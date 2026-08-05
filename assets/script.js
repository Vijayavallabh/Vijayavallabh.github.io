/* ============================================================
   Poincaré disk, drawn properly.

   Points live in the open unit disk. A geodesic between two of
   them is the arc of the circle through both that meets the unit
   circle at right angles, so edges bow away from the boundary.
   Pointer movement applies a Mobius translation, which is an
   isometry of the hyperbolic plane: the picture slides without
   changing any hyperbolic distance, even though it looks like it
   does in Euclidean terms.

   The tree is his research: six branches from the centre, one per
   domain, coloured to match the legend.

   Geometry is precomputed once and held in flat arrays, so the
   frame loop allocates nothing. The loop only runs while the
   figure is on screen and the tab is visible.
   ============================================================ */

(() => {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     Disk
     ───────────────────────────────────────────────────────── */

  const canvas = document.getElementById('disk');
  const frame  = canvas && canvas.parentElement;
  const ctx    = canvas && canvas.getContext('2d');

  const DOMAINS  = ['genomics', 'geometry', 'privacy', 'agents', 'vision', 'speech'];
  const CHILDREN = [6, 3, 2];
  // Euclidean radius of a point at hyperbolic distance d from the
  // centre is tanh(d / 2). Depth crowds toward the boundary.
  const RADII = [0, 0.56, 0.845, 0.962];

  // base positions, transformed positions, and per-domain edge lists
  let bx, by, nodeDepth, nodeDomain, px, py;
  const groups = DOMAINS.map(key => ({ key, a: [], b: [] }));

  function build() {
    const _bx = [0], _by = [0], _depth = [0], _domain = [null];
    let level = [{ i: 0, a0: 0, a1: Math.PI * 2 }];

    for (let d = 1; d < RADII.length; d++) {
      const next = [];
      for (const parent of level) {
        const k = CHILDREN[d - 1];
        const span = (parent.a1 - parent.a0) / k;
        for (let i = 0; i < k; i++) {
          const a0 = parent.a0 + i * span;
          const a1 = a0 + span;
          const theta = a0 + span / 2 + (Math.random() - 0.5) * span * 0.34;
          const r = RADII[d] * (1 - Math.random() * 0.035);
          const idx = _bx.length;

          _bx.push(r * Math.cos(theta));
          _by.push(r * Math.sin(theta));
          _depth.push(d);
          // depth 1 fans out into the six domains, one per branch
          _domain.push(d === 1 ? DOMAINS[i % DOMAINS.length] : _domain[parent.i]);

          const g = groups[DOMAINS.indexOf(_domain[idx])];
          g.a.push(parent.i);
          g.b.push(idx);

          next.push({ i: idx, a0, a1 });
        }
      }
      level = next;
    }

    bx = Float64Array.from(_bx);
    by = Float64Array.from(_by);
    nodeDepth = _depth;
    nodeDomain = _domain;
    px = new Float64Array(bx.length);
    py = new Float64Array(bx.length);
  }

  /* palette is read from CSS so dark mode follows automatically */
  let palette = {};
  function readPalette() {
    const s = getComputedStyle(document.documentElement);
    palette = {
      rule: s.getPropertyValue('--rule').trim(),
      ink:  s.getPropertyValue('--ink').trim()
    };
    for (const d of DOMAINS) palette[d] = s.getPropertyValue('--' + d).trim();
  }

  /* Rotate every node, then translate by the pointer offset.
     Both are isometries, so the hyperbolic picture is unchanged. */
  function place(spin, ax, ay) {
    const c = Math.cos(spin), s = Math.sin(spin);
    for (let i = 0; i < bx.length; i++) {
      const rx = bx[i] * c - by[i] * s;
      const ry = bx[i] * s + by[i] * c;
      const nx = rx + ax, ny = ry + ay;
      const dx = 1 + ax * rx + ay * ry;
      const dy = ax * ry - ay * rx;
      const den = dx * dx + dy * dy || 1e-9;
      px[i] = (nx * dx + ny * dy) / den;
      py[i] = (ny * dx - nx * dy) / den;
    }
  }

  /* Circle through p and q orthogonal to the unit circle.
     Orthogonality means |c|^2 = r^2 + 1, which turns the two
     "on the circle" conditions into a linear system in c. */
  function geodesic(i, j, R, ox, oy) {
    const ax = px[i], ay = py[i], bxx = px[j], byy = py[j];
    const det = 4 * (ax * byy - ay * bxx);

    // p, q and the origin are collinear: the geodesic is a diameter
    if (Math.abs(det) < 1e-7) {
      ctx.moveTo(ox + ax * R, oy + ay * R);
      ctx.lineTo(ox + bxx * R, oy + byy * R);
      return;
    }

    const pp = ax * ax + ay * ay + 1;
    const qq = bxx * bxx + byy * byy + 1;
    const cx = (pp * 2 * byy - qq * 2 * ay) / det;
    const cy = (2 * ax * qq - 2 * bxx * pp) / det;
    const rad = Math.sqrt(Math.max(cx * cx + cy * cy - 1, 1e-9));

    const a1 = Math.atan2(ay - cy, ax - cx);
    const a2 = Math.atan2(byy - cy, bxx - cx);
    let diff = a2 - a1;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    ctx.moveTo(ox + ax * R, oy + ay * R);
    ctx.arc(ox + cx * R, oy + cy * R, rad * R, a1, a1 + diff, diff < 0);
  }

  let size = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = Math.max(frame.getBoundingClientRect().width, 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const R = size / 2 - 8;
    const ox = size / 2;
    const oy = size / 2;

    ctx.clearRect(0, 0, size, size);

    // the boundary: infinitely far away in hyperbolic terms
    ctx.beginPath();
    ctx.arc(ox, oy, R, 0, Math.PI * 2);
    ctx.strokeStyle = palette.rule;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 1.1;
    for (const g of groups) {
      if (!g.a.length) continue;
      ctx.beginPath();
      for (let i = 0; i < g.a.length; i++) geodesic(g.a[i], g.b[i], R, ox, oy);
      ctx.strokeStyle = palette[g.key];
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < px.length; i++) {
      const d = nodeDepth[i];
      const rad = d === 0 ? 4.5 : Math.max(3.6 - d * 0.75, 1.5);
      ctx.beginPath();
      ctx.arc(ox + px[i] * R, oy + py[i] * R, rad, 0, Math.PI * 2);
      ctx.fillStyle = nodeDomain[i] ? palette[nodeDomain[i]] : palette.ink;
      ctx.fill();
    }
  }

  /* ── the loop, gated on visibility so it stops when unseen ── */

  let spin = 0, last = 0, rafId = 0;
  let aimX = 0, aimY = 0, shiftX = 0, shiftY = 0;
  let ptrX = null, ptrY = null;
  let onScreen = true;

  function step(now) {
    const dt = Math.min(now - last || 16, 50);
    last = now;
    spin += dt * 0.000045;

    if (ptrX !== null) {
      // one layout read per frame, not one per pointer event
      const box = frame.getBoundingClientRect();
      const nx = (ptrX - (box.left + box.width / 2)) / (box.width / 2);
      const ny = (ptrY - (box.top + box.height / 2)) / (box.height / 2);
      const len = Math.hypot(nx, ny) || 1;
      const mag = Math.min(len, 1) * 0.26;   // stay well inside the disk
      aimX = -(nx / len) * mag;
      aimY = -(ny / len) * mag;
    }

    shiftX += (aimX - shiftX) * 0.055;
    shiftY += (aimY - shiftY) * 0.055;

    place(spin, shiftX, shiftY);
    draw();
    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (rafId) return;
    last = performance.now();
    rafId = requestAnimationFrame(step);
  }
  function stop() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function renderStill() {
    place(spin, shiftX, shiftY);
    draw();
  }

  function initDisk() {
    if (!canvas || !ctx) return;
    build();
    readPalette();
    resize();
    renderStill();

    let queued = false;
    window.addEventListener('resize', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; resize(); renderStill(); });
    });

    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => { readPalette(); renderStill(); };
    if (scheme.addEventListener) scheme.addEventListener('change', onScheme);
    else scheme.addListener(onScheme);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (window.matchMedia('(hover: hover)').matches) {
      window.addEventListener('pointermove', e => {
        ptrX = e.clientX;
        ptrY = e.clientY;
      }, { passive: true });
    }

    // only animate what someone can actually see
    new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting;
      if (onScreen && !document.hidden) start(); else stop();
    }, { rootMargin: '100px' }).observe(frame);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden || !onScreen) stop(); else start();
    });
  }

  /* ─────────────────────────────────────────────────────────
     Nav: mark the section being read
     ───────────────────────────────────────────────────────── */

  function initNav() {
    const links = Array.from(document.querySelectorAll('.topbar-nav a'));
    if (!links.length) return;

    // document order is fixed, so rank sections once instead of
    // reading offsetTop inside the observer callback
    const targets = links
      .map((link, order) => {
        const el = document.querySelector(link.getAttribute('href'));
        return el && { link, el, order };
      })
      .filter(Boolean);

    const visible = new Set();

    const observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        const t = targets.find(t => t.el === e.target);
        if (!t) continue;
        if (e.isIntersecting) visible.add(t); else visible.delete(t);
      }

      let top = null;
      for (const t of visible) if (!top || t.order < top.order) top = t;

      for (const t of targets) {
        if (t === top) t.link.setAttribute('aria-current', 'true');
        else t.link.removeAttribute('aria-current');
      }
    }, { rootMargin: '-20% 0px -70% 0px' });

    for (const t of targets) observer.observe(t.el);
  }

  initDisk();
  initNav();
})();
