// ============================================================
//  Little Symphony — Fonction Edge "whatsapp-reply"
//
//  Envoie une réponse WhatsApp à un client, invoquée par le panel
//  admin (utilisateur connecté avec le rôle "admin"). N'écrit
//  jamais le message dans une base — il part directement vers
//  l'API WhatsApp Business Cloud.
//
//  ⚠️ Rappel important (API WhatsApp) : on ne peut répondre
//  librement en texte libre que dans les 24h suivant le dernier
//  message du client ("fenêtre de service"). Passé ce délai, il
//  faut utiliser un message modèle ("template") pré-approuvé par
//  Meta — non géré par cette fonction, à ajouter plus tard si
//  besoin.
//
//  ⚠️ Comme les autres fonctions de ce module, ce fichier n'a pas
//  pu être testé en conditions réelles. Prévois une phase de test
//  avant la mise en production.
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

    const { to, message } = await req.json().catch(() => ({}));
    if (!to || !message) {
      return json({ ok: false, error: "to et message requis" });
    }

    const { data: settings, error: settingsErr } = await supabase
      .from("messaging_settings")
      .select("whatsapp_phone_number_id, whatsapp_token")
      .eq("id", true)
      .single();
    if (settingsErr || !settings?.whatsapp_phone_number_id || !settings?.whatsapp_token) {
      return json({ ok: false, error: "WhatsApp non connecté" });
    }

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${settings.whatsapp_phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.whatsapp_token}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      return json({ ok: false, error: data?.error?.message || "Échec de l'envoi" });
    }
    return json({ ok: true, messageId: data.messages?.[0]?.id });
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
