// Ireme Luxury — shared site behaviour: bag (cart), wishlist, cart drawer, header search.
// Bag and wishlist live in the visitor's browser (localStorage); orders are sent on WhatsApp.
// Exposes window.IremeStore for catalog.js.

(function () {
  const WHATSAPP = '250786753764';
  const BAG_KEY = 'ireme.bag.v1';
  const WISH_KEY = 'ireme.wishlist.v1';

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: keep in memory */ }
  }

  let bag = load(BAG_KEY);       // [{ ref, brand, name, price, img, qty }]
  let wishlist = load(WISH_KEY); // [{ ref, brand, name, price, img }]
  const listeners = [];

  const snapshot = (p) => ({
    ref: p.ref, brand: p.brand || '', name: p.name || '', price: p.price || 0,
    img: p.img ? p.img.src || p.img : '',
  });
  const title = (p) => p.name || 'Ref. ' + p.ref;
  const rwf = (n) => 'RWF ' + n.toLocaleString('en-US');

  function changed() {
    save(BAG_KEY, bag);
    save(WISH_KEY, wishlist);
    renderBadge();
    renderDrawer();
    listeners.forEach((fn) => fn());
  }

  const IremeStore = {
    bagCount: () => bag.reduce((n, i) => n + i.qty, 0),
    addToBag(p) {
      const hit = bag.find((i) => i.ref === p.ref);
      if (hit) hit.qty += 1;
      else bag.push(Object.assign(snapshot(p), { qty: 1 }));
      changed();
      const badge = document.getElementById('bag-count');
      if (badge) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
    },
    setQty(ref, qty) {
      bag = qty > 0 ? bag.map((i) => (i.ref === ref ? Object.assign(i, { qty }) : i)) : bag.filter((i) => i.ref !== ref);
      changed();
    },
    inWishlist: (ref) => wishlist.some((i) => i.ref === ref),
    toggleWishlist(p) {
      wishlist = IremeStore.inWishlist(p.ref) ? wishlist.filter((i) => i.ref !== p.ref) : wishlist.concat(snapshot(p));
      changed();
      return IremeStore.inWishlist(p.ref);
    },
    onChange: (fn) => listeners.push(fn),
    openDrawer,
  };
  window.IremeStore = IremeStore;

  // ---------- Header badge ----------
  function renderBadge() {
    const n = IremeStore.bagCount();
    const badge = document.getElementById('bag-count');
    const btn = document.getElementById('bag-button');
    if (badge) badge.textContent = n;
    if (btn) btn.setAttribute('aria-label', 'Shopping bag, ' + n + (n === 1 ? ' item' : ' items'));
  }

  // ---------- Drawer (Bag / Wishlist tabs) ----------
  let tab = 'bag';
  let lastFocus = null;

  const CLOSE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>';

  function buildDrawer() {
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<div id="drawer-backdrop" class="drawer-backdrop fixed inset-0 z-[80] bg-black/50"></div>' +
      '<aside id="cart-drawer" class="side-drawer fixed inset-y-0 right-0 z-[90] flex w-full max-w-md flex-col bg-white text-text shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-hidden="true">' +
      '<div class="flex items-center justify-between border-b border-line px-6 py-5">' +
      '<h2 id="drawer-title" class="font-display text-2xl">Your selection</h2>' +
      '<button type="button" data-drawer-close class="flex h-11 w-11 cursor-pointer items-center justify-center text-muted transition-colors duration-200 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold" aria-label="Close">' + CLOSE_SVG + '</button>' +
      '</div>' +
      '<div class="flex border-b border-line px-6" role="tablist">' +
      '<button type="button" role="tab" data-tab="bag" class="drawer-tab -mb-px cursor-pointer border-b-2 px-1 py-3.5 mr-6 text-[0.75rem] font-medium uppercase tracking-wide2 transition-colors duration-200"></button>' +
      '<button type="button" role="tab" data-tab="wishlist" class="drawer-tab -mb-px cursor-pointer border-b-2 px-1 py-3.5 text-[0.75rem] font-medium uppercase tracking-wide2 transition-colors duration-200"></button>' +
      '</div>' +
      '<div id="drawer-body" class="flex-1 overflow-y-auto px-6"></div>' +
      '<div id="drawer-foot" class="border-t border-line px-6 py-5"></div>' +
      '</aside>';
    document.body.append(...wrap.children);

    document.getElementById('drawer-backdrop').addEventListener('click', closeDrawer);
    const drawer = document.getElementById('cart-drawer');
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('[data-drawer-close]')) return closeDrawer();
      const t = e.target.closest('[data-tab]');
      if (t) { tab = t.dataset.tab; renderDrawer(); return; }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      const ref = act.dataset.ref;
      const item = bag.find((i) => i.ref === ref);
      if (act.dataset.act === 'inc') IremeStore.setQty(ref, item.qty + 1);
      if (act.dataset.act === 'dec') IremeStore.setQty(ref, item.qty - 1);
      if (act.dataset.act === 'remove') IremeStore.setQty(ref, 0);
      if (act.dataset.act === 'unwish') { wishlist = wishlist.filter((i) => i.ref !== ref); changed(); }
      if (act.dataset.act === 'move') {
        const w = wishlist.find((i) => i.ref === ref);
        wishlist = wishlist.filter((i) => i.ref !== ref);
        IremeStore.addToBag(w);
        tab = 'bag';
        renderDrawer();
      }
    });
  }

  function lineHTML(i, isBag) {
    const price = i.price ? rwf(i.price * (isBag ? i.qty : 1)) : 'Price on request';
    const controls = isBag
      ? '<div class="mt-3 flex items-center gap-4">' +
        '<div class="flex items-center border border-line">' +
        '<button type="button" data-act="dec" data-ref="' + i.ref + '" class="h-8 w-8 cursor-pointer text-muted hover:text-text" aria-label="Decrease quantity">&minus;</button>' +
        '<span class="w-6 text-center text-sm" aria-label="Quantity">' + i.qty + '</span>' +
        '<button type="button" data-act="inc" data-ref="' + i.ref + '" class="h-8 w-8 cursor-pointer text-muted hover:text-text" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<button type="button" data-act="remove" data-ref="' + i.ref + '" class="cursor-pointer text-xs uppercase tracking-wide2 text-muted underline-offset-4 hover:text-text hover:underline">Remove</button>' +
        '</div>'
      : '<div class="mt-3 flex items-center gap-4">' +
        '<button type="button" data-act="move" data-ref="' + i.ref + '" class="cursor-pointer text-xs font-medium uppercase tracking-wide2 text-gold-dark underline-offset-4 hover:underline">Add to bag</button>' +
        '<button type="button" data-act="unwish" data-ref="' + i.ref + '" class="cursor-pointer text-xs uppercase tracking-wide2 text-muted underline-offset-4 hover:text-text hover:underline">Remove</button>' +
        '</div>';
    return (
      '<li class="flex gap-4 border-b border-line py-5">' +
      '<img src="' + i.img + '" alt="" width="96" height="96" class="h-24 w-24 shrink-0 border border-line bg-white object-contain p-1.5" />' +
      '<div class="min-w-0 flex-1">' +
      '<p class="text-[0.625rem] font-medium uppercase tracking-luxe text-gold-dark">' + i.brand + '</p>' +
      '<p class="mt-1 truncate text-sm text-text">' + title(i) + '</p>' +
      '<p class="mt-1 text-sm font-medium">' + price + '</p>' +
      controls +
      '</div></li>'
    );
  }

  function renderDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    drawer.querySelectorAll('.drawer-tab').forEach((b) => {
      const on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', on);
      b.className = b.className.replace(/ ?(border-gold text-text|border-transparent text-muted)/g, '') +
        (on ? ' border-gold text-text' : ' border-transparent text-muted');
      b.textContent = b.dataset.tab === 'bag'
        ? 'Bag (' + IremeStore.bagCount() + ')'
        : 'Wishlist (' + wishlist.length + ')';
    });

    const body = document.getElementById('drawer-body');
    const foot = document.getElementById('drawer-foot');
    const list = tab === 'bag' ? bag : wishlist;

    if (!list.length) {
      body.innerHTML = '<p class="py-16 text-center text-sm text-muted">' +
        (tab === 'bag' ? 'Your bag is empty.' : 'Tap the heart on any piece to save it here.') + '</p>';
    } else {
      body.innerHTML = '<ul>' + list.map((i) => lineHTML(i, tab === 'bag')).join('') + '</ul>';
    }

    if (tab === 'bag' && bag.length) {
      const known = bag.filter((i) => i.price);
      const total = known.reduce((n, i) => n + i.price * i.qty, 0);
      const onRequest = bag.length - known.length;
      foot.innerHTML =
        '<div class="flex items-baseline justify-between"><span class="text-sm uppercase tracking-wide2 text-muted">Subtotal</span>' +
        '<span class="text-lg font-medium">' + rwf(total) + '</span></div>' +
        (onRequest ? '<p class="mt-1 text-xs text-muted">+ ' + onRequest + ' item' + (onRequest > 1 ? 's' : '') + ' priced on request</p>' : '') +
        '<a href="' + whatsappLink() + '" target="_blank" rel="noopener" class="btn-lux mt-5 w-full">Order on WhatsApp</a>' +
        '<p class="mt-3 text-center text-xs text-muted">We confirm availability, payment and Kigali delivery with you directly.</p>';
    } else {
      foot.innerHTML = '<button type="button" data-drawer-close class="w-full cursor-pointer border border-line py-3 text-[0.75rem] font-medium uppercase tracking-wide2 text-text transition-colors duration-200 hover:border-gold">Continue shopping</button>';
    }
  }

  function whatsappLink() {
    const lines = bag.map((i) =>
      '• ' + i.qty + ' × ' + i.brand + ' ' + title(i) + (i.name ? ' (Ref. ' + i.ref + ')' : '') +
      ' — ' + (i.price ? rwf(i.price * i.qty) : 'price on request'));
    const total = bag.reduce((n, i) => n + (i.price || 0) * i.qty, 0);
    const text = 'Hello Ireme Luxury, I would like to order:\n' + lines.join('\n') +
      '\n\nSubtotal: ' + rwf(total) + '\n\nThank you!';
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text);
  }

  function onKey(e) { if (e.key === 'Escape') closeDrawer(); }

  function openDrawer(which) {
    if (which) tab = which;
    renderDrawer();
    lastFocus = document.activeElement;
    document.getElementById('drawer-backdrop').classList.add('is-open');
    const d = document.getElementById('cart-drawer');
    d.classList.add('is-open');
    d.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    d.querySelector('[data-drawer-close]').focus();
  }

  function closeDrawer() {
    document.getElementById('drawer-backdrop').classList.remove('is-open');
    const d = document.getElementById('cart-drawer');
    d.classList.remove('is-open');
    d.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (lastFocus) lastFocus.focus();
  }

  // ---------- Wire up header ----------
  buildDrawer();
  renderBadge();
  renderDrawer();

  const bagBtn = document.getElementById('bag-button');
  if (bagBtn) bagBtn.addEventListener('click', () => openDrawer('bag'));
  const wishBtn = document.getElementById('wishlist-button');
  if (wishBtn) wishBtn.addEventListener('click', () => openDrawer('wishlist'));

  const menuBtn = document.getElementById('menu-button');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = document.getElementById('mobile-menu').classList.toggle('hidden') === false;
      menuBtn.setAttribute('aria-expanded', open);
    });
  }

  // Keep the bag in sync when another tab changes it
  window.addEventListener('storage', (e) => {
    if (e.key === BAG_KEY || e.key === WISH_KEY) { bag = load(BAG_KEY); wishlist = load(WISH_KEY); renderBadge(); renderDrawer(); listeners.forEach((fn) => fn()); }
  });
})();
