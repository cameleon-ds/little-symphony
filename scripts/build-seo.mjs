// Génère les pages produit statiques (produit/<slug>.html) + sitemap.xml pour le référencement.
// Lancé automatiquement par .github/workflows/seo-build.yml (toutes les 6 h) ou à la main : node scripts/build-seo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://little-symphony.com/';
const OUT  = path.join(ROOT, 'produit');

const client = fs.readFileSync(path.join(ROOT, 'supabase-client.js'), 'utf8');
const SB_URL = client.match(/https:\/\/[a-z0-9]+\.supabase\.co/)[0];
const SB_KEY = client.match(/eyJ[A-Za-z0-9._-]+/)[0];

const esc  = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt  = n => Number(n).toFixed(3).replace('.', ',') + ' DT';
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };
// Texte par défaut (produits sans vrai descriptif) : ne sert pas de description Google
const DEFAULT_DESC = 'Produit sélectionné avec soin par notre équipe Little Symphony pour le bien-être de votre enfant. Qualité premium, matériaux certifiés, adapté aux petits.';
const realDesc = p => { const d = String(p.description || '').trim(); return d && d !== DEFAULT_DESC ? d : ''; };
const abs  = u => !u ? SITE + 'images/og-image.jpg?v=2' : /^https?:/.test(u) ? u : SITE + u.replace(/^\//, '');

async function sb(q) {
  const r = await fetch(`${SB_URL}/rest/v1/${q}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

const products = await sb('products?select=id,slug,name,subtitle,description,price,price_old,images,stock,attributes,updated_at,categories(name,name_full,key)&is_active=eq.true&order=name');
const template = fs.readFileSync(path.join(ROOT, 'product.html'), 'utf8');

fs.mkdirSync(OUT, { recursive: true });
const keep = new Set();

for (const p of products) {
  if (!p.slug) continue;
  const file = `${p.slug}.html`;
  keep.add(file);
  const url   = `${SITE}produit/${encodeURIComponent(p.slug)}.html`;
  const cat   = p.categories?.name || '';
  const attrs = Object.fromEntries((p.attributes || []).map(a => [a.title, a.desc]));
  const img   = abs((p.images || [])[0]);
  const desc  = realDesc(p)
    ? clip(realDesc(p), 158)
    : clip(`${p.name}${p.subtitle ? ' – ' + p.subtitle : ''}. ${cat ? cat + ' pour bébé et enfant. ' : ''}Prix : ${fmt(p.price)}. Commandez en ligne chez Little Symphony, livraison Grand-Tunis.`, 158);
  const title = clip(`${p.name} – ${fmt(p.price)} | Little Symphony Tunisie`, 70);

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: p.name,
        image: (p.images || []).length ? p.images.map(abs) : [img],
        description: realDesc(p) || desc,
        sku: attrs['Référence'] || p.slug,
        ...(/^\d{13}$/.test(attrs['Code-barres'] || '') ? { gtin13: attrs['Code-barres'] } : {}),
        ...(attrs['Marque'] ? { brand: { '@type': 'Brand', name: attrs['Marque'] } } : {}),
        ...(cat ? { category: cat } : {}),
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: 'TND',
          price: Number(p.price).toFixed(3),
          availability: (p.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: 'Little Symphony' }
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Boutique', item: SITE + 'boutique.html' },
          ...(cat ? [{ '@type': 'ListItem', position: 2, name: cat, item: SITE + 'boutique.html' }] : []),
          { '@type': 'ListItem', position: cat ? 3 : 2, name: p.name, item: url }
        ]
      }
    ]
  };

  const head = `<base href="../">
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Little Symphony">
<meta property="og:locale" content="fr_TN">
<meta property="og:title" content="${esc(p.name)} – ${esc(fmt(p.price))}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:secure_url" content="${esc(img)}">
<meta property="og:image:alt" content="${esc(p.name)}">
<meta property="product:price:amount" content="${Number(p.price).toFixed(3)}">
<meta property="product:price:currency" content="TND">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.name)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<script>window.PRERENDER_SLUG = ${JSON.stringify(p.slug)};</script>`;

  let html = template
    .replace(/<meta name="robots"[^>]*>\s*/i, '')
    .replace(/<link rel="canonical"[^>]*>\s*/i, '')
    .replace(/(<meta name="viewport"[^>]*>)/i, `$1\n${head}`)
    .replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`)
    // Contenu pré-rempli : lisible par Google même sans JavaScript
    .replace(/(<h1 class="product-name" id="product-name">)(<\/h1>)/, `$1${esc(p.name)}$2`)
    .replace(/(<div class="product-sub" id="product-sub">)(<\/div>)/, `$1${esc(p.subtitle || '')}$2`)
    .replace(/(<span class="price" id="price">)(<\/span>)/, `$1${esc(fmt(p.price))}$2`)
    .replace(/(<p class="product-desc" id="product-desc">)(<\/p>)/, `$1${esc(p.description || '')}$2`)
    .replace(/<img class="img-main" id="img-main" src="" alt="">/, `<img class="img-main" id="img-main" src="${esc(img)}" alt="${esc(p.name)}">`)
    .replace(/(<span id="bc-name">)[^<]*(<\/span>)/, `$1${esc(p.name)}$2`)
    .replace(/(<a href="index.html" id="bc-cat">)[^<]*(<\/a>)/, `$1${esc(cat || 'Boutique')}$2`);

  fs.writeFileSync(path.join(OUT, file), html);
}

// Supprimer les pages des produits retirés ou masqués
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html') && !keep.has(f)) fs.unlinkSync(path.join(OUT, f));

// Sitemap
const today = new Date().toISOString().slice(0, 10);
const staticPages = [
  ['', '1.0', 'daily'], ['boutique.html', '0.9', 'daily'], ['apropos.html', '0.5', 'monthly'],
  ['contact.html', '0.5', 'monthly'], ['cgv.html', '0.2', 'yearly'], ['cgu.html', '0.2', 'yearly'], ['mentions-legales.html', '0.2', 'yearly']
];
const urls = [
  ...staticPages.map(([u, pr, cf]) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`),
  ...products.filter(p => p.slug).map(p => {
    const img = (p.images || [])[0];
    return `  <url><loc>${SITE}produit/${encodeURIComponent(p.slug)}.html</loc><lastmod>${(p.updated_at || today).slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority>${img ? `<image:image><image:loc>${esc(abs(img))}</image:loc><image:title>${esc(p.name)}</image:title></image:image>` : ''}</url>`;
  })
];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`);

console.log(`${keep.size} pages produit générées, sitemap : ${urls.length} URLs`);
