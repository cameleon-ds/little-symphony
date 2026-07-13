// ============================================================
//  Little Symphony — Fonction Edge "messaging-conversations"
//
//  Sert le module Messagerie du panel admin pour Facebook Messenger
//  et Instagram DM. AUCUN message n'est jamais stocké dans Supabase :
//  cette fonction va chercher les conversations et les messages EN
//  DIRECT chez Meta (Graph API) à chaque appel, et les renvoie tels
//  quels au panel admin.
//
//  Limite propre à l'API Meta (pas la nôtre) : la Graph API ne
//  redonne le contenu complet que des ~20 derniers messages de
//  chaque conversation. Au-delà, Meta renvoie une erreur "message
//  supprimé" — il n'existe pas d'archivage illimité côté Meta pour
//  ce type d'appel.
//
//  Actions :
//   - { action: "list" }                          → conversations + messages récents
//   - { action: "reply", platform, recipientId, message } → envoie une réponse
//
//  ⚠️ Comme "social-publish", ce fichier n'a pas pu être testé en
//  conditions réelles (pas d'accès à un compte Meta depuis cet
//  environnement). Prévois une phase de test avant la mise en
//  production.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GRAPH_VERSION = "v20.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ── Authentification : doit être un admin connecté ──────
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await caller.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ ok: false, error: "Non authentifié" });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (profile?.role !== "admin") {
      return json({ ok: false, error: "Accès refusé" });
    }

    const body = await req.json().catch(() => ({}));

    const { data: settings, error: settingsErr } = await supabase
      .from("messaging_settings")
      .select("*")
      .eq("id", true)
      .single();
    if (settingsErr || !settings) {
      return json({ ok: false, error: "Réglages de messagerie introuvables" });
    }

    if (body.action === "reply") {
      return await handleReply(settings, body);
    }

    // action par défaut : "list"
    return await handleList(settings);
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: (e as Error).message });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// deno-lint-ignore no-explicit-any
async function handleList(settings: any) {
  const conversations: unknown[] = [];
  const errors: string[] = [];

  if (settings.facebook_page_id && settings.facebook_page_token) {
    try {
      conversations.push(
        ...(await fetchPlatformConversations(settings, "messenger", "facebook")),
      );
    } catch (e) {
      errors.push(`Facebook: ${(e as Error).message}`);
    }

    if (settings.instagram_business_id) {
      try {
        conversations.push(
          ...(await fetchPlatformConversations(settings, "instagram", "instagram")),
        );
      } catch (e) {
        errors.push(`Instagram: ${(e as Error).message}`);
      }
    }
  } else {
    errors.push("Facebook / Instagram non connectés");
  }

  return json({ ok: true, conversations, errors });
}

async function fetchPlatformConversations(
  // deno-lint-ignore no-explicit-any
  settings: any,
  metaPlatform: "messenger" | "instagram",
  label: "facebook" | "instagram",
) {
  const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
  const listUrl =
    `${base}/${settings.facebook_page_id}/conversations` +
    `?platform=${metaPlatform}&fields=participants,updated_time,messages.limit(20){message,from,created_time,attachments}` +
    `&access_token=${settings.facebook_page_token}`;

  const res = await fetch(listUrl);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Échec de récupération des conversations");

  // deno-lint-ignore no-explicit-any
  return (data.data || []).map((conv: any) => {
    const participant = (conv.participants?.data || []).find(
      (p: { id?: string }) => p.id !== settings.facebook_page_id,
    );
    // deno-lint-ignore no-explicit-any
    const messages = (conv.messages?.data || []).map((m: any) => ({
      id: m.id,
      content: m.message || (m.attachments ? "📎 Pièce jointe" : ""),
      attachmentUrl: m.attachments?.data?.[0]?.image_data?.url ||
        m.attachments?.data?.[0]?.file_url || null,
      fromPage: m.from?.id === settings.facebook_page_id,
      createdAt: m.created_time,
    })).reverse();

    return {
      platform: label,
      conversationId: conv.id,
      senderId: participant?.id || null,
      senderName: participant?.name || "Client",
      updatedAt: conv.updated_time,
      messages,
    };
  });
}

// deno-lint-ignore no-explicit-any
async function handleReply(settings: any, body: any) {
  const { platform, recipientId, message } = body;
  if (!recipientId || !message) {
    return json({ ok: false, error: "recipientId et message requis" });
  }
  if (platform !== "facebook" && platform !== "instagram") {
    return json({ ok: false, error: "Plateforme invalide" });
  }

  const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
  // Messenger et Instagram DM partagent le même point d'envoi côté Page,
  // dès lors que le compte Instagram est lié à la page Facebook connectée.
  const sendUrl = `${base}/me/messages?access_token=${settings.facebook_page_token}`;

  const res = await fetch(sendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      messaging_type: "RESPONSE",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return json({ ok: false, error: data?.error?.message || "Échec de l'envoi" });
  }
  return json({ ok: true, messageId: data.message_id });
}
