// ============================================================
//  Little Symphony — Fonction Edge "whatsapp-webhook"
//
//  Reçoit les messages WhatsApp entrants (WhatsApp Business
//  Platform / Cloud API) directement depuis les serveurs de Meta.
//
//  ⚠️ Architecture "zéro stockage" demandée : contrairement à
//  Messenger, WhatsApp ne conserve AUCUN historique consultable de
//  son côté — chaque message n'est envoyé qu'UNE SEULE FOIS, ici,
//  au moment où il arrive. Cette fonction ne l'écrit dans AUCUNE
//  table : elle le relaie immédiatement en direct au panel admin
//  via Supabase Realtime Broadcast (REST), puis l'oublie.
//  → Si le panel admin n'est pas ouvert à ce moment précis, le
//    message (et une éventuelle photo jointe) est perdu, comme
//    voulu.
//
//  Cette fonction gère aussi la route de proxy image
//  ".../whatsapp-webhook/media/{mediaId}" : elle va chercher la
//  photo chez Meta et la retransmet directement dans la réponse
//  HTTP (streaming), sans jamais l'enregistrer nulle part. Les
//  liens médias de Meta expirent rapidement — une image non
//  consultée dans la fenêtre laissée par Meta redevient
//  définitivement inaccessible, ce qui est cohérent avec le choix
//  "rien après un rafraîchissement".
//
//  Configuration côté Meta for Developers (App → WhatsApp →
//  Configuration → Webhook) :
//   - Callback URL : https://<PROJECT_REF>.supabase.co/functions/v1/whatsapp-webhook
//   - Verify token : la valeur de messaging_settings.whatsapp_webhook_verify_token
//   - Champ à cocher (Webhook fields) : "messages"
//
//  ⚠️ Comme les autres fonctions de ce module, ce fichier n'a pas
//  pu être testé en conditions réelles. Prévois une phase de test
//  avant la mise en production.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH_VERSION = "v20.0";
const BROADCAST_TOPIC = "messagerie-whatsapp-live";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // ── Route proxy média : .../whatsapp-webhook/media/{mediaId} ──
  const mediaMatch = url.pathname.match(/\/media\/([^/]+)$/);
  if (mediaMatch && req.method === "GET") {
    return await proxyMedia(supabase, mediaMatch[1]);
  }

  // ── Vérification du webhook (handshake Meta) ──────────────
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const { data: settings } = await supabase
      .from("messaging_settings")
      .select("whatsapp_webhook_verify_token")
      .eq("id", true)
      .single();

    if (mode === "subscribe" && token && token === settings?.whatsapp_webhook_verify_token) {
      return new Response(challenge || "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── Réception d'un message ─────────────────────────────────
  if (req.method === "POST") {
    try {
      const payload = await req.json();
      await handleIncoming(supabase, payload);
    } catch (e) {
      console.error("whatsapp-webhook error:", e);
    }
    // Toujours répondre 200 rapidement, sinon Meta réessaie / désactive le webhook.
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});

// deno-lint-ignore no-explicit-any
async function handleIncoming(supabase: any, payload: any) {
  const { data: settings } = await supabase
    .from("messaging_settings")
    .select("whatsapp_token")
    .eq("id", true)
    .single();

  const entries = payload?.entry || [];
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const contacts = value.contacts || [];
      const messages = value.messages || [];

      for (const msg of messages) {
        const contact = contacts.find((c: { wa_id?: string }) => c.wa_id === msg.from);
        const senderName = contact?.profile?.name || msg.from;

        let content = "";
        let mediaId: string | null = null;
        let mediaType: string | null = null;

        if (msg.type === "text") {
          content = msg.text?.body || "";
        } else if (msg.type === "image") {
          content = msg.image?.caption || "📷 Photo";
          mediaId = msg.image?.id || null;
          mediaType = "image";
        } else if (msg.type === "video") {
          content = msg.video?.caption || "🎥 Vidéo";
          mediaId = msg.video?.id || null;
          mediaType = "video";
        } else if (msg.type === "document") {
          content = msg.document?.filename || "📎 Document";
          mediaId = msg.document?.id || null;
          mediaType = "document";
        } else {
          content = `[${msg.type}]`;
        }

        await broadcast({
          platform: "whatsapp",
          senderId: msg.from,
          senderName,
          content,
          mediaId,
          mediaType,
          // URL de proxy que le panel admin peut utiliser directement dans un <img>,
          // sans jamais recevoir le token d'accès WhatsApp.
          mediaProxyUrl: mediaId
            ? `${SUPABASE_URL}/functions/v1/whatsapp-webhook/media/${mediaId}`
            : null,
          receivedAt: new Date(Number(msg.timestamp) * 1000 || Date.now()).toISOString(),
        });
      }
    }
  }
}

async function broadcast(payload: Record<string, unknown>) {
  await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ topic: BROADCAST_TOPIC, event: "new-message", payload }],
    }),
  });
}

// deno-lint-ignore no-explicit-any
async function proxyMedia(supabase: any, mediaId: string): Promise<Response> {
  const { data: settings } = await supabase
    .from("messaging_settings")
    .select("whatsapp_token")
    .eq("id", true)
    .single();

  if (!settings?.whatsapp_token) {
    return new Response("WhatsApp non connecté", { status: 404 });
  }

  try {
    // Étape 1 : résoudre l'URL temporaire réelle du média
    const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${settings.whatsapp_token}` },
    });
    const metaData = await metaRes.json();
    if (!metaRes.ok || !metaData.url) {
      return new Response("Média introuvable ou expiré", { status: 404 });
    }

    // Étape 2 : streamer directement le contenu, sans jamais l'enregistrer.
    const fileRes = await fetch(metaData.url, {
      headers: { Authorization: `Bearer ${settings.whatsapp_token}` },
    });
    if (!fileRes.ok || !fileRes.body) {
      return new Response("Média introuvable ou expiré", { status: 404 });
    }

    return new Response(fileRes.body, {
      status: 200,
      headers: {
        "Content-Type": metaData.mime_type || "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("proxyMedia error:", e);
    return new Response("Erreur de récupération du média", { status: 500 });
  }
}
