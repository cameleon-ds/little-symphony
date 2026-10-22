// ============================================================
//  Little Symphony — Fonction Edge "import-image"
//  Appelée par le panel admin à l'enregistrement d'un produit :
//  télécharge une image depuis un lien externe et la range dans
//  le stockage Supabase (bucket products/imported/), pour que la
//  photo ne dépende plus du site d'origine.
//  Réservée aux comptes admin.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const MAX_BYTES = 8 * 1024 * 1024;

// Statut 200 + ok:false en cas d'erreur : supabase-js ne remonte pas le corps des réponses non-2xx.
const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    // 1. Admin connecté uniquement
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const caller = createClient(SB_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: u } = await caller.auth.getUser();
    if (!u?.user) return json({ ok: false, error: "Non authentifié" });
    const sb = createClient(SB_URL, SERVICE_KEY);
    const { data: prof } = await sb.from("profiles").select("role").eq("id", u.user.id).single();
    if (prof?.role !== "admin") return json({ ok: false, error: "Accès refusé" });

    // 2. Lien à importer
    const body = await req.json().catch(() => ({}));
    const url = String(body.url || "").trim();
    if (!/^https?:\/\//i.test(url)) return json({ ok: false, error: "Lien invalide" });
    if (url.startsWith(SB_URL)) return json({ ok: true, url, already: true });
    const slug = String(body.slug || "produit").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "produit";

    // 3. Téléchargement (JPEG/PNG demandés en priorité : le module Réseaux sociaux ne lit pas le WebP/AVIF)
    let r: Response;
    try {
      r = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          "Accept": "image/jpeg,image/png;q=0.9,image/*;q=0.5",
        },
      });
    } catch (_) {
      return json({ ok: false, error: "Le site refuse le téléchargement automatique" });
    }
    const ct = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!r.ok) return json({ ok: false, error: `Le site a répondu ${r.status}` });
    if (!ct.startsWith("image/")) return json({ ok: false, error: "Ce lien n'est pas une image" });
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.length < 500) return json({ ok: false, error: "Image vide ou invalide" });
    if (buf.length > MAX_BYTES) return json({ ok: false, error: "Image trop lourde (plus de 8 Mo)" });

    // 4. Rangement dans le stockage
    const path = `imported/${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${EXT[ct] || "jpg"}`;
    const { error: upErr } = await sb.storage.from("products").upload(path, buf, { contentType: ct, upsert: false, cacheControl: "31536000" });
    if (upErr) return json({ ok: false, error: upErr.message });
    const { data: pub } = sb.storage.from("products").getPublicUrl(path);
    return json({ ok: true, url: pub.publicUrl, type: ct, size: buf.length });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message });
  }
});
