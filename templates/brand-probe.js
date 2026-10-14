// Brand probe: paste into the page's console (or run with a browser tool's "execute JavaScript")
// on the brand's home page. Returns raw brand evidence as JSON; Claude turns it into brand-dna.json.
// Scroll the page to the bottom once before running so lazy sections are rendered.
(() => {
  const els = [...document.querySelectorAll('body *')].filter((e) => e.offsetWidth || e.offsetHeight);
  const hex = (c) => {
    const m = c && c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    if (!m || (m[4] !== undefined && +m[4] < 0.5)) return null;
    return '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  const tally = (map, k, n = 1) => { if (k) map[k] = (map[k] || 0) + n; };
  const top = (map, n) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);

  // Colors weighted by area (backgrounds) and by text length (text color).
  const bg = {}, text = {}, border = {}, fonts = {}, radius = {};
  for (const e of els) {
    const s = getComputedStyle(e), area = Math.min(e.offsetWidth * e.offsetHeight, 2e6) / 1e4;
    tally(bg, hex(s.backgroundColor), area);
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    if (own) { tally(text, hex(s.color), own.length); tally(fonts, s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), own.length); }
    if (parseFloat(s.borderTopWidth) > 0) tally(border, hex(s.borderTopColor));
    if (parseFloat(s.borderTopLeftRadius) > 0) tally(radius, s.borderTopLeftRadius);
    const g = s.backgroundImage.match(/gradient\([^)]*\)/); if (g) tally(bg, 'gradient: ' + s.backgroundImage.slice(0, 120));
  }
  const type = (sel) => {
    const e = document.querySelector(sel); if (!e) return null;
    const s = getComputedStyle(e);
    return { text: e.innerText.trim().slice(0, 80), family: s.fontFamily, size: s.fontSize, weight: s.fontWeight,
      color: hex(s.color), letterSpacing: s.letterSpacing, transform: s.textTransform, lineHeight: s.lineHeight };
  };
  const buttons = [...document.querySelectorAll('a[class*=btn], a[class*=button], button, .elementor-button, [role=button]')]
    .filter((e) => e.offsetWidth).slice(0, 8).map((e) => {
      const s = getComputedStyle(e);
      return { text: e.innerText.trim().slice(0, 40), bg: hex(s.backgroundColor), color: hex(s.color), radius: s.borderTopLeftRadius };
    });
  // The brand's own logo is almost always inside the link to the home page; check there first,
  // because "logo" selectors also match customer and partner logos further down the page.
  const home = [...document.querySelectorAll('a[href]')].filter((a) => new URL(a.href, location.href).pathname === '/' && new URL(a.href, location.href).host === location.host).slice(0, 3);
  const logos = [
    ...home.flatMap((a) => [...a.querySelectorAll('img')].map((i) => ({ homeLink: true, src: i.currentSrc || i.src, alt: i.alt, natural: `${i.naturalWidth}x${i.naturalHeight}` }))),
    ...home.flatMap((a) => [...a.querySelectorAll('svg')].map((sv) => ({ homeLink: true, inlineSvg: sv.outerHTML.slice(0, 6000) }))),
    ...[...document.querySelectorAll('header img, [class*=logo] img, img[class*=logo], img[alt*=logo i], img[src*=logo i]')]
      .map((i) => ({ src: i.currentSrc || i.src, alt: i.alt, natural: `${i.naturalWidth}x${i.naturalHeight}` })),
    ...[...document.querySelectorAll('header svg, [class*=logo] svg')].slice(0, 2).map((s) => ({ inlineSvg: s.outerHTML.slice(0, 3000) })),
    ...[...document.querySelectorAll('link[rel*=icon], meta[property="og:image"]')].map((l) => ({ src: l.href || l.content, rel: l.rel || 'og:image' })),
  ];
  const links = [...document.querySelectorAll('a[href]')];
  return {
    url: location.href, title: document.title, sampledAt: new Date().toISOString().slice(0, 10),
    description: document.querySelector('meta[name=description]')?.content || null,
    themeColor: document.querySelector('meta[name=theme-color]')?.content || null,
    backgrounds: top(bg, 12), textColors: top(text, 10), borders: top(border, 8), radius: top(radius, 5),
    fonts: top(fonts, 6),
    googleFontLinks: [...document.querySelectorAll('link[href*="fonts.googleapis"]')].map((l) => l.href),
    type: { h1: type('h1'), h2: type('h2'), h3: type('h3'), body: type('p'), nav: type('nav a') },
    buttons, logos: logos.slice(0, 10),
    headlines: [...document.querySelectorAll('h1,h2,h3')].map((h) => h.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 20),
    phone: links.filter((a) => a.href.startsWith('tel:')).map((a) => a.href.slice(4))[0] || null,
    email: links.filter((a) => a.href.startsWith('mailto:')).map((a) => a.href.slice(7))[0] || null,
  };
})();
