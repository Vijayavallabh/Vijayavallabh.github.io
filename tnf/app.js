/* ===========================================================================
   TNF conditional binders: interactions
   1) hero repulsion beat (GSAP, plays once; magenta fires once)
   2) human->mouse slopegraph from fe_data.json
   3) the 18-design table (accessible twin of the chart)
   4) demoted 3D viewer of des_6025 (drag-only, no spin)
   5) theme toggle + reduced-motion discipline
   =========================================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  // one global ease + conflict policy so a pH toggle can never leave two tweens fighting the binder transform
  if (typeof window.gsap !== "undefined") window.gsap.defaults({ ease: "power2.out", overwrite: "auto" });

  /* ---------- theme ---------- */
  (function theme() {
    var btn = $("#themeBtn");
    if (!btn) return;
    var saved = null;
    try { saved = localStorage.getItem("tnf-theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = cur ? (cur === "dark" ? "light" : "dark") : (sysDark ? "light" : "dark");
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("tnf-theme", next); } catch (e) {}
    });
  })();

  /* ---------- hero repulsion beat ---------- */
  (function hero() {
    var binder = $("#binder"), his = $("#hisField"), repel = $("#repel"), glow = $("#glow");
    var stateWord = $("#stateWord"), envWord = $("#envWord");
    var replay = $("#replayBtn"), b74 = $("#ph74"), b60 = $("#ph60");
    if (!binder) return;

    function setBound() {
      stateWord.textContent = "bound"; envWord.textContent = "blood, pH 7.4";
      b74 && b74.setAttribute("aria-pressed", "true");
      b60 && b60.setAttribute("aria-pressed", "false");
    }
    function setReleased() {
      stateWord.textContent = "released"; envWord.textContent = "inside the cell, pH 6.0";
      b74 && b74.setAttribute("aria-pressed", "false");
      b60 && b60.setAttribute("aria-pressed", "true");
    }

    var hasGSAP = typeof window.gsap !== "undefined";
    var playing = false, heroTL = null;

    function setBinderX(v) {
      if (hasGSAP) window.gsap.set(binder, { x: v });
      else binder.setAttribute("transform", "translate(" + v + ",0)");
    }
    function staticReleased() {
      setBinderX(-70);
      if (hasGSAP) window.gsap.set(repel, { scale: 1 });
      his.setAttribute("opacity", "1"); repel.setAttribute("opacity", "1"); glow.setAttribute("opacity", "1");
      setReleased();
    }
    function staticBound() {
      setBinderX(0);
      his.setAttribute("opacity", "0"); repel.setAttribute("opacity", "0"); glow.setAttribute("opacity", "0");
      setBound();
    }

    function beat() {
      if (reduce || !hasGSAP) { staticReleased(); return; }
      if (playing) return; playing = true;
      staticBound();
      heroTL = window.gsap.timeline({ onComplete: function () { playing = false; } });
      heroTL
        .to(glow, { attr: { opacity: 0.9 }, duration: 0.5, ease: "sine.inOut" }, 0)
        .to(his, { attr: { opacity: 1 }, duration: 0.35, ease: "power1.out" }, 0.28)
        .fromTo(repel,
          { attr: { opacity: 0 }, scale: 0.72 },
          { attr: { opacity: 1 }, scale: 1, transformOrigin: "50% 50%", duration: 0.22, ease: "back.out(2.4)" }, 0.85)
        .to(binder, { x: -70, duration: 0.72, ease: "power3.out" }, 0.9)
        .call(setReleased, null, 0.9)
        .to(repel, { attr: { opacity: 0 }, duration: 0.5, ease: "power1.in" }, 1.34);
    }

    replay && replay.addEventListener("click", beat);
    b74 && b74.addEventListener("click", function () {
      if (heroTL) { heroTL.kill(); playing = false; }
      if (hasGSAP && !reduce) {
        window.gsap.to(binder, { x: 0, duration: 0.55, ease: "power2.inOut" });
        window.gsap.to([his, repel, glow], { attr: { opacity: 0 }, duration: 0.4, ease: "power1.out" });
      } else { staticBound(); }
      setBound();
    });
    b60 && b60.addEventListener("click", beat);

    // play once on scroll-into-view
    function arm() {
      if (reduce || !hasGSAP || typeof window.ScrollTrigger === "undefined") { return; }
      window.ScrollTrigger.create({
        trigger: "#scene", start: "top 72%", once: true,
        onEnter: beat
      });
    }
    // reduced motion: show the released end-state statically (the repulsion is visible without animation)
    if (reduce) { staticReleased(); } else { setBound(); }
    if (document.readyState === "complete") arm(); else window.addEventListener("load", arm);
  })();

  /* ---------- data-driven: slopegraph + table ---------- */
  fetch("fe_data.json").then(function (r) { return r.json(); }).then(function (rows) {
    buildTable(rows);
    buildSlope(rows);
  }).catch(function () { /* table/chart simply absent; prose still stands */ });

  var TIER = {
    dual: { cls: "pos", word: "releases", pill: "pos" },
    anti: { cls: "neg", word: "reverses", pill: "neg" },
    flat: { cls: "flat", word: "holds / flat", pill: "fl" },
    lean: { cls: "flat", word: "flat (lean)", pill: "fl" }
  };

  function sign(v) { return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2); }
  function signz(v) { return "z " + (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1); }

  function buildTable(rows) {
    var tb = $("#designRows"); if (!tb) return;
    var html = "";
    rows.forEach(function (d) {
      var t = TIER[d.tier] || TIER.flat;
      var dualRow = d.tier === "dual" ? ' class="dual"' : "";
      html += "<tr" + dualRow + ">" +
        '<td class="num">' + d.rank + "</td>" +
        '<td class="nm">' + d.short + "</td>" +
        '<td class="num pos">' + sign(d.human) + " <span style=\"color:var(--tx2)\">" + signz(d.hz) + "</span></td>" +
        '<td class="num ' + t.cls + '">' + sign(d.mouse) + " <span style=\"color:var(--tx2)\">" + signz(d.mz) + ", n" + d.mn + "</span></td>" +
        '<td><span class="pill ' + t.cls + '">' + t.word + "</span></td>" +
        "</tr>";
    });
    tb.innerHTML = html;
  }

  function buildSlope(rows) {
    var svg = $("#slope"); if (!svg) return;
    var NS = "http://www.w3.org/2000/svg";
    var W = 760, H = 460, xL = 182, xR = 578, top = 44, bot = 416, mid = (top + bot) / 2;
    var DOM = 9; // ddG domain +/- 9
    function y(v) { return mid - (v / DOM) * ((bot - top) / 2); }
    function el(name, attrs) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

    // frame + zero horizon
    svg.appendChild(el("line", { x1: xL, y1: top, x2: xL, y2: bot, class: "frame" }));
    svg.appendChild(el("line", { x1: xR, y1: top, x2: xR, y2: bot, class: "frame" }));
    svg.appendChild(el("line", { x1: 120, y1: mid, x2: 640, y2: mid, class: "zero" }));

    // ticks on the left axis
    [8, 4, 0, -4, -8].forEach(function (t) {
      var yt = y(t);
      svg.appendChild(el("line", { x1: xL - 5, y1: yt, x2: xL, y2: yt, class: "frame" }));
      var tx = el("text", { x: xL - 10, y: yt + 4, "text-anchor": "end", class: "axislab", "font-size": "12" });
      tx.textContent = (t > 0 ? "+" : "") + t; svg.appendChild(tx);
    });

    // axis labels
    var hl = el("text", { x: xL, y: 28, "text-anchor": "middle", class: "axislab" }); hl.textContent = "human"; svg.appendChild(hl);
    var ml = el("text", { x: xR, y: 28, "text-anchor": "middle", class: "axislab" }); ml.textContent = "mouse"; svg.appendChild(ml);
    var up = el("text", { x: 126, y: top + 14, class: "axislab", "font-size": "12" }); up.textContent = "releases ↑"; up.setAttribute("fill", "var(--pos-live)"); svg.appendChild(up);
    var dn = el("text", { x: 126, y: bot - 4, class: "axislab", "font-size": "12" }); dn.textContent = "reverses ↓"; dn.setAttribute("fill", "var(--neg-live)"); svg.appendChild(dn);

    var tip = $("#tip");
    function showTip(d, evt) {
      if (!tip) return;
      tip.innerHTML = d.short + "<br>human " + sign(d.human) + " " + signz(d.hz) +
        "<br>mouse " + sign(d.mouse) + " " + signz(d.mz) + " n" + d.mn +
        "<br>" + (TIER[d.tier] || TIER.flat).word + " in mouse";
      tip.style.left = Math.min(evt.clientX + 14, window.innerWidth - 220) + "px";
      tip.style.top = (evt.clientY + 14) + "px";
      tip.style.opacity = "1";
    }
    function hideTip() { if (tip) tip.style.opacity = "0"; }

    var animTargets = [];
    var labels = [];
    rows.forEach(function (d) {
      var tier = d.tier;
      var cls = tier === "dual" ? "pos" : tier === "anti" ? "neg" : "flat";
      var crossing = d.human > 0 && d.mouse < 0;
      var yh = y(d.human), ym = y(d.mouse);
      var line = el("line", { x1: xL, y1: yh, x2: xR, y2: (reduce ? ym : yh), class: "sl-line " + cls + (crossing || tier === "dual" ? " hot" : ""), tabindex: "0", role: "img" });
      line.setAttribute("aria-label", d.short + ", human " + sign(d.human) + ", mouse " + sign(d.mouse) + ", " + (TIER[d.tier] || TIER.flat).word + " in mouse");
      var dotH = el("circle", { cx: xL, cy: yh, class: "sl-dot " + cls });
      var dotM = el("circle", { cx: xR, cy: (reduce ? ym : yh), class: "sl-dot " + cls });
      svg.appendChild(line); svg.appendChild(dotH); svg.appendChild(dotM);
      animTargets.push({ line: line, dotM: dotM, ym: ym, cross: crossing });

      function over(e) { showTip(d, e); line.style.strokeWidth = "4"; }
      line.addEventListener("mousemove", over); line.addEventListener("mouseleave", function () { hideTip(); line.style.strokeWidth = ""; });
      line.addEventListener("focus", function () { var r = line.getBoundingClientRect(); showTip(d, { clientX: r.right - 40, clientY: r.top + 10 }); });
      line.addEventListener("blur", hideTip);

      // collect labels for the 5 dual releasers + the two named reversers
      if (tier === "dual" || d.short === "des_4098" || d.short === "des_1060") {
        labels.push({ text: d.short, y: ym, color: tier === "dual" ? "pos" : "neg" });
      }
    });

    // de-collide right-side labels (push apart to a minimum gap), then draw
    labels.sort(function (a, b) { return a.y - b.y; });
    var GAP = 16;
    for (var li = 1; li < labels.length; li++) {
      if (labels[li].y - labels[li - 1].y < GAP) labels[li].y = labels[li - 1].y + GAP;
    }
    labels.forEach(function (L) {
      var t = el("text", { x: xR + 12, y: L.y + 4, class: "axislab", "font-size": "12.5", "text-anchor": "start" });
      t.textContent = L.text; t.setAttribute("fill", "var(--" + L.color + "-live)");
      t.setAttribute("font-family", "var(--mono)");
      svg.appendChild(t);
    });

    // animate mouse endpoints into place once, on scroll-into-view
    if (!reduce && typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined") {
      window.ScrollTrigger.create({
        trigger: "#slope", start: "top 70%", once: true,
        onEnter: function () {
          var g = window.gsap;
          var quiet = animTargets.filter(function (a) { return !a.cross; });
          var story = animTargets.filter(function (a) { return a.cross; });
          quiet.forEach(function (a, i) {
            var d = i * 0.028;
            g.to(a.line, { attr: { y2: a.ym }, duration: 0.72, delay: d, ease: "power2.out" });
            g.to(a.dotM, { attr: { cy: a.ym }, duration: 0.72, delay: d, ease: "power2.out" });
          });
          var base = quiet.length * 0.028 + 0.14;
          story.forEach(function (a, i) {
            var d = base + i * 0.1;
            g.to(a.line, { attr: { y2: a.ym }, duration: 1.0, delay: d, ease: "power3.inOut" });
            g.to(a.dotM, { attr: { cy: a.ym }, duration: 1.0, delay: d, ease: "power3.inOut" });
          });
        }
      });
    }
  }

  /* ---------- 3D viewer (demoted; drag-only, no spin; high-DPI) ---------- */
  (function mol() {
    var host = $("#viewer"); if (!host || typeof window.$3Dmol === "undefined") return;
    try {
      var v = window.$3Dmol.createViewer(host, {
        backgroundColor: 0x0D1526,
        backgroundAlpha: 0,
        antialias: true,
        cartoonQuality: 10,
        disableFog: true
      });
      if (!v) return;
      fetch("des6025_complex.pdb").then(function (r) { return r.text(); }).then(function (pdb) {
        v.addModel(pdb, "pdb");
        v.setStyle({ chain: "B" }, { cartoon: { color: 0x8a93a6, opacity: 0.65 } });
        v.setStyle({ chain: "A" }, { cartoon: { color: 0x4f86ff } });
        v.addStyle({ chain: "A", resi: [32, 52, 66, 74] }, { stick: { radius: 0.34, color: 0xDB2777 } });
        var fb = $(".mol-fallback", host); if (fb) fb.style.display = "none";
        v.zoomTo({ chain: "A" }); v.zoom(0.8); v.render();
        v.resize();
        requestAnimationFrame(function () { try { v.resize(); } catch (e) {} });
        try {
          v.addSurface(window.$3Dmol.SurfaceType.SAS,
            { opacity: 0.5, color: 0x8a93a6 },
            { chain: "B" }, { chain: "B" }, undefined,
            function () { try { v.render(); } catch (e) {} });
        } catch (e) { /* surface optional; cartoon already shows */ }
      }).catch(function () { /* leave the fallback text */ });
      var rt;
      window.addEventListener("resize", function () {
        clearTimeout(rt); rt = setTimeout(function () { try { v.resize(); } catch (e) {} }, 150);
      });
    } catch (e) { /* leave the fallback text */ }
  })();
})();
