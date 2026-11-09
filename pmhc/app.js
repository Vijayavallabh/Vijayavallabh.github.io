/* KRAS G12D / HLA-A*11:01 write-up: theme, the cancer-flag vs healthy-flag schematic,
   the designs table, and a 3D view of each design on the four-chain peptide-HLA complex. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme ---------- */
  (function theme() {
    var btn = $("#themeBtn");
    var saved = null;
    try { saved = localStorage.getItem("pmhc-theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (!cur) cur = prefersDark ? "dark" : "light";
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("pmhc-theme", next); } catch (e) {}
    });
  })();

  /* ---------- the cancer-flag vs healthy-flag schematic ---------- */
  (function scene() {
    var bMut = $("#flagMut"), bWt = $("#flagWt");
    var pos6 = $("#pos6"), bridge = $("#bridgeLine"), charge = $("#pos6charge");
    var flagWord = $("#flagWord"), diffWord = $("#diffWord");
    if (!bMut || !bWt) return;
    var hasGSAP = typeof window.gsap !== "undefined";
    var RED = "#DC2626", GREY = "#8792a6";

    function set(mut) {
      bMut.setAttribute("aria-pressed", String(mut));
      bWt.setAttribute("aria-pressed", String(!mut));
      if (flagWord) flagWord.textContent = mut ? "cancer flag" : "healthy flag";
      if (diffWord) diffWord.textContent = mut ? "position 6 is a D (aspartate)" : "position 6 is a G (glycine)";
      var r = mut ? 11 : 5;
      var fill = mut ? RED : GREY;
      if (hasGSAP && !reduce) {
        window.gsap.to(pos6, { duration: 0.5, ease: "power3.out", attr: { r: r, fill: fill } });
        window.gsap.to(bridge, { duration: 0.5, opacity: mut ? 1 : 0 });
        if (charge) window.gsap.to(charge, { duration: 0.4, opacity: mut ? 1 : 0 });
      } else {
        pos6.setAttribute("r", String(r)); pos6.setAttribute("fill", fill);
        bridge.setAttribute("opacity", mut ? "1" : "0");
        if (charge) charge.setAttribute("opacity", mut ? "1" : "0");
      }
    }
    bMut.addEventListener("click", function () { set(true); });
    bWt.addEventListener("click", function () { set(false); });
    set(true);
  })();

  /* ---------- the 20 designs ---------- */
  (function table() {
    var tb = $("#designRows"); if (!tb) return;
    // [rank, name, source, length, class, evidence, set, tag]
    var D = [
      [1, "b3_gpu7_113", "BoltzGen", 62, "single chain", "robust", "top", "flagship"],
      [2, "genie3_g6_28_m0", "Genie3", 63, "single chain", "robust", "top", ""],
      [3, "genie3_g2_103_m1", "Genie3", 80, "single chain", "leaning", "top", ""],
      [4, "nb3_gpu4_132", "BoltzGen", 131, "nanobody", "leaning", "top", ""],
      [5, "nb3_gpu6_132", "BoltzGen", 124, "nanobody", "ruler", "top", ""],
      [6, "genie3_8_m0", "Genie3", 105, "single chain", "ruler", "top", ""],
      [7, "b3_gpu7_181", "BoltzGen", 77, "single chain", "ruler", "top", ""],
      [8, "genie3_g4_121_m1", "Genie3", 104, "single chain", "ruler", "top", ""],
      [9, "nb3_gpu3_307", "BoltzGen", 120, "nanobody", "ruler", "top", ""],
      [10, "b3_gpu4_211", "BoltzGen", 65, "single chain", "ruler", "top", ""],
      [11, "b3_gpu5_174", "BoltzGen", 74, "single chain", "ruler", "reserve", ""],
      [12, "genie3_g6_148_m1", "Genie3", 57, "single chain", "ruler", "reserve", ""],
      [13, "genie3_g5_72_m0", "Genie3", 99, "single chain", "ruler", "reserve", ""],
      [14, "nb3_gpu7_192", "BoltzGen", 118, "nanobody", "ruler", "reserve", ""],
      [15, "genie3_g6_142_m1", "Genie3", 61, "single chain", "ruler", "reserve", ""],
      [16, "b3_gpu3_164", "BoltzGen", 66, "single chain", "ruler", "reserve", ""],
      [17, "nb3_gpu2_108", "BoltzGen", 113, "nanobody", "ruler", "reserve", ""],
      [18, "nb3_gpu7_029", "BoltzGen", 124, "nanobody", "ruler", "reserve", ""],
      [19, "b3_gpu4_161", "BoltzGen", 88, "single chain", "ruler", "reserve", ""],
      [20, "genie3_g2_141_m1", "Genie3", 82, "single chain", "leaning", "reserve", "reserve"]
    ];
    var ev = {
      robust: ["pose-robust", "pos"],
      leaning: ["net-leaning", "mid"],
      ruler: ["co-fold", "flat"]
    };
    var html = "";
    for (var i = 0; i < D.length; i++) {
      var d = D[i];
      var e = ev[d[5]];
      var tag = d[7] ? " <span class='rowtag'>" + d[7] + "</span>" : "";
      html += "<tr" + (d[6] === "top" ? ' class="is-top"' : "") + ">" +
        "<td>" + d[0] + "</td>" +
        "<td><span class='data'>" + d[1] + "</span>" + tag + "</td>" +
        "<td>" + d[2] + "</td>" +
        "<td>" + d[3] + "&#8202;aa</td>" +
        "<td>" + d[4] + "</td>" +
        "<td><span class='reach " + e[1] + "'>" + e[0] + "</span></td>" +
        "<td>" + (d[6] === "top" ? "<b>top&#8209;10</b>" : "reserve") + "</td>" +
        "</tr>";
    }
    tb.innerHTML = html;
  })();

  /* ---------- 3D: each design on the four-chain peptide-HLA complex ---------- */
  (function gallery() {
    var host = $("#viewer"); if (!host || typeof window.$3Dmol === "undefined") return;
    var tabsEl = $("#molTabs"), infoEl = $("#molInfo");
    var spinBtn = $("#molSpin"), surfBtn = $("#molSurf"), resetBtn = $("#molReset");
    var BLUE = 0x2563eb,   // the design
        GOLD = 0xf59e0b,   // the peptide (the flag)
        RED = 0xdc2626,    // Asp6, the one difference
        TEAL = 0x0d9488,   // Arg114, the groove anchor it reaches
        GREY = 0x97a1b2;   // HLA + b2m, the platform
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
      // platform: HLA (A) and b2m (B), faded to grey so the eye skips them
      vv.setStyle({ chain: "A" }, { cartoon: { color: GREY, opacity: 0.5 } });
      vv.setStyle({ chain: "B" }, { cartoon: { color: GREY, opacity: 0.32 } });
      // the peptide (C): the flag the design must read, in amber, backbone + sticks
      vv.setStyle({ chain: "C" }, { cartoon: { color: GOLD, thickness: 0.5 }, stick: { color: GOLD, radius: 0.16 } });
      // the design (P): the star, in blue
      vv.setStyle({ chain: "P" }, { cartoon: { color: BLUE } });
      // Asp6: the one buried difference, bold red
      vv.addStyle({ chain: "C", resi: 6 }, { stick: { color: RED, radius: 0.34 } });
      vv.addStyle({ chain: "C", resi: 6 }, { sphere: { color: RED, radius: 0.95 } });
      // Arg114 on the HLA floor: the anchor Asp6 reaches down to
      vv.addStyle({ chain: "A", resi: 114 }, { stick: { color: TEAL, radius: 0.26 } });
      // a soft surface on the HLA groove only, so it reads as a platform without hiding the flag
      if (surfOn) {
        vv.addSurface(window.$3Dmol.SurfaceType.VDW, { opacity: 0.12, color: GREY }, { chain: "A" });
      }
      vv.addLabel("Asp6", {
        inFront: true, fontSize: 11, fontColor: "white",
        backgroundColor: "0x111827", backgroundOpacity: 0.72, borderThickness: 0.0
      }, { chain: "C", resi: 6 });
      // frame the flag and the design, not the whole platform
      vv.zoomTo({ or: [{ chain: "C" }, { chain: "P" }] });
      vv.zoom(0.82);
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
      var tier = e.tier === "pose-robust"
        ? "Favours the cancer flag on every one of 5 predicted poses."
        : "Favours the cancer flag on 4 of 5 poses; one pose flips, disclosed.";
      var tag = e.tag ? " <span class='rowtag'>" + e.tag + "</span>" : "";
      infoEl.innerHTML =
        "<h3>" + e.label + tag + "</h3>" +
        "<dl>" +
        "<dt>rank</dt><dd>#" + e.rank + " of 20</dd>" +
        "<dt>made by</dt><dd>" + e.gen + "</dd>" +
        "<dt>shape</dt><dd>" + e.cls + ", " + e.length + " building blocks</dd>" +
        "<dt>physics gate</dt><dd>" + e.ddG + " kcal/mol, favours G12D on " + e.poses + " poses</dd>" +
        "<dt>buried bridge</dt><dd>Asp6 to Arg114, " + e.bridge + " &#8491; in this pose</dd>" +
        "</dl>" +
        "<p class='note'>" + tier + " Predicted pose, not a solved structure. " +
        "The red spot is position 6 (Asp6), the single letter that differs from a healthy cell. " +
        "It sits buried against the teal anchor (Arg114) in the floor of the groove, " +
        "which is why no folding score can read it directly and only the lab can settle it.</p>";
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
        var badge = e.tier === "pose-robust" ? "robust" : "leaning";
        b.innerHTML = "<span class='rk'>#" + e.rank + "</span> " + e.label +
          " <span class='sp " + (e.tier === "pose-robust" ? "robust" : "leaning") + "'>" + badge + "</span>";
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
      surfBtn.textContent = surfOn ? "hide platform" : "show platform";
      if (data[curIdx] && data[curIdx]._pdb) draw(data[curIdx]);
    });
    if (resetBtn) resetBtn.addEventListener("click", function () {
      if (v) { v.zoomTo({ or: [{ chain: "C" }, { chain: "P" }] }); v.zoom(0.82); v.render(); }
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
