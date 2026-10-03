// Ireme Luxury — category listing renderer.
// Expects: body[data-category="watches"|"perfumes"] and the toolbar/sidebar/grid elements below.
// Cards render whichever fields a product has: brand, name, ref (SKU), desc, retail, price.
// Bag and wishlist come from js/site.js (window.IremeStore).

(function () {
  const DATA = { watches: IREME_WATCHES, perfumes: IREME_PERFUMES };
  const items = DATA[document.body.dataset.category] || [];
  const store = window.IremeStore;
  const $ = (id) => document.getElementById(id);

  const grid = $('product-grid');
  const searchInput = $('catalog-search');
  const sortSelect = $('catalog-sort');
  const perPageSelect = $('catalog-per-page');
  const countEl = $('results-count');
  const emptyEl = $('empty-state');
  const prevBtn = $('pager-prev');
  const nextBtn = $('pager-next');
  const pageInfo = $('pager-info');
  const brandPills = $('brand-filter');
  const brandChecks = $('brand-checks');
  const priceBox = $('price-filter');
  const priceMin = $('price-min');
  const priceMax = $('price-max');
  const priceFill = $('price-fill');
  const priceLabel = $('price-label');

  const priced = items.filter((p) => p.price);
  const PRICE_STEP = 10000;
  const LO = priced.length ? Math.floor(Math.min(...priced.map((p) => p.price)) / PRICE_STEP) * PRICE_STEP : 0;
  const HI = priced.length ? Math.ceil(Math.max(...priced.map((p) => p.price)) / PRICE_STEP) * PRICE_STEP : 0;

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '',
    sort: 'featured',
    perPage: parseInt(perPageSelect.value, 10) || 12,
    page: 1,
    brands: new Set(),
    min: LO,
    max: HI,
  };
  if (state.q) searchInput.value = state.q;
  const urlBrand = params.get('brand');

  const rwf = (n) => 'RWF ' + n.toLocaleString('en-US');
  // Must match slug() in tools/build_product_pages.py
  const productUrl = (p) => 'p/' + (p.brand + '-' + p.ref).toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '') + '.html';
  const byRef = (ref) => items.find((p) => p.ref === ref);

  const BADGE_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4 shrink-0" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />' +
    '</svg>';

  const HEART_PATH = 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z';
  const heartSVG = (on) =>
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.4" class="h-5 w-5" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="' + HEART_PATH + '" /></svg>';

  const BAG_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="hidden h-4 w-4 sm:block" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>';

  function cardHTML(p) {
    const wished = store && store.inWishlist(p.ref);
    const heading = p.name || 'Ref. ' + p.ref;
    return (
      '<li>' +
      '<article class="group relative flex h-full flex-col rounded-[3px] border border-line bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">' +
      '<button type="button" data-wish="' + p.ref + '" aria-pressed="' + !!wished + '" aria-label="' + (wished ? 'Remove from' : 'Save to') + ' wishlist" ' +
      'class="absolute right-2 top-2 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:text-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold ' +
      (wished ? 'text-gold' : 'text-text/70') + '">' + heartSVG(wished) + '</button>' +
      '<a href="' + productUrl(p) + '" data-ref="' + p.ref + '" aria-haspopup="dialog" class="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold">' +
      '<div class="overflow-hidden bg-white px-4 pb-2 pt-8 sm:px-6 sm:pt-10">' +
      '<img src="' + p.img.src + '" alt="' + p.img.alt + '" width="600" height="600" loading="lazy" ' +
      'class="aspect-square w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105" />' +
      '</div>' +
      '</a>' +
      '<div class="flex flex-1 flex-col px-3 pb-4 pt-3 sm:px-5 sm:pb-5">' +
      '<p class="flex items-center gap-1.5 text-[0.6875rem] text-muted sm:text-xs">' + '<span class="text-gold">' + BADGE_SVG + '</span>Authenticity Guaranteed</p>' +
      (p.brand ? '<p class="mt-3 text-[0.625rem] font-medium uppercase tracking-luxe text-gold-dark sm:text-[0.6875rem]">' + p.brand + '</p>' : '') +
      '<h3 class="mt-1 text-sm leading-snug text-text sm:text-base"><a href="' + productUrl(p) + '" data-ref="' + p.ref + '" aria-haspopup="dialog" class="transition-colors duration-200 hover:text-gold-dark">' + heading + '</a></h3>' +
      (p.name ? '<p class="mt-0.5 text-xs text-muted">' + p.ref + '</p>' : '') +
      (p.desc ? '<p class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">' + p.desc + '</p>' : '') +
      '<p class="mt-3 text-base font-medium tracking-wide text-text sm:text-lg">' + (p.price ? rwf(p.price) : '<span class="text-sm font-normal text-muted">Price on request</span>') + '</p>' +
      '<div class="mt-auto pt-4">' +
      '<button type="button" data-add="' + p.ref + '" class="btn-cart">' + BAG_SVG + '<span>Add to cart</span></button>' +
      '</div>' +
      '</div>' +
      '</article>' +
      '</li>'
    );
  }

  // ---------- Product detail modal ----------
  const BRAND_INFO = {
    'Hugo Boss': {
      madeFor: 'German design house since 1924. Sharp, modern dress and sport watches — made for the professional who values understated confidence.',
      materials: 'Stainless-steel or ion-plated case with steel, leather or mesh strap and mineral crystal.',
    },
    'Maserati': {
      madeFor: 'Italian automotive heritage on the wrist. Bold, sporty designs inspired by the trident marque — made for the driver who loves style with a pulse.',
      materials: 'Stainless-steel case with steel or leather strap and mineral crystal.',
    },
    'Michael Kors': {
      madeFor: 'American glamour and everyday luxury. Polished, fashion-forward watches — made to finish an outfit with a statement.',
      materials: 'Stainless-steel or gold-tone case with matching bracelet or leather strap and mineral crystal.',
    },
    'Tissot': {
      madeFor: 'Swiss-made since 1853. Precision movements in classic dress cases — made for the office, ceremonies and a lifetime of everyday elegance.',
      materials: 'Stainless-steel case and bracelet, scratch-resistant sapphire or mineral crystal, Swiss quartz or automatic movement.',
    },
    'Lacoste': {
      madeFor: 'Born of the tennis court’s sport-chic spirit — made for casual weekends, active days and effortless summer style.',
      materials: 'Stainless-steel or light alloy case with silicone, leather or steel strap and mineral crystal.',
    },
    'Berlo': {
      madeFor: 'Quiet, contemporary minimalism — made for understated daily wear that pairs with everything in your wardrobe.',
      materials: 'Stainless-steel case with leather or mesh strap and mineral crystal.',
    },
    'Tommy Hilfiger': {
      madeFor: 'Bold American prep — made for confident everyday looks, equally at home with denim or a blazer.',
      materials: 'Stainless-steel or ion-plated case with steel, leather or silicone strap and mineral crystal.',
    },
  };

  const STRAP_INFO = {
    rubber: {
      madeFor: 'A quick way to give your watch a new character — swap colours for sport, travel or the weekend. Available in 20 mm and 22 mm widths.',
      materials: 'Soft, water-resistant silicone rubber strap with a gold-tone buckle.',
    },
    leather: {
      madeFor: 'A refined change of dress for your watch — richer, warmer and boardroom-ready. Available in 20 mm and 22 mm widths.',
      materials: 'Genuine leather strap with a gold-tone buckle.',
    },
  };

  let lastFocus = null;

  function closeModal() {
    const overlay = $('catalog-modal');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKey);
    if (lastFocus) lastFocus.focus();
  }

  function onModalKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  function openModal(p) {
    let info;
    if (p.type === 'strap') {
      info = STRAP_INFO[p.ref.toUpperCase().startsWith('BLS') ? 'leather' : 'rubber'];
    } else {
      info = BRAND_INFO[p.brand] || { heading: 'About this fragrance', madeFor: p.desc || '', materials: null };
    }
    if (!info || !info.madeFor) return;
    lastFocus = document.activeElement;

    const tick = '<span class="text-gold">' + BADGE_SVG + '</span>';
    const overlay = document.createElement('div');
    overlay.id = 'catalog-modal';
    overlay.className = 'fixed inset-0 z-[60] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', p.brand + ' ' + p.ref + ' details');

    overlay.innerHTML =
      '<div class="relative mx-auto my-4 w-full max-w-4xl rounded-[3px] bg-white text-text shadow-2xl sm:my-8" data-modal-panel>' +
      '<button type="button" data-modal-close aria-label="Close details" ' +
      'class="absolute right-3 top-3 z-10 flex h-11 w-11 cursor-pointer items-center justify-center text-muted transition-colors duration-200 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>' +
      '</button>' +
      '<div class="grid sm:grid-cols-2">' +
      '<div class="border-b border-line p-6 sm:border-b-0 sm:border-r">' +
      '<img src="' + p.img.src + '" alt="' + p.img.alt + '" width="600" height="600" class="aspect-square w-full object-contain" />' +
      '</div>' +
      '<div class="flex flex-col p-7 lg:p-9">' +
      '<p class="text-[0.6875rem] font-medium uppercase tracking-luxe text-gold-dark">' + p.brand + '</p>' +
      '<h2 class="mt-2 font-display text-3xl leading-snug">' + (p.name || 'Ref. ' + p.ref) + '</h2>' +
      (p.name ? '<p class="mt-1 text-sm text-muted">Ref. ' + p.ref + '</p>' : '') +
      (p.price
        ? '<p class="mt-4 text-xl font-medium tracking-wide">' + rwf(p.price) + '</p>'
        : '<p class="mt-4 text-sm text-muted">Contact us for the current price and availability.</p>') +
      '<button type="button" data-add="' + p.ref + '" class="btn-cart mt-6 sm:max-w-xs">' + BAG_SVG + '<span>Add to cart</span></button>' +
      '<a href="' + productUrl(p) + '" class="mt-3 text-xs uppercase tracking-wide2 text-muted underline underline-offset-4 hover:text-text">View full details</a>' +
      '<div class="my-7 h-px bg-line" aria-hidden="true"></div>' +
      '<h3 class="text-[0.6875rem] font-medium uppercase tracking-luxe text-gold-dark">' + (info.heading || 'Made for') + '</h3>' +
      '<p class="mt-3 text-sm leading-relaxed text-muted">' + info.madeFor + '</p>' +
      (info.materials
        ? '<h3 class="mt-6 text-[0.6875rem] font-medium uppercase tracking-luxe text-gold-dark">Materials</h3>' +
          '<p class="mt-3 text-sm leading-relaxed text-muted">' + info.materials + '</p>' +
          '<p class="mt-2 text-xs text-muted/80">Exact specifications for this reference are provided with its certificate on delivery.</p>'
        : '') +
      '<ul class="mt-6 space-y-2 text-sm text-text/80">' +
      '<li class="flex items-center gap-2.5">' + tick + 'Original &amp; certified — authenticity guaranteed</li>' +
      (document.body.dataset.category === 'perfumes'
        ? '<li class="flex items-center gap-2.5">' + tick + 'Batch-verified, stored away from heat and light</li>'
        : '<li class="flex items-center gap-2.5">' + tick + 'Two-year local warranty included</li>') +
      '<li class="flex items-center gap-2.5">' + tick + 'Delivered across Rwanda</li>' +
      '</ul>' +
      '</div>' +
      '</div>' +
      '</div>';

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('[data-modal-close]')) return closeModal();
      const add = e.target.closest('[data-add]');
      if (add) addToBag(add);
    });
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onModalKey);
    overlay.querySelector('[data-modal-close]').focus();
  }

  // ---------- Card actions ----------
  function addToBag(btn) {
    const p = byRef(btn.dataset.add);
    if (!p || !store) return;
    store.addToBag(p);
    const label = btn.querySelector('span');
    btn.disabled = true;
    label.textContent = 'Added ✓';
    setTimeout(() => { label.textContent = 'Add to cart'; btn.disabled = false; }, 1400);
  }

  grid.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) return addToBag(add);

    const wish = e.target.closest('[data-wish]');
    if (wish && store) {
      const on = store.toggleWishlist(byRef(wish.dataset.wish));
      wish.setAttribute('aria-pressed', on);
      wish.setAttribute('aria-label', (on ? 'Remove from' : 'Save to') + ' wishlist');
      wish.classList.toggle('text-gold', on);
      wish.classList.toggle('text-text/70', !on);
      wish.innerHTML = heartSVG(on);
      return;
    }

    const link = e.target.closest('a[data-ref]');
    if (!link) return;
    e.preventDefault();
    const item = byRef(link.dataset.ref);
    if (item) openModal(item);
  });

  // Hearts follow wishlist changes made in the drawer
  if (store) store.onChange(() => {
    grid.querySelectorAll('[data-wish]').forEach((b) => {
      const on = store.inWishlist(b.dataset.wish);
      if ((b.getAttribute('aria-pressed') === 'true') === on) return;
      b.setAttribute('aria-pressed', on);
      b.classList.toggle('text-gold', on);
      b.classList.toggle('text-text/70', !on);
      b.innerHTML = heartSVG(on);
    });
  });

  // ---------- Brand filters (pills + sidebar checkboxes share one state) ----------
  const brandCounts = items.reduce((m, p) => { if (p.brand) m[p.brand] = (m[p.brand] || 0) + 1; return m; }, {});
  const brands = Object.keys(brandCounts);
  if (urlBrand) {
    const match = brands.find((b) => b.toLowerCase() === urlBrand.toLowerCase());
    if (match) state.brands.add(match);
  }

  function renderBrandFilters() {
    if (brandPills) {
      if (brands.length < 2) brandPills.classList.add('hidden');
      brandPills.innerHTML = ['all'].concat(brands).map((b) => {
        const pressed = b === 'all' ? state.brands.size === 0 : state.brands.size === 1 && state.brands.has(b);
        return '<button type="button" data-brand="' + b + '" aria-pressed="' + pressed + '" class="pill">' + (b === 'all' ? 'All' : b) + '</button>';
      }).join('');
    }
    if (brandChecks) {
      brandChecks.innerHTML = brands.map((b, i) =>
        '<li><label class="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-text/85 transition-colors duration-200 hover:text-text">' +
        '<input type="checkbox" class="filter-check" value="' + b + '" id="brand-' + i + '"' + (state.brands.has(b) ? ' checked' : '') + ' />' +
        b + ' <span class="text-muted">(' + brandCounts[b] + ')</span></label></li>'
      ).join('');
    }
  }

  if (brandPills) brandPills.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-brand]');
    if (!btn) return;
    state.brands = btn.dataset.brand === 'all' ? new Set() : new Set([btn.dataset.brand]);
    state.page = 1;
    renderBrandFilters();
    apply();
  });

  if (brandChecks) brandChecks.addEventListener('change', (e) => {
    const box = e.target.closest('input[type=checkbox]');
    if (!box) return;
    if (box.checked) state.brands.add(box.value); else state.brands.delete(box.value);
    state.page = 1;
    renderBrandFilters();
    brandChecks.querySelector('input[value="' + box.value + '"]').focus();
    apply();
  });

  // ---------- Price range ----------
  function renderPrice() {
    if (!priceBox) return;
    const span = HI - LO || 1;
    priceFill.style.left = ((state.min - LO) / span) * 100 + '%';
    priceFill.style.right = (100 - ((state.max - LO) / span) * 100) + '%';
    priceLabel.textContent = rwf(state.min) + ' – ' + rwf(state.max);
  }

  if (priceBox) {
    if (!priced.length) {
      priceBox.classList.add('hidden');
    } else {
      [priceMin, priceMax].forEach((r) => { r.min = LO; r.max = HI; r.step = PRICE_STEP; });
      priceMin.value = LO;
      priceMax.value = HI;
      const onSlide = (e) => {
        let lo = +priceMin.value, hi = +priceMax.value;
        if (lo > hi) { if (e.target === priceMin) lo = hi; else hi = lo; }
        priceMin.value = state.min = lo;
        priceMax.value = state.max = hi;
        state.page = 1;
        renderPrice();
        apply();
      };
      priceMin.addEventListener('input', onSlide);
      priceMax.addEventListener('input', onSlide);
      renderPrice();
    }
  }

  // ---------- Reset ----------
  const resetBtn = $('filter-reset');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    state.brands = new Set();
    state.min = LO; state.max = HI;
    state.q = ''; searchInput.value = '';
    if (priceMin) { priceMin.value = LO; priceMax.value = HI; renderPrice(); }
    state.page = 1;
    renderBrandFilters();
    apply();
  });

  // ---------- Mobile filter drawer ----------
  const drawer = $('filter-panel');
  const drawerBackdrop = $('filter-backdrop');
  const openBtn = $('filter-open');
  function setFilterDrawer(open) {
    drawer.classList.toggle('is-open', open);
    drawerBackdrop.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (openBtn) openBtn.setAttribute('aria-expanded', open);
    if (open) drawer.querySelector('[data-filter-close]').focus(); else if (openBtn) openBtn.focus();
  }
  if (drawer && openBtn) {
    openBtn.addEventListener('click', () => setFilterDrawer(true));
    drawerBackdrop.addEventListener('click', () => setFilterDrawer(false));
    drawer.querySelectorAll('[data-filter-close]').forEach((b) => b.addEventListener('click', () => setFilterDrawer(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) setFilterDrawer(false); });
  }

  // ---------- Filter + sort + paginate ----------
  function apply() {
    const q = state.q.trim().toLowerCase();
    const priceActive = priced.length && (state.min > LO || state.max < HI);
    let list = items.filter((p) => {
      if (state.brands.size && !state.brands.has(p.brand)) return false;
      if (priceActive && (!p.price || p.price < state.min || p.price > state.max)) return false;
      if (!q) return true;
      return (
        p.ref.toLowerCase().includes(q) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    });

    if (state.sort === 'price-asc') list = list.slice().sort((a, b) => a.price - b.price);
    else if (state.sort === 'price-desc') list = list.slice().sort((a, b) => b.price - a.price);
    else if (state.sort === 'name') list = list.slice().sort((a, b) => (a.name || a.ref).localeCompare(b.name || b.ref));

    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / state.perPage));
    state.page = Math.min(state.page, pages);

    const start = (state.page - 1) * state.perPage;
    const shown = list.slice(start, start + state.perPage);

    grid.innerHTML = shown.map(cardHTML).join('');
    emptyEl.classList.toggle('hidden', total > 0);
    grid.classList.toggle('hidden', total === 0);

    countEl.textContent = total.toLocaleString('en-US') + (total === 1 ? ' product' : ' products');
    const showing = $('results-range');
    if (showing) showing.textContent = total ? 'Showing ' + (start + 1) + '–' + (start + shown.length) + ' of ' + total.toLocaleString('en-US') : '';

    pageInfo.textContent = 'Page ' + state.page + ' of ' + pages;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= pages;
    const pager = prevBtn.closest('nav');
    if (pager) pager.classList.toggle('hidden', pages <= 1);
  }

  searchInput.addEventListener('input', () => { state.q = searchInput.value; state.page = 1; apply(); });
  const searchForm = searchInput.form;
  if (searchForm) searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $('catalog-top').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; state.page = 1; apply(); });
  perPageSelect.addEventListener('change', () => {
    state.perPage = perPageSelect.value === 'all' ? items.length || 1 : parseInt(perPageSelect.value, 10);
    state.page = 1;
    apply();
  });
  const toTop = () => $('catalog-top').scrollIntoView({ block: 'start' });
  prevBtn.addEventListener('click', () => { state.page -= 1; apply(); toTop(); });
  nextBtn.addEventListener('click', () => { state.page += 1; apply(); toTop(); });

  renderBrandFilters();
  apply();
})();
