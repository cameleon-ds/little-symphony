/* ── Admin Little Symphony — Onglet « Contenu » ──
   Édition du contenu des pages Accueil, À propos, Contact et du Footer.
   Les données sont stockées dans la table Supabase `site_content` (une ligne par page,
   colonne `data` en JSON) et affichées par site-content.js / _shared.js côté site. */

(function injectContentCss() {
  const css = `
.nav-group{display:flex;flex-direction:column}
.nav-chevron{margin-left:auto;width:14px!important;height:14px!important;transition:transform .2s}
.nav-group.open .nav-chevron{transform:rotate(90deg)}
.nav-subs{display:none;flex-direction:column;gap:2px;margin:2px 0 4px 28px}
.nav-group.open .nav-subs{display:flex}
.nav-sub{text-align:left;padding:7px 12px;border:none;background:none;border-radius:8px;font-size:13px;color:var(--text-soft);cursor:pointer;font-family:var(--sans)}
.nav-sub:hover{background:var(--primary-xlight);color:var(--charcoal)}
.nav-sub.active{color:var(--primary-dark);font-weight:600;background:#F5EDED}
.ce-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:1.5rem}
.ce-actions{display:flex;gap:8px;align-items:center}
.ce-btn{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans);border:1.5px solid var(--border);background:#fff;color:var(--charcoal);text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.ce-btn:hover{border-color:var(--primary)}
.ce-btn.dark{background:var(--charcoal);color:#fff;border-color:var(--charcoal);position:relative}
.ce-btn.dark:disabled{opacity:.6;cursor:wait}
#ce-save-btn.is-dirty .dirty-dot{display:block}
.ce-section{background:#fff;border:1px solid var(--border);border-radius:14px;margin-bottom:1rem;overflow:hidden}
.ce-section > summary{list-style:none;cursor:pointer;padding:1rem 1.4rem;font-weight:600;font-size:14.5px;color:var(--charcoal);display:flex;align-items:center;gap:10px}
.ce-section > summary::-webkit-details-marker{display:none}
.ce-section > summary::before{content:'▸';color:var(--primary-dark);transition:transform .2s;display:inline-block}
.ce-section[open] > summary::before{transform:rotate(90deg)}
.ce-section > summary .ce-hint{font-weight:400;font-size:12px;color:var(--text-muted);margin-left:auto}
.ce-body{padding:0 1.4rem 1.4rem;display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}
.ce-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.ce-field.full{grid-column:1/-1}
.ce-label{font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted)}
.ce-help{font-size:11.5px;color:var(--text-muted);margin-top:-2px}
.ce-input,.ce-textarea,.ce-select{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13.5px;font-family:var(--sans);color:var(--charcoal);background:#fff;outline:none;box-sizing:border-box}
.ce-input:focus,.ce-textarea:focus,.ce-select:focus{border-color:var(--primary)}
.ce-textarea{min-height:80px;resize:vertical;line-height:1.5}
.ce-check{display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--charcoal);cursor:pointer}
.ce-img{display:flex;gap:12px;align-items:flex-start}
.ce-img-prev{width:120px;height:80px;border-radius:8px;border:1px solid var(--border);background:#F3EFED center/cover no-repeat;flex-shrink:0}
.ce-img-ctl{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}
.ce-icon{display:flex;gap:8px;align-items:center}
.ce-icon-prev{width:36px;height:36px;border-radius:8px;background:var(--primary-xlight);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ce-icon-prev svg{width:18px;height:18px;stroke:var(--primary-dark);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ce-color{display:flex;gap:8px;align-items:center}
.ce-color input[type=color]{width:42px;height:36px;border:1.5px solid var(--border);border-radius:8px;padding:2px;background:#fff;cursor:pointer}
.ce-list{grid-column:1/-1;display:flex;flex-direction:column;gap:10px}
.ce-item{border:1.5px solid var(--border);border-radius:12px;background:#FCFAF9}
.ce-item > summary{list-style:none;cursor:pointer;padding:.7rem 1rem;display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:600;color:var(--charcoal)}
.ce-item > summary::-webkit-details-marker{display:none}
.ce-item-num{width:24px;height:24px;border-radius:50%;background:var(--primary-xlight);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11.5px;color:var(--primary-dark);flex-shrink:0}
.ce-item-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ce-item-btns{display:flex;gap:4px}
.ce-ibtn{width:30px;height:30px;border-radius:7px;border:1px solid var(--border);background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--text-soft)}
.ce-ibtn:hover{border-color:var(--primary);color:var(--charcoal)}
.ce-ibtn.del:hover{border-color:#E57373;color:#C62828;background:#FFF5F5}
.ce-ibtn:disabled{opacity:.35;cursor:default}
.ce-item .ce-body{padding:.4rem 1rem 1rem}
.ce-add{align-self:flex-start;padding:8px 14px;border-radius:8px;border:1.5px dashed var(--primary);background:#fff;color:var(--primary-dark);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--sans)}
.ce-add:hover{background:var(--primary-xlight)}
/* Champ modifié et pas encore enregistré : contour vert */
.ce-input[data-mod],.ce-textarea[data-mod],.ce-select[data-mod]{border-color:#22C55E!important;box-shadow:0 0 0 3px rgba(34,197,94,.15)}
.ce-check input[data-mod]{outline:2px solid #22C55E;outline-offset:2px}
.ce-item[data-mod]{border-color:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.12)}
.ce-sub-title{grid-column:1/-1;font-size:13px;font-weight:600;color:var(--charcoal);margin-top:6px;padding-top:12px;border-top:1px dashed var(--border)}
@media(max-width:768px){.ce-body{grid-template-columns:1fr}.ce-img-prev{width:90px;height:64px}}
`;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
})();

/* ── Définition des champs éditables par page ─────────────────────────────── */
const CEF = {
  text:  (k, label, o = {}) => ({ k, label, type: 'text', ...o }),
  area:  (k, label, o = {}) => ({ k, label, type: 'textarea', full: true, ...o }),
  rich:  (k, label, o = {}) => ({ k, label, type: 'textarea', full: true, rows: 2, help: 'Astuce : *mot* = mot en italique coloré · Entrée = retour à la ligne', ...o }),
  img:   (k, label, o = {}) => ({ k, label, type: 'image', full: true, ...o }),
  icon:  (k, label = 'Icône', o = {}) => ({ k, label, type: 'icon', ...o }),
  bool:  (k, label, o = {}) => ({ k, label, type: 'bool', ...o }),
  color: (k, label, o = {}) => ({ k, label, type: 'color', ...o }),
  link:  (k, label, o = {}) => ({ k, label, type: 'text', placeholder: 'ex. boutique.html ou https://…', ...o }),
  list:  (k, label, item, fields, o = {}) => ({ k, label, type: 'list', item, fields, ...o }),
  group: (k, label, fields) => ({ k, label, type: 'group', fields }),
};

const CE_PAGES = {
  accueil: { key: 'home', label: 'Accueil', url: 'index.html', sections: [
    CEF.list('slides', 'Slider', 'Slide', [
      CEF.img('image', 'Image de fond'),
      CEF.icon('icon'), CEF.text('tag', 'Étiquette (au-dessus du titre)'),
      CEF.rich('title', 'Titre'),
      CEF.area('text', 'Texte'),
      CEF.text('cta_label', 'Texte du bouton'),
      { k: 'cta_cat', label: 'Le bouton ouvre la catégorie', type: 'category' },
      CEF.link('cta_link', 'Ou lien du bouton (si aucune catégorie)'),
    ], { titleKey: 'tag', hint: 'Diaporama en haut de la page' }),
    CEF.group('ateliers', 'Ateliers enfants', [
      CEF.bool('hidden', 'Masquer cette section sur le site', { full: true }),
      CEF.text('eyebrow', 'Sur-titre'), CEF.text('title', 'Titre'),
      CEF.list('items', 'Ateliers', 'Atelier', [
        CEF.img('image', 'Photo'),
        CEF.text('name', 'Nom de l’atelier'), CEF.text('badge', 'Étiquette sur la photo'),
        CEF.text('date', 'Date et heure'), CEF.text('duration', 'Durée'),
        CEF.text('age', 'Âge'), CEF.text('price', 'Tarif'),
        CEF.area('desc', 'Description'),
      ], { titleKey: 'name' }),
    ]),
    CEF.group('promo', 'Exclusivité Little Symphony', [
      CEF.img('image', 'Image de fond'),
      CEF.text('tag', 'Étiquette'), CEF.text('title', 'Titre'),
      CEF.area('text', 'Texte'),
      CEF.text('cta_label', 'Texte du bouton'), CEF.link('cta_link', 'Lien du bouton'),
    ]),
    CEF.list('trust', '4 points clés', 'Point clé', [
      CEF.icon('icon'), CEF.text('title', 'Titre'), CEF.text('sub', 'Sous-titre'),
    ], { titleKey: 'title', hint: 'Bandeau au-dessus du footer' }),
  ]},

  apropos: { key: 'about', label: 'À propos', url: 'apropos.html', sections: [
    CEF.group('hero', 'Bannière', [
      CEF.img('image', 'Image de fond'), CEF.text('eyebrow', 'Sur-titre', { full: true }), CEF.rich('title', 'Titre'),
    ]),
    CEF.group('manifesto', 'Notre histoire', [
      CEF.rich('quote', 'Citation'), CEF.text('eyebrow', 'Sur-titre', { full: true }),
      CEF.area('text', 'Texte', { rows: 8, help: 'Laissez une ligne vide entre deux paragraphes' }),
    ]),
    CEF.group('photos', 'Photos de la boutique', [
      CEF.text('eyebrow', 'Sur-titre'), CEF.rich('title', 'Titre'), CEF.area('lead', 'Introduction'),
      CEF.list('items', 'Photos', 'Photo', [CEF.img('image', 'Photo'), CEF.text('label', 'Légende'), CEF.text('alt', 'Description (accessibilité)')],
        { titleKey: 'label', help: 'La première photo est affichée en grand' }),
    ]),
    CEF.group('zones', 'Espaces par âge', [
      CEF.text('eyebrow', 'Sur-titre'), CEF.rich('title', 'Titre'), CEF.area('lead', 'Introduction'),
      CEF.list('items', 'Espaces', 'Espace', [CEF.img('image', 'Photo'), CEF.text('tag', 'Âge'), CEF.text('title', 'Titre'), CEF.area('text', 'Texte')], { titleKey: 'tag' }),
    ]),
    CEF.group('cats', 'Notre sélection (univers)', [
      CEF.text('eyebrow', 'Sur-titre'), CEF.rich('title', 'Titre'), CEF.area('lead', 'Introduction'),
      CEF.list('items', 'Univers', 'Univers', [CEF.icon('icon'), CEF.color('color', 'Couleur'), CEF.text('name', 'Nom'), CEF.text('sub', 'Sous-titre')], { titleKey: 'name' }),
    ]),
    CEF.group('music', 'Coin musical & ateliers', [
      CEF.img('image', 'Photo'), CEF.text('eyebrow', 'Sur-titre'), CEF.rich('title', 'Titre'), CEF.area('text', 'Texte'),
      CEF.list('items', 'Ateliers', 'Atelier', [CEF.icon('icon'), CEF.text('name', 'Nom'), CEF.text('desc', 'Description', { full: true })], { titleKey: 'name' }),
      CEF.text('cta_label', 'Texte du bouton'), CEF.link('cta_link', 'Lien du bouton'),
    ]),
    CEF.group('values', 'Nos engagements', [
      CEF.text('eyebrow', 'Sur-titre'), CEF.rich('title', 'Titre'), CEF.area('lead', 'Introduction'),
      CEF.list('items', 'Engagements', 'Engagement', [CEF.icon('icon'), CEF.text('title', 'Titre'), CEF.area('text', 'Texte')], { titleKey: 'title' }),
    ]),
    CEF.group('cta', 'Bandeau final', [
      CEF.rich('title', 'Titre'), CEF.area('text', 'Texte'),
      CEF.text('btn1_label', 'Bouton 1 — texte'), CEF.link('btn1_link', 'Bouton 1 — lien'),
      CEF.text('btn2_label', 'Bouton 2 — texte'), CEF.link('btn2_link', 'Bouton 2 — lien'),
    ]),
  ]},

  contact: { key: 'contact', label: 'Contact', url: 'contact.html', sections: [
    CEF.group('hero', 'En-tête', [CEF.text('eyebrow', 'Sur-titre', { full: true }), CEF.rich('title', 'Titre'), CEF.area('text', 'Texte')]),
    CEF.group('address', 'Adresse', [
      CEF.text('value', 'Adresse'), CEF.text('sub', 'Complément'),
      CEF.text('link_label', 'Texte du lien Google Maps'),
    ]),
    { k: '', label: 'Carte Google Maps', type: 'root', fields: [
      CEF.text('map_query', 'Position sur la carte', { full: true, help: 'Coordonnées GPS (ex. 36.8465407,10.1670608) ou adresse complète. Sert pour la carte et les liens « Itinéraire ».' }),
    ]},
    { k: '', label: 'Téléphones', type: 'root', fields: [
      CEF.list('phones', 'Numéros', 'Numéro', [CEF.text('number', 'Numéro', { full: true, placeholder: '+216 XX XXX XXX' })], { titleKey: 'number' }),
      CEF.text('phone_sub', 'Texte sous les numéros', { full: true }),
    ]},
    CEF.group('email', 'E-mail', [CEF.text('value', 'Adresse e-mail'), CEF.text('sub', 'Texte en dessous')]),
    CEF.group('hours', 'Horaires', [CEF.text('value', 'Horaires'), CEF.text('sub', 'Texte en dessous')]),
    { k: '', label: 'Formulaire & réseaux', type: 'root', fields: [
      CEF.text('form_title', 'Titre du formulaire'), CEF.text('form_subtitle', 'Sous-titre du formulaire'),
      CEF.text('social_title', 'Texte au-dessus des réseaux sociaux', { full: true }),
    ]},
    CEF.group('map', 'Bandeau « Nous trouver »', [CEF.text('title', 'Titre'), CEF.text('link_label', 'Texte du lien'), CEF.area('text', 'Texte')]),
  ]},

  footer: { key: 'footer', label: 'Footer', url: 'index.html#main-footer', sections: [
    { k: '', label: 'Présentation', type: 'root', fields: [CEF.area('brand_text', 'Texte sous le logo')] },
    CEF.group('socials', 'Réseaux sociaux', [
      CEF.link('instagram', 'Lien Instagram', { placeholder: 'https://instagram.com/…' }),
      CEF.link('facebook', 'Lien Facebook', { placeholder: 'https://facebook.com/…' }),
      CEF.link('tiktok', 'Lien TikTok', { placeholder: 'https://tiktok.com/@…' }),
    ]),
    { k: '', label: 'Colonnes de liens', type: 'root', fields: [
      CEF.list('columns', 'Colonnes', 'Colonne', [
        CEF.text('title', 'Titre de la colonne', { full: true }),
        CEF.list('links', 'Liens', 'Lien', [CEF.text('label', 'Texte'), CEF.link('url', 'Lien', { help: 'Laisser vide = texte simple, sans lien' })], { titleKey: 'label' }),
      ], { titleKey: 'title' }),
    ]},
    { k: '', label: 'Bas de page', type: 'root', fields: [CEF.text('copyright', 'Copyright'), CEF.text('region', 'Région')] },
  ]},

  mentions: { key: 'mentions', label: 'Mentions légales', url: 'mentions-legales.html', sections: [
    CEF.group('hero', 'En-tête', [CEF.text('eyebrow', 'Sur-titre'), CEF.text('title', 'Titre'), CEF.area('text', 'Introduction', { rows: 3 })]),
    CEF.list('sections', 'Articles', 'Article', [
      CEF.text('title', 'Titre de l\u2019article', { full: true }),
      CEF.area('body', 'Texte', { rows: 9, help: 'Ligne vide = nouveau paragraphe · ligne commençant par « - » = liste à puces · [texte](lien) = lien · [texte] = champ à compléter surligné · **texte** = gras' }),
    ], { titleKey: 'title', hint: 'Ajouter, supprimer, réordonner' }),
    { k: '', label: 'Date de mise à jour', type: 'root', fields: [CEF.text('updated', 'Texte en bas de page', { full: true })] },
  ]},

  cgv: { key: 'cgv', label: 'CGV', url: 'cgv.html', sections: [
    CEF.group('hero', 'En-tête', [CEF.text('eyebrow', 'Sur-titre'), CEF.text('title', 'Titre'), CEF.area('text', 'Introduction', { rows: 3 })]),
    CEF.list('sections', 'Articles', 'Article', [
      CEF.text('title', 'Titre de l\u2019article', { full: true }),
      CEF.area('body', 'Texte', { rows: 9, help: 'Ligne vide = nouveau paragraphe · ligne commençant par « - » = liste à puces · [texte](lien) = lien · [texte] = champ à compléter surligné · **texte** = gras' }),
    ], { titleKey: 'title', hint: 'Ajouter, supprimer, réordonner' }),
    { k: '', label: 'Date de mise à jour', type: 'root', fields: [CEF.text('updated', 'Texte en bas de page', { full: true })] },
  ]},
};

/* ── État de l'éditeur ───────────────────────────────────────────────────── */
// Catégories proposées dans « Le bouton ouvre la catégorie » (chargées depuis Supabase)
let _ceCats = [];
async function ceLoadCats() {
  if (_ceCats.length) return;
  const { data, error } = await _supabase.from('categories').select('key, name, sort_order').order('sort_order');
  if (!error && data) _ceCats = data.map(c => ({ key: c.key, nom: c.name }));
}

const _ce = { page: null, data: null, dirty: false, open: new Set(), mod: new Set() };

function ceGet(path) {
  return path.split('.').filter(Boolean).reduce((o, k) => (o == null ? undefined : o[k]), _ce.data);
}
function ceSetPath(path, val) {
  const ks = path.split('.').filter(Boolean);
  let o = _ce.data;
  ks.slice(0, -1).forEach((k, i) => {
    if (o[k] == null) o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    o = o[k];
  });
  o[ks[ks.length - 1]] = val;
}
function ceJoin(a, b) { return a ? (b === '' ? a : a + '.' + b) : String(b); }
function ceSetDirty(v) {
  _ce.dirty = !!v;
  document.getElementById('ce-save-btn')?.classList.toggle('is-dirty', _ce.dirty);
}
window.addEventListener('beforeunload', e => {
  if (_ce.dirty && document.getElementById('panel-contenu')?.classList.contains('active')) { e.preventDefault(); e.returnValue = ''; }
});

/* ── Ouverture d'une page ────────────────────────────────────────────────── */
async function ceOpen(slug, opts = {}) {
  if (!CE_PAGES[slug]) slug = 'accueil';
  if (_ce.dirty && _ce.page && _ce.page !== slug && !confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?')) return;
  const conf = CE_PAGES[slug];
  const navBtn = document.getElementById('nav-contenu');
  showPanel('contenu', navBtn);
  document.getElementById('nav-group-contenu')?.classList.add('open');
  document.querySelectorAll('.nav-sub').forEach(b => b.classList.toggle('active', b.dataset.page === slug));
  setBreadcrumb('Contenu', conf.label);
  if (!opts.fromHash && location.hash !== '#contenu/' + slug) history.pushState(null, '', '#contenu/' + slug);
  else if (location.hash === '#contenu') history.replaceState(null, '', '#contenu/' + slug);

  _ce.page = slug; _ce.open = new Set(); _ce.mod = new Set(); ceSetDirty(false);
  document.getElementById('ce-title').textContent = 'Contenu — ' + conf.label;
  document.getElementById('ce-view').href = conf.url;
  const form = document.getElementById('ce-form');
  form.innerHTML = '<div style="padding:2rem;color:var(--text-muted)">Chargement…</div>';

  const [{ data, error }] = await Promise.all([
    _supabase.from('site_content').select('data').eq('key', conf.key).maybeSingle(),
    ceLoadCats(),
  ]);
  if (_ce.page !== slug) return;                   // l'utilisateur a changé de page entre-temps
  if (error) { form.innerHTML = `<div style="padding:2rem;color:#C62828">Erreur de chargement : ${lsEsc(error.message)}</div>`; return; }
  _ce.data = (data && data.data) ? data.data : {};
  ceRender();
}

function ceToggleGroup() {
  const g = document.getElementById('nav-group-contenu');
  if (!g) return;
  if (!g.classList.contains('open')) ceOpen('accueil');
  else g.classList.remove('open');
}

/* ── Rendu du formulaire ─────────────────────────────────────────────────── */
function ceRender() {
  const conf = CE_PAGES[_ce.page];
  const scrollY = window.scrollY;
  document.getElementById('ce-form').innerHTML = conf.sections.map((s, i) => {
    const sid = 'sec' + i;
    const isOpen = _ce.open.has(sid);
    let body;
    if (s.type === 'list') body = ceFieldList(s, s.k);
    else if (s.type === 'group') body = s.fields.map(f => ceField(f, ceJoin(s.k, f.k))).join('');
    else body = s.fields.map(f => ceField(f, f.k)).join('');
    return `<details class="ce-section" data-open-key="${sid}"${isOpen ? ' open' : ''} ontoggle="ceRemember(this)">
      <summary>${lsEsc(s.label)}${s.hint ? `<span class="ce-hint">${lsEsc(s.hint)}</span>` : ''}</summary>
      <div class="ce-body">${body}</div>
    </details>`;
  }).join('');
  window.scrollTo(0, scrollY);
}
function ceRemember(el) {
  const k = el.dataset.openKey;
  if (el.open) _ce.open.add(k); else _ce.open.delete(k);
}

function ceField(f, path) {
  const v = ceGet(path);
  const full = f.full ? ' full' : '';
  const help = f.help ? `<div class="ce-help">${lsEsc(f.help)}</div>` : '';
  const lab = `<label class="ce-label">${lsEsc(f.label)}</label>`;
  const dp = `data-p="${lsEsc(path)}"${_ce.mod.has(path) ? ' data-mod="1"' : ''}`;
  switch (f.type) {
    case 'text':
      return `<div class="ce-field${full}">${lab}<input class="ce-input" ${dp} value="${lsEsc(v)}" placeholder="${lsEsc(f.placeholder || '')}" oninput="ceInput(this)">${help}</div>`;
    case 'textarea':
      return `<div class="ce-field${full}">${lab}<textarea class="ce-textarea" ${dp} rows="${f.rows || 4}" oninput="ceInput(this)">${lsEsc(v)}</textarea>${help}</div>`;
    case 'bool':
      return `<div class="ce-field${full}"><label class="ce-check"><input type="checkbox" ${dp} ${v ? 'checked' : ''} onchange="ceInput(this)"> ${lsEsc(f.label)}</label></div>`;
    case 'color':
      return `<div class="ce-field${full}">${lab}<div class="ce-color"><input type="color" value="${lsEsc(v || '#C9A09A')}" oninput="this.nextElementSibling.value=this.value;ceInput(this.nextElementSibling)"><input class="ce-input" ${dp} value="${lsEsc(v)}" oninput="ceInput(this);if(/^#[0-9a-f]{6}$/i.test(this.value))this.previousElementSibling.value=this.value"></div></div>`;
    case 'icon':
      return `<div class="ce-field${full}">${lab}<div class="ce-icon"><div class="ce-icon-prev"><svg viewBox="0 0 24 24">${lsIcon(v)}</svg></div>
        <select class="ce-select" ${dp} onchange="ceInput(this);this.previousElementSibling.innerHTML='<svg viewBox=&quot;0 0 24 24&quot;>'+lsIcon(this.value)+'</svg>'">
          ${Object.entries(LS_ICONS).map(([k, ic]) => `<option value="${k}"${k === v ? ' selected' : ''}>${lsEsc(ic.label)}</option>`).join('')}
        </select></div></div>`;
    case 'category': {
      const cats = _ceCats.slice();
      if (v && !cats.some(c => c.key === v)) cats.push({ key: v, nom: v + ' (introuvable)' });   // ne jamais perdre une valeur existante
      return `<div class="ce-field${full}">${lab}<select class="ce-select" ${dp} onchange="ceInput(this)">
        <option value="">— Aucune (utiliser le lien) —</option>
        ${cats.map(c => `<option value="${lsEsc(c.key)}"${c.key === v ? ' selected' : ''}>${lsEsc(c.nom)}</option>`).join('')}
      </select></div>`;
    }
    case 'image':
      return `<div class="ce-field${full}">${lab}<div class="ce-img">
        <div class="ce-img-prev" style="background-image:url('${lsEsc(String(v || '').replace(/'/g, '%27'))}')"></div>
        <div class="ce-img-ctl">
          <input class="ce-input" ${dp} value="${lsEsc(v)}" placeholder="Lien de l'image (https://…) ou bouton ci-dessous" oninput="ceInput(this);this.closest('.ce-img').querySelector('.ce-img-prev').style.backgroundImage='url(\\''+this.value.replace(/'/g,'%27')+'\\')'">
          <div><label class="ce-btn" style="cursor:pointer">📷 Importer une image<input type="file" accept="image/*" style="display:none" onchange="ceUpload(this)"></label></div>
        </div></div>${help}</div>`;
    case 'group':
      return `<div class="ce-sub-title">${lsEsc(f.label)}</div>` + f.fields.map(sf => ceField(sf, ceJoin(path, sf.k))).join('');
    case 'list':
      return ceFieldList(f, path);
  }
  return '';
}

function ceFieldList(f, path) {
  const arr = Array.isArray(ceGet(path)) ? ceGet(path) : [];
  const items = arr.map((it, i) => {
    const ip = ceJoin(path, i);
    const okey = 'it:' + ip;
    const t = (f.titleKey && it && it[f.titleKey]) ? String(it[f.titleKey]).replace(/\*/g, '') : (f.item + ' ' + (i + 1));
    return `<details class="ce-item" data-open-key="${lsEsc(okey)}"${_ce.open.has(okey) ? ' open' : ''}${_ce.mod.has(okey) ? ' data-mod="1"' : ''} ontoggle="ceRemember(this)">
      <summary><span class="ce-item-num">${i + 1}</span><span class="ce-item-title">${lsEsc(t)}</span>
        <span class="ce-item-btns" onclick="event.preventDefault();event.stopPropagation()">
          <button type="button" class="ce-ibtn" title="Monter" ${i === 0 ? 'disabled' : ''} onclick="ceMove('${path}',${i},-1)">↑</button>
          <button type="button" class="ce-ibtn" title="Descendre" ${i === arr.length - 1 ? 'disabled' : ''} onclick="ceMove('${path}',${i},1)">↓</button>
          <button type="button" class="ce-ibtn del" title="Supprimer" onclick="ceDel('${path}',${i})">🗑</button>
        </span></summary>
      <div class="ce-body">${f.fields.map(sf => ceField(sf, ceJoin(ip, sf.k))).join('')}</div>
    </details>`;
  }).join('');
  return `${f.label && path.includes('.') ? `<div class="ce-sub-title">${lsEsc(f.label)}</div>` : ''}
    <div class="ce-list">${items}${f.help ? `<div class="ce-help">${lsEsc(f.help)}</div>` : ''}
      <button type="button" class="ce-add" onclick="ceAdd('${path}')">+ Ajouter ${lsEsc(ceArticle(f.item))}</button>
    </div>`;
}
function ceArticle(item) {
  const fem = ['slide', 'colonne', 'photo'];
  return (fem.includes(item.toLowerCase()) ? 'une ' : 'un ') + item.toLowerCase();
}

/* ── Actions ─────────────────────────────────────────────────────────────── */
function ceInput(el) {
  const val = el.type === 'checkbox' ? el.checked : el.value;
  ceSetPath(el.dataset.p, val);
  _ce.mod.add(el.dataset.p);
  el.setAttribute('data-mod', '1');
  ceSetDirty(true);
}
// Après un déplacement / une suppression dans une liste, recaler les repères « modifié »
function ceRemapMod(path, mapIdx) {
  const pre = path + '.';
  _ce.mod = new Set([..._ce.mod].map(k => {
    const it = k.startsWith('it:'), p = it ? k.slice(3) : k;
    if (!p.startsWith(pre)) return k;
    const rest = p.slice(pre.length).split('.');
    const n = mapIdx(+rest[0]);
    if (n == null) return null;
    rest[0] = String(n);
    return (it ? 'it:' : '') + pre + rest.join('.');
  }).filter(Boolean));
}
function ceAdd(path) {
  const arr = Array.isArray(ceGet(path)) ? ceGet(path) : [];
  const fresh = {};
  arr.push(fresh);
  ceSetPath(path, arr);
  _ce.open.add('it:' + ceJoin(path, arr.length - 1));
  _ce.mod.add('it:' + ceJoin(path, arr.length - 1));
  ceSetDirty(true);
  ceRender();
}
function ceDel(path, i) {
  const arr = ceGet(path);
  if (!Array.isArray(arr)) return;
  const it = arr[i] || {};
  const name = it.name || it.title || it.tag || it.label || it.number || ('élément ' + (i + 1));
  if (!confirm(`Supprimer « ${String(name).replace(/\*/g, '')} » ?`)) return;
  arr.splice(i, 1);
  _ce.open = new Set([..._ce.open].filter(k => !k.startsWith('it:' + path + '.')));
  ceRemapMod(path, n => n === i ? null : (n > i ? n - 1 : n));
  ceSetDirty(true);
  ceRender();
}
function ceMove(path, i, dir) {
  const arr = ceGet(path);
  const j = i + dir;
  if (!Array.isArray(arr) || j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  _ce.open = new Set([..._ce.open].filter(k => !k.startsWith('it:' + path + '.')));
  ceRemapMod(path, n => n === i ? j : (n === j ? i : n));
  _ce.mod.add('it:' + ceJoin(path, i)); _ce.mod.add('it:' + ceJoin(path, j));
  ceSetDirty(true);
  ceRender();
}

async function ceUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const wrap = input.closest('.ce-img');
  const urlInput = wrap.querySelector('.ce-input');
  const label = input.parentElement;
  const old = label.firstChild.textContent;
  label.firstChild.textContent = '⏳ Envoi en cours…';
  try {
    const up = await compressImage(file, 1920, 0.85);
    const ext = up.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg');
    const path = `content/${_ce.page}-${Date.now()}.${ext}`;
    const { error } = await _supabase.storage.from('products').upload(path, up, { upsert: true, contentType: up.type, cacheControl: '31536000' });
    if (error) throw error;
    const { data } = _supabase.storage.from('products').getPublicUrl(path);
    urlInput.value = data.publicUrl;
    ceInput(urlInput);
    wrap.querySelector('.ce-img-prev').style.backgroundImage = `url('${data.publicUrl}')`;
  } catch (e) {
    alert('Erreur lors de l’envoi de l’image : ' + (e.message || e));
  } finally {
    label.firstChild.textContent = old;
    input.value = '';
  }
}

async function ceSave() {
  if (!_ce.page || !_ce.data) return;
  const conf = CE_PAGES[_ce.page];
  const btn = document.getElementById('ce-save-btn');
  btn.disabled = true;
  const { error } = await _supabase.from('site_content')
    .upsert({ key: conf.key, data: _ce.data, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  btn.disabled = false;
  if (error) { alert('Erreur lors de l’enregistrement : ' + error.message); return; }
  ceSetDirty(false);
  _ce.mod = new Set();
  document.querySelectorAll('#ce-form [data-mod]').forEach(el => el.removeAttribute('data-mod'));
  showToast('Les changements ont bien été enregistrés', `Page ${conf.label} mise à jour sur le site`, null, 'success');
}
