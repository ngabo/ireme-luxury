// Ireme Luxury — category listing renderer.
// Expects: body[data-category="watches"|"perfumes"] and the toolbar/grid elements below.
// Cards render whichever fields a product has: brand, name, ref (SKU), desc, retail, price.

(function () {
  const DATA = { watches: IREME_WATCHES, perfumes: IREME_PERFUMES };
  const items = DATA[document.body.dataset.category] || [];
  const DARK = document.body.dataset.theme === 'dark';

  const grid = document.getElementById('product-grid');
  const searchInput = document.getElementById('catalog-search');
  const sortSelect = document.getElementById('catalog-sort');
  const perPageSelect = document.getElementById('catalog-per-page');
  const countEl = document.getElementById('results-count');
  const emptyEl = document.getElementById('empty-state');
  const prevBtn = document.getElementById('pager-prev');
  const nextBtn = document.getElementById('pager-next');
  const pageInfo = document.getElementById('pager-info');
  const brandFilter = document.getElementById('brand-filter');

  const state = {
    q: '',
    sort: 'featured',
    perPage: parseInt(perPageSelect.value, 10) || 12,
    page: 1,
    brand: 'all',
  };

  const rwf = (n) => 'RWF ' + n.toLocaleString('en-US');

  const BADGE_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-3.5 w-3.5" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />' +
    '</svg>';

  const HEART_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" class="h-5 w-5" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />' +
    '</svg>';

  function cardDark(p) {
    let meta = '';
    if (p.brand) {
      meta += '<p class="text-[0.625rem] font-medium uppercase tracking-luxe text-gold-light">' + p.brand + '</p>';
    }
    meta += '<h3 class="mt-1.5 font-display text-base font-medium leading-snug text-cream transition-colors duration-200 group-hover:text-gold-light">' + (p.name || p.ref) + '</h3>';
    if (p.name) {
      meta += '<p class="mt-1 text-[0.6875rem] uppercase tracking-wide2 text-cream/50">Ref. ' + p.ref + '</p>';
    }
    if (p.desc) {
      meta += '<p class="mt-1.5 text-sm font-light leading-relaxed text-cream/50">' + p.desc + '</p>';
    }

    const priceHTML = p.price
      ? '<span>' + (p.retail ? '<span class="text-cream/40 line-through">Retail ' + rwf(p.retail) + '</span><br />' : '') +
        '<span class="mt-1 inline-block text-base text-cream"><span class="text-cream/50">RWF</span> <span class="font-medium">' + p.price.toLocaleString('en-US') + '</span></span></span>'
      : '<span class="mt-1 inline-block text-sm font-light normal-case text-cream/50">Enquire for price</span>';

    return (
      '<li>' +
      '<a href="#" data-ref="' + p.ref + '" aria-haspopup="dialog" class="group block cursor-pointer border border-cream/10 bg-charcoal transition-colors duration-300 hover:border-gold/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">' +
      '<div class="relative overflow-hidden p-3 pt-14">' +
      '<span class="absolute left-1/2 top-3 inline-flex w-max -translate-x-1/2 items-center gap-1.5 border border-cream/10 bg-black/80 px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-wide2 text-gold-pale backdrop-blur-sm">' +
      BADGE_SVG + 'Authenticity Guaranteed</span>' +
      '<img src="' + p.img.src + '" alt="' + p.img.alt + '" width="600" height="600" loading="lazy" ' +
      'class="aspect-square w-full bg-white object-contain transition-opacity duration-300 group-hover:opacity-90" />' +
      '</div>' +
      '<div class="px-5 pb-5 pt-2">' + meta +
      '<p class="mt-3 flex items-center justify-between text-sm tracking-wide2">' +
      priceHTML +
      '<span class="text-cream/50 transition-colors duration-200 group-hover:text-gold-light" aria-hidden="true">' + HEART_SVG + '</span>' +
      '</p>' +
      '</div>' +
      '</a>' +
      '</li>'
    );
  }

  function cardLight(p) {
    let meta = '';
    if (p.brand) {
      meta += '<p class="text-[0.625rem] font-medium uppercase tracking-luxe text-gold">' + p.brand + '</p>';
    }
    if (p.name) {
      meta += '<h3 class="mt-1 font-display text-lg font-medium leading-snug transition-colors duration-200 group-hover:text-gold">' + p.name + '</h3>';
      meta += '<p class="mt-1 text-[0.6875rem] uppercase tracking-wide2 text-charcoal-soft">Ref. ' + p.ref + '</p>';
    } else {
      meta += '<h3 class="mt-1 font-display text-lg font-medium leading-snug transition-colors duration-200 group-hover:text-gold">' + p.ref + '</h3>';
    }
    if (p.desc) {
      meta += '<p class="mt-1.5 text-sm font-light leading-relaxed text-charcoal-soft">' + p.desc + '</p>';
    }

    let priceHTML = '';
    if (p.retail) {
      priceHTML += '<span class="text-charcoal-soft/70 line-through">Retail ' + rwf(p.retail) + '</span><br />';
    }
    priceHTML += '<span class="mt-1 inline-block text-base"><span class="text-charcoal-soft">RWF</span> <span class="font-medium">' + p.price.toLocaleString('en-US') + '</span></span>';

    return (
      '<li>' +
      '<a href="#" class="group block cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">' +
      '<div class="relative overflow-hidden bg-cream">' +
      '<img src="' + p.img.src + '" alt="' + p.img.alt + '" width="600" height="600" loading="lazy" ' +
      'class="aspect-square w-full bg-white object-contain transition-opacity duration-300 group-hover:opacity-90" />' +
      '<span class="absolute left-4 top-4 inline-flex items-center gap-1.5 bg-charcoal/90 px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-wide2 text-gold-pale backdrop-blur-sm">' +
      BADGE_SVG + 'Authenticity Guaranteed</span>' +
      '</div>' +
      '<div class="mt-5">' + meta + '</div>' +
      '<p class="mt-3 text-sm tracking-wide2">' + priceHTML + '</p>' +
      '</a>' +
      '</li>'
    );
  }

  const cardHTML = DARK ? cardDark : cardLight;

  // ---------- Product detail modal (watches) ----------
  const BRAND_INFO = {
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

  let lastFocus = null;

  function closeModal() {
    const overlay = document.getElementById('catalog-modal');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKey);
    if (lastFocus) lastFocus.focus();
  }

  function onModalKey(e) {
    if (e.key === 'Escape') closeModal();
  }

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

  function openModal(p) {
    let info;
    if (p.type === 'strap') {
      info = STRAP_INFO[p.ref.toUpperCase().startsWith('BLS') ? 'leather' : 'rubber'];
    } else {
      info = BRAND_INFO[p.brand] || { heading: 'About this fragrance', madeFor: p.desc || '', materials: null };
    }
    if (!info || !info.madeFor) return;
    lastFocus = document.activeElement;

    const overlay = document.createElement('div');
    overlay.id = 'catalog-modal';
    overlay.className = 'fixed inset-0 z-[60] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:p-8';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', p.brand + ' ' + p.ref + ' details');

    overlay.innerHTML =
      '<div class="relative mx-auto my-4 w-full max-w-4xl border border-cream/10 bg-charcoal sm:my-8" data-modal-panel>' +
      '<button type="button" data-modal-close aria-label="Close details" ' +
      'class="absolute right-3 top-3 z-10 flex h-11 w-11 cursor-pointer items-center justify-center bg-black/60 text-cream transition-colors duration-200 hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>' +
      '</button>' +
      '<div class="grid sm:grid-cols-2">' +
      '<img src="' + p.img.src + '" alt="' + p.img.alt + '" width="600" height="600" ' +
      'class="aspect-square w-full bg-white object-contain" />' +
      '<div class="flex flex-col p-7 lg:p-9">' +
      '<p class="text-[0.625rem] font-medium uppercase tracking-luxe text-gold-light">' + p.brand + '</p>' +
      '<h2 class="mt-2 font-display text-2xl font-medium leading-snug text-cream">' + (p.name || p.ref) + '</h2>' +
      (p.price
        ? '<p class="mt-3 text-lg tracking-wide2 text-cream"><span class="text-cream/50 text-sm">RWF</span> <span class="font-medium">' + p.price.toLocaleString('en-US') + '</span></p>'
        : '<p class="mt-3 text-sm font-light text-cream/50">Contact us for the current price and availability.</p>') +
      '<div class="my-6 h-px bg-cream/10" aria-hidden="true"></div>' +
      '<h3 class="text-[0.6875rem] font-medium uppercase tracking-luxe text-gold-light">' + (info.heading || 'Made for') + '</h3>' +
      '<p class="mt-3 text-sm font-light leading-relaxed text-cream/70">' + info.madeFor + '</p>' +
      (info.materials
        ? '<h3 class="mt-6 text-[0.6875rem] font-medium uppercase tracking-luxe text-gold-light">Materials</h3>' +
          '<p class="mt-3 text-sm font-light leading-relaxed text-cream/70">' + info.materials + '</p>' +
          '<p class="mt-2 text-xs font-light text-cream/40">Exact specifications for this reference are provided with its certificate on delivery.</p>'
        : '') +
      '<ul class="mt-6 space-y-2 text-sm font-light text-cream/60">' +
      '<li class="flex items-center gap-2.5">' + BADGE_SVG + 'Original &amp; certified — authenticity guaranteed</li>' +
      (document.body.dataset.category === 'perfumes'
        ? '<li class="flex items-center gap-2.5">' + BADGE_SVG + 'Batch-verified, stored away from heat and light</li>'
        : '<li class="flex items-center gap-2.5">' + BADGE_SVG + 'Two-year local warranty included</li>') +
      '<li class="flex items-center gap-2.5">' + BADGE_SVG + 'Delivered across Rwanda</li>' +
      '</ul>' +
      (p.price ? '' :
        '<a href="contact.html" class="btn-gold mt-7 self-start">Contact us</a>') +
      '</div>' +
      '</div>' +
      '</div>';

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('[data-modal-close]')) closeModal();
    });
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onModalKey);
    overlay.querySelector('[data-modal-close]').focus();
  }

  grid.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-ref]');
    if (!link) return;
    e.preventDefault();
    const item = items.find((p) => p.ref === link.dataset.ref);
    if (item) openModal(item);
  });

  function renderBrandFilter() {
    if (!brandFilter) return;
    const brands = [...new Set(items.map((p) => p.brand).filter(Boolean))];
    if (brands.length < 2) {
      brandFilter.classList.add('hidden');
      return;
    }
    const base =
      'cursor-pointer border px-5 py-2.5 text-[0.75rem] font-medium uppercase tracking-wide2 transition-colors duration-200 ' +
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ';
    const idle = DARK
      ? base + 'border-cream/20 text-cream hover:border-gold hover:text-gold-light'
      : base + 'border-charcoal/20 text-charcoal hover:border-gold hover:text-gold';
    const active = DARK
      ? base + 'border-gold bg-gold text-charcoal-deep'
      : base + 'border-charcoal bg-charcoal text-cream';
    brandFilter.innerHTML = ['all'].concat(brands).map((b) => {
      const label = b === 'all' ? 'All brands' : b;
      const cls = state.brand === b ? active : idle;
      const pressed = state.brand === b ? 'true' : 'false';
      return '<button type="button" data-brand="' + b + '" aria-pressed="' + pressed + '" class="' + cls + '">' + label + '</button>';
    }).join('');
    brandFilter.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.brand = btn.dataset.brand;
        state.page = 1;
        renderBrandFilter();
        apply();
      });
    });
  }

  function apply() {
    const q = state.q.trim().toLowerCase();
    let list = items.filter((p) => {
      if (state.brand !== 'all' && p.brand !== state.brand) return false;
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

    countEl.textContent = total === 0
      ? 'No results'
      : 'Showing ' + (start + 1) + ' to ' + (start + shown.length) + ' of ' + total + ' results';

    pageInfo.textContent = 'Page ' + state.page + ' of ' + pages;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= pages;
  }

  searchInput.addEventListener('input', () => { state.q = searchInput.value; state.page = 1; apply(); });
  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; state.page = 1; apply(); });
  perPageSelect.addEventListener('change', () => {
    state.perPage = perPageSelect.value === 'all' ? items.length || 1 : parseInt(perPageSelect.value, 10);
    state.page = 1;
    apply();
  });
  prevBtn.addEventListener('click', () => { state.page -= 1; apply(); grid.scrollIntoView({ block: 'start' }); });
  nextBtn.addEventListener('click', () => { state.page += 1; apply(); grid.scrollIntoView({ block: 'start' }); });

  renderBrandFilter();
  apply();
})();
