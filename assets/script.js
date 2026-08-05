/* ============================================================
   Poincaré disk, drawn properly.

   Points live in the open unit disk. A geodesic between two of
   them is the arc of the circle through both that meets the unit
   circle at right angles, so edges bow away from the boundary.
   Pointer movement applies a Mobius translation, which is an
   isometry of the hyperbolic plane: the picture slides without
   distorting any hyperbolic distance, even though it looks like
   it does in Euclidean terms.

   The tree is his research: six branches from the centre, one per
   domain, coloured to match the legend.
   ============================================================ */

(() => {
  'use strict';

  const canvas = document.getElementById('disk');
  const frame = canvas && canvas.parentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── complex helpers ──────────────────────────────────── */

  // Mobius translation by a: z -> (z + a) / (1 + conj(a) z)
  const translate = (z, a) => {
    const nx = z.x + a.x;
    const ny = z.y + a.y;
    const dx = 1 + a.x * z.x + a.y * z.y;
    const dy = a.x * z.y - a.y * z.x;
    const den = dx * dx + dy * dy || 1e-9;
    return { x: (nx * dx + ny * dy) / den, y: (ny * dx - nx * dy) / den };
  };

  const rotate = (z, t) => {
    const c = Math.cos(t), s = Math.sin(t);
    return { x: z.x * c - z.y * s, y: z.x * s + z.y * c };
  };

  /* ── the tree ─────────────────────────────────────────── */

  const DOMAINS = ['genomics', 'geometry', 'privacy', 'agents', 'vision', 'speech'];
  const CHILDREN = [6, 3, 2];
  // Euclidean radius of a point at hyperbolic distance d from the
  // centre is tanh(d / 2). Depth crowds toward the boundary.
  const RADII = [0, 0.56, 0.845, 0.962];

  const nodes = [];
  const edges = [];

  function build() {
    const root = { pos: { x: 0, y: 0 }, depth: 0, domain: null, i: 0 };
    nodes.push(root);

    let level = [{ node: root, a0: 0, a1: Math.PI * 2 }];

    for (let depth = 1; depth < RADII.length; depth++) {
      const next = [];
      level.forEach(parent => {
        const k = CHILDREN[depth - 1];
        const span = (parent.a1 - parent.a0) / k;
        for (let i = 0; i < k; i++) {
          const a0 = parent.a0 + i * span;
          const a1 = a0 + span;
          const jitter = (Math.random() - 0.5) * span * 0.34;
          const theta = a0 + span / 2 + jitter;
          const r = RADII[depth] * (1 - Math.random() * 0.035);
          const node = {
            pos: { x: r * Math.cos(theta), y: r * Math.sin(theta) },
            depth,
            // depth 1 fans out into the six domains, one per branch
            domain: depth === 1 ? DOMAINS[i % DOMAINS.length] : parent.node.domain,
            i: nodes.length
          };
          nodes.push(node);
          edges.push([parent.node, node]);
          next.push({ node, a0, a1 });
        }
      });
      level = next;
    }
  }

  /* ── palette, read from CSS so dark mode follows ──────── */

  let palette = {};
  function readPalette() {
    const s = getComputedStyle(document.documentElement);
    palette = { rule: s.getPropertyValue('--rule').trim(), ink: s.getPropertyValue('--ink').trim() };
    DOMAINS.forEach(d => { palette[d] = s.getPropertyValue('--' + d).trim(); });
  }

  /* ── geodesic drawing ─────────────────────────────────── */

  // Solve for the circle through p and q orthogonal to the unit
  // circle. Orthogonality means |c|^2 = r^2 + 1, which turns the
  // two "on the circle" conditions into a linear system in c.
  function geodesic(ctx, p, q, R, ox, oy) {
    const det = 4 * (p.x * q.y - p.y * q.x);

    // p, q and the origin are collinear: the geodesic is a diameter.
    if (Math.abs(det) < 1e-7) {
      ctx.moveTo(ox + p.x * R, oy + p.y * R);
      ctx.lineTo(ox + q.x * R, oy + q.y * R);
      return;
    }

    const pp = p.x * p.x + p.y * p.y + 1;
    const qq = q.x * q.x + q.y * q.y + 1;
    const cx = (pp * 2 * q.y - qq * 2 * p.y) / det;
    const cy = (2 * p.x * qq - 2 * q.x * pp) / det;
    const rad = Math.sqrt(Math.max(cx * cx + cy * cy - 1, 1e-9));

    let a1 = Math.atan2(p.y - cy, p.x - cx);
    let a2 = Math.atan2(q.y - cy, q.x - cx);
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    ctx.moveTo(ox + p.x * R, oy + p.y * R);
    ctx.arc(ox + cx * R, oy + cy * R, rad * R, a1, a1 + diff, diff < 0);
  }

  /* ── render loop ──────────────────────────────────────── */

  const ctx = canvas && canvas.getContext('2d');
  let size = 0, spin = 0, last = 0;
  const aim = { x: 0, y: 0 };
  const shift = { x: 0, y: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = frame.getBoundingClientRect();
    size = Math.max(box.width, 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const R = size / 2 - 8;
    const ox = size / 2;
    const oy = size / 2;

    ctx.clearRect(0, 0, size, size);

    // the boundary: infinity, one hyperbolic step further out forever
    ctx.beginPath();
    ctx.arc(ox, oy, R, 0, Math.PI * 2);
    ctx.strokeStyle = palette.rule;
    ctx.lineWidth = 1;
    ctx.stroke();

    const place = z => translate(rotate(z, spin), shift);
    const pos = nodes.map(n => place(n.pos));

    // edges, grouped by colour so we batch the paths
    const byDomain = {};
    edges.forEach(([a, b]) => {
      const key = b.domain || 'genomics';
      (byDomain[key] || (byDomain[key] = [])).push([pos[a.i], pos[b.i]]);
    });

    Object.keys(byDomain).forEach(key => {
      ctx.beginPath();
      byDomain[key].forEach(([p, q]) => geodesic(ctx, p, q, R, ox, oy));
      ctx.strokeStyle = palette[key];
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // nodes
    nodes.forEach((n, i) => {
      const p = pos[i];
      const rad = n.depth === 0 ? 4.5 : Math.max(3.6 - n.depth * 0.75, 1.5);
      ctx.beginPath();
      ctx.arc(ox + p.x * R, oy + p.y * R, rad, 0, Math.PI * 2);
      ctx.fillStyle = n.domain ? palette[n.domain] : palette.ink;
      ctx.fill();
    });
  }

  function frameLoop(now) {
    const dt = Math.min((now - last) || 16, 50);
    last = now;

    spin += dt * 0.000045;
    shift.x += (aim.x - shift.x) * 0.055;
    shift.y += (aim.y - shift.y) * 0.055;

    draw();
    requestAnimationFrame(frameLoop);
  }

  function initDisk() {
    if (!canvas || !ctx) return;
    build();
    readPalette();
    resize();

    let pending = false;
    window.addEventListener('resize', () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; resize(); draw(); });
    });

    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => { readPalette(); draw(); };
    scheme.addEventListener ? scheme.addEventListener('change', onScheme)
                            : scheme.addListener(onScheme);

    if (reduced.matches) { draw(); return; }

    // Pointer drives a Mobius translation, capped well inside the
    // disk so the transform never blows up near the boundary.
    if (window.matchMedia('(hover: hover)').matches) {
      window.addEventListener('pointermove', e => {
        const box = frame.getBoundingClientRect();
        const nx = (e.clientX - (box.left + box.width / 2)) / (box.width / 2);
        const ny = (e.clientY - (box.top + box.height / 2)) / (box.height / 2);
        const cap = 0.26;
        const len = Math.hypot(nx, ny) || 1;
        const mag = Math.min(len, 1) * cap;
        aim.x = -(nx / len) * mag;
        aim.y = -(ny / len) * mag;
      }, { passive: true });
    }

    requestAnimationFrame(frameLoop);
  }

  /* ── nav: mark the section you're reading ─────────────── */

  function initNav() {
    const links = Array.from(document.querySelectorAll('.topbar-nav a'));
    if (!links.length) return;

    const map = new Map();
    links.forEach(a => {
      const el = document.querySelector(a.getAttribute('href'));
      if (el) map.set(el, a);
    });

    const seen = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
      let top = null;
      map.forEach((_, el) => {
        if (!seen.has(el)) return;
        if (!top || el.offsetTop < top.offsetTop) top = el;
      });
      links.forEach(a => a.classList.remove('current'));
      if (top) map.get(top).classList.add('current');
    }, { rootMargin: '-20% 0px -70% 0px' });

    map.forEach((_, el) => observer.observe(el));
  }

  initDisk();
  initNav();
})();
