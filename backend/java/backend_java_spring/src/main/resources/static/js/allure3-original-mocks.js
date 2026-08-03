/**
 * Faithful-enough SVG mocks of Allure 3 dashboard charts *before* qa-guru overrides
 * (mono-blue funnel pyramid, default palette, macOS-window tile chrome).
 * Paired with widget-tile-mocks.js on allure3-charts-compare.html.
 */
(function (global) {
  "use strict";

  var ALLURE_PRIMARY = "#4b9bff";
  var CHART_RX = 0;

  var STATUS = {
    passed: "var(--color-status-passed-chart-fill, #3bc95d)",
    failed: "#fd5a3e",
    broken: "#ffd050",
    skipped: "#aaaaaa",
    unknown: "#b46fd8",
  };

  var LAYERS = ["manual", "e2e", "api", "integration", "component", "unit"];
  var LAYER_COUNTS = { manual: 2, e2e: 3, api: 4, integration: 5, component: 8, unit: 12 };

  var svgOpen =
    '<svg viewBox="0 0 240 240" role="img" preserveAspectRatio="xMidYMid meet" aria-label=';

  function svgMeet(label) {
    return svgOpen + '"' + label + '">';
  }

  function funnelWidths(n) {
    var widths = [];
    var i;
    for (i = 0; i < n; i++) {
      var v = i / (n - 1);
      widths.push(0.24 + 0.76 * (0.35 * v + 0.65 * v * v));
    }
    return widths;
  }

  function currentStatusSvg() {
    var r = 106;
    var cx = 120;
    var cy = 120;
    var sw = 18;
    var capDeg = (sw / 2 / r) * (180 / Math.PI);
    var gapDeg = 4;
    var segs = [
      { c: STATUS.passed, n: 30 },
      { c: STATUS.failed, n: 2 },
      { c: STATUS.broken, n: 1 },
      { c: STATUS.skipped, n: 1 },
    ];
    var total = segs.reduce(function (s, x) {
      return s + x.n;
    }, 0);
    var perUnitDeg = (360 - gapDeg * segs.length) / total;
    function pt(deg) {
      var rad = ((deg - 90) * Math.PI) / 180;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    }
    function arc(a0, a1, color) {
      var p0 = pt(a0);
      var p1 = pt(a1);
      var large = a1 - a0 > 180 ? 1 : 0;
      return (
        '<path d="M' +
        p0[0].toFixed(2) +
        " " +
        p0[1].toFixed(2) +
        " A" +
        r +
        " " +
        r +
        " 0 " +
        large +
        " 1 " +
        p1[0].toFixed(2) +
        " " +
        p1[1].toFixed(2) +
        '" fill="none" stroke="' +
        color +
        '" stroke-width="' +
        sw +
        '" stroke-linecap="round" />'
      );
    }
    var cursor = 0;
    var ring = segs
      .map(function (seg) {
        var nominal = seg.n * perUnitDeg;
        var drawn = Math.max(0, nominal - capDeg * 2);
        var start = cursor + (nominal - drawn) / 2;
        cursor += nominal + gapDeg;
        return drawn > 0.01 ? arc(start, start + drawn, seg.c) : arc(start, start + 0.01, seg.c);
      })
      .join("");
    return (
      svgMeet("Current status") +
      ring +
      '<text x="' +
      cx +
      '" y="' +
      (cy + 2) +
      '" text-anchor="middle" font-family="var(--font-sans)" font-size="30" font-weight="800" fill="var(--color-text)">88%</text>' +
      '<text x="' +
      cx +
      '" y="' +
      (cy + 24) +
      '" text-anchor="middle" font-family="var(--font-sans)" font-size="14" fill="var(--color-text-muted)">of 34</text>' +
      "</svg>"
    );
  }

  /** Allure TestingPyramidWidget — continuous trapezoids, one primary fill. */
  function testingPyramidSvg() {
    var n = LAYERS.length;
    var W = 240;
    var H = 240;
    var padX = 8;
    var padY = 12;
    var gap = 1;
    var funnelW = W - padX * 2;
    var bandH = (H - padY * 2 - gap * (n - 1)) / n;
    var cx = W / 2;
    var widths = funnelWidths(n);
    var parts = [svgMeet("Testing pyramid")];
    LAYERS.forEach(function (layer, i) {
      var y0 = padY + i * (bandH + gap);
      var y1 = y0 + bandH;
      var w0 = widths[i] * funnelW;
      var w1 = (i < n - 1 ? widths[i + 1] : Math.min(1, widths[i] + 0.08)) * funnelW;
      var x0l = cx - w0 / 2;
      var x0r = cx + w0 / 2;
      var x1l = cx - w1 / 2;
      var x1r = cx + w1 / 2;
      var points =
        x0l.toFixed(1) +
        "," +
        y0.toFixed(1) +
        " " +
        x0r.toFixed(1) +
        "," +
        y0.toFixed(1) +
        " " +
        x1r.toFixed(1) +
        "," +
        y1.toFixed(1) +
        " " +
        x1l.toFixed(1) +
        "," +
        y1.toFixed(1);
      parts.push('<polygon points="' + points + '" fill="' + ALLURE_PRIMARY + '" />');
      var midY = (y0 + y1) / 2;
      parts.push(
        '<text x="12" y="' +
          (midY + 4).toFixed(1) +
          '" font-family="var(--font-sans)" font-size="9" fill="var(--color-text-muted)">Layer: ' +
          layer +
          "</text>"
      );
      parts.push(
        '<text x="' +
          cx +
          '" y="' +
          (midY + 4).toFixed(1) +
          '" text-anchor="middle" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#fff">' +
          LAYER_COUNTS[layer] +
          "</text>"
      );
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function durationsByLayerSvg() {
    var rows = LAYERS.map(function (k) {
      return { k: k, n: { manual: 4.2, e2e: 2.8, api: 1.6, integration: 0.9, component: 0.4, unit: 0.15 }[k] };
    });
    var W = 240;
    var H = 240;
    var padX = 10;
    var padY = 10;
    var n = rows.length;
    var rowH = (H - padY * 2) / n;
    var labelW = 72;
    var barArea = W - padX * 2 - labelW - 28;
    var maxAvg = 4.2;
    var parts = [svgMeet("Durations by layer")];
    rows.forEach(function (r, i) {
      var rowY = padY + i * rowH;
      var barH = Math.max(8, Math.floor(rowH * 0.45));
      var barY = rowY + (rowH - barH) / 2;
      var barW = Math.max(2, Math.floor((r.n / maxAvg) * barArea));
      var barX = padX + labelW;
      parts.push(
        '<text x="' +
          padX +
          '" y="' +
          (rowY + rowH * 0.68).toFixed(1) +
          '" font-family="var(--font-sans)" font-size="10" fill="var(--color-text-muted)">' +
          r.k +
          "</text>"
      );
      parts.push(
        '<rect x="' +
          barX.toFixed(1) +
          '" y="' +
          barY.toFixed(1) +
          '" width="' +
          barW.toFixed(1) +
          '" height="' +
          barH +
          '" fill="' +
          ALLURE_PRIMARY +
          '" />'
      );
      parts.push(
        '<text x="' +
          (barX + barW + 4).toFixed(1) +
          '" y="' +
          (rowY + rowH * 0.68).toFixed(1) +
          '" font-family="var(--font-sans)" font-size="10" fill="var(--color-text-muted)">' +
          r.n.toFixed(1) +
          "s</text>"
      );
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function durationDynamicsSvg() {
    var vals = [12.4, 10.1, 11.2, 8.6, 9.0, 7.4, 8.1, 6.9, 7.2, 6.1];
    var W = 240;
    var H = 240;
    var padT = 16;
    var padB = 18;
    var padX = 14;
    var plotW = W - padX * 2;
    var plotH = H - padT - padB;
    var max = 13;
    var n = vals.length;
    var slot = plotW / (n - 1);
    function y(v) {
      return padT + plotH - (v / max) * plotH;
    }
    var pts = vals
      .map(function (v, i) {
        return (padX + i * slot).toFixed(1) + "," + y(v).toFixed(1);
      })
      .join(" ");
    var area =
      padX +
      "," +
      (padT + plotH) +
      " " +
      pts +
      " " +
      (padX + (n - 1) * slot) +
      "," +
      (padT + plotH);
    return (
      svgMeet("Duration dynamics") +
      '<polygon points="' +
      area +
      '" fill="rgba(75,155,255,.18)" />' +
      '<polyline points="' +
      pts +
      '" fill="none" stroke="' +
      ALLURE_PRIMARY +
      '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />' +
      "</svg>"
    );
  }

  function statusAgePyramidSvg() {
    var buckets = [
      { age: "1 build", failed: 6, broken: 3, skipped: 2, unknown: 1 },
      { age: "2", failed: 4, broken: 2, skipped: 1, unknown: 1 },
      { age: "3–4", failed: 3, broken: 1, skipped: 1, unknown: 0 },
      { age: "5–7", failed: 2, broken: 1, skipped: 0, unknown: 0 },
      { age: "8+", failed: 1, broken: 0, skipped: 0, unknown: 0 },
    ];
    var order = ["failed", "broken", "skipped", "unknown"];
    var colorOf = {
      failed: STATUS.failed,
      broken: STATUS.broken,
      skipped: STATUS.skipped,
      unknown: STATUS.unknown,
    };
    var n = buckets.length;
    var W = 240;
    var H = 240;
    var padY = 12;
    var gap = 1;
    var bandH = (H - padY * 2 - gap * (n - 1)) / n;
    var cx = W / 2;
    var fullW = W - 24;
    var totals = buckets.map(function (b) {
      return b.failed + b.broken + b.skipped + b.unknown;
    });
    var max = totals.reduce(function (m, t) {
      return Math.max(m, t);
    }, 1);
    var widths = funnelWidths(n);
    var parts = [svgMeet("Status age pyramid")];
    buckets.forEach(function (b, i) {
      var total = totals[i];
      var y0 = padY + i * (bandH + gap);
      var y1 = y0 + bandH;
      var w0 = (total / max) * fullW * widths[i];
      var w1 =
        i < n - 1
          ? (totals[i + 1] / max) * fullW * widths[i + 1]
          : Math.min(fullW, w0 * 1.06);
      var x0l = cx - w0 / 2;
      var x0r = cx + w0 / 2;
      var x1l = cx - w1 / 2;
      var x1r = cx + w1 / 2;
      var clipId = "a3-sap-" + i;
      parts.push(
        '<defs><clipPath id="' +
          clipId +
          '"><polygon points="' +
          x0l.toFixed(1) +
          "," +
          y0.toFixed(1) +
          " " +
          x0r.toFixed(1) +
          "," +
          y0.toFixed(1) +
          " " +
          x1r.toFixed(1) +
          "," +
          y1.toFixed(1) +
          " " +
          x1l.toFixed(1) +
          "," +
          y1.toFixed(1) +
          '" /></clipPath></defs>'
      );
      parts.push('<g clip-path="url(#' + clipId + ')">');
      var x = x0l;
      order.forEach(function (k) {
        if (!b[k]) return;
        var sw = (b[k] / total) * w0;
        parts.push(
          '<rect x="' +
            x.toFixed(1) +
            '" y="' +
            y0.toFixed(1) +
            '" width="' +
            sw.toFixed(1) +
            '" height="' +
            bandH.toFixed(1) +
            '" fill="' +
            colorOf[k] +
            '" />'
        );
        x += sw;
      });
      parts.push("</g>");
      parts.push(
        '<text x="' +
          cx +
          '" y="' +
          ((y0 + y1) / 2 + 4).toFixed(1) +
          '" text-anchor="middle" font-family="var(--font-sans)" font-size="10" font-weight="600" fill="rgba(0,0,0,.75)">' +
          b.age +
          "</text>"
      );
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function durationsSvg() {
    var heights = [150, 96, 92, 55, 0, 0, 40, 0, 0, 78];
    var W = 240;
    var H = 240;
    var padT = 12;
    var padB = 14;
    var padX = 10;
    var plotH = H - padT - padB;
    var n = heights.length;
    var slot = (W - padX * 2) / n;
    var barW = slot * 0.72;
    var maxH = heights.reduce(function (m, h) {
      return Math.max(m, h);
    }, 1);
    var parts = [svgMeet("Durations")];
    heights.forEach(function (h, i) {
      if (h <= 0) return;
      var barH = (h / maxH) * plotH;
      var x = padX + i * slot + (slot - barW) / 2;
      var y = padT + plotH - barH;
      parts.push(
        '<rect x="' +
          x.toFixed(1) +
          '" y="' +
          y.toFixed(1) +
          '" width="' +
          barW.toFixed(1) +
          '" height="' +
          barH.toFixed(1) +
          '" fill="' +
          ALLURE_PRIMARY +
          '" />'
      );
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function coverageDiffSvg() {
    var cells = [
      { x: 0, y: 0, w: 130, h: 138, d: "added", n: "auth" },
      { x: 130, y: 0, w: 110, h: 80, d: "unchanged", n: "cart" },
      { x: 130, y: 80, w: 110, h: 58, d: "removed", n: "search" },
      { x: 0, y: 138, w: 82, h: 102, d: "added", n: "user" },
      { x: 82, y: 138, w: 88, h: 102, d: "unchanged", n: "pay" },
      { x: 170, y: 138, w: 70, h: 102, d: "removed", n: "admin" },
    ];
    var diffColor = {
      added: "#6bbf59",
      removed: "#fd5a3e",
      unchanged: "var(--color-border, rgba(255,255,255,.14))",
    };
    var parts = [svgMeet("Coverage diff")];
    cells.forEach(function (c) {
      parts.push(
        '<rect x="' +
          c.x +
          '" y="' +
          c.y +
          '" width="' +
          c.w +
          '" height="' +
          c.h +
          '" fill="' +
          diffColor[c.d] +
          '" stroke="var(--color-surface)" stroke-width="3" />'
      );
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function problemsDistributionSvg() {
    var rows = ["chrome", "firefox", "safari"];
    var data = [
      [0, 1, 0, 2, 0, 1],
      [1, 0, 3, 0, 1, 0],
      [0, 2, 1, 1, 4, 0],
    ];
    var W = 240;
    var H = 240;
    var padY = 12;
    var labelW = 54;
    var padR = 8;
    var gap = 3;
    var cols = data[0].length;
    var cellW = (W - labelW - padR - gap * (cols - 1)) / cols;
    var cellH = (H - padY * 2 - gap * (rows.length - 1)) / rows.length;
    var max = 4;
    function heat(v) {
      if (v === 0) return "var(--color-border, rgba(255,255,255,.12))";
      var t = v / max;
      return (
        "hsl(" +
        Math.round(12 - 12 * t) +
        ", " +
        Math.round(60 + 30 * t) +
        "%, " +
        Math.round(62 - 14 * t) +
        "%)"
      );
    }
    var parts = [svgMeet("Problems by environment")];
    rows.forEach(function (label, ri) {
      var y = padY + ri * (cellH + gap);
      data[ri].forEach(function (v, ci) {
        var x = labelW + ci * (cellW + gap);
        parts.push(
          '<rect x="' +
            x.toFixed(1) +
            '" y="' +
            y.toFixed(1) +
            '" width="' +
            cellW.toFixed(1) +
            '" height="' +
            cellH.toFixed(1) +
            '" fill="' +
            heat(v) +
            '" />'
        );
      });
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function statusDynamicsSvg() {
    var builds = [
      { passed: 26, broken: 3, failed: 5 },
      { passed: 28, broken: 2, failed: 4 },
      { passed: 27, broken: 4, failed: 3 },
      { passed: 30, broken: 2, failed: 2 },
      { passed: 29, broken: 3, failed: 2 },
      { passed: 31, broken: 1, failed: 2 },
      { passed: 30, broken: 2, failed: 1 },
      { passed: 30, broken: 1, failed: 3 },
    ];
    var W = 240;
    var H = 240;
    var padT = 12;
    var padB = 14;
    var padX = 10;
    var plotH = H - padT - padB;
    var n = builds.length;
    var slot = (W - padX * 2) / n;
    var barW = slot * 0.72;
    var parts = [svgMeet("Status dynamics")];
    builds.forEach(function (b, i) {
      var total = b.passed + b.broken + b.failed;
      var x = padX + i * slot + (slot - barW) / 2;
      var y = padT + plotH;
      [["passed", b.passed], ["broken", b.broken], ["failed", b.failed]].forEach(function (seg) {
        var h = (seg[1] / total) * plotH;
        y -= h;
        parts.push(
          '<rect x="' +
            x.toFixed(1) +
            '" y="' +
            y.toFixed(1) +
            '" width="' +
            barW.toFixed(1) +
            '" height="' +
            h.toFixed(1) +
            '" fill="' +
            STATUS[seg[0]] +
            '" />'
        );
      });
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function hBarsSvg(label, rows) {
    var W = 240;
    var H = 240;
    var padX = 10;
    var padY = 12;
    var gap = 10;
    var capH = 15;
    var n = rows.length;
    var rowH = (H - padY * 2 - gap * (n - 1)) / n;
    var max = rows.reduce(function (m, r) {
      return Math.max(m, r.n);
    }, 1);
    var barMax = W - padX * 2;
    var parts = [svgMeet(label)];
    rows.forEach(function (r, i) {
      var y = padY + i * (rowH + gap);
      var w = (r.n / max) * barMax;
      var capY = y + 11;
      var barY = y + capH;
      var barH = rowH - capH;
      parts.push(
        '<text x="' +
          padX +
          '" y="' +
          capY.toFixed(1) +
          '" font-family="var(--font-sans)" font-size="11" fill="var(--color-text-muted)">' +
          r.k +
          "</text>"
      );
      parts.push(
        '<text x="' +
          (W - padX) +
          '" y="' +
          capY.toFixed(1) +
          '" text-anchor="end" font-family="var(--font-sans)" font-size="11" font-weight="600" fill="var(--color-text)">' +
          r.n +
          "</text>"
      );
      parts.push(
        '<rect x="' +
          padX +
          '" y="' +
          barY.toFixed(1) +
          '" width="' +
          Math.max(3, w).toFixed(1) +
          '" height="' +
          barH.toFixed(1) +
          '" fill="' +
          r.c +
          '" />'
      );
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function testResultSeveritiesSvg() {
    return hBarsSvg("Results by severity", [
      { k: "blocker", n: 1, c: "#c0392b" },
      { k: "critical", n: 3, c: STATUS.failed },
      { k: "normal", n: 16, c: "#ff8c42" },
      { k: "minor", n: 9, c: STATUS.broken },
      { k: "trivial", n: 5, c: STATUS.skipped },
    ]);
  }

  function statusTransitionsSvg() {
    var builds = [
      { fixed: 4, regressed: 2, malfunctioned: 1 },
      { fixed: 3, regressed: 1, malfunctioned: 0 },
      { fixed: 5, regressed: 2, malfunctioned: 1 },
      { fixed: 2, regressed: 3, malfunctioned: 1 },
      { fixed: 6, regressed: 1, malfunctioned: 0 },
      { fixed: 3, regressed: 2, malfunctioned: 2 },
      { fixed: 4, regressed: 1, malfunctioned: 0 },
      { fixed: 5, regressed: 2, malfunctioned: 1 },
    ];
    var W = 240;
    var H = 240;
    var padX = 10;
    var padT = 12;
    var padB = 12;
    var mid = padT + (H - padT - padB) / 2;
    var upH = mid - padT;
    var downH = H - padB - mid;
    var maxUp = 6;
    var maxDown = 5;
    var n = builds.length;
    var slot = (W - padX * 2) / n;
    var barW = slot * 0.66;
    var parts = [svgMeet("Status transitions")];
    builds.forEach(function (b, i) {
      var x = padX + i * slot + (slot - barW) / 2;
      var fh = (b.fixed / maxUp) * upH;
      parts.push(
        '<rect x="' +
          x.toFixed(1) +
          '" y="' +
          (mid - fh).toFixed(1) +
          '" width="' +
          barW.toFixed(1) +
          '" height="' +
          fh.toFixed(1) +
          '" fill="' +
          STATUS.passed +
          '" />'
      );
      var y = mid;
      [["failed", b.regressed], ["orange", b.malfunctioned]].forEach(function (seg) {
        if (!seg[1]) return;
        var h = (seg[1] / maxDown) * downH;
        var color = seg[0] === "orange" ? "#ff8200" : STATUS.failed;
        parts.push(
          '<rect x="' +
            x.toFixed(1) +
            '" y="' +
            y.toFixed(1) +
            '" width="' +
            barW.toFixed(1) +
            '" height="' +
            h.toFixed(1) +
            '" fill="' +
            color +
            '" />'
        );
        y += h;
      });
    });
    parts.push(
      '<line x1="' +
        padX +
        '" y1="' +
        mid.toFixed(1) +
        '" x2="' +
        (W - padX) +
        '" y2="' +
        mid.toFixed(1) +
        '" stroke="var(--color-text-muted)" stroke-width="1" />'
    );
    parts.push("</svg>");
    return parts.join("");
  }

  function testBaseGrowthDynamicsSvg() {
    var builds = [
      { added: 5, removed: 1 },
      { added: 3, removed: 0 },
      { added: 6, removed: 2 },
      { added: 2, removed: 1 },
      { added: 4, removed: 0 },
      { added: 7, removed: 3 },
      { added: 3, removed: 1 },
      { added: 5, removed: 2 },
    ];
    var W = 240;
    var H = 240;
    var padX = 10;
    var padT = 12;
    var padB = 12;
    var mid = padT + (H - padT - padB) * 0.62;
    var upH = mid - padT;
    var downH = H - padB - mid;
    var maxUp = 7;
    var maxDown = 3;
    var n = builds.length;
    var slot = (W - padX * 2) / n;
    var barW = slot * 0.66;
    var parts = [svgMeet("Test base growth")];
    builds.forEach(function (b, i) {
      var x = padX + i * slot + (slot - barW) / 2;
      var ah = (b.added / maxUp) * upH;
      parts.push(
        '<rect x="' +
          x.toFixed(1) +
          '" y="' +
          (mid - ah).toFixed(1) +
          '" width="' +
          barW.toFixed(1) +
          '" height="' +
          ah.toFixed(1) +
          '" fill="' +
          STATUS.passed +
          '" />'
      );
      var rh = (b.removed / maxDown) * downH;
      parts.push(
        '<rect x="' +
          x.toFixed(1) +
          '" y="' +
          mid.toFixed(1) +
          '" width="' +
          barW.toFixed(1) +
          '" height="' +
          rh.toFixed(1) +
          '" fill="' +
          STATUS.failed +
          '" />'
      );
    });
    parts.push(
      '<line x1="' +
        padX +
        '" y1="' +
        mid.toFixed(1) +
        '" x2="' +
        (W - padX) +
        '" y2="' +
        mid.toFixed(1) +
        '" stroke="var(--color-text-muted)" stroke-width="1" />'
    );
    parts.push("</svg>");
    return parts.join("");
  }

  function successRateDistributionSvg() {
    var cells = [
      { x: 0, y: 0, w: 130, h: 138, r: 96 },
      { x: 130, y: 0, w: 110, h: 80, r: 100 },
      { x: 130, y: 80, w: 110, h: 58, r: 74 },
      { x: 0, y: 138, w: 82, h: 102, r: 100 },
      { x: 82, y: 138, w: 88, h: 102, r: 62 },
      { x: 170, y: 138, w: 70, h: 102, r: 40 },
    ];
    function rateColor(r) {
      return "hsl(" + Math.round((r / 100) * 120) + ", 62%, 52%)";
    }
    var parts = [svgMeet("Success rate")];
    cells.forEach(function (c) {
      parts.push(
        '<rect x="' +
          c.x +
          '" y="' +
          c.y +
          '" width="' +
          c.w +
          '" height="' +
          c.h +
          '" fill="' +
          rateColor(c.r) +
          '" stroke="var(--color-surface)" stroke-width="3" />'
      );
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function stabilityDistributionSvg() {
    var vals = [100, 96, 88, 92, 100, 84, 98, 90, 100, 78];
    var threshold = 90;
    var W = 240;
    var H = 240;
    var padT = 12;
    var padB = 14;
    var padX = 10;
    var plotH = H - padT - padB;
    var n = vals.length;
    var slot = (W - padX * 2) / n;
    var barW = slot * 0.72;
    var parts = [svgMeet("Stability distribution")];
    vals.forEach(function (v, i) {
      var h = (v / 100) * plotH;
      var x = padX + i * slot + (slot - barW) / 2;
      var y = padT + plotH - h;
      var c = v >= threshold ? STATUS.passed : v >= 80 ? STATUS.broken : STATUS.failed;
      parts.push(
        '<rect x="' +
          x.toFixed(1) +
          '" y="' +
          y.toFixed(1) +
          '" width="' +
          barW.toFixed(1) +
          '" height="' +
          h.toFixed(1) +
          '" fill="' +
          c +
          '" />'
      );
    });
    var ty = padT + plotH - (threshold / 100) * plotH;
    parts.push(
      '<line x1="' +
        padX +
        '" y1="' +
        ty.toFixed(1) +
        '" x2="' +
        (W - padX) +
        '" y2="' +
        ty.toFixed(1) +
        '" stroke="var(--color-text-muted)" stroke-width="1.5" stroke-dasharray="4 3" />'
    );
    parts.push("</svg>");
    return parts.join("");
  }

  var RENDERERS = {
    currentStatus: currentStatusSvg,
    testingPyramid: testingPyramidSvg,
    testResultSeverities: testResultSeveritiesSvg,
    statusDynamics: statusDynamicsSvg,
    statusTransitions: statusTransitionsSvg,
    testBaseGrowthDynamics: testBaseGrowthDynamicsSvg,
    coverageDiff: coverageDiffSvg,
    successRateDistribution: successRateDistributionSvg,
    problemsDistribution: problemsDistributionSvg,
    stabilityDistribution: stabilityDistributionSvg,
    durations: durationsSvg,
    durationDynamics: durationDynamicsSvg,
    statusAgePyramid: statusAgePyramidSvg,
  };

  /** Resolve widget-tile CATALOG slot → original Allure 3 SVG. */
  function renderForCatalog(slot) {
    if (!slot) return "";
    if (slot.type === "durations" && slot.groupBy === "layer") {
      return durationsByLayerSvg();
    }
    var fn = RENDERERS[slot.type];
    return fn ? fn() : "";
  }

  function render(key) {
    if (key === "durationsByLayer") return durationsByLayerSvg();
    var fn = RENDERERS[key];
    return fn ? fn() : "";
  }

  global.Allure3OriginalMocks = {
    render: render,
    renderForCatalog: renderForCatalog,
    renderers: RENDERERS,
  };
})(typeof window !== "undefined" ? window : globalThis);
