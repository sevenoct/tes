/* ==========================================================================
   Hasan Ramdani — Portfolio
   1. Three-phase waves (the material behind the glass)
   2. Mobile menu
   3. Nav indicator + scroll spy
   4. Pointer glow + hero parallax
   5. Lens: real glass refraction (Chromium only, CSS-only glass elsewhere)
   ========================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- 1. Three-phase waves: A, B, C are 120° apart ---------- */
  (function buildWaves() {
    const svg = $('.waves');
    if (!svg) return;
    const PERIOD = 600, AMP = 215, MID = 300, WIDTH = 3600, STEP = 15;
    [['pa', 0], ['pb', 2 * Math.PI / 3], ['pc', 4 * Math.PI / 3]].forEach(([cls, phase]) => {
      let d = '';
      for (let x = 0; x <= WIDTH; x += STEP) {
        const y = MID - AMP * Math.sin(2 * Math.PI * x / PERIOD + phase);
        d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
      }
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('class', cls);
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
  })();

  /* ---------- 2. Mobile menu ---------- */
  const nav = $('#site-nav');
  const menuBtn = $('.menu-btn');
  const mqDesktop = matchMedia('(min-width: 901px)');

  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('pointerdown', e => {
    if (nav?.classList.contains('open') && !e.target.closest('.topbar')) setMenu(false);
  });
  mqDesktop.addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---------- 3. Nav indicator (sliding glass pill) + scroll spy ---------- */
  const ind = $('.nav-ind');
  const spyLinks = $$('#site-nav a:not(.nav-cta)');
  let activeLink = null;

  function placeIndicator() {
    if (!ind) return;
    if (!activeLink || !mqDesktop.matches) { ind.classList.remove('on'); return; }
    ind.style.width = activeLink.offsetWidth + 'px';
    ind.style.transform = `translate3d(${activeLink.offsetLeft}px,-50%,0)`;
    ind.classList.add('on');
  }
  function setActive(link) {
    spyLinks.forEach(a => {
      const on = a === link;
      a.classList.toggle('active', on);
      on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    });
    activeLink = link;
    placeIndicator();
  }
  if ('IntersectionObserver' in window) {
    const targets = spyLinks
      .map(a => ({ a, el: $(a.getAttribute('href')) }))
      .filter(t => t.el);
    const visible = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const t = targets.find(x => x.el === en.target);
        en.isIntersecting ? visible.add(t) : visible.delete(t);
      });
      const pick = targets.filter(t => visible.has(t)).pop() || null;
      setActive(pick ? pick.a : null);
    }, { rootMargin: '-42% 0px -52% 0px' });
    targets.forEach(t => io.observe(t.el));
  }
  addEventListener('resize', placeIndicator);
  document.fonts?.ready.then(placeIndicator);

  /* ---------- 4. Pointer glow + hero parallax ---------- */
  const glasses = $$('.glass');
  const hero = $('#hero-card');
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (canHover) {
    let px = -1, py = -1, raf = 0;
    const lit = new Set();

    const frame = () => {
      raf = 0;
      const vh = innerHeight;
      for (const g of glasses) {
        const r = g.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        const near = px >= r.left - 40 && px <= r.right + 40 && py >= r.top - 40 && py <= r.bottom + 40;
        if (near) {
          g.style.setProperty('--mx', (px - r.left).toFixed(0) + 'px');
          g.style.setProperty('--my', (py - r.top).toFixed(0) + 'px');
          if (!lit.has(g)) { g.style.setProperty('--glow', '1'); lit.add(g); }
        } else if (lit.has(g)) {
          g.style.setProperty('--glow', '0'); lit.delete(g);
        }
      }
      if (hero) {
        const r = hero.getBoundingClientRect();
        const nx = clamp((px - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1);
        const ny = clamp((py - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1);
        hero.style.setProperty('--nx', nx.toFixed(3));
        hero.style.setProperty('--ny', ny.toFixed(3));
      }
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(frame); };

    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      px = e.clientX; py = e.clientY; queue();
    }, { passive: true });
    addEventListener('scroll', queue, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { px = py = -9999; queue(); });
  }

  /* ---------- 5. Lens: refraction through the glass edge ----------
     Chromium is the only engine that accepts an SVG filter inside
     backdrop-filter. For every .lens element we render a displacement map
     (bent light at the bezel, computed with Snell's law on a convex squircle
     surface) and plug it into an feDisplacementMap. Safari / Firefox keep the
     CSS glass defined in style.css — nothing breaks, it just doesn't bend.   */
  (function initLens() {
    const ua = navigator.userAgent;
    const chromium = /(Chrome|Chromium)\//.test(ua) && !/(CriOS|FxiOS)/.test(ua);
    if (!chromium) return;
    if (matchMedia('(prefers-reduced-transparency: reduce)').matches) return;

    const lenses = $$('.lens');
    if (!lenses.length) return;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
    const defs = document.createElementNS(NS, 'defs');
    svg.appendChild(defs);
    document.body.prepend(svg);

    /* radial profile: how far light is displaced vs. distance into the bezel */
    const N_GLASS = 1.5, GAP = 0.25, SAMPLES = 128;
    const surface = t => Math.pow(1 - Math.pow(1 - t, 4), 0.25);      // convex squircle height
    const lut = new Float32Array(SAMPLES);
    (function () {
      let max = 0;
      for (let i = 0; i < SAMPLES; i++) {
        const t = clamp(i / (SAMPLES - 1), 0.002, 1);
        const d = 0.001;
        const slope = (surface(clamp(t + d, 0, 1)) - surface(clamp(t - d, 0, 1))) / (2 * d);
        const th1 = Math.atan(Math.abs(slope));
        const th2 = Math.asin(Math.sin(th1) / N_GLASS);
        lut[i] = (surface(t) + GAP) * Math.tan(th1 - th2);
        if (lut[i] > max) max = lut[i];
      }
      for (let i = 0; i < SAMPLES; i++) lut[i] /= max;
      lut[SAMPLES - 1] = 0;
    })();

    function renderMap(w, h, radius, bezel, res) {
      const sw = Math.max(2, Math.round(w * res)), sh = Math.max(2, Math.round(h * res));
      const canvas = document.createElement('canvas');
      canvas.width = sw; canvas.height = sh;
      const ctx = canvas.getContext('2d');
      const img = ctx.createImageData(sw, sh);
      const px = img.data;
      const hx = sw / 2, hy = sh / 2, rr = radius * res, bz = Math.max(1, bezel * res);

      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const i = (y * sw + x) * 4;
          const dx = x + 0.5 - hx, dy = y + 0.5 - hy;
          const qx = Math.abs(dx) - (hx - rr), qy = Math.abs(dy) - (hy - rr);
          const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
          const outside = Math.hypot(ox, oy);
          const dist = -(outside + Math.min(Math.max(qx, qy), 0) - rr);  // distance inside the edge

          let r = 128, g = 128;
          if (dist < bz) {
            const m = lut[Math.min(SAMPLES - 1, Math.max(0, Math.floor((dist / bz) * (SAMPLES - 1))))];
            // outward normal of the rounded rect at this pixel
            let nx, ny;
            if (outside > 0) { nx = Math.sign(dx) * ox / outside; ny = Math.sign(dy) * oy / outside; }
            else if (qx > qy) { nx = Math.sign(dx); ny = 0; }
            else { nx = 0; ny = Math.sign(dy); }
            // light bends toward the centre: sample from further inside
            r = 128 + (-nx) * m * 127;
            g = 128 + (-ny) * m * 127;
          }
          px[i] = r; px[i + 1] = g; px[i + 2] = 128; px[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return canvas.toDataURL('image/png');
    }

    let uid = 0;
    function build(el) {
      // layout size, not getBoundingClientRect(): the latter includes transforms (entrance animation)
      const w = el.offsetWidth, h = el.offsetHeight;
      if (w < 8 || h < 8) return;
      const prev = el._lens;
      if (prev && prev.w === w && prev.h === h) return;

      const minDim = Math.min(w, h);
      const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2);
      const bezel = clamp(+el.dataset.bezel || minDim * 0.42, 10, 46);
      const strength = +el.dataset.strength || clamp(bezel * 1.05, 10, 40);
      const res = Math.min(1, Math.sqrt(520000 / (w * h)));
      const url = renderMap(w, h, radius, bezel, res);

      const id = prev ? prev.id : 'lens-' + (++uid);
      let f = document.getElementById(id);
      if (!f) {
        f = document.createElementNS(NS, 'filter');
        f.setAttribute('id', id);
        f.setAttribute('color-interpolation-filters', 'sRGB');
        f.setAttribute('filterUnits', 'userSpaceOnUse');
        f.setAttribute('primitiveUnits', 'userSpaceOnUse');
        const fi = document.createElementNS(NS, 'feImage');
        fi.setAttribute('result', 'map');
        fi.setAttribute('preserveAspectRatio', 'none');
        const fd = document.createElementNS(NS, 'feDisplacementMap');
        fd.setAttribute('in', 'SourceGraphic');
        fd.setAttribute('in2', 'map');
        fd.setAttribute('xChannelSelector', 'R');
        fd.setAttribute('yChannelSelector', 'G');
        f.append(fi, fd);
        defs.appendChild(f);
      }
      f.setAttribute('x', '0'); f.setAttribute('y', '0');
      f.setAttribute('width', w); f.setAttribute('height', h);
      const fi = f.querySelector('feImage'), fd = f.querySelector('feDisplacementMap');
      fi.setAttribute('x', '0'); fi.setAttribute('y', '0');
      fi.setAttribute('width', w); fi.setAttribute('height', h);
      fi.setAttribute('href', url);
      fi.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
      fd.setAttribute('scale', (strength * 255 / 127).toFixed(2));

      el._lens = { id, w, h };
      el.style.setProperty('--lens', `url(#${id})`);
      el.classList.add('lens-on');
    }

    const pending = new Set();
    let tick = 0;
    const flush = () => { tick = 0; pending.forEach(build); pending.clear(); };
    const ro = new ResizeObserver(entries => {
      entries.forEach(en => pending.add(en.target));
      if (!tick) tick = requestAnimationFrame(flush);
    });
    lenses.forEach(el => { build(el); ro.observe(el); });
    document.fonts?.ready.then(() => lenses.forEach(build));
  })();
})();
