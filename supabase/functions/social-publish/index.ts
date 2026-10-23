// ============================================================
//  Little Symphony — Fonction Edge "social-publish"
//  Publie automatiquement le prochain produit de la file
//  d'attente sur Facebook et Instagram, avec le texte
//  (titre, prix, tranche d'âge) incrusté sur l'image.
//
//  Déclenchée par pg_cron (voir GUIDE-reseaux-sociaux.md),
//  idéalement toutes les heures — la fonction décide elle-même
//  si c'est le bon jour / la bonne heure pour publier.
//
//  ⚠️ Ce fichier est un point de départ solide mais n'a pas pu
//  être testé en conditions réelles (pas d'accès à un compte
//  Meta ni à ton projet Supabase depuis cet environnement).
//  Prévois une phase de test avant la mise en production
//  (voir le guide, section "Tester").
// ============================================================

// Import "node:fs" en premier : requis par Supabase pour que Deno.readFile()
// (utilisé plus bas pour charger le logo bundlé) cohabite proprement avec
// les autres imports npm de ce fichier.
import "node:fs";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image } from "jsr:@matmen/imagescript@3.3.0"; // version figée : renderText est asynchrone (await obligatoire)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GRAPH_VERSION = "v25.0";

// Polices utilisées pour le texte incrusté (Inter pour le texte courant,
// Playwrite US Modern — police manuscrite "enfantine" — à l'essai pour le
// titre du produit). Chargées à chaque exécution depuis Google Fonts.
const FONT_BOLD_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf";
const FONT_TITLE_URL =
  "https://raw.githubusercontent.com/cameleon-ds/little-symphony/main/fonts/GoogleSans-Bold.ttf"; // police du titre : Google Sans Bold (version statique, latin) // police du titre : Lobster

const BRAND_PRIMARY = 0xc9a09aff; // --primary du site
const TITLE_COLOR = 0xffffffff;  // titre du produit en blanc…
const TITLE_SHADOW_RGB = 0x5a321e; // …avec une ombre marron très douce (vrai flou) pour rester lisible
const TITLE_SHADOW_BLUR = 8;        // rayon du flou (px)
const TITLE_SHADOW_OPACITY = 0.55;  // intensité de l'ombre (0 à 1)

const AGE_LABELS: Record<string, string> = {
  "0-6": "0-6 mois",
  "6-12": "6-12 mois",
  "1-3": "1-3 ans",
  "3-6": "3-6 ans",
  "6-9": "6-9 ans",
  "9-12": "9-12 ans",
};

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

    // ── 0. Authentification : cron (service_role) vs admin (JWT) ──
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    let isCron = token === SERVICE_ROLE_KEY;
    // Appel planifié (pg_cron) : secret partagé stocké dans la table privée _cron_secret
    const cronHeader = req.headers.get("x-cron-secret") || "";
    if (!isCron && cronHeader) {
      const { data: cs } = await supabase.from("_cron_secret").select("secret").eq("id", true).maybeSingle();
      isCron = !!cs?.secret && cs.secret === cronHeader;
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // pas de corps (appel cron classique) — normal
    }

    if (!isCron) {
      // Doit être un admin connecté, et ne peut demander qu'un aperçu.
      const caller = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: userErr } = await caller.auth.getUser();
      if (userErr || !userData?.user) {
        // Statut 200 volontaire : supabase-js functions.invoke() ne remonte pas
        // le corps JSON des réponses non-2xx, on garde donc 200 + ok:false
        // pour que le panel admin puisse afficher le vrai message d'erreur.
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
      if (body.action === "post_now") {
        return await handlePostNow(supabase, body.queueId as string | undefined);
      }
      if (body.action !== "preview") {
        return json({ ok: false, error: "Action non autorisée pour ce compte" });
      }
      return await handlePreview(supabase, body.queueId as string | undefined);
    }

    // Un admin peut aussi demander un aperçu via le token cron (ex: test manuel).
    if (body.action === "preview") {
      return await handlePreview(supabase, body.queueId as string | undefined);
    }

    // ── 1. Récupérer les réglages ──────────────────────────
    const { data: settings, error: settingsErr } = await supabase
      .from("social_settings")
      .select("*")
      .eq("id", true)
      .single();

    if (settingsErr || !settings) {
      return json({ skipped: true, reason: "Réglages introuvables" });
    }
    if (!settings.is_active) {
      return json({ skipped: true, reason: "Module désactivé (is_active=false)" });
    }
    if (!settings.facebook_page_id || !settings.facebook_page_token) {
      return json({ skipped: true, reason: "Facebook non connecté" });
    }

    // ── 2. Vérifier que c'est le bon jour / la bonne heure ──
    const now = new Date();
    const tzNow = new Date(
      now.toLocaleString("en-US", { timeZone: settings.timezone || "Africa/Tunis" }),
    );
    const isoDay = ((tzNow.getDay() + 6) % 7) + 1; // JS: 0=dim..6=sam → ISO: 1=lun..7=dim
    const todayStr = tzNow.toISOString().slice(0, 10);

    const lastRunDay = settings.last_run_at
      ? new Date(new Date(settings.last_run_at).toLocaleString("en-US", { timeZone: settings.timezone || "Africa/Tunis" })).toISOString().slice(0, 10)
      : null;

    if (!settings.post_days.includes(isoDay)) {
      return json({ skipped: true, reason: `Jour ${isoDay} non planifié` });
    }
    if (lastRunDay === todayStr) {
      return json({ skipped: true, reason: "Déjà publié aujourd'hui" });
    }
    const [h, m] = String(settings.post_time).split(":").map(Number);
    const scheduledMinutes = h * 60 + m;
    const nowMinutes = tzNow.getHours() * 60 + tzNow.getMinutes();
    if (nowMinutes < scheduledMinutes) {
      return json({ skipped: true, reason: "Heure de publication pas encore atteinte" });
    }

    // ── 3. Catégories autorisées à la publication automatique ───
    const allowedCategories = settings.enabled_categories || [];

    // ── 4. Prochain produit dans la file (parmi ces catégories) ─
    // Premier produit de la file : catégorie cochée OU ajouté à la main depuis l'admin (manual)
    const { data: candidates, error: queueErr } = await supabase
      .from("social_queue")
      .select("*, products!inner(*)")
      .eq("status", "pending")
      .or(`scheduled_for.is.null,scheduled_for.lte.${todayStr}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(500);
    // deno-lint-ignore no-explicit-any
    const queueItem = (candidates || []).find((q: any) => q.manual || allowedCategories.includes(q.products?.category_id));

    if (queueErr) throw queueErr;
    if (!queueItem) {
      return json({ skipped: true, reason: "File d'attente vide" });
    }

    const product = queueItem.products;
    if (!product || !product.images?.length) {
      await markFailed(supabase, queueItem.id, "Produit sans image");
      return json({ skipped: true, reason: "Produit sans image, marqué en échec" });
    }

    // ── 5 à 8. Générer le visuel, publier, mettre à jour la file ─
    const out = await publishQueueItem(supabase, settings, queueItem);
    return json({ ok: out.success, product: product.name, results: out.results, errors: out.errors });
  } catch (e) {
    console.error(e);
    // Statut 200 volontaire, voir la note dans le bloc d'authentification plus haut.
    return json({ ok: false, error: (e as Error).message });
  }
});

// ── Helpers ────────────────────────────────────────────────

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}

// ── Aperçu (utilisé par le bouton "Aperçu" du panel admin) ──
// Compose l'image + le texte de publication SANS jamais appeler
// Facebook/Instagram et SANS toucher au statut de la file d'attente.
async function handlePreview(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  queueId: string | undefined,
) {
  if (!queueId) {
    return json({ ok: false, error: "queueId manquant" });
  }

  const { data: settings } = await supabase
    .from("social_settings")
    .select("template_style, site_url")
    .eq("id", true)
    .single();

  const siteUrl = (settings?.site_url || "https://little-symphony.com").replace(/\/$/, "");

  const { data: queueItem, error: queueErr } = await supabase
    .from("social_queue")
    .select("id, platform, source_image, custom_text, products(*)")
    .eq("id", queueId)
    .single();

  if (queueErr || !queueItem) {
    return json({ ok: false, error: "Élément de file introuvable" });
  }

  const product = queueItem.products;
  if (!product || !product.images?.length) {
    return json({ ok: false, error: "Ce produit n'a pas d'image" });
  }

  const composedBytes = await composeImage(product, settings?.template_style, siteUrl, queueItem.source_image, await getCategoryColor(supabase, product.category_id));

  // Fichier "preview-<id>" réutilisé/écrasé à chaque aperçu : ne pollue pas le bucket.
  const fileName = `preview-${queueItem.id}.jpg`;
  const { error: uploadErr } = await supabase.storage
    .from("social-media")
    .upload(fileName, composedBytes, { contentType: "image/jpeg", upsert: true });
  if (uploadErr) {
    return json({ ok: false, error: uploadErr.message });
  }

  const { data: pub } = supabase.storage.from("social-media").getPublicUrl(fileName);
  // Cache-buster pour être sûr de voir la dernière version dans le panel admin.
  const imageUrl = `${pub.publicUrl}?t=${Date.now()}`;

  return json({
    ok: true,
    preview: {
      imageUrl,
      caption: buildCaption(product, siteUrl, queueItem.custom_text),
      ...captionParts(product, siteUrl, queueItem.custom_text),
      productDescription: product.description || "",
      platform: queueItem.platform,
      productName: product.name,
      productSlug: product.slug,
      productId: product.id,
      customImage: !!queueItem.source_image,
    },
  });
}

// ── Génère le visuel d'un élément de la file, le publie et met à jour la file ──
// Utilisé par la publication automatique et par le bouton « Poster maintenant ».
async function publishQueueItem(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  // deno-lint-ignore no-explicit-any
  settings: any,
  // deno-lint-ignore no-explicit-any
  queueItem: any,
): Promise<{ success: boolean; results: Record<string, unknown>; errors: string[] }> {
  const product = queueItem.products;
  const siteUrl = (settings.site_url || "https://little-symphony.com").replace(/\/$/, "");
  const composedBytes = await composeImage(product, settings.template_style, siteUrl, queueItem.source_image, await getCategoryColor(supabase, product.category_id));

  const fileName = `${product.slug}-${Date.now()}.jpg`;
  const { error: uploadErr } = await supabase.storage
    .from("social-media")
    .upload(fileName, composedBytes, { contentType: "image/jpeg", upsert: true });
  if (uploadErr) throw uploadErr;
  const { data: pub } = supabase.storage.from("social-media").getPublicUrl(fileName);
  const imageUrl = pub.publicUrl;

  const caption = buildCaption(product, siteUrl, queueItem.custom_text);
  // L'API Instagram refuse le 3:4 (ratio min. 4:5) : version 1080 x 1350 du même visuel pour Instagram
  let igImageUrl = imageUrl;
  if ((queueItem.platform === "instagram" || queueItem.platform === "both") && settings.instagram_business_id) {
    const igBytes = await composeImage(product, settings.template_style, siteUrl, queueItem.source_image, await getCategoryColor(supabase, product.category_id), 1350);
    const igName = `${product.slug}-${Date.now()}-ig.jpg`;
    const { error: igErr } = await supabase.storage.from("social-media").upload(igName, igBytes, { contentType: "image/jpeg", upsert: true });
    if (!igErr) igImageUrl = supabase.storage.from("social-media").getPublicUrl(igName).data.publicUrl;
  }
  const results: Record<string, unknown> = {};
  let fbPostId: string | null = null;
  let igMediaId: string | null = null;
  const errors: string[] = [];

  if (queueItem.platform === "facebook" || queueItem.platform === "both") {
    try {
      fbPostId = await postToFacebook(settings, imageUrl, caption);
      results.facebook = fbPostId;
    } catch (e) {
      errors.push(`Facebook: ${(e as Error).message}`);
    }
  }
  if ((queueItem.platform === "instagram" || queueItem.platform === "both") && settings.instagram_business_id) {
    try {
      igMediaId = await postToInstagram(settings, igImageUrl, caption);
      results.instagram = igMediaId;
    } catch (e) {
      errors.push(`Instagram: ${(e as Error).message}`);
    }
  }

  const success = !!(fbPostId || igMediaId);
  await supabase
    .from("social_queue")
    .update({
      status: success ? "posted" : "failed",
      posted_at: success ? new Date().toISOString() : null,
      image_used_url: imageUrl,
      fb_post_id: fbPostId,
      ig_media_id: igMediaId,
      error_message: errors.length ? errors.join(" | ") : null,
    })
    .eq("id", queueItem.id);

  // Une publication (auto ou manuelle) compte pour la journée : l'automatisme ne repostera pas aujourd'hui.
  // Même en cas d'échec, pour ne pas réessayer toutes les 5 minutes.
  await supabase.from("social_settings").update({ last_run_at: new Date().toISOString() }).eq("id", true);

  return { success, results, errors };
}

// ── Bouton « Poster maintenant » du panel admin ──
async function handlePostNow(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  queueId: string | undefined,
) {
  if (!queueId) return json({ ok: false, error: "queueId manquant" });
  const { data: settings } = await supabase.from("social_settings").select("*").eq("id", true).single();
  if (!settings?.facebook_page_id || !settings?.facebook_page_token) {
    return json({ ok: false, error: "Facebook n'est pas connecté" });
  }
  const { data: queueItem, error: qErr } = await supabase
    .from("social_queue").select("*, products(*)").eq("id", queueId).single();
  if (qErr || !queueItem) return json({ ok: false, error: "Élément de file introuvable" });
  if (queueItem.status === "posted") return json({ ok: false, error: "Ce produit a déjà été publié" });
  if (!queueItem.products?.images?.length) return json({ ok: false, error: "Ce produit n'a pas d'image" });

  const out = await publishQueueItem(supabase, settings, queueItem);
  return json({ ok: out.success, product: queueItem.products.name, results: out.results, errors: out.errors,
    error: out.success ? undefined : out.errors.join(" | ") });
}

async function markFailed(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  id: string,
  reason: string,
) {
  await supabase
    .from("social_queue")
    .update({ status: "failed", error_message: reason })
    .eq("id", id);
}

// deno-lint-ignore no-explicit-any
function captionParts(product: any, siteUrl: string, customText?: string | null) {
  const ages = (product.age_ranges || [])
    .map((a: string) => AGE_LABELS[a] || a)
    .join(", ");
  const price = product.is_promo && product.price_old
    ? `${product.price} DT (au lieu de ${product.price_old} DT)`
    : `${product.price} DT`;
  // Page produit statique (meilleur aperçu du lien sur Facebook). Instagram n'hyperlie jamais le texte.
  const productLink = `${siteUrl}/produit/${product.slug}.html`;

  // Texte d'accroche : texte personnalisé pour cette publication (admin), sinon le descriptif du produit
  const custom = (customText || "").trim();
  const intro = custom || (product.description ? truncate(String(product.description).trim(), 1500) : "");

  const head = [`✨ ${product.name}`, product.subtitle || "", `💰 ${price}`, ages ? `👶 ${ages}` : ""].filter(Boolean).join("\n");
  // Lien et hashtags séparés par une ligne vide pour la lisibilité
  const footer = [head, `🔗 Voir le produit : ${productLink}`, "#LittleSymphony  #Tunisie  #Bebe  #Enfant"].join("\n\n");

  return { intro, introIsCustom: !!custom, footer };
}

// deno-lint-ignore no-explicit-any
function buildCaption(product: any, siteUrl: string, customText?: string | null): string {
  const { intro, footer } = captionParts(product, siteUrl, customText);
  return intro ? `${intro}\n\n${footer}` : footer;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

// Ombre douce d'un texte : vrai flou (3 passes de flou-boîte ≈ gaussien) appliqué au canal alpha,
// puis teinte et opacité. Renvoie l'image de l'ombre et la marge ajoutée autour du texte.
function softShadow(textImg: Image, rgb: number, radius: number, opacity: number, bold: boolean): { img: Image; pad: number } {
  const P = radius * 3;
  const w = textImg.width + P * 2 + 2, h = textImg.height + P * 2 + 2;
  const mask = new Image(w, h);
  const offs = bold ? [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]] : [[0, 0]];
  for (const [dx, dy] of offs) mask.composite(textImg, P + dx, P + dy);
  const src = mask.bitmap;
  const a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = src[i * 4 + 3];
  const tmp = new Float32Array(w * h);
  const r = Math.max(1, Math.round(radius / 1.7));
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      const row = y * w; let s = 0;
      for (let x = -r; x <= r; x++) s += a[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) { tmp[row + x] = s / (2 * r + 1); s += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)]; }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) { a[y * w + x] = s / (2 * r + 1); s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; }
    }
  }
  const out = new Image(w, h);
  const bm = out.bitmap;
  const R = (rgb >> 16) & 255, G = (rgb >> 8) & 255, B = rgb & 255;
  for (let i = 0; i < w * h; i++) { bm[i * 4] = R; bm[i * 4 + 1] = G; bm[i * 4 + 2] = B; bm[i * 4 + 3] = Math.min(255, Math.round(a[i] * opacity)); }
  out.bitmap = bm;
  return { img: out, pad: P };
}

// deno-lint-ignore no-explicit-any
// Découpe le titre en lignes qui tiennent dans la largeur du visuel (mesure réelle du texte).
// Taille réduite automatiquement si le titre dépasse 3 lignes.
async function wrapTitle(fontBytes: Uint8Array, name: string, maxWidth: number): Promise<{ lines: string[]; size: number }> {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  const measure = async (txt: string, size: number) => (await Image.renderText(fontBytes, size, txt, 0xffffffff)).width + 2;
  for (const size of [84, 76, 68, 60]) {
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (!cur || (await measure(test, size)) <= maxWidth) cur = test;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    // Équilibrer 2 lignes (évite une ligne pleine + un mot seul)
    if (lines.length === 2) {
      const balanced = splitTitle(name);
      if (balanced.length === 2 && (await measure(balanced[0], size)) <= maxWidth && (await measure(balanced[1], size)) <= maxWidth) {
        lines.splice(0, 2, balanced[0], balanced[1]);
      }
    }
    if (lines.length <= 3) return { lines, size };
  }
  return { lines: [name], size: 60 };
}

// Coupe un titre trop long en deux lignes aussi équilibrées que possible (coupure entre deux mots)
function splitTitle(name: string): string[] {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return [name];
  let best = [name], bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const score = Math.max(a.length, b.length);
    if (score < bestScore) { bestScore = score; best = [a, b]; }
  }
  return best;
}

// Rendu d'une ligne du titre lettre par lettre : avec Lobster, certaines lettres (f, T…) débordent
// sur la lettre précédente et le moteur de rendu les effaçait. Positions calculées sur la ligne entière.
async function renderTitleLine(font: Uint8Array, size: number, text: string, color: number): Promise<{ img: Image; offset: number }> {
  const full = await Image.renderText(font, size, text, color);
  const offset = Math.round(size * 0.3);
  const out = new Image(full.width + offset * 2, full.height);
  const barW = (await Image.renderText(font, size, "|", color)).width;
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === " ") continue;
    const pre = chars.slice(0, i).join("");
    const x = pre ? (await Image.renderText(font, size, pre + "|", color)).width - barW : 0;
    const g = await Image.renderText(font, size, chars[i], color);
    out.composite(g, offset + x, 0);
  }
  return { img: out, offset };
}

// Couleur de la catégorie du produit (même couleur que sur l'accueil et la boutique)
// deno-lint-ignore no-explicit-any
async function getCategoryColor(supabase: any, categoryId?: string | null): Promise<string | null> {
  if (!categoryId) return null;
  const { data } = await supabase.from("categories").select("color").eq("id", categoryId).maybeSingle();
  return data?.color || null;
}

// Palette du visuel dérivée de la couleur de catégorie : teinte foncée (bulle prix, texte âge),
// teinte moyenne (cercle) et teinte très foncée (ombre du titre)
function paletteFrom(hex?: string | null) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  const base = m ? parseInt(m[1], 16) : 0xc9a09a; // --primary du site par défaut
  const r = (base >> 16) & 255, g = (base >> 8) & 255, b = base & 255;
  const shade = (f: number) => {
    const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
    return (c(r) << 16) | (c(g) << 8) | c(b);
  };
  const rgba = (rgb: number, a: number) => ((rgb << 8) | a) >>> 0;
  return {
    dark: rgba(shade(0.72), 0xff),     // bulle du prix / texte de l'âge
    circle: rgba(shade(0.8), 0x90),    // grand cercle semi-transparent
    shadowRgb: shade(0.38),            // ombre douce du titre
    old: rgba(shade(0.9), 0xff),       // « au lieu de … » dans la bulle du prix
  };
}

// deno-lint-ignore no-explicit-any
async function composeImage(product: any, style: any, siteUrl: string, sourceImage?: string | null, categoryColor?: string | null, height = 1440): Promise<Uint8Array> {
  // Format portrait Instagram 1080 x 1440 (3:4)
  const W = 1080, H = height; // 1080 x 1440 (3:4) ; 1080 x 1350 (4:5) pour l'API Instagram
  const pal = paletteFrom(categoryColor);

  const photoRes = await fetch(sourceImage || product.images[0]);
  const photoBuf = new Uint8Array(await photoRes.arrayBuffer());
  let photo = await Image.decode(photoBuf);

  // Recadrage centré au ratio 3:4 (remplit tout le visuel)
  const ratio = W / H;
  let cw = photo.width, ch = photo.height;
  if (cw / ch > ratio) cw = Math.round(ch * ratio); else ch = Math.round(cw / ratio);
  photo = photo.crop(Math.floor((photo.width - cw) / 2), Math.floor((photo.height - ch) / 2), cw, ch).resize(W, H);

  const canvas = new Image(W, H);
  canvas.composite(photo, 0, 0);

  const dim = new Image(W, H);
  dim.fill(0x0000001a);
  canvas.composite(dim, 0, 0);

  // Grand cercle couleur de la catégorie, en bas à gauche
  const circleLayer = new Image(W, H);
  circleLayer.drawCircle(Math.round(W * 0.4), H, Math.round(W * 0.6), pal.circle);
  canvas.composite(circleLayer, 0, 0);

  const fontBytes = new Uint8Array(await (await fetch(FONT_BOLD_URL)).arrayBuffer());
  const titleFontBytes = new Uint8Array(await (await fetch(FONT_TITLE_URL)).arrayBuffer());

  // Titre (Lobster) : retour à la ligne avant le bord droit, interligne resserré
  const titleLines: { img: Image; shadow: Image; pad: number; offset: number }[] = [];
  let lineGap = 0;
  if (style?.show_title !== false) {
    const name = product.name || "";
    const fullW = (await Image.renderText(titleFontBytes, 84, name, TITLE_COLOR)).width + 2;
    const { lines, size } = fullW <= W - 80 && name.length <= 18
      ? { lines: [name], size: 84 }
      : await wrapTitle(titleFontBytes, name, W - 80);
    lineGap = -Math.round(size * 0.12);
    for (const line of lines) {
      const t = await Image.renderText(titleFontBytes, size, line, TITLE_COLOR); const offset = 0;
      const sh = softShadow(t, pal.shadowRgb, TITLE_SHADOW_BLUR, TITLE_SHADOW_OPACITY, false);
      titleLines.push({ img: t, shadow: sh.img, pad: sh.pad + offset, offset });
    }
  }

  // Prix et tranche d'âge : en haut à droite, alignés à droite
  const topRight: { bubble: Image; img: Image; padX: number; padY: number }[] = [];
  if (style?.show_price !== false) {
    // Bulle couleur de la catégorie, texte blanc ; en promo, l'ancien prix en petit sur une 2e ligne
    const priceImg = await Image.renderText(fontBytes, 48, `${product.price} DT`, 0xffffffff);
    const oldImg = product.is_promo && product.price_old
      ? await Image.renderText(fontBytes, 26, `au lieu de ${product.price_old} DT`, 0xffffffe0)
      : null;
    const padX = 28, padY = 14, gap = 2;
    const innerW = Math.max(priceImg.width, oldImg ? oldImg.width : 0);
    const innerH = priceImg.height + (oldImg ? gap + oldImg.height : 0);
    const text = new Image(innerW, innerH);
    text.composite(priceImg, innerW - priceImg.width, 0);
    if (oldImg) text.composite(oldImg, innerW - oldImg.width, priceImg.height + gap);
    const bubble = new Image(innerW + padX * 2, innerH + padY * 2);
    bubble.fill(pal.dark);
    bubble.roundCorners(Math.round(Math.min(bubble.height / 2, 40)));
    topRight.push({ bubble, img: text, padX, padY });
  }
  if (style?.show_age_range !== false && product.age_ranges?.length) {
    // Bulle blanche, texte couleur de la catégorie
    const ages = product.age_ranges.map((a: string) => AGE_LABELS[a] || a).join(" · ");
    const ageImg = await Image.renderText(fontBytes, 28, ages, pal.dark);
    const padX = 18, padY = 9;
    const bubble = new Image(ageImg.width + padX * 2, ageImg.height + padY * 2);
    bubble.fill(0xffffffff);
    bubble.roundCorners(Math.round(bubble.height / 2));
    topRight.push({ bubble, img: ageImg, padX, padY });
  }
  // Logo blanc à plat (dessiné à la fin) ; les bulles du haut s'alignent sur le haut visible du logo
  const LOGO_Y = 32;
  let logo: Image | null = null;
  let logoTop = 40;
  if (style?.show_logo !== false) {
    const logoBytes = new Uint8Array(await (await fetch(`${siteUrl.replace(/\/$/, "")}/logo/logo-white.png`)).arrayBuffer());
    const rawLogo = await Image.decode(logoBytes);
    const lb = rawLogo.bitmap;
    for (let i = 0; i < lb.length; i += 4) { lb[i] = 255; lb[i + 1] = 255; lb[i + 2] = 255; }
    rawLogo.bitmap = lb;
    const targetLogoWidth = 420;
    logo = rawLogo.resize(targetLogoWidth, Math.round(rawLogo.height * (targetLogoWidth / rawLogo.width)));
    const bm = logo.bitmap, lw = logo.width;
    let first = 0;
    search: for (let y = 0; y < logo.height; y++) for (let x = 0; x < lw; x++) if (bm[(y * lw + x) * 4 + 3] > 60) { first = y; break search; }
    logoTop = LOGO_Y + first;
  }
  let ty = logoTop;
  for (const t of topRight) {
    const tx = W - 40 - t.bubble.width;
    canvas.composite(t.bubble, tx, ty);
    canvas.composite(t.img, tx + t.padX, ty + t.padY);
    ty += t.bubble.height + 10;
  }

  // Site web tout en bas, titre juste au-dessus
  let siteImg: Image | null = null;
  if (style?.show_website !== false) {
    siteImg = await Image.renderText(fontBytes, 30, siteUrl.replace(/^https?:\/\//, ""), 0xffffffff);
  }
  const bottomLimit = siteImg ? H - 40 - siteImg.height - 14 : H - 40;
  const titleH = titleLines.reduce((h, l, i) => h + l.img.height + (i ? lineGap : 0), 0);
  let cursorY = bottomLimit - titleH;
  for (const l of titleLines) {
    canvas.composite(l.shadow, 40 - l.pad + 2, cursorY - (l.pad - l.offset) + 4);
    canvas.composite(l.img, 40 - l.offset, cursorY);
    cursorY += l.img.height + lineGap;
  }
  if (siteImg) canvas.composite(siteImg, 40, H - 40 - siteImg.height);

  if (logo) canvas.composite(logo, 36, LOGO_Y);

  return await canvas.encodeJPEG(90);
}

// deno-lint-ignore no-explicit-any
async function postToFacebook(settings: any, imageUrl: string, caption: string): Promise<string> {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${settings.facebook_page_id}/photos`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: imageUrl,
      caption,
      access_token: settings.facebook_page_token,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Échec publication Facebook");
  return data.post_id || data.id;
}

// deno-lint-ignore no-explicit-any
async function postToInstagram(settings: any, imageUrl: string, caption: string): Promise<string> {
  const base = `https://graph.facebook.com/${GRAPH_VERSION}/${settings.instagram_business_id}`;

  // Étape 1 : créer le conteneur média
  const createRes = await fetch(`${base}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: settings.facebook_page_token,
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createData?.error?.message || "Échec création média Instagram");
  }

  // Instagram doit finir de traiter l'image avant la publication : on attend que le conteneur soit prêt
  for (let i = 0; i < 10; i++) {
    const st = await (await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${createData.id}?fields=status_code&access_token=${encodeURIComponent(settings.facebook_page_token)}`)).json();
    if (st?.status_code === "FINISHED") break;
    if (st?.status_code === "ERROR") throw new Error("Instagram n'a pas pu traiter l'image");
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Étape 2 : publier le conteneur
  const publishRes = await fetch(`${base}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: createData.id,
      access_token: settings.facebook_page_token,
    }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok) {
    throw new Error(publishData?.error?.message || "Échec publication Instagram");
  }
  return publishData.id;
}
