/* ── Little Symphony — Shared utilities ── */
'use strict';

// ── CATEGORIES META (single source of truth for index + boutique) ─────────────
const CATS_META = [
  {
    key:'jouets', name:'Jouets', nameFull:'Jouets & Éveil', color:'#A0BDC5',
    subtitle:'Éveiller l\'imagination',
    icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    subs:['Tous','Éveil 0-12m','Puzzles & Cubes','Peluches','Poupées','Véhicules','Jeux de plage']
  },
  {
    key:'livres', name:'Livres', nameFull:'Livres', color:'#B7B9A3',
    subtitle:'Grandir en lisant',
    icon:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    subs:['Tous','0–3 ans','3–6 ans','6–12 ans']
  },
  {
    key:'musique', name:'Musique', nameFull:'Instruments de Musique', color:'#E5BAA4',
    subtitle:'Éveiller la musique dès le premier âge',
    icon:'<line x1="12" y1="3" x2="12" y2="16"/><path d="M12 3c4 1.5 6 4 4 8"/><circle cx="9" cy="18" r="3"/>',
    subs:['Tous','0–12 mois','1–3 ans','3–6 ans','6–12 ans']
  },
  {
    key:'art', name:'Art', nameFull:'Art & Créativité', color:'#B7B9A3',
    subtitle:'Cultiver la créativité',
    icon:'<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2v-.5c0-.28.22-.5.5-.5H17c2.76 0 5-2.24 5-5 0-5.52-4.48-10-10-10z"/>',
    subs:['Tous','Instruments','Dessin & Peinture','Cahiers','Jeux de société','Danse']
  },
  {
    key:'maternite', name:'Maternité', nameFull:'Maternité', color:'#D2A29C',
    subtitle:'Accompagner la maman',
    icon:'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    subs:['Tous','Soins corps','Shampoings','Coussins d\'allaitement']
  },
  {
    key:'hygiene', name:'Hygiène', nameFull:'Hygiène & Soins', color:'#A6AEBA',
    subtitle:'Les essentiels du quotidien',
    icon:'<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
    subs:['Tous','Couches T1-T2','Couches T3-T5','Crèmes & Soins','Shampoing & Savon','Lingettes','Lessive bio']
  },
  {
    key:'repas', name:'Repas', nameFull:'Repas & Nutrition', color:'#B7B9A3',
    subtitle:'Nourrir avec soin',
    icon:'<path d="M8 2h8"/><path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2"/><path d="M7 15h10"/>',
    subs:['Tous','Biberons 0-6m','Biberons 6m+','Tétines','Assiettes & Couverts','Chauffe-biberon','Stérilisateur','Babycook']
  },
  {
    key:'securite', name:'Sécurité', nameFull:'Sécurité', color:'#E5BAA4',
    subtitle:'Protéger ce qui compte',
    icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    subs:['Tous','Coins de table','Caches prises','Bloque-portes','Barrières']
  },
  {
    key:'vetements', name:'Vêtements', nameFull:'Vêtements', color:'#D2A29C',
    subtitle:'Douceur et style de 0 à 12 ans',
    icon:'<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>',
    subs:['Tous','0–6 mois','6–12 mois','1–3 ans','3–6 ans','6–12 ans','Maillots & Serviettes']
  },
  {
    key:'mobilier', name:'Mobilier', nameFull:'Mobilier', color:'#D3BBA8',
    subtitle:'Aménager l\'espace bébé',
    icon:'<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    subs:['Tous','Poussettes','Berceaux & Parcs','Tables à langer','Transats','Chaises hautes','Baignoires']
  },
  {
    key:'cadeaux', name:'Cadeaux', nameFull:'Cadeaux', color:'#D3BBA8',
    subtitle:'Offrir avec amour',
    icon:'<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    subs:['Tous','Coffrets naissance','Paniers cadeaux','Emballage']
  },
];

// ── CART ─────────────────────────────────────────────────────────────────────
const Cart = {
  get() { return JSON.parse(localStorage.getItem('ls_cart') || '[]'); },
  save(items) { localStorage.setItem('ls_cart', JSON.stringify(items)); },
  count() { return Cart.get().reduce((n, i) => n + i.qty, 0); },
  total() { return Cart.get().reduce((s, i) => s + i.priceNum * i.qty, 0); },
  add(product) {
    const items = Cart.get();
    const id = product.name + '|' + product.sub;
    const existing = items.find(i => i.id === id);
    if (existing) {
      existing.qty += product.qty || 1;
    } else {
      items.push({ ...product, id, qty: product.qty || 1 });
    }
    Cart.save(items);
    LS.updateCartBadge();
  },
  remove(id) {
    Cart.save(Cart.get().filter(i => i.id !== id));
    LS.updateCartBadge();
  },
  updateQty(id, qty) {
    const items = Cart.get();
    const item = items.find(i => i.id === id);
    if (item) { item.qty = Math.max(1, qty); Cart.save(items); }
    LS.updateCartBadge();
  },
  clear() { localStorage.removeItem('ls_cart'); LS.updateCartBadge(); }
};

// ── AUTH ─────────────────────────────────────────────────────────────────────
const Auth = {
  getUser()    { return JSON.parse(localStorage.getItem('ls_user') || 'null'); },
  setUser(u)   { localStorage.setItem('ls_user', JSON.stringify(u)); },
  isLoggedIn() { return !!Auth.getUser(); },
  logout()     {
    localStorage.removeItem('ls_user');
    if (typeof _supabase !== 'undefined') {
      _supabase.auth.signOut().finally(() => { window.location.href = 'index.html'; });
    } else {
      window.location.href = 'index.html';
    }
  }
};

// ── ORDERS ───────────────────────────────────────────────────────────────────
const Orders = {
  get()      { return JSON.parse(localStorage.getItem('ls_orders') || '[]'); },
  add(order) {
    const orders = Orders.get();
    orders.unshift(order);
    localStorage.setItem('ls_orders', JSON.stringify(orders));
  }
};

// ── PRICE PARSING ─────────────────────────────────────────────────────────────
function parsePrice(str) {
  if (typeof str === 'number') return str;
  return parseFloat((String(str || '0')).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}
function formatPrice(num) {
  return num.toFixed(3).replace('.', ',').replace(/(\d)(?=(\d{3})+,)/g, '$1 ') + ' DT';
}

// ── CURRENT PRODUCT (for product.html) ───────────────────────────────────────
const CurrentProduct = {
  set(p)  { localStorage.setItem('ls_current_product', JSON.stringify(p)); },
  get()   { return JSON.parse(localStorage.getItem('ls_current_product') || 'null'); }
};

// ── LS NAMESPACE (helpers) ────────────────────────────────────────────────────
const LS = {
  updateCartBadge() {
    document.querySelectorAll('.cart-count').forEach(el => {
      const n = Cart.count();
      el.textContent = n;
      el.style.display = n > 0 ? 'flex' : 'none';
    });
  },
  updateNavUser() {
    const user = Auth.getUser();
    document.querySelectorAll('.nav-user-name').forEach(el => {
      el.textContent = user ? user.firstName : '';
    });
    document.querySelectorAll('.nav-login-link').forEach(el => {
      el.href = user ? 'profile.html' : 'login.html';
      el.title = user ? `Mon compte (${user.firstName})` : 'Se connecter';
    });
  }
};

// ── NAV COMMON CSS ────────────────────────────────────────────────────────────
const COMMON_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,700&family=Inter:wght@300;400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  :root{
    --primary:#C9A09A;--primary-dark:#A86860;--primary-light:#F5EDED;
    --primary-xlight:#FBF9F9;--charcoal:#1C1C1E;--charcoal-mid:#3A3A3C;
    --text-soft:#6E6460;--text-muted:#A09590;
    --border:#EDE6E3;--border-light:#F5F0EE;--white:#FFFFFF;
    --serif:'Playfair Display',serif;--sans:'Inter',sans-serif;
    --radius:16px;--radius-sm:10px;
    --shadow-sm:0 2px 12px rgba(0,0,0,0.06);
    --shadow-md:0 8px 32px rgba(0,0,0,0.10);
    --shadow-card:0 4px 20px rgba(201,160,154,0.15);
  }
  body{font-family:var(--sans);background:#fff;color:var(--charcoal);-webkit-font-smoothing:antialiased}
  img{display:block;max-width:100%}
  button{cursor:pointer;font-family:var(--sans)}
  a{text-decoration:none;color:inherit}
  input,select,textarea{font-family:var(--sans)}

  /* NAV */
  nav{position:fixed;top:0;left:0;right:0;z-index:200;background:rgba(255,255,255,0.93);
    backdrop-filter:blur(20px);border-bottom:1px solid rgba(237,230,227,0.7);transition:box-shadow 0.3s}
  nav.scrolled{box-shadow:var(--shadow-sm)}
  .nav-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;
    justify-content:space-between;height:68px;padding:0 2rem}
  .logo{display:flex;align-items:center;text-decoration:none}
  .logo img{height:48px;width:auto}
  .nav-links{display:flex;align-items:center;gap:2rem}
  .nav-link{font-size:13px;font-weight:500;color:var(--text-soft);letter-spacing:0.02em;
    transition:color 0.2s;border:none;background:none;padding:4px 0;text-decoration:none}
  .nav-link:hover{color:var(--charcoal)}
  .nav-right{display:flex;align-items:center;gap:4px}
  .nav-icon-btn{width:40px;height:40px;border-radius:50%;border:none;background:none;
    color:var(--charcoal);display:flex;align-items:center;justify-content:center;
    transition:background 0.2s;position:relative;text-decoration:none}
  .nav-icon-btn:hover{background:var(--primary-light);color:var(--primary-dark)}
  .nav-icon-btn svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8;
    stroke-linecap:round;stroke-linejoin:round}
  .cart-count{position:absolute;top:6px;right:6px;width:16px;height:16px;border-radius:50%;
    background:var(--primary);color:#fff;font-size:9px;font-weight:700;
    display:none;align-items:center;justify-content:center;border:2px solid #fff}

  /* BREADCRUMB */
  .breadcrumb{max-width:1280px;margin:0 auto;padding:88px 2rem 0;
    display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-muted)}
  .breadcrumb a{color:var(--text-muted);text-decoration:none;transition:color 0.2s}
  .breadcrumb a:hover{color:var(--charcoal)}
  .breadcrumb span{color:var(--charcoal);font-weight:500}
  .breadcrumb-sep{opacity:0.4}

  /* BUTTONS */
  .btn-primary{background:var(--primary);color:#fff;border:none;
    padding:15px 32px;border-radius:40px;font-size:14px;font-weight:600;
    transition:all 0.25s;box-shadow:0 4px 20px rgba(201,160,154,0.35)}
  .btn-primary:hover{background:var(--primary-dark);transform:translateY(-2px)}
  .btn-outline{background:transparent;color:var(--charcoal);
    border:1.5px solid var(--border);padding:14px 32px;border-radius:40px;
    font-size:14px;font-weight:500;transition:all 0.2s}
  .btn-outline:hover{border-color:var(--primary);color:var(--primary)}

  /* FORM */
  .form-group{margin-bottom:1.2rem}
  .form-label{display:block;font-size:13px;font-weight:500;color:var(--charcoal);margin-bottom:6px}
  .form-input{width:100%;padding:12px 16px;border:1.5px solid var(--border);
    border-radius:var(--radius-sm);font-size:14px;color:var(--charcoal);
    background:#fff;transition:border-color 0.2s;outline:none}
  .form-input:focus{border-color:var(--primary)}
  .form-input.error{border-color:#E65100}
  .form-hint{font-size:12px;color:var(--text-muted);margin-top:4px}
  .form-error{font-size:12px;color:#E65100;margin-top:4px;display:none}

  /* PAGE WRAPPER */
  .page-wrap{max-width:1280px;margin:0 auto;padding:2rem 2rem 5rem}

  /* FOOTER MINI */
  .footer-mini{border-top:1px solid var(--border);padding:2rem;text-align:center;
    font-size:12px;color:var(--text-muted);margin-top:4rem}
`;

// ── PROFILE DROPDOWN ─────────────────────────────────────────────────────────
function _profileDropdownHTML() {
  const user = Auth.getUser();
  if (!user) {
    return `<a href="login.html" class="sn-icon" title="Se connecter" style="text-decoration:none">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    </a>`;
  }
  const userName = `${user.firstName||''} ${user.lastName||''}`.trim() || user.email;
  return `
  <div style="position:relative" id="_pdrop_wrap">
    <button onclick="_pdropToggle()" title="Mon compte"
      style="width:40px;height:40px;border-radius:50%;border:none;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#1C1C1E;font-size:17px;font-weight:700;font-family:var(--sans);transition:background 0.2s,color 0.2s;flex-shrink:0"
      onmouseover="this.style.background='#F5EDED';this.style.color='#A86860'" onmouseout="this.style.background='none';this.style.color='#1C1C1E'">
      ${(user.firstName||user.email||'?')[0].toUpperCase()}
    </button>
    <div id="_pdrop" style="position:absolute;top:calc(100% + 10px);right:0;width:220px;background:#fff;border:1px solid #EDE6E3;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.10);padding:0.5rem 0;z-index:9999;opacity:0;pointer-events:none;transform:translateY(-8px);transition:opacity 0.2s,transform 0.2s">
      <div style="padding:12px 16px 10px;border-bottom:1px solid #EDE6E3">
        <div style="font-size:14px;font-weight:600;color:#1C1C1E">${userName}</div>
        <div style="font-size:11px;color:#A09590;margin-top:2px">${user.email||''}</div>
      </div>
      <a href="profile.html" onclick="_pdropClose()" style="display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:13px;font-weight:500;color:#6E6460;text-decoration:none" onmouseover="this.style.background='#FBF9F9'" onmouseout="this.style.background=''">
        <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Mon profil
      </a>
      <a href="orders.html" onclick="_pdropClose()" style="display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:13px;font-weight:500;color:#6E6460;text-decoration:none" onmouseover="this.style.background='#FBF9F9'" onmouseout="this.style.background=''">
        <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
        Mes commandes
      </a>
      <div style="height:1px;background:#EDE6E3;margin:4px 0"></div>
      <button onclick="Auth.logout()" style="display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:13px;font-weight:500;color:#E65100;background:none;border:none;width:100%;cursor:pointer" onmouseover="this.style.background='#FBF9F9'" onmouseout="this.style.background=''">
        <svg width="15" height="15" viewBox="0 0 24 24" stroke="#E65100" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Déconnexion
      </button>
    </div>
  </div>`;
}

function _pdropToggle() {
  const dd = document.getElementById('_pdrop');
  if (!dd) return;
  const open = dd.style.opacity === '1';
  dd.style.opacity = open ? '0' : '1';
  dd.style.pointerEvents = open ? 'none' : 'auto';
  dd.style.transform = open ? 'translateY(-8px)' : 'translateY(0)';
}
function _pdropClose() {
  const dd = document.getElementById('_pdrop');
  if (!dd) return;
  dd.style.opacity = '0'; dd.style.pointerEvents = 'none'; dd.style.transform = 'translateY(-8px)';
}
document.addEventListener('click', e => {
  const wrap = document.getElementById('_pdrop_wrap');
  if (wrap && !wrap.contains(e.target)) _pdropClose();
});

// ── RECHERCHE (menu ouvert + icône PC) → boutique.html?q=… ─────────────────────
function _snSearchFormHTML(id) {
  let q = '';
  try { q = new URLSearchParams(location.search).get('q') || ''; } catch (e) {}
  const v = q.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  return `<form class="sn-search" action="boutique.html" method="get" role="search" onsubmit="return _snSearchSubmit(this)">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="search" name="q" id="${id}" value="${v}" placeholder="Rechercher un produit…" autocomplete="off" aria-label="Rechercher un produit">
      <button type="submit" class="sn-search-go" aria-label="Rechercher" title="Rechercher"><svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>
    </form>`;
}
function _snSearchSubmit(form) {
  const q = (form.q.value || '').trim();
  // Déjà sur la boutique : on filtre sans recharger la page
  if (typeof window.lsBoutiqueSearch === 'function') {
    window.lsBoutiqueSearch(q, true);
    const drawer = document.getElementById('sn-drawer');
    if (drawer && drawer.classList.contains('open')) _snBurgerToggle();
    _snSearchClose();
    form.q.blur();
    return false;
  }
  location.href = 'boutique.html' + (q ? '?q=' + encodeURIComponent(q) : '');
  return false;
}
function _snSearchToggle() {
  const w = document.getElementById('sn-search-wrap');
  if (!w) return;
  const open = !w.classList.contains('open');
  w.classList.toggle('open', open);
  if (open) setTimeout(() => { const i = document.getElementById('sn-search-pc'); if (i) i.focus(); }, 50);
}
function _snSearchClose() {
  const w = document.getElementById('sn-search-wrap');
  if (w) w.classList.remove('open');
}
document.addEventListener('click', e => {
  const w = document.getElementById('sn-search-wrap');
  if (w && w.classList.contains('open') && !w.contains(e.target)) _snSearchClose();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') _snSearchClose(); });
(function _snSearchStyles() {
  if (document.getElementById('sn-search-css')) return;
  const st = document.createElement('style');
  st.id = 'sn-search-css';
  st.textContent = `
.sn-search{position:relative;display:flex;align-items:center;width:100%}
.sn-search>svg{position:absolute;left:16px;width:18px;height:18px;stroke:var(--text-muted);fill:none;stroke-width:2;stroke-linecap:round;pointer-events:none}
.sn-search input{width:100%;padding:13px 56px 13px 46px;border:1.5px solid var(--border);border-radius:40px;background:var(--primary-xlight);font-family:var(--sans);font-size:15px;color:var(--charcoal);outline:none;transition:border-color .2s,background .2s;-webkit-appearance:none;appearance:none}
.sn-search input:focus{border-color:var(--primary);background:#fff}
.sn-search input::placeholder{color:var(--text-muted)}
.sn-search input::-webkit-search-cancel-button{display:none}
.sn-search-go{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:none;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s}
.sn-search-go:hover{background:var(--primary-dark)}
.sn-search-go svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.sn-drawer .sn-search{max-width:420px;margin-bottom:1.6rem}
.sn-drawer .sn-search input{font-size:16px}
.sn-search-wrap{position:relative;display:flex}
.sn-search-pop{position:absolute;top:calc(100% + 10px);right:0;width:340px;padding:10px;background:#fff;border-radius:var(--radius);box-shadow:var(--shadow-md);opacity:0;pointer-events:none;transform:translateY(-8px);transition:opacity .2s,transform .2s;z-index:300}
.sn-search-wrap.open .sn-search-pop{opacity:1;pointer-events:auto;transform:translateY(0)}
.sn-search-pop .sn-search input{font-size:14px;padding:11px 52px 11px 44px}
.sn-search-pop .sn-search-go{width:34px;height:34px}
@media (max-width:900px){.sn-search-wrap{display:none}}
`;
  (document.head || document.documentElement).appendChild(st);
})();

// ── IMAGES PRODUIT : TOUJOURS ENTIÈRES ───────────────────────────────────────
// On compare la forme de la photo à celle de son cadre (carré dans la boutique,
// rectangle sur l'accueil…). Si elles diffèrent nettement — photo en hauteur
// (ex. une guitare) ou en largeur (ex. un étui) — la photo est affichée en
// entier, bords complétés en blanc, au lieu d'être recadrée.
const LS_PRODUCT_IMG = '.prod-img,.feat-img,.img-main,.img-thumb,.suggest-img,.product-img img,.detail-img-main,.detail-img-thumbs img,.item-img,.sum-img';
function _lsCheckTall(img) {
  if (!img || img.tagName !== 'IMG' || !img.naturalWidth || !img.matches(LS_PRODUCT_IMG)) return;
  const imgR = img.naturalWidth / img.naturalHeight;
  const boxR = (img.clientWidth && img.clientHeight) ? img.clientWidth / img.clientHeight : 1;
  const diff = imgR / boxR;
  img.classList.toggle('img-tall', diff > 1.15 || diff < 1 / 1.15);
}
function lsRecheckImages() {
  document.querySelectorAll(LS_PRODUCT_IMG).forEach(i => { if (i.complete) _lsCheckTall(i); });
}
document.addEventListener('load', e => _lsCheckTall(e.target), true);
document.addEventListener('DOMContentLoaded', lsRecheckImages);
let _lsImgT = null;
window.addEventListener('resize', () => { clearTimeout(_lsImgT); _lsImgT = setTimeout(lsRecheckImages, 200); });
(function () {
  if (document.getElementById('ls-img-tall-css')) return;
  const st = document.createElement('style');
  st.id = 'ls-img-tall-css';
  st.textContent = 'img.img-tall{object-fit:contain!important;object-position:center!important;background:#fff!important}';
  (document.head || document.documentElement).appendChild(st);
})();

// ── RENDER NAV ────────────────────────────────────────────────────────────────
function renderNav(activePage, opts) {
  opts = opts || {};
  const el = document.getElementById('main-nav');
  if (!el) return;

  const links = [
    { label: 'Accueil',   href: 'index.html',        key: 'home'     },
    { label: 'Boutique',  href: 'boutique.html',      key: 'boutique' },
    { label: 'À propos',  href: 'apropos.html',       key: 'apropos'  },
    { label: 'Contact',   href: 'contact.html',        key: 'contact'  },
  ];

  const navLinksHTML = links.map(l =>
    `<a href="${l.href}" class="sn-link${activePage===l.key?' active':''}">${l.label}</a>`
  ).join('');

  const extraBtns = opts.extraBtns || '';

  const drawerLinksHTML = links.map(l =>
    `<a href="${l.href}" class="sn-drawer-link${activePage===l.key?' active':''}">${l.label}</a>`
  ).join('');

  el.innerHTML = `
    <div class="sn-inner">
      <a href="index.html" class="sn-logo">
        <img src="logo/logo.png" alt="Little Symphony">
      </a>
      <div class="sn-links">${navLinksHTML}</div>
      <div class="sn-right">
        <div class="sn-search-wrap" id="sn-search-wrap">
          <button type="button" class="sn-icon sn-search-btn" title="Rechercher" aria-label="Rechercher" onclick="_snSearchToggle()">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <div class="sn-search-pop" id="sn-search-pop">${_snSearchFormHTML('sn-search-pc')}</div>
        </div>
        <a href="cart.html" class="sn-icon" title="Panier">
          <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <span class="sn-cart-badge cart-count"></span>
        </a>
        ${extraBtns}
        <div style="width:0px;margin-right:-5px;flex-shrink:0"></div>
        ${_profileDropdownHTML()}
        <button class="sn-burger" id="sn-burger-btn" onclick="_snBurgerToggle()" aria-label="Menu">
          <svg viewBox="0 0 24 24" id="sn-burger-icon"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </div>`;

  // Injecter le drawer directement dans le body (hors du nav)
  // pour éviter le nouveau containing block créé par backdrop-filter
  let drawer = document.getElementById('sn-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.className = 'sn-drawer';
    drawer.id = 'sn-drawer';
    document.body.appendChild(drawer);
  }
  drawer.innerHTML = `${_snSearchFormHTML('sn-search-drawer')}<div class="sn-drawer-links">${drawerLinksHTML}</div>`;

  LS.updateCartBadge();
  window.addEventListener('scroll', () => el.classList.toggle('scrolled', scrollY > 20));

}

function _snBurgerToggle() {
  const drawer = document.getElementById('sn-drawer');
  const btn = document.getElementById('sn-burger-btn');
  if (drawer) drawer.classList.toggle('open');
  if (btn) btn.classList.toggle('menu-open');
}


// ── RENDER FOOTER ─────────────────────────────────────────────────────────────
// ── CONTENU ÉDITABLE (table Supabase site_content) ──────────────────────────
// Lecture directe via l'API REST (fonctionne aussi sur les pages sans supabase-js).
// Le dernier contenu reçu est gardé en cache local pour un affichage immédiat.
const LS_SB_URL = 'https://uyyillkilzsywcrrfbov.supabase.co';
const LS_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5eWlsbGtpbHpzeXdjcnJmYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzU1NTUsImV4cCI6MjA5ODMxMTU1NX0.7hnsFSZQBoDardOPa6fO7TsGoov1p6DLN0i_Uqgy5Ls';
function loadSiteContent(key, apply) {
  const ck = 'ls_content_' + key;
  let cached = null;
  try { cached = localStorage.getItem(ck); } catch (e) {}
  let last = null;                                   // dernier contenu affiché pour CET appel
  if (cached) { try { last = cached; apply(JSON.parse(cached)); } catch (e) { console.warn('contenu ' + key, e); } }
  fetch(LS_SB_URL + '/rest/v1/site_content?select=data&key=eq.' + encodeURIComponent(key), {
    headers: { apikey: LS_SB_KEY, Authorization: 'Bearer ' + LS_SB_KEY }
  }).then(r => r.ok ? r.json() : null).then(rows => {
    if (!rows || !rows[0] || !rows[0].data) return;
    const str = JSON.stringify(rows[0].data);
    try { localStorage.setItem(ck, str); } catch (e) {}
    if (last === str) return;                         // rien n'a changé : pas de nouveau rendu
    last = str;
    try { apply(rows[0].data); } catch (e) { console.warn('contenu ' + key, e); }
  }).catch(() => {});
}

// Contenu par défaut du footer (identique au site d'origine) — remplacé par celui de l'admin
const FOOTER_DEFAULT = {
  brand_text: 'La boutique de référence pour les familles tunisiennes qui misent sur la qualité, la douceur et le style.',
  socials: { instagram: '', facebook: '', tiktok: '' },
  columns: [
    { title: 'Boutique', links: [{ label: 'Nouveautés', url: '' }, { label: 'Meilleures ventes', url: '' }, { label: 'Promotions', url: '' }, { label: 'Coffrets cadeaux', url: '' }] },
    { title: 'Service',  links: [{ label: 'Mes commandes', url: '#commandes' }, { label: 'Retours', url: '' }, { label: 'Contactez-nous', url: '' }, { label: 'FAQ', url: '' }] },
    { title: 'Infos',    links: [{ label: 'À propos', url: 'apropos.html' }, { label: 'Blog & conseils', url: '' }, { label: 'Mentions légales', url: 'mentions-legales.html' }, { label: 'CGV', url: 'cgv.html' }] },
  ],
  copyright: '© 2025 Little Symphony — Tous droits réservés',
  region: 'Région de Grand-Tunis',
};
let _footerData = null, _footerLoading = false;

function renderFooter() {
  const el = document.getElementById('main-footer');
  if (!el) return;
  const f = Object.assign({}, FOOTER_DEFAULT, _footerData || {});
  const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const soc = f.socials || {};
  const socBtn = (k, title, svg) => `
          <button class="sf-soc-btn" title="${title}"${soc[k] ? ` onclick="window.open('${esc(soc[k]).replace(/'/g, '%27')}','_blank','noopener')"` : ''}>
            ${svg}
          </button>`;
  const link = l => {
    let url = l.url || '';
    if (url === '#commandes') url = Auth.isLoggedIn() ? 'orders.html' : 'login.html';
    return url ? `<a href="${esc(url)}" style="color:#807870;text-decoration:none">${esc(l.label)}</a>` : esc(l.label);
  };

  el.innerHTML = `
    <div class="sf-inner">
      <div class="sf-brand">
        <div class="sf-logo"><img src="logo/logo-white.png" alt="Little Symphony"></div>
        <p>${esc(f.brand_text)}</p>
        <div class="sf-social">${socBtn('instagram', 'Instagram', '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>')}${socBtn('facebook', 'Facebook', '<svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>')}${socBtn('tiktok', 'TikTok', '<svg viewBox="0 0 24 24"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg>')}
        </div>
      </div>
      ${(f.columns || []).map(c => `<div>
        <h4>${esc(c.title)}</h4>
        <ul>
          ${(c.links || []).map(l => `<li>${link(l)}</li>`).join('\n          ')}
        </ul>
      </div>`).join('\n      ')}
    </div>
    <div class="sf-bottom">
      <span>${esc(f.copyright)}</span>
      <div style="display:flex;gap:1.5rem">
        <a href="mentions-legales.html">Politique de confidentialité</a>
        <a href="cgv.html">CGV</a>
        <a href="cgu.html">CGU</a>
        <a href="#" style="display:flex;align-items:center;gap:5px">
          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${esc(f.region)}
        </a>
      </div>
    </div>`;

  // Charger (une seule fois) le contenu du footer défini dans l'admin, puis ré-afficher
  if (!_footerLoading) {
    _footerLoading = true;
    loadSiteContent('footer', d => { _footerData = d; renderFooter(); });
  }
}

// ── TOAST GLOBAL ─────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'ls-toast';
  t.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>${msg}`;
  document.body.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 280);
  }, 2500);
}


/* ── Image de remplacement pour les produits sans photo (ou photo cassée) ── */
const PRODUCT_PLACEHOLDER = 'images/placeholder-produit.svg';
(function () {
  const isPh = img => (img.getAttribute('src') || '').indexOf('placeholder-produit') !== -1;
  const fix = img => {
    if (!img || img.tagName !== 'IMG' || isPh(img)) return;
    if (img.closest && img.closest('header, nav, footer, .logo, .logo-wrap')) return;   // jamais le logo
    img.src = PRODUCT_PLACEHOLDER;
    img.style.objectFit = 'cover';
  };
  // Photo qui ne charge pas (lien mort, site qui bloque…)
  document.addEventListener('error', e => fix(e.target), true);
  // Photo absente (src vide)
  const scan = root => (root.querySelectorAll ? root.querySelectorAll('img') : []).forEach(img => {
    const src = (img.getAttribute('src') || '').trim();
    if (!src || src === 'undefined' || src === 'null') fix(img);
    else if (img.complete && img.naturalWidth === 0) fix(img);
  });
  const start = () => {
    scan(document);
    new MutationObserver(muts => muts.forEach(m => {
      if (m.type === 'attributes') { const s = (m.target.getAttribute('src') || '').trim(); if (!s) fix(m.target); }
      m.addedNodes && m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.tagName === 'IMG') scan({ querySelectorAll: () => [n] }); else scan(n); } });
    })).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
