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

  /* ---------- 3D: the flagship design on the TfR1 apical domain ---------- */
  (function viewer() {
    var host = $("#viewer"); if (!host || typeof window.$3Dmol === "undefined") return;
    fetch("tfr1_top_complex.pdb").then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (data) {
      host.innerHTML = "";
      var v = window.$3Dmol.createViewer(host, { backgroundColor: "0x00000000" });
      v.addModel(data, "pdb");
      // target apical = the long chain (grey, translucent); binder = the short chain (electrostatic blue)
      var atoms = v.getModel().selectedAtoms({});
      var counts = {};
      for (var i = 0; i < atoms.length; i++) { counts[atoms[i].chain] = (counts[atoms[i].chain] || 0) + 1; }
      var chains = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
      var target = chains[0], binder = chains[1] || chains[0];
      v.setStyle({ chain: target }, { cartoon: { color: 0x8a93a6, opacity: 0.58 } });
      v.setStyle({ chain: binder }, { cartoon: { color: 0x1d4ed8 }, stick: { color: 0x1d4ed8, radius: 0.17 } });
      // the two switch histidines, drawn as spheres
      v.setStyle({ chain: binder, resn: "HIS" }, { cartoon: { color: 0x1d4ed8 }, stick: { color: 0xdb2777, radius: 0.22 }, sphere: { color: 0xdb2777, radius: 0.9 } });
      v.zoomTo({ chain: binder });
      v.zoom(0.72);
      v.render();
      if (!reduce) v.spin("y", 0.4);
    }).catch(function () {
      host.innerHTML = '<p class="mol-fallback">The 3D view could not load. The structure file is in the project repository.</p>';
    });
  })();
})();
