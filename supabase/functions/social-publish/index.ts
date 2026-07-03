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
import { Image } from "jsr:@matmen/imagescript";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GRAPH_VERSION = "v19.0";

// Polices utilisées pour le texte incrusté (Inter pour le texte courant,
// Playwrite US Modern — police manuscrite "enfantine" — à l'essai pour le
// titre du produit). Chargées à chaque exécution depuis Google Fonts.
const FONT_BOLD_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf";
const FONT_TITLE_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/playwriteusmodern/PlaywriteUSModern%5Bwght%5D.ttf";

const BRAND_PRIMARY = 0xc9a09aff; // --primary du site

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
    const isCron = token === SERVICE_ROLE_KEY;

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
      ? new Date(settings.last_run_at).toISOString().slice(0, 10)
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
    if (!allowedCategories.length) {
      return json({ skipped: true, reason: "Aucune catégorie sélectionnée pour la publication" });
    }

    // ── 4. Prochain produit dans la file (parmi ces catégories) ─
    const { data: queueItem, error: queueErr } = await supabase
      .from("social_queue")
      .select("*, products!inner(*)")
      .eq("status", "pending")
      .in("products.category_id", allowedCategories)
      .or(`scheduled_for.is.null,scheduled_for.lte.${todayStr}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (queueErr) throw queueErr;
    if (!queueItem) {
      return json({ skipped: true, reason: "File d'attente vide" });
    }

    const product = queueItem.products;
    if (!product || !product.images?.length) {
      await markFailed(supabase, queueItem.id, "Produit sans image");
      return json({ skipped: true, reason: "Produit sans image, marqué en échec" });
    }

    // ── 5. Générer l'image avec le texte incrusté ───────────
    const siteUrl = (settings.site_url || "https://little-symphony.com").replace(/\/$/, "");
    const composedBytes = await composeImage(product, settings.template_style, siteUrl);

    const fileName = `${product.slug}-${Date.now()}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from("social-media")
      .upload(fileName, composedBytes, { contentType: "image/jpeg", upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: pub } = supabase.storage.from("social-media").getPublicUrl(fileName);
    const imageUrl = pub.publicUrl;

    // ── 6. Construire le texte de publication ───────────────
    const caption = buildCaption(product, siteUrl);

    // ── 7. Publier ───────────────────────────────────────────
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

    if (
      (queueItem.platform === "instagram" || queueItem.platform === "both") &&
      settings.instagram_business_id
    ) {
      try {
        igMediaId = await postToInstagram(settings, imageUrl, caption);
        results.instagram = igMediaId;
      } catch (e) {
        errors.push(`Instagram: ${(e as Error).message}`);
      }
    }

    // ── 8. Mettre à jour la file + les réglages ─────────────
    const success = fbPostId || igMediaId;
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

    if (success) {
      await supabase
        .from("social_settings")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", true);
    }

    return json({ ok: true, product: product.name, results, errors });
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
    .select("id, platform, products(*)")
    .eq("id", queueId)
    .single();

  if (queueErr || !queueItem) {
    return json({ ok: false, error: "Élément de file introuvable" });
  }

  const product = queueItem.products;
  if (!product || !product.images?.length) {
    return json({ ok: false, error: "Ce produit n'a pas d'image" });
  }

  const composedBytes = await composeImage(product, settings?.template_style, siteUrl);

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
      caption: buildCaption(product, siteUrl),
      platform: queueItem.platform,
      productName: product.name,
    },
  });
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
function buildCaption(product: any, siteUrl: string): string {
  const ages = (product.age_ranges || [])
    .map((a: string) => AGE_LABELS[a] || a)
    .join(", ");
  const price = product.is_promo && product.price_old
    ? `${product.price} DT (au lieu de ${product.price_old} DT)`
    : `${product.price} DT`;

  // Lien direct vers la fiche produit — c'est le vrai CTA cliquable
  // (Facebook transforme automatiquement les URLs du texte en lien ;
  // Instagram, lui, n'hyperlie jamais le texte d'une publication —
  // c'est une limitation de la plateforme, pas de notre code).
  const productLink = `${siteUrl}/product.html?slug=${product.slug}`;

  const lines = [
    `✨ ${product.name}`,
    product.subtitle || "",
    "",
    product.description ? truncate(product.description, 300) : "",
    "",
    `💰 ${price}`,
    ages ? `👶 ${ages}` : "",
    "",
    `🔗 Voir le produit : ${productLink}`,
    "#LittleSymphony #Tunisie #Bebe #Enfant",
  ].filter(Boolean);

  return lines.join("\n");
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

// deno-lint-ignore no-explicit-any
async function composeImage(product: any, style: any, siteUrl: string): Promise<Uint8Array> {
  const SIZE = 1080; // format carré, compatible FB + IG

  // 1. Photo produit
  const photoRes = await fetch(product.images[0]);
  const photoBuf = new Uint8Array(await photoRes.arrayBuffer());
  let photo = await Image.decode(photoBuf);

  // Recadrage carré centré + redimensionnement
  const side = Math.min(photo.width, photo.height);
  photo = photo.crop(
    Math.floor((photo.width - side) / 2),
    Math.floor((photo.height - side) / 2),
    side,
    side,
  ).resize(SIZE, SIZE);

  const canvas = new Image(SIZE, SIZE);
  canvas.composite(photo, 0, 0);

  // 2. Logo (celui du header du site, format rectangulaire) en haut à
  // gauche, sur une pastille blanche arrondie pour rester lisible quelle
  // que soit la couleur de la photo produit. Le fichier logo.png est
  // bundlé avec la fonction (voir supabase/config.toml).
  if (style?.show_logo !== false) {
    const logoBytes = await Deno.readFile("./logo.png");
    const rawLogo = await Image.decode(logoBytes);
    const targetLogoWidth = 340;
    const targetLogoHeight = Math.round(rawLogo.height * (targetLogoWidth / rawLogo.width));
    const logo = rawLogo.resize(targetLogoWidth, targetLogoHeight);

    const pad = 18;
    const backing = new Image(logo.width + pad * 2, logo.height + pad * 2);
    backing.fill(0xffffffee);
    backing.roundCorners(16);
    canvas.composite(backing, 24, 24);
    canvas.composite(logo, 24 + pad, 24 + pad);
  }

  // 3. Grand cercle décoratif (à la place du bandeau rectangulaire) —
  // couleur primaire foncée, plus transparente, et plus bas dans l'image
  // (dôme moins haut). Centré sur le bord bas de l'image, aligné à
  // gauche et s'étirant presque jusqu'au bord droit, façon design
  // "univers enfant".
  // Note technique : "drawCircle" dessine directement sur l'image et
  // écrase les pixels (il ne mélange pas avec la photo en dessous), donc
  // la transparence n'avait aucun effet visible. On dessine le cercle sur
  // un calque à part, transparent, qu'on fusionne ensuite avec "composite"
  // (qui, lui, tient compte de l'opacité).
  const bandHeight = Math.round(SIZE * 0.38); // garde la même zone de texte qu'avant
  const circleRadius = Math.round(SIZE * 0.55);
  const circleCenterX = Math.round(SIZE * 0.4); // décalé vers la gauche (au lieu du centre)
  const circleLayer = new Image(SIZE, SIZE);
  circleLayer.drawCircle(circleCenterX, SIZE, circleRadius, 0xa8686080); // --primary-dark, ~50% opacité
  canvas.composite(circleLayer, 0, 0);

  // 4. Polices — ImageScript attend directement les octets bruts du fichier
  // .ttf (pas de classe "Font" à instancier, contrairement à une version
  // précédente de cette fonction qui provoquait une erreur au démarrage).
  const fontBytes = new Uint8Array(await (await fetch(FONT_BOLD_URL)).arrayBuffer());
  const titleFontBytes = new Uint8Array(await (await fetch(FONT_TITLE_URL)).arrayBuffer());

  let cursorY = SIZE - bandHeight + 24;

  if (style?.show_title !== false) {
    // Titre en Playwrite US Modern (police manuscrite, à l'essai).
    // Le fichier chargé n'a pas de variante grasse dédiée : on simule le
    // gras en superposant le texte avec de légers décalages d'1px — si
    // ça alourdit trop le tracé manuscrit, dis-le moi pour le retirer.
    const title = Image.renderText(titleFontBytes, 68, product.name, 0xffffffff, SIZE - 80);
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) =>
      canvas.composite(title, 40 + dx, cursorY + dy)
    );
    cursorY += title.height + 18;
  }

  if (style?.show_price !== false) {
    const priceText = product.is_promo && product.price_old
      ? `${product.price} DT (au lieu de ${product.price_old} DT)`
      : `${product.price} DT`;
    // Prix affiché dans une bulle blanche, texte couleur primaire.
    const priceTextImg = Image.renderText(fontBytes, 38, priceText, BRAND_PRIMARY, SIZE - 120);
    const padX = 22, padY = 12;
    const bubble = new Image(priceTextImg.width + padX * 2, priceTextImg.height + padY * 2);
    bubble.fill(0xffffffff);
    bubble.roundCorners(Math.round(bubble.height / 2));
    canvas.composite(bubble, 40, cursorY);
    canvas.composite(priceTextImg, 40 + padX, cursorY + padY);
    cursorY += bubble.height + 14;
  }

  if (style?.show_age_range !== false && product.age_ranges?.length) {
    const ages = product.age_ranges.map((a: string) => AGE_LABELS[a] || a).join(" · ");
    const ageImg = Image.renderText(fontBytes, 30, ages, 0xffffffff, SIZE - 80);
    canvas.composite(ageImg, 40, cursorY);
    cursorY += ageImg.height + 18;
  }

  // 5. Site web — toujours collé tout en bas de l'image (position fixe,
  // indépendante du titre/prix/âge au-dessus). Note : une image publiée
  // sur Facebook/Instagram ne peut pas contenir de zone cliquable
  // (limitation des deux plateformes) ; le vrai lien cliquable, lui, est
  // dans le texte de la publication (voir buildCaption ci-dessous), qui
  // s'affiche sous la photo.
  if (style?.show_website !== false) {
    const site = siteUrl.replace(/^https?:\/\//, "");
    const siteImg = Image.renderText(fontBytes, 30, site, 0xffffffff, SIZE - 80);
    const siteY = SIZE - 40 - siteImg.height;
    canvas.composite(siteImg, 40, siteY);
  }

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
