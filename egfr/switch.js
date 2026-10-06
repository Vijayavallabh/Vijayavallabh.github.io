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

  /* ── 3D structure of design 23 ──────────────────────────── */
  var viewerEl = document.getElementById('viewer');
  if (viewerEl && window.$3Dmol) {
    try {
      var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var binderCol = dark ? '#8fbdf0' : '#2a6fae';
      var acidCol   = dark ? '#f2688a' : '#c22f4e';
      // opaque, theme-matched background: WebGL transparency is unreliable across browsers
      var v = $3Dmol.createViewer(viewerEl, { backgroundColor: dark ? 0x0e1219 : 0xf4f5f9 });
      fetch('phsw23.pdb').then(function (r) { return r.text(); }).then(function (pdb) {
        var fb = viewerEl.querySelector('.mol-fallback');
        if (fb) fb.remove();
        v.addModel(pdb, 'pdb');
        v.setStyle({}, { cartoon: { color: binderCol, opacity: 0.96, thickness: 0.5 } });
        v.setStyle({ resi: 66 }, { cartoon: { color: acidCol } });
        v.addStyle({ resi: 66 }, { stick: { color: acidCol, radius: 0.3 } });
        v.zoomTo();
        v.zoom(1.3);
        v.render();
        if (!reduce) v.spin('y', 0.35);
      }).catch(function () {});
    } catch (e) { /* leave the fallback message in place */ }
  }

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
