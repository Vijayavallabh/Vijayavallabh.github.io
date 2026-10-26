/* GLP-1R write-up — theme, the bind/activate schematic, the designs table, and a 3D view. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme ---------- */
  (function theme() {
    var btn = $("#themeBtn");
    var saved = null;
    try { saved = localStorage.getItem("glp1r-theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (!cur) cur = prefersDark ? "dark" : "light";
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("glp1r-theme", next); } catch (e) {}
    });
  })();

  /* ---------- the bind vs. activate schematic ---------- */
  (function scene() {
    var bBind = $("#stBind"), bAct = $("#stAct");
    var pep = $("#pep"), tm6 = $("#tm6"), field = $("#onField"), dot = $("#switchDot");
    var stateWord = $("#stateWord"), envWord = $("#envWord");
    if (!bBind || !bAct) return;
    var hasGSAP = typeof window.gsap !== "undefined";

    function set(active) {
      bBind.setAttribute("aria-pressed", String(!active));
      bAct.setAttribute("aria-pressed", String(active));
      stateWord.textContent = active ? "inserted" : "bound";
      envWord.textContent = active ? "receptor on?" : "receptor off";
      var pepT = active ? { x: 86, y: 56, rotation: 13 } : { x: 0, y: 0, rotation: 0 };
      var tm6R = active ? 20 : 0;
      var fieldO = active ? 1 : 0;
      var dotFill = active ? "#34d399" : "#13203c";
      if (hasGSAP && !reduce) {
        window.gsap.to(pep, { duration: 0.75, ease: "power2.inOut", x: pepT.x, y: pepT.y, rotation: pepT.rotation, transformOrigin: "88% 50%" });
        window.gsap.to(tm6, { duration: 0.65, ease: "power2.inOut", rotation: tm6R, transformOrigin: "50% 100%" });
        window.gsap.to(field, { duration: 0.6, opacity: fieldO });
        window.gsap.to(dot, { duration: 0.5, fill: dotFill });
      } else {
        pep.setAttribute("transform", "translate(" + pepT.x + "," + pepT.y + ") rotate(" + pepT.rotation + ")");
        tm6.style.transform = "rotate(" + tm6R + "deg)";
        field.setAttribute("opacity", String(fieldO));
        dot.setAttribute("fill", dotFill);
      }
    }
    bBind.addEventListener("click", function () { set(false); });
    bAct.addEventListener("click", function () { set(true); });
    set(false);
  })();

  /* ---------- the 20 designs ---------- */
  (function table() {
    var tb = $("#designRows"); if (!tb) return;
    var D = [
      [1, "glp1r_25_ago", "BoltzGen", 30, "both folds", "tested"],
      [2, "glp1r_28_ago", "BoltzGen", 30, "both folds", "tested"],
      [3, "glp1r_29_ago", "BoltzGen", 23, "both folds", "tested"],
      [4, "glp1r_30_mini", "RFD4-Proteina", 80, "both folds", "tested"],
      [5, "glp1r_31_mini", "RFD4-Proteina", 79, "both folds", "tested"],
      [6, "glp1r_32_mini", "RFD4-Proteina", 86, "both folds", "tested"],
      [7, "glp1r_23_ago", "PepGLAD", 15, "both folds", "tested"],
      [8, "glp1r_10_ago", "DiffPepBuilder", 23, "both folds", "tested"],
      [9, "glp1r_33_ago", "DiffPepBuilder", 14, "both folds", "tested"],
      [10, "glp1r_27_ago", "PepGLAD", 13, "both folds", "tested"],
      [11, "glp1r_34_ago", "BoltzGen", 26, "both folds", "reserve"],
      [12, "glp1r_35_mini", "RFD4-Proteina", 81, "both folds", "reserve"],
      [13, "glp1r_36_ago", "DiffPepBuilder", 22, "one fold", "reserve"],
      [14, "glp1r_50_ago", "BoltzGen", 21, "both folds", "reserve"],
      [15, "glp1r_26_ago", "PepGLAD", 17, "both folds", "reserve"],
      [16, "glp1r_51_ago", "BoltzGen", 22, "both folds", "reserve"],
      [17, "glp1r_21_ago", "RFd3", 37, "one fold", "reserve"],
      [18, "glp1r_38_bind", "RFdiffusion (ECD)", 77, "ECD site", "reserve"],
      [19, "glp1r_19_bind", "RFdiffusion (ECD)", 74, "ECD site", "reserve"],
      [20, "glp1r_39_pm", "PepMLM", 20, "one fold", "reserve"]
    ];
    var rowClass = { "both folds": "pos", "one fold": "flat", "ECD site": "flat" };
    var html = "";
    for (var i = 0; i < D.length; i++) {
      var d = D[i];
      html += "<tr" + (d[5] === "tested" ? ' class="is-top"' : "") + ">" +
        "<td>" + d[0] + "</td>" +
        "<td><span class='data'>" + d[1] + "</span></td>" +
        "<td>" + d[2] + "</td>" +
        "<td>" + d[3] + "&#8202;aa</td>" +
        "<td><span class='reach " + (rowClass[d[4]] || "flat") + "'>" + d[4] + "</span></td>" +
        "<td>" + (d[5] === "tested" ? "<b>top&#8209;10</b>" : "reserve") + "</td>" +
        "</tr>";
    }
    tb.innerHTML = html;
  })();

  /* ---------- 3D: the top design on GLP-1R ---------- */
  (function viewer() {
    var host = $("#viewer"); if (!host || typeof window.$3Dmol === "undefined") return;
    fetch("glp1r_25_complex.cif").then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (data) {
      host.innerHTML = "";
      var v = window.$3Dmol.createViewer(host, { backgroundColor: "0x00000000" });
      v.addModel(data, "cif");
      // receptor = the long chain (grey, translucent); design = the short chain (teal)
      var atoms = v.getModel().selectedAtoms({});
      var counts = {};
      for (var i = 0; i < atoms.length; i++) { counts[atoms[i].chain] = (counts[atoms[i].chain] || 0) + 1; }
      var chains = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
      var receptor = chains[0], design = chains[1] || chains[0];
      v.setStyle({ chain: receptor }, { cartoon: { color: 0x8a93a6, opacity: 0.6 } });
      v.setStyle({ chain: design }, { cartoon: { color: 0x2a9d8f }, stick: { color: 0x2a9d8f, radius: 0.18 } });
      v.zoomTo({ chain: design });
      v.zoom(0.75);
      v.render();
      if (!reduce) v.spin("y", 0.4);
    }).catch(function () {
      host.innerHTML = '<p class="mol-fallback">The 3D view could not load. The structure file is in the project repository.</p>';
    });
  })();
})();
