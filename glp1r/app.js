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

  /* ---------- 3D: a gallery of designs on GLP-1R ---------- */
  (function gallery() {
    var host = $("#viewer"); if (!host || typeof window.$3Dmol === "undefined") return;
    var tabsEl = $("#molTabs"), infoEl = $("#molInfo");
    var spinBtn = $("#molSpin"), surfBtn = $("#molSurf"), resetBtn = $("#molReset");
    var GREY = 0x8a93a6, TEAL = 0x2a9d8f, GOLD = 0xe0a100;
    var READER_B = 276; // chain-B residue number of the R299 "reader" (UniProt 299 = construct 276)
    var v = null, data = [], curIdx = 0, spinning = !reduce, surfOn = false;

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
      vv.setStyle({ chain: "B" }, { cartoon: { color: GREY, opacity: 0.55 } });
      vv.setStyle({ chain: "A" }, { cartoon: { color: TEAL }, stick: { color: TEAL, radius: 0.16 } });
      // the design residues that touch the pocket (N-terminus + the one nearest the reader)
      (entry.highlightA || []).forEach(function (rn) {
        vv.addStyle({ chain: "A", resi: rn }, { stick: { color: TEAL, radius: 0.34 } });
        vv.addStyle({ chain: "A", resi: rn }, { sphere: { color: TEAL, radius: 0.95 } });
      });
      // the R299 reader on the receptor, in gold: the residue a real agonist must touch
      vv.addStyle({ chain: "B", resi: READER_B }, { stick: { color: GOLD, radius: 0.34 } });
      vv.addStyle({ chain: "B", resi: READER_B }, { sphere: { color: GOLD, radius: 1.0 } });
      if (surfOn) {
        vv.addSurface(window.$3Dmol.SurfaceType.VDW, { opacity: 0.45, color: GREY }, { chain: "B" });
      }
      vv.zoomTo({ chain: "A" });
      vv.zoom(entry.readsReader ? 0.62 : 0.5);
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
      var tag = e.tag ? " <span class='rowtag'>" + e.tag + "</span>" : "";
      var reach = e.readsReader
        ? "Its chain reaches the R299 reader, closest atom about " + e.readerDist + " Å away in this pose."
        : "It settles on the receptor's outer domain, about " + e.readerDist + " Å from the R299 reader: it never enters the pocket.";
      var lc = e.lowConf ? " In this co-fold the computer is less certain of the exact pose." : "";
      infoEl.innerHTML =
        "<h3>" + e.label + tag + "</h3>" +
        "<dl>" +
        "<dt>rank</dt><dd>#" + e.rank + " of 20</dd>" +
        "<dt>length</dt><dd>" + e.length + " building blocks</dd>" +
        "<dt>built by</dt><dd>" + e.gen + "</dd>" +
        "<dt>the reader</dt><dd>" + (e.readsReader ? "reached" : "not reached") + "</dd>" +
        "</dl>" +
        "<p class='note'>Predicted pose, not a solved structure. " + reach + lc + " Reaching the reader is a necessary sign of a real agonist, not a guarantee of one: a few known blockers reach it too. The gold stick is R299; the teal spheres are the design's own contact points.</p>";
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
        var chip = e.kind === "reader" ? "reaches reader" : "ECD perch";
        b.innerHTML = "<span class='rk'>#" + e.rank + "</span> " + e.label +
          " <span class='sp " + e.kind + "'>" + chip + "</span>";
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
      if (v && data[curIdx]) { v.zoomTo({ chain: "A" }); v.zoom(data[curIdx].readsReader ? 0.62 : 0.5); v.render(); }
    });

    fetch("complexes/manifest.json").then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (m) {
      data = m; if (!data.length) return;
      if (reduce && spinBtn) { spinBtn.setAttribute("aria-pressed", "false"); spinBtn.textContent = "spin"; }
      if (surfBtn) { surfBtn.setAttribute("aria-pressed", "false"); surfBtn.textContent = "show surface"; }
      buildTabs(); load(0);
    }).catch(function () {
      host.innerHTML = '<p class="mol-fallback">The 3D views could not load. The structures are in the project repository.</p>';
    });
  })();
})();
