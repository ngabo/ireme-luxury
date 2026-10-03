"""Generate one static page per product, plus sitemap.xml, robots.txt and a Google product feed.

Run after changing js/products.js:   python tools/build_product_pages.py && npm run build
Pages land in p/<slug>.html. The header is copied from watches.html so it stays in sync.
Slugs must match productUrl() in js/catalog.js.
"""
import html, json, os, re
from datetime import date
from urllib.parse import quote
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SITE = 'https://ireme.sonadive.com/'
WHATSAPP = '33758585624'
TODAY = date.today().isoformat()


def slug(p):
    return re.sub(r'[^a-z0-9.]+', '-', (p['brand'] + '-' + p['ref']).lower()).strip('-')


def parse_products():
    src = open('js/products.js', encoding='utf-8').read()
    out = {}
    for const, cat in (('IREME_WATCHES', 'watches'), ('IREME_PERFUMES', 'perfumes')):
        block = src[src.index('const ' + const):]
        block = block[:block.index('];')]
        items = []
        for line in block.splitlines():
            if 'ref:' not in line:
                continue
            get = lambda k: (re.search(k + r':\s*(["\'])(.*?)\1', line) or [None, None, None])[2]
            price = re.search(r'price:\s*(\d+)', line)
            items.append({
                'brand': get('brand'), 'ref': get('ref'), 'name': get('name'), 'desc': get('desc'),
                'type': get('type'), 'price': int(price.group(1)) if price else 0,
                'img': re.search(r'src:\s*(["\'])(.*?)\1', line).group(2),
                'alt': re.search(r'alt:\s*(["\'])(.*?)\1', line).group(2),
                'cat': cat,
            })
        out[cat] = items
    return out


def brand_info():
    """Pull the BRAND_INFO / STRAP_INFO copy out of js/catalog.js (single source of truth)."""
    src = open('js/catalog.js', encoding='utf-8').read()
    info = {}
    for m in re.finditer(r"'?([\w ]+?)'?: \{\s*madeFor: '(.*?)',\s*materials: '(.*?)',\s*\}", src, re.S):
        info[m.group(1).strip()] = (m.group(2), m.group(3))
    return info


def title(p):
    if p['name']:
        return p['name']
    kind = 'Strap' if p['type'] == 'strap' else 'Watch'
    return f"{p['brand']} {kind} {p['ref']}"


def rwf(n):
    return 'RWF ' + f'{n:,}'


def header_for(active):
    """Reuse the live header from watches.html, re-pointed one folder up."""
    s = open('watches.html', encoding='utf-8').read()
    h = s[s.index('  <!-- ============ HEADER ============ -->'):s.index('</header>') + len('</header>')]
    h = h.replace(' aria-current="page"', '')
    h = re.sub(r'(<a href="' + ('watches' if active == 'watches' else 'perfumes') + r'\.html" class="nav-link-lux[^"]*")', r'\1 aria-current="page"', h)
    h = re.sub(r'(href|action)="(?!https?:|#|tel:|mailto:|/)([^"]+)"', r'\1="../\2"', h)
    # Header search should send people to the catalog with their query
    h = h.replace('id="catalog-search"', 'id="site-search" name="q"')
    return h


def footer():
    s = open('watches.html', encoding='utf-8').read()
    f = s[s.index('  <!-- ============ FOOTER ============ -->'):s.index('</footer>') + len('</footer>')]
    return re.sub(r'href="(?!https?:|#|tel:|mailto:|/)([^"]+)"', r'href="../\1"', f)


def page(p, related, info, header, foot, version):
    t = title(p)
    url = SITE + 'p/' + slug(p) + '.html'
    img_abs = SITE + p['img']
    cat_page = p['cat'] + '.html'
    cat_label = 'Watches' if p['cat'] == 'watches' else 'Perfumes'
    if p['type'] == 'strap':
        made, materials = info.get('leather' if p['ref'].upper().startswith('BLS') else 'rubber', ('', ''))
    else:
        made, materials = info.get(p['brand'], (p['desc'] or '', ''))
    desc = (f"Original {t} at Ireme Luxury, Kigali. " +
            (f"{rwf(p['price'])}. " if p['price'] else '') +
            "Authenticity guaranteed, delivered across Rwanda. Order on WhatsApp.")
    wa =f"https://wa.me/{WHATSAPP}?text=" + quote(f"Hello Ireme Luxury, I'm interested in the {t}: {url}")

    ld = {
        '@context': 'https://schema.org/', '@type': 'Product',
        'name': t, 'image': [img_abs], 'description': desc, 'sku': p['ref'], 'mpn': p['ref'],
        'brand': {'@type': 'Brand', 'name': p['brand']},
    }
    if p['price']:
        ld['offers'] = {
            '@type': 'Offer', 'url': url, 'priceCurrency': 'RWF', 'price': str(p['price']),
            'availability': 'https://schema.org/InStock', 'itemCondition': 'https://schema.org/NewCondition',
            'seller': {'@type': 'Organization', 'name': 'Ireme Luxury'},
        }
    crumbs = {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': cat_label, 'item': SITE + cat_page},
            {'@type': 'ListItem', 'position': 2, 'name': p['brand'], 'item': SITE + cat_page + '?brand=' + quote(p['brand'])},
            {'@type': 'ListItem', 'position': 3, 'name': t, 'item': url},
        ]}
    e = html.escape
    tick = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4 shrink-0 text-gold" aria-hidden="true">'
            '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>')
    perks = ['Original &amp; certified — authenticity guaranteed',
             'Batch-verified, stored away from heat and light' if p['cat'] == 'perfumes' else 'Two-year local warranty included',
             'Delivered across Rwanda']
    rel = ''.join(
        f'''<li><a href="{slug(r)}.html" class="group block rounded-[3px] border border-line bg-white p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
            <img src="../{e(r['img'])}" alt="{e(r['alt'])}" width="300" height="300" loading="lazy" class="aspect-square w-full object-contain transition-transform duration-300 group-hover:scale-105" />
            <p class="mt-3 text-[0.625rem] font-medium uppercase tracking-luxe text-gold-dark">{e(r['brand'])}</p>
            <p class="mt-1 truncate text-sm text-text">{e(title(r))}</p>
            <p class="mt-1 text-sm font-medium">{rwf(r['price']) if r['price'] else 'Price on request'}</p>
          </a></li>''' for r in related)
    data = json.dumps({'ref': p['ref'], 'brand': p['brand'], 'name': p['name'] or '', 'price': p['price'], 'img': {'src': '../' + p['img']}})

    return f'''<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{e(t)} — {rwf(p['price']) + ' | ' if p['price'] else ''}Ireme Luxury Kigali</title>
  <meta name="description" content="{e(desc)}" />
  <link rel="canonical" href="{url}" />
  <meta property="og:type" content="product" />
  <meta property="og:title" content="{e(t)} — Ireme Luxury" />
  <meta property="og:description" content="{e(desc)}" />
  <meta property="og:image" content="{img_abs}" />
  <meta property="og:url" content="{url}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../css/styles.css?v={version}" />
  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
  <script type="application/ld+json">{json.dumps(crumbs, ensure_ascii=False)}</script>
</head>

<body class="bg-ivory font-body text-text">
{header}

  <main class="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
    <nav class="text-xs uppercase tracking-wide2 text-muted" aria-label="Breadcrumb">
      <a href="../{cat_page}" class="hover:text-text">{cat_label}</a>
      <span class="mx-2" aria-hidden="true">/</span>
      <a href="../{cat_page}?brand={quote(p['brand'])}" class="hover:text-text">{e(p['brand'])}</a>
      <span class="mx-2" aria-hidden="true">/</span>
      <span class="text-text">{e(p['ref'])}</span>
    </nav>

    <div class="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
      <div class="rounded-[3px] border border-line bg-white p-6 sm:p-10">
        <img src="../{e(p['img'])}" alt="{e(p['alt'])}" width="600" height="600" fetchpriority="high" class="aspect-square w-full object-contain" />
      </div>

      <div class="flex flex-col">
        <p class="text-xs font-medium uppercase tracking-luxe text-gold-dark">{e(p['brand'])}</p>
        <h1 class="mt-2 font-display text-3xl leading-tight sm:text-4xl">{e(t)}</h1>
        <p class="mt-2 text-sm text-muted">Ref. {e(p['ref'])}</p>
        <p class="mt-5 text-2xl font-medium tracking-wide">{rwf(p['price']) if p['price'] else '<span class="text-base font-normal text-muted">Price on request</span>'}</p>

        <div class="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" id="add-to-bag" class="btn-cart sm:max-w-xs"><span>Add to cart</span></button>
          <a href="{wa}" target="_blank" rel="noopener" class="flex min-h-[44px] items-center justify-center gap-2 rounded-[2px] border border-line bg-white px-5 text-[0.75rem] font-medium uppercase tracking-[0.16em] text-text transition-colors duration-200 hover:border-gold">Ask on WhatsApp</a>
        </div>

        <ul class="mt-7 space-y-2.5 text-sm text-text/80">
          {''.join(f'<li class="flex items-center gap-2.5">{tick}{x}</li>' for x in perks)}
        </ul>

        <div class="my-8 h-px bg-line" aria-hidden="true"></div>
        {f'<h2 class="text-[0.6875rem] font-medium uppercase tracking-luxe text-gold-dark">{"Made for" if p["cat"] == "watches" else "About this fragrance"}</h2><p class="mt-3 text-sm leading-relaxed text-muted">{e(made)}</p>' if made else ''}
        {f'<h2 class="mt-6 text-[0.6875rem] font-medium uppercase tracking-luxe text-gold-dark">Materials</h2><p class="mt-3 text-sm leading-relaxed text-muted">{e(materials)}</p><p class="mt-2 text-xs text-muted/80">Exact specifications for this reference are provided with its certificate on delivery.</p>' if materials else ''}
      </div>
    </div>

    {f"""<section class="mt-16" aria-labelledby="related-heading">
      <h2 id="related-heading" class="font-display text-2xl sm:text-3xl">More from {e(p['brand'])}</h2>
      <ul class="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4" role="list">{rel}</ul>
    </section>""" if related else ''}
  </main>

{foot}

  <script src="../js/site.js?v={version}"></script>
  <script>
    (function () {{
      var p = {data};
      var btn = document.getElementById('add-to-bag');
      btn.addEventListener('click', function () {{
        window.IremeStore.addToBag(p);
        var l = btn.querySelector('span');
        l.textContent = 'Added \\u2713';
        setTimeout(function () {{ l.textContent = 'Add to cart'; }}, 1400);
      }});
    }})();
  </script>
</body>
</html>
'''


def main():
    products = parse_products()
    info = brand_info()
    version = re.search(r'styles\.css\?v=(\w+)', open('watches.html', encoding='utf-8').read()).group(1)
    foot = footer()
    os.makedirs('p', exist_ok=True)
    for f in os.listdir('p'):
        if f.endswith('.html'):
            os.remove(os.path.join('p', f))

    all_items = products['watches'] + products['perfumes']
    slugs = [slug(p) for p in all_items]
    assert len(slugs) == len(set(slugs)), 'duplicate product slugs'

    for cat, items in products.items():
        header = header_for(cat)
        for i, p in enumerate(items):
            same = [r for r in items if r['brand'] == p['brand'] and r['ref'] != p['ref'] and (r['type'] == p['type'])]
            k = items.index(p)
            related = (same[k % max(len(same), 1):] + same)[:4] if same else []
            with open(f'p/{slug(p)}.html', 'w', encoding='utf-8', newline='\n') as fh:
                fh.write(page(p, related, info, header, foot, version))

    # sitemap.xml
    urls = [SITE + 'watches.html', SITE + 'perfumes.html', SITE + 'contact.html'] + [SITE + 'p/' + s + '.html' for s in slugs]
    with open('sitemap.xml', 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u in urls:
            fh.write(f'  <url><loc>{escape(u)}</loc><lastmod>{TODAY}</lastmod></url>\n')
        fh.write('</urlset>\n')

    with open('robots.txt', 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}sitemap.xml\n')

    # Google Merchant Center product feed (RSS 2.0). Only priced items can be listed.
    with open('google-feed.xml', 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n')
        fh.write(f'<title>Ireme Luxury</title>\n<link>{SITE}</link>\n<description>Original watches and fine fragrances, Kigali</description>\n')
        for p in all_items:
            if not p['price']:
                continue
            cat = ('Apparel &amp; Accessories &gt; Jewelry &gt; Watches' if p['type'] != 'strap'
                   else 'Apparel &amp; Accessories &gt; Jewelry &gt; Watch Accessories &gt; Watch Bands')
            fh.write('<item>\n'
                     f'  <g:id>{escape(p["ref"])}</g:id>\n'
                     f'  <g:title>{escape(title(p))}</g:title>\n'
                     f'  <g:description>{escape("Original " + title(p) + ". Authenticity guaranteed, two-year local warranty, delivered across Rwanda.")}</g:description>\n'
                     f'  <g:link>{SITE}p/{slug(p)}.html</g:link>\n'
                     f'  <g:image_link>{SITE}{escape(p["img"])}</g:image_link>\n'
                     f'  <g:availability>in_stock</g:availability>\n'
                     f'  <g:price>{p["price"]} RWF</g:price>\n'
                     f'  <g:brand>{escape(p["brand"])}</g:brand>\n'
                     f'  <g:mpn>{escape(p["ref"])}</g:mpn>\n'
                     f'  <g:condition>new</g:condition>\n'
                     f'  <g:google_product_category>{cat}</g:google_product_category>\n'
                     '</item>\n')
        fh.write('</channel>\n</rss>\n')

    print(f'{len(all_items)} product pages, sitemap with {len(urls)} URLs, feed written.')


if __name__ == '__main__':
    main()
