/* ── Little Symphony — Contenu éditable des pages (Accueil, À propos, Contact) ──
   Le contenu est stocké dans la table Supabase `site_content` (une ligne par page)
   et modifié depuis l'admin (onglet « Contenu »).
   Le HTML statique des pages reste en place comme version de secours : si la base
   ne répond pas, la page s'affiche exactement comme avant. */

/* Bibliothèque d'icônes (tracés SVG 24×24) utilisée par le site et l'admin */
const LS_ICONS = {
  star:     { label: 'Étoile',            svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
  star2:    { label: 'Étoile (fine)',     svg: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' },
  guitar:   { label: 'Guitare',           svg: '<line x1="12" y1="3" x2="12" y2="16"/><path d="M12 3c4 1.5 6 4 4 8"/><circle cx="9" cy="18" r="3"/>' },
  note:     { label: 'Note de musique',   svg: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
  book:     { label: 'Livre',             svg: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' },
  palette:  { label: 'Palette',           svg: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2v-.5c0-.28.22-.5.5-.5H17c2.76 0 5-2.24 5-5 0-5.52-4.48-10-10-10z"/>' },
  brush:    { label: 'Pinceau / art',     svg: '<circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85"/>' },
  ball:     { label: 'Ballon',            svg: '<circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>' },
  sun:      { label: 'Soleil / jouets',   svg: '<circle cx="12" cy="12" r="5"/><path d="M5.5 5.5l1.5 1.5m10 10 1.5 1.5M5.5 18.5l1.5-1.5m10-10 1.5-1.5"/>' },
  bed:      { label: 'Lit / bébé',        svg: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>' },
  heart:    { label: 'Cœur',              svg: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' },
  truck:    { label: 'Camion / livraison', svg: '<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>' },
  leaf:     { label: 'Feuille / bio',     svg: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>' },
  gift:     { label: 'Cadeau',            svg: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>' },
  giftbox:  { label: 'Coffret',           svg: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>' },
  refresh:  { label: 'Retour / échange',  svg: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>' },
  shield:   { label: 'Bouclier / sécurité', svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
  smile:    { label: 'Sourire',           svg: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>' },
  users:    { label: 'Personnes',         svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>' },
  home:     { label: 'Maison',            svg: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  shirt:    { label: 'Vêtement',          svg: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>' },
  monitor:  { label: 'Mobilier',          svg: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>' },
  spoon:    { label: 'Repas',             svg: '<path d="M3 2l1.5 1.5M3 12h1M12 3v1M21 12h-1M18.5 5.5 17 7M5.5 5.5 7 7"/><path d="M12 7a5 5 0 1 0 5 5"/>' },
  sparkle:  { label: 'Éclat',             svg: '<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>' },
  clock:    { label: 'Horloge',           svg: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  calendar: { label: 'Calendrier',        svg: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  pin:      { label: 'Adresse',           svg: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' },
  phone:    { label: 'Téléphone',         svg: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>' },
  mail:     { label: 'E-mail',            svg: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>' },
};
function lsIcon(name) { return (LS_ICONS[name] || LS_ICONS.star).svg; }

/* Échappement HTML */
function lsEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/* Texte « enrichi » simple : *mot* = italique d'accent, retour à la ligne = saut de ligne */
function lsRich(s, emAttr) {
  return lsEsc(s).replace(/\*([^*]+)\*/g, '<em' + (emAttr || '') + '>$1</em>').replace(/\r?\n/g, '<br>');
}
/* Paragraphes séparés par une ligne vide */
function lsParas(s) {
  return String(s || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}
function lsTel(n) { return 'tel:' + String(n || '').replace(/[^\d+]/g, ''); }
function lsQ(q) { return encodeURIComponent(q || '').replace(/%2C/gi, ','); }
function lsMapsLink(q) { return 'https://www.google.com/maps/search/?api=1&query=' + lsQ(q); }
function lsMapsEmbed(q) { return 'https://maps.google.com/maps?q=' + lsQ(q) + '&z=17&output=embed'; }

/* ═══════════════════════ ACCUEIL ═══════════════════════ */
function lsSlideCta(s) {
  if (s.cta_cat) return `showCatScroll('${String(s.cta_cat).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')`;
  if (s.cta_link) return `window.location.href='${String(s.cta_link).replace(/'/g, "\\'")}'`;
  return '';
}
function lsRenderSlides(slides) {
  return (slides || []).map((s, i) => `
    <div class="slide">
      <div class="slide-bg${i === 0 ? ' kb' : ''}" style="background-image:url('${lsEsc(s.image)}')"></div>
      <div class="slide-content">
        <span class="slide-tag"><svg viewBox="0 0 24 24">${lsIcon(s.icon)}</svg>${lsEsc(s.tag)}</span>
        <h2>${lsRich(s.title)}</h2>
        <p>${lsEsc(s.text)}</p>
        ${s.cta_label ? `<button class="btn-slide" onclick="${lsEsc(lsSlideCta(s))}">${lsEsc(s.cta_label)}</button>` : ''}
      </div>
    </div>
`).join('');
}
const LS_META_ICONS = {
  date: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  duration: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  age: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
};
function lsRenderAteliers(items) {
  return (items || []).map(a => `
    <div class="atelier-card">
      <div class="atelier-img-wrap">
        <img src="${lsEsc(a.image)}" alt="${lsEsc(a.alt || a.name)}" loading="lazy">
        ${a.badge ? `<div class="atelier-badge">${lsEsc(a.badge)}</div>` : ''}
      </div>
      <div class="atelier-body">
        <div class="atelier-meta">
          ${['date', 'duration', 'age'].filter(k => a[k]).map(k => `<span class="atelier-meta-item">
            <svg viewBox="0 0 24 24">${LS_META_ICONS[k]}</svg>
            ${lsEsc(a[k])}
          </span>`).join('\n          ')}
        </div>
        <h3 class="atelier-name">${lsEsc(a.name)}</h3>
        <p class="atelier-desc">${lsEsc(a.desc)}</p>
        ${a.price ? `<div class="atelier-tarif">${lsEsc(a.price)}</div>` : ''}
      </div>
    </div>
`).join('');
}
function lsRenderTrust(items) {
  return (items || []).map(t => `
    <div class="trust-item">
      <div class="trust-icon"><svg viewBox="0 0 24 24">${lsIcon(t.icon)}</svg></div>
      <div class="trust-text"><strong>${lsEsc(t.title)}</strong><span>${lsEsc(t.sub)}</span></div>
    </div>`).join('');
}

function lsApplyHome(d) {
  if (!d) return;
  const $ = id => document.getElementById(id);
  if (d.slides && d.slides.length && $('sliderTrack')) {
    $('sliderTrack').innerHTML = lsRenderSlides(d.slides);
    if (typeof window.sliderRebuild === 'function') window.sliderRebuild();
  }
  if (d.ateliers) {
    const at = d.ateliers;
    const outer = $('ls-ateliers');
    if (outer) outer.style.display = at.hidden ? 'none' : '';
    if ($('ls-ateliers-eyebrow')) $('ls-ateliers-eyebrow').textContent = at.eyebrow || '';
    if ($('ls-ateliers-title')) $('ls-ateliers-title').textContent = at.title || '';
    if ($('ls-ateliers-grid')) $('ls-ateliers-grid').innerHTML = lsRenderAteliers(at.items);
  }
  if (d.promo) {
    const p = d.promo, box = $('ls-promo');
    if (box) {
      if (p.image) box.style.setProperty('--promo-bg', `url('${String(p.image).replace(/'/g, '%27')}')`);
      box.querySelector('.promo-tag').textContent = p.tag || '';
      box.querySelector('h2').textContent = p.title || '';
      box.querySelector('p').textContent = p.text || '';
      const a = box.querySelector('.btn-promo');
      a.textContent = p.cta_label || '';
      a.setAttribute('href', p.cta_link || '#');
      a.style.display = p.cta_label ? 'inline-block' : 'none';
    }
  }
  if (d.trust && $('ls-trust')) $('ls-trust').innerHTML = lsRenderTrust(d.trust);
}

/* ═══════════════════════ À PROPOS ═══════════════════════ */
const LS_EM_IT = ' style="font-style:italic"';
function lsApplyAbout(d) {
  if (!d) return;
  const $ = id => document.getElementById(id);
  const set = (id, html) => { const el = $(id); if (el && html != null) el.innerHTML = html; };

  if (d.hero) {
    if (d.hero.image && document.querySelector('.ap-hero-bg')) document.querySelector('.ap-hero-bg').style.backgroundImage = `url('${String(d.hero.image).replace(/'/g, '%27')}')`;
    set('ls-ap-hero', `
    <span class="ap-hero-eyebrow" style="margin-bottom:0.4rem">${lsEsc(d.hero.eyebrow)}</span>
    <h1>${lsRich(d.hero.title, ' style="font-style:italic;color:var(--primary)"')}</h1>
  `);
  }
  if (d.manifesto) {
    const m = d.manifesto;
    set('ls-ap-manifesto', `
    <div>
      <p class="manifesto-quote">${lsRich(m.quote)}</p>
    </div>
    <div class="manifesto-text">
      <span class="ap-eyebrow">${lsEsc(m.eyebrow)}</span>
      ${lsParas(m.text).map(p => `<p>${lsEsc(p)}</p>`).join('\n      ')}
    </div>
  `);
  }
  if (d.photos) {
    const ph = d.photos;
    set('ls-ap-photos', `
  <span class="ap-eyebrow">${lsEsc(ph.eyebrow)}</span>
  <h2 class="ap-h2">${lsRich(ph.title, LS_EM_IT)}</h2>
  <p class="ap-lead" style="margin-bottom:2rem">${lsEsc(ph.lead)}</p>
  <div class="photos-grid">
    ${(ph.items || []).map((it, i) => `<div class="photo-cell${i === 0 ? ' tall' : ''}">
      <img src="${lsEsc(it.image)}" alt="${lsEsc(it.alt || it.label)}" loading="lazy">
      ${it.label ? `<div class="photo-label">${lsEsc(it.label)}</div>` : ''}
    </div>`).join('\n    ')}
  </div>
`);
  }
  if (d.zones) {
    const z = d.zones;
    set('ls-ap-zones', `
    <span class="ap-eyebrow">${lsEsc(z.eyebrow)}</span>
    <h2 class="ap-h2">${lsRich(z.title, LS_EM_IT)}</h2>
    <p class="ap-lead">${lsEsc(z.lead)}</p>
    <div class="zones-grid">
      ${(z.items || []).map(it => `<div class="zone-card">
        <div class="zone-img">
          <img src="${lsEsc(it.image)}" alt="${lsEsc(it.tag)}" loading="lazy">
        </div>
        <div class="zone-body">
          <span class="zone-tag">${lsEsc(it.tag)}</span>
          <h4>${lsEsc(it.title)}</h4>
          <p>${lsEsc(it.text)}</p>
        </div>
      </div>`).join('\n      ')}
    </div>
  `);
  }
  if (d.cats) {
    const c = d.cats;
    set('ls-ap-cats', `
  <span class="ap-eyebrow">${lsEsc(c.eyebrow)}</span>
  <h2 class="ap-h2">${lsRich(c.title, LS_EM_IT)}</h2>
  <p class="ap-lead" style="margin-bottom:2.5rem">${lsEsc(c.lead)}</p>
  <div class="cats-row">
    ${(c.items || []).map(it => `<div class="cat-pill">
      <div class="cat-pill-dot" style="background:${lsEsc(it.color || '#C9A09A')}">
        <svg viewBox="0 0 24 24">${lsIcon(it.icon)}</svg>
      </div>
      <div><div class="cat-pill-name">${lsEsc(it.name)}</div><div class="cat-pill-sub">${lsEsc(it.sub)}</div></div>
    </div>`).join('\n    ')}
  </div>
`);
  }
  if (d.music) {
    const mu = d.music;
    set('ls-ap-music', `
    <div class="music-img">
      <img src="${lsEsc(mu.image)}" alt="Coin musical Little Symphony" loading="lazy">
      <div class="music-img-overlay"></div>
    </div>
    <div class="music-content">
      <span class="ap-eyebrow">${lsEsc(mu.eyebrow)}</span>
      <h2>${lsRich(mu.title)}</h2>
      <p>${lsEsc(mu.text)}</p>
      <div class="atelier-list">
        ${(mu.items || []).map(it => `<div class="atelier-item">
          <div class="atelier-icon">
            <svg viewBox="0 0 24 24">${lsIcon(it.icon)}</svg>
          </div>
          <div>
            <div class="atelier-name">${lsEsc(it.name)}</div>
            <div class="atelier-desc">${lsEsc(it.desc)}</div>
          </div>
        </div>`).join('\n        ')}
      </div>
      ${mu.cta_label ? `<a href="${lsEsc(mu.cta_link || 'contact.html')}" class="music-cta">
        ${lsEsc(mu.cta_label)}
        <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </a>` : ''}
    </div>
  `);
  }
  if (d.values) {
    const v = d.values;
    set('ls-ap-values', `
    <div style="text-align:center;margin-bottom:0.5rem">
      <span class="ap-eyebrow">${lsEsc(v.eyebrow)}</span>
    </div>
    <h2 class="ap-h2" style="text-align:center">${lsRich(v.title, LS_EM_IT)}</h2>
    <p class="ap-lead" style="text-align:center;margin:0 auto">${lsEsc(v.lead)}</p>
    <div class="values-grid">
      ${(v.items || []).map(it => `<div class="value-card">
        <div class="value-icon">
          <svg viewBox="0 0 24 24">${lsIcon(it.icon)}</svg>
        </div>
        <h4>${lsEsc(it.title)}</h4>
        <p>${lsEsc(it.text)}</p>
      </div>`).join('\n      ')}
    </div>
  `);
  }
  if (d.cta) {
    const c = d.cta;
    set('ls-ap-cta', `
  <h2>${lsRich(c.title)}</h2>
  <p>${lsEsc(c.text)}</p>
  <div class="cta-btns">
    ${c.btn1_label ? `<a href="${lsEsc(c.btn1_link)}" class="cta-btn-primary">${lsEsc(c.btn1_label)}</a>` : ''}
    ${c.btn2_label ? `<a href="${lsEsc(c.btn2_link)}" class="cta-btn-outline">${lsEsc(c.btn2_label)}</a>` : ''}
  </div>
`);
  }
}

/* ═══════════════════════ CONTACT ═══════════════════════ */
function lsApplyContact(d) {
  if (!d) return;
  const $ = id => document.getElementById(id);
  const q = d.map_query || '';
  if (d.hero && $('ls-ct-hero')) {
    $('ls-ct-hero').innerHTML = `
  <span class="eyebrow">${lsEsc(d.hero.eyebrow)}</span>
  <h1>${lsRich(d.hero.title)}</h1>
  <p>${lsEsc(d.hero.text)}</p>
`;
  }
  const card = (icon, label, value, subs) => `
    <div class="info-card">
      <div class="info-icon">
        <svg viewBox="0 0 24 24">${lsIcon(icon)}</svg>
      </div>
      <div>
        <div class="info-label">${label}</div>
        <div class="info-value">${value}</div>
        ${subs.filter(Boolean).map(s => `<div class="info-sub">${s}</div>`).join('\n        ')}
      </div>
    </div>`;
  if ($('ls-ct-cards')) {
    const a = d.address || {}, e = d.email || {}, h = d.hours || {};
    const phones = (d.phones || []).filter(p => p && p.number);
    $('ls-ct-cards').innerHTML =
      card('pin', 'Adresse', lsEsc(a.value), [lsEsc(a.sub), q && a.link_label ? `<a href="${lsEsc(lsMapsLink(q))}" target="_blank" rel="noopener" style="color:var(--primary-dark);font-weight:600">${lsEsc(a.link_label)}</a>` : '']) +
      card('phone', 'Téléphone', phones.map(p => `<a href="${lsEsc(lsTel(p.number))}" style="color:inherit">${lsEsc(p.number)}</a>`).join('<br>'), [lsEsc(d.phone_sub)]) +
      card('mail', 'E-mail', e.value ? `<a href="mailto:${lsEsc(e.value)}" style="color:inherit">${lsEsc(e.value)}</a>` : '', [lsEsc(e.sub)]) +
      card('clock', 'Horaires', lsEsc(h.value), [lsEsc(h.sub)]);
  }
  if (d.social_title && $('ls-ct-social-title')) $('ls-ct-social-title').textContent = d.social_title;
  if (d.form_title && $('ls-ct-form-title')) $('ls-ct-form-title').textContent = d.form_title;
  if (d.form_subtitle != null && $('ls-ct-form-sub')) $('ls-ct-form-sub').textContent = d.form_subtitle;
  if (d.map && $('ls-ct-map')) {
    const m = d.map;
    $('ls-ct-map').innerHTML = `
  <h3>${lsEsc(m.title)}</h3>
  <p>${lsEsc(m.text)}${q && m.link_label ? ` · <a href="${lsEsc(lsMapsLink(q))}" target="_blank" rel="noopener" style="color:var(--primary-dark);font-weight:600">${lsEsc(m.link_label)}</a>` : ''}</p>
  ${q ? `<iframe class="map-embed" src="${lsEsc(lsMapsEmbed(q))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Little Symphony sur Google Maps" allowfullscreen></iframe>` : ''}
`;
  }
}
