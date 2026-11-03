/* pH switch interaction + the 20-design table.
   One value drives the scene: e, the fraction of time the salt bridge
   stays formed. It rises as the surroundings turn acidic. Histidine
   tips near pH 6.3; the engineered bridge makes the change cooperative,
   so the midpoint of the visible engagement sits near 6.75. */

(function () {
  'use strict';

  var stage   = document.querySelector('.stage');
  var slider  = document.getElementById('phSlider');
  if (!stage || !slider) return;

  var css        = getComputedStyle(document.documentElement);
  var ACID       = css.getPropertyValue('--acid').trim()    || '#c22f4e';
  var NEUTRAL    = css.getPropertyValue('--neutral').trim() || '#1f6bb0';

  var binder   = document.getElementById('binder');
  var bridge   = document.getElementById('bridge');
  var hisPlus  = document.getElementById('hisPlus');
  var glow     = document.getElementById('glow');
  var phVal    = document.getElementById('phVal');
  var phDesc   = document.getElementById('phDesc');
  var gripFill = document.getElementById('gripFill');
  var gripPct  = document.getElementById('gripPct');
  var stateWord= document.getElementById('stateWord');
  var envWord  = document.getElementById('envWord');

  function engagement(ph) { return 1 / (1 + Math.pow(10, 2.0 * (ph - 6.75))); }

  function render(ph) {
    var e = engagement(ph);
    var tx = 56 * e;                     // binder slides in to dock (capped so residues don't overlap)
    binder.setAttribute('transform', 'translate(' + tx.toFixed(1) + ',0)');
    bridge.setAttribute('x1', (314 + tx).toFixed(1));
    bridge.setAttribute('opacity', e.toFixed(3));
    hisPlus.setAttribute('opacity', e.toFixed(3));
    glow.setAttribute('opacity', (0.85 * e).toFixed(3));

    var on  = e >= 0.5;
    var col = on ? ACID : NEUTRAL;
    stage.style.setProperty('--state', col);
    stage.style.setProperty('--state-ink', col);

    var env = ph <= 6.8 ? 'tumour' : (ph >= 7.2 ? 'blood' : 'crossover');
    phVal.textContent  = ph.toFixed(1);
    phDesc.textContent = env + ' pH · switch ' + (on ? 'on' : 'off');
    gripFill.style.width = (e * 100).toFixed(0) + '%';
    gripPct.textContent  = Math.round(e * 100) + '%';
    stateWord.textContent = e > 0.6 ? 'bound' : (e < 0.25 ? 'released' : 'letting go');
    envWord.textContent   = env;
  }

  slider.addEventListener('input', function () { render(this.value / 10); });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    slider.value = 65;
    render(6.5);
  } else {
    // one orchestrated load moment: blood -> tumour, then it rests
    render(7.4);
    var start = null, from = 74, to = 65, dur = 1100;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      var k = 1 - Math.pow(1 - t, 3);           // ease-out cubic
      var v = Math.round(from + (to - from) * k);
      slider.value = v;
      render(v / 10);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── the 20 designs ──────────────────────────────────────── */
  var rows = [
    // n, id, wiring, length, switch strength (0-1 or null), blood leak (or null)
    [1,  '23',    'fwd', 108, 0.96, 0.04],
    [2,  '32',    'ko',  108, null, null],
    [3,  'inv02', 'inv', 80,  0.87, 0.13],
    [4,  '27',    'fwd', 104, 0.98, 0.02],
    [5,  'inv01', 'inv', 88,  0.52, 0.00],
    [6,  '29',    'fwd', 56,  0.93, 0.07],
    [7,  '33',    'fwd', 92,  0.93, 0.02],
    [8,  '22',    'fwd', 56,  0.96, 0.04],
    [9,  '34',    'fwd', 108, 0.93, 0.07],
    [10, '36',    'fwd', 56,  0.95, 0.04],
    [11, '04',    'fwd', 104, 0.89, null],
    [12, '38',    'fwd', 70,  0.55, 0.38],
    [13, '08',    'fwd', 104, 0.57, null],
    [14, '39',    'fwd', 92,  0.48, 0.20],
    [15, '19',    'fwd', 61,  0.48, null],
    [16, '12',    'fwd', 70,  0.34, null],
    [17, '16',    'fwd', 92,  0.20, null],
    [18, '02',    'fwd', 91,  0.15, null],
    [19, '06',    'fwd', 108, 0.59, null],
    [20, '09',    'fwd', 108, 0.26, null]
  ];
  var wiring = { fwd: 'Forward', inv: 'Inverted', ko: 'Control' };

  function leakCell(v) {
    if (v === null) return '<span class="dash">&mdash;</span>';
    var word = v <= 0.1 ? 'clean' : (v <= 0.25 ? 'minor' : 'leaks');
    return '<span class="num">' + word + ' · ' + v.toFixed(2) + '</span>';
  }
  function strengthCell(v) {
    if (v === null) return '<span class="dash">&mdash;</span>';
    return '<span class="strength"><span class="meter"><i style="width:' +
           Math.round(v * 100) + '%"></i></span><span class="val">' + v.toFixed(2) + '</span></span>';
  }

  /* ── 3D gallery: designs bound to EGFR ───────────────────── */
  (function gallery() {
    var host = document.getElementById('viewer');
    if (!host || !window.$3Dmol) return;
    var tabsEl = document.getElementById('molTabs'), infoEl = document.getElementById('molInfo');
    var spinBtn = document.getElementById('molSpin'), surfBtn = document.getElementById('molSurf'), resetBtn = document.getElementById('molReset');
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var GREY = 0x8a93a6;
    var BINDER = dark ? 0x8fbdf0 : 0x2a6fae;   // designed binder
    var ACID   = dark ? 0xf2688a : 0xc22f4e;   // the binder's switch carboxylate (or His, inverted)
    var GOLD   = 0xd9a400;                       // EGFR's titratable partner (His433 / Asp460)
    var BG = dark ? 0x161b24 : 0xffffff;        // opaque, theme-matched (WebGL transparency is unreliable)
    var v = null, data = [], curIdx = 0, spinning = !reduce, surfOn = true;

    function ensure() {
      if (v) return v;
      host.innerHTML = '';
      v = $3Dmol.createViewer(host, { backgroundColor: BG, antialias: true });
      return v;
    }
    function draw(e) {
      var vv = ensure();
      vv.removeAllModels(); vv.removeAllSurfaces(); vv.removeAllLabels();
      vv.addModel(e._pdb, 'pdb');
      vv.setStyle({ chain: 'B' }, { cartoon: { color: GREY, opacity: 0.5 } });
      vv.setStyle({ chain: 'A' }, { cartoon: { color: BINDER } });
      (e.highlightA || []).forEach(function (rn) {
        vv.addStyle({ chain: 'A', resi: rn }, { stick: { color: ACID, radius: 0.32 } });
        vv.addStyle({ chain: 'A', resi: rn }, { sphere: { color: ACID, radius: 1.0 } });
      });
      if (e.partnerB != null) {
        vv.addStyle({ chain: 'B', resi: e.partnerB }, { stick: { color: GOLD, radius: 0.32 } });
        vv.addStyle({ chain: 'B', resi: e.partnerB }, { sphere: { color: GOLD, radius: 1.0 } });
      }
      if (surfOn) vv.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.4, color: GREY }, { chain: 'B' });
      vv.zoomTo({ chain: 'A' });
      vv.zoom(0.62);
      vv.render();
      vv.spin(spinning ? 'y' : false, spinning ? 0.3 : 0);
    }
    function markTabs() {
      Array.prototype.forEach.call(tabsEl.children, function (b, i) { b.setAttribute('aria-selected', String(i === curIdx)); });
    }
    function renderInfo(e) {
      if (!infoEl) return;
      var tag = e.tag ? " <span class='rowtag'>" + e.tag + "</span>" : '';
      var fwd = e.wiring === 'fwd';
      var pair = fwd
        ? "The binder holds out an acid (" + (e.highlightA || []).join(', ') + "); in the tumour's acid, EGFR's own His433 picks up a proton and grips it, about " + e.switchDist + " Å apart in this pose."
        : "The binder carries the switch histidine (" + (e.highlightA || []).join(', ') + "); it pairs EGFR's Asp460, about " + e.switchDist + " Å apart in this pose.";
      var lc = e.lowConf ? " In this co-fold the computer is less certain of the exact pose." : "";
      var far = (e.switchDist != null && e.switchDist > 6) ? " Here the two land further apart than a salt bridge, so this blind pose does not capture the designed contact." : "";
      infoEl.innerHTML =
        "<h3>" + e.label + tag + "</h3>" +
        "<dl>" +
        "<dt>rank</dt><dd>#" + e.rank + " of 20</dd>" +
        "<dt>length</dt><dd>" + e.length + " building blocks</dd>" +
        "<dt>switch strength</dt><dd>" + (e.strength != null ? e.strength.toFixed(2) : "n/a") + "</dd>" +
        "<dt>wiring</dt><dd>" + (fwd ? "forward" : "inverted") + "</dd>" +
        "</dl>" +
        "<p class='note'>Predicted pose, not a solved structure. " + pair + far + lc +
        " The red is the binder's switch residue; the gold is EGFR's titratable partner. Colours are this page's, not the real colour of any atom.</p>";
    }
    function load(i) {
      curIdx = i; var e = data[i];
      markTabs(); renderInfo(e);
      if (e._pdb) { draw(e); return; }
      fetch(e.file).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (txt) {
        e._pdb = txt; if (data[curIdx] === e) draw(e);
      }).catch(function () { host.innerHTML = '<p class="mol-fallback">Could not load this structure. The files are in the project repository.</p>'; });
    }
    function buildTabs() {
      tabsEl.innerHTML = '';
      data.forEach(function (e, i) {
        var b = document.createElement('button');
        b.className = 'mol-tab'; b.type = 'button'; b.setAttribute('role', 'tab');
        b.innerHTML = "<span class='rk'>#" + e.rank + "</span> " + e.label +
          " <span class='sp " + e.wiring + "'>" + (e.wiring === 'fwd' ? 'forward' : 'inverted') + "</span>";
        b.addEventListener('click', function () { load(i); });
        tabsEl.appendChild(b);
      });
    }
    if (spinBtn) spinBtn.addEventListener('click', function () {
      spinning = !spinning; spinBtn.setAttribute('aria-pressed', String(spinning));
      spinBtn.textContent = spinning ? 'pause spin' : 'spin';
      if (v) v.spin(spinning ? 'y' : false, spinning ? 0.3 : 0);
    });
    if (surfBtn) surfBtn.addEventListener('click', function () {
      surfOn = !surfOn; surfBtn.setAttribute('aria-pressed', String(surfOn));
      surfBtn.textContent = surfOn ? 'hide surface' : 'show surface';
      if (data[curIdx] && data[curIdx]._pdb) draw(data[curIdx]);
    });
    if (resetBtn) resetBtn.addEventListener('click', function () {
      if (v) { v.zoomTo({ chain: 'A' }); v.zoom(0.62); v.render(); }
    });

    fetch('complexes/manifest.json').then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (m) {
      data = m; if (!data.length) return;
      if (reduce && spinBtn) { spinBtn.setAttribute('aria-pressed', 'false'); spinBtn.textContent = 'spin'; }
      buildTabs(); load(0);
    }).catch(function () { host.innerHTML = '<p class="mol-fallback">The 3D views could not load. The structures are in the project repository.</p>'; });
  })();

  var tbody = document.getElementById('designRows');
  if (tbody) {
    var html = '';
    rows.forEach(function (r) {
      html += '<tr>' +
        '<td class="num">' + r[0] + '</td>' +
        '<td class="d-id">phsw ' + r[1] + '</td>' +
        '<td><span class="role ' + r[2] + '">' + wiring[r[2]] + '</span></td>' +
        '<td class="num">' + r[3] + ' aa</td>' +
        '<td>' + strengthCell(r[4]) + '</td>' +
        '<td>' + leakCell(r[5]) + '</td>' +
      '</tr>';
    });
    tbody.innerHTML = html;
  }
})();
