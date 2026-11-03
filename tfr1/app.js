/* TfR1 write-up — theme, the pH hold/release schematic, the designs table, and a 3D view. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme ---------- */
  (function theme() {
    var btn = $("#themeBtn");
    var saved = null;
    try { saved = localStorage.getItem("tfr1-theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (!cur) cur = prefersDark ? "dark" : "light";
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("tfr1-theme", next); } catch (e) {}
    });
  })();

  /* ---------- the hold-at-7.4 / let-go-at-6.0 schematic ---------- */
  (function scene() {
    var bHigh = $("#phHigh"), bLow = $("#phLow");
    var binder = $("#binder"), field = $("#releaseField"), band = $("#envBand");
    var his = [$("#his1"), $("#his2"), $("#his3")];
    var stateWord = $("#stateWord"), envWord = $("#envWord");
    if (!bHigh || !bLow) return;
    var hasGSAP = typeof window.gsap !== "undefined";
    var neutral = "#64707f", charged = "#DB2777"; // --flat vs --recoil

    function set(acid) {
      bHigh.setAttribute("aria-pressed", String(!acid));
      bLow.setAttribute("aria-pressed", String(acid));
      stateWord.textContent = acid ? "released" : "bound";
      envWord.textContent = acid ? "lets go" : "holds on";
      if (band) band.setAttribute("fill", acid ? "url(#endoGrad)" : "url(#serumGrad)");
      var bT = acid ? { x: -118, y: -70, rotation: -15 } : { x: 0, y: 0, rotation: 0 };
      var fieldO = acid ? 1 : 0;
      var hisFill = acid ? charged : neutral;
      if (hasGSAP && !reduce) {
        window.gsap.to(binder, { duration: 0.8, ease: "power3.inOut", x: bT.x, y: bT.y, rotation: bT.rotation, transformOrigin: "50% 50%" });
        window.gsap.to(field, { duration: 0.6, opacity: fieldO });
        his.forEach(function (h, i) { if (h) window.gsap.to(h, { duration: 0.45, delay: i * 0.06, fill: hisFill }); });
      } else {
        binder.setAttribute("transform", "translate(" + bT.x + "," + bT.y + ") rotate(" + bT.rotation + ")");
        field.setAttribute("opacity", String(fieldO));
        his.forEach(function (h) { if (h) h.setAttribute("fill", hisFill); });
      }
    }
    bHigh.addEventListener("click", function () { set(false); });
    bLow.addEventListener("click", function () { set(true); });
    set(false);
  })();

  /* ---------- the 20 designs ---------- */
  (function table() {
    var tb = $("#designRows"); if (!tb) return;
    // [rank, name, source, length, reach ("human+mouse"|"human"), set, tag]
    var D = [
      [1, "genie_w2g3_53", "Genie3", 68, "human+mouse", "top", "flagship"],
      [2, "w3g0_174", "Genie3", 72, "human+mouse", "top", ""],
      [3, "resc_v25g3_80", "Genie3", 70, "human+mouse", "top", ""],
      [4, "genie_w2g6_144", "Genie3", 70, "human", "top", ""],
      [5, "resc_w3g5_70", "Genie3", 99, "human", "top", ""],
      [6, "resc_v25g3_49", "Genie3", 73, "human+mouse", "top", ""],
      [7, "w3g3_92", "Genie3", 90, "human", "top", ""],
      [8, "resc_w4g7_217", "Genie3", 70, "human", "top", ""],
      [9, "resc_genie_w2g5_111", "Genie3", 72, "human", "top", ""],
      [10, "resc_w4g1_195", "Genie3", 89, "human", "top", ""],
      [11, "resc_w4g1_286", "Genie3", 70, "human", "reserve", ""],
      [12, "resc_w4g0_194", "Genie3", 71, "human", "reserve", ""],
      [13, "resc_v25g6_84", "Genie3", 92, "human", "reserve", ""],
      [14, "w3g5_231", "Genie3", 78, "human", "reserve", ""],
      [15, "resc_v25g3_130", "Genie3", 98, "human+mouse", "reserve", "audit pick"],
      [16, "w3g7_240", "Genie3", 69, "human", "reserve", ""],
      [17, "ms_g3_65_xr", "Genie3 + multi-state", 65, "human+mouse", "reserve", ""],
      [18, "resc_v25g5_13", "Genie3", 106, "human", "reserve", "audit pick"],
      [19, "ms_g3_22v_xr", "Genie3 + multi-state", 73, "human+mouse", "reserve", ""],
      [20, "resc_v25g5_109", "Genie3", 85, "human+mouse", "reserve", ""]
    ];
    var html = "";
    for (var i = 0; i < D.length; i++) {
      var d = D[i], xr = d[4] === "human+mouse";
      var tag = d[6] ? " <span class='rowtag'>" + d[6] + "</span>" : "";
      html += "<tr" + (d[5] === "top" ? ' class="is-top"' : "") + ">" +
        "<td>" + d[0] + "</td>" +
        "<td><span class='data'>" + d[1] + "</span>" + tag + "</td>" +
        "<td>" + d[2] + "</td>" +
        "<td>" + d[3] + "&#8202;aa</td>" +
        "<td><span class='reach " + (xr ? "pos" : "flat") + "'>" + (xr ? "human + mouse" : "human") + "</span></td>" +
        "<td>" + (d[5] === "top" ? "<b>top&#8209;10</b>" : "reserve") + "</td>" +
        "</tr>";
    }
    tb.innerHTML = html;
  })();

  /* ---------- 3D: a gallery of designs bound to TfR1 ---------- */
  (function gallery() {
    var host = $("#viewer"); if (!host || typeof window.$3Dmol === "undefined") return;
    var tabsEl = $("#molTabs"), infoEl = $("#molInfo");
    var spinBtn = $("#molSpin"), surfBtn = $("#molSurf"), resetBtn = $("#molReset");
    var GREY = 0x8a93a6, BLUE = 0x1d4ed8, PINK = 0xdb2777;
    var v = null, data = [], curIdx = 0, spinning = !reduce, surfOn = true;

    function ensure() {
      if (v) return v;
      host.innerHTML = "";
      v = window.$3Dmol.createViewer(host, { backgroundColor: "0x00000000", antialias: true });
      return v;
    }
    function draw(entry) {
      var vv = ensure();
      vv.removeAllModels(); vv.removeAllSurfaces(); vv.removeAllLabels();
      vv.addModel(entry._pdb, "pdb");
      vv.setStyle({ chain: "B" }, { cartoon: { color: GREY, opacity: 0.9 } });
      vv.setStyle({ chain: "A" }, { cartoon: { color: BLUE } });
      (entry.switchHis || []).forEach(function (rn) {
        vv.addStyle({ chain: "A", resi: rn }, { stick: { color: PINK, radius: 0.3 } });
        vv.addStyle({ chain: "A", resi: rn }, { sphere: { color: PINK, radius: 1.05 } });
      });
      if (surfOn) {
        vv.addSurface(window.$3Dmol.SurfaceType.VDW, { opacity: 0.4, color: GREY }, { chain: "B" });
      }
      vv.zoomTo({ chain: "A" });
      vv.zoom(0.68);
      vv.render();
      vv.spin(spinning ? "y" : false, spinning ? 0.3 : 0);
    }
    function markTabs() {
      Array.prototype.forEach.call(tabsEl.children, function (b, i) {
        b.setAttribute("aria-selected", String(i === curIdx));
      });
    }
    function renderInfo(e) {
      if (!infoEl) return;
      var hd = (e.hisDist != null) ? (e.hisDist + " Å from the receptor in this pose") : "built into the binder";
      var tag = e.tag ? " <span class='rowtag'>" + e.tag + "</span>" : "";
      infoEl.innerHTML =
        "<h3>" + e.label + tag + "</h3>" +
        "<dl>" +
        "<dt>rank</dt><dd>#" + e.rank + " of 20</dd>" +
        "<dt>length</dt><dd>" + e.length + " building blocks</dd>" +
        "<dt>shown on</dt><dd>" + e.species + " TfR1</dd>" +
        "<dt>binds</dt><dd>" + e.binds + "</dd>" +
        "<dt>switch His</dt><dd>" + (e.switchHis || []).join(", ") + "</dd>" +
        "</dl>" +
        "<p class='note'>Predicted pose, not a solved structure. The switch histidines sit " + hd + ". " +
        (e.method === "pocket"
          ? "Shown on the human receptor, from the docking check that holds the protein on the apical patch."
          : "Shown as a co-fold on the mouse receptor, the channel where the placement check can be trusted.") +
        "</p>";
    }
    function load(i) {
      curIdx = i; var entry = data[i];
      markTabs(); renderInfo(entry);
      if (entry._pdb) { draw(entry); return; }
      fetch(entry.file).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (txt) {
        entry._pdb = txt; if (data[curIdx] === entry) draw(entry);
      }).catch(function () {
        host.innerHTML = '<p class="mol-fallback">Could not load this structure. The files are in the project repository.</p>';
      });
    }
    function buildTabs() {
      tabsEl.innerHTML = "";
      data.forEach(function (e, i) {
        var b = document.createElement("button");
        b.className = "mol-tab"; b.type = "button"; b.setAttribute("role", "tab");
        b.innerHTML = "<span class='rk'>#" + e.rank + "</span> " + e.label +
          " <span class='sp " + e.species + "'>" + e.species + "</span>";
        b.addEventListener("click", function () { load(i); });
        tabsEl.appendChild(b);
      });
    }
    if (spinBtn) spinBtn.addEventListener("click", function () {
      spinning = !spinning; spinBtn.setAttribute("aria-pressed", String(spinning));
      spinBtn.textContent = spinning ? "pause spin" : "spin";
      if (v) v.spin(spinning ? "y" : false, spinning ? 0.3 : 0);
    });
    if (surfBtn) surfBtn.addEventListener("click", function () {
      surfOn = !surfOn; surfBtn.setAttribute("aria-pressed", String(surfOn));
      surfBtn.textContent = surfOn ? "hide surface" : "show surface";
      if (data[curIdx] && data[curIdx]._pdb) draw(data[curIdx]);
    });
    if (resetBtn) resetBtn.addEventListener("click", function () {
      if (v) { v.zoomTo({ chain: "A" }); v.zoom(0.68); v.render(); }
    });

    fetch("complexes/manifest.json").then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (m) {
      data = m; if (!data.length) return;
      if (reduce && spinBtn) { spinBtn.setAttribute("aria-pressed", "false"); spinBtn.textContent = "spin"; }
      buildTabs(); load(0);
    }).catch(function () {
      host.innerHTML = '<p class="mol-fallback">The 3D views could not load. The structures are in the project repository.</p>';
    });
  })();
})();
