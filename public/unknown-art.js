/* Drawn pictures for The Unknown. Symbolic dossier art, never likenesses. Each picture is built from the entity's seed, so
   the same card always looks the same but no two look alike. viewBox 0 0 100 100; tones come from the .un-pic classes in foundry.css. */
(function () {
  'use strict';
  function rng(seed) { var a = (seed || 1) >>> 0; var g = function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; g(); g(); g(); return g; }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  function f(n) { return +n.toFixed(1); }

  /* shared patterns: one hidden svg in the page, referenced by url(#un-…) */
  function defs() {
    if (document.getElementById('un-defs')) return;
    var d = document.createElement('div');
    d.innerHTML = '<svg id="un-defs" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
      '<pattern id="un-hatch" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 0v3.2" stroke="#000" stroke-width=".9" opacity=".34"/></pattern>' +
      '<pattern id="un-hatch2" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-48)"><path d="M0 0v2.6" stroke="#000" stroke-width=".7" opacity=".3"/></pattern>' +
      '<pattern id="un-dots" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".7" fill="#d9d2c3" opacity=".22"/></pattern>' +
      '<pattern id="un-scan" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height=".8" fill="#000" opacity=".28"/></pattern>' +
      '<pattern id="un-brick" width="12" height="6" patternUnits="userSpaceOnUse"><path d="M0 .4h12M0 6h12M0 .4v5.6M6 6v-5.6" stroke="#000" stroke-width=".7" opacity=".35" fill="none"/></pattern>' +
      '<radialGradient id="un-vig" cx="50%" cy="46%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".72"/></radialGradient>' +
      '<radialGradient id="un-spot" cx="50%" cy="34%" r="62%"><stop offset="0" stop-color="#d9d2c3" stop-opacity=".26"/><stop offset="1" stop-color="#d9d2c3" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="un-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>' +
      '</defs></svg>';
    document.body.appendChild(d.firstChild);
  }

  /* ---------- people ---------- */
  function head(r, o) {
    o = o || {};
    var cx = 50, cy = o.cy || 38, rx = o.rx || (14 + r() * 3.5), ry = o.ry || (16.5 + r() * 2.5), eye = o.eye || cy - 1;
    var s = '';
    s += '<path class="sk2" d="M41 ' + (cy + 12) + 'h18v' + (66 - cy - 12) + 'H41z"/><path class="sh" d="M41 ' + (cy + 18) + 'q9 6 18 0v8q-9 6-18 0z"/>';             // neck + shadow under the jaw
    s += '<ellipse class="sk2" cx="' + f(cx - rx) + '" cy="' + (cy + 2) + '" rx="2.6" ry="4.4"/><ellipse class="sk2" cx="' + f(cx + rx) + '" cy="' + (cy + 2) + '" rx="2.6" ry="4.4"/>'; // ears
    s += '<ellipse class="sk" cx="50" cy="' + cy + '" rx="' + f(rx) + '" ry="' + f(ry) + '"/>';
    s += '<path class="sh" d="M' + f(cx + rx * .42) + ' ' + f(cy - ry * .86) + 'Q' + f(cx + rx * 1.06) + ' ' + cy + ' ' + f(cx + rx * .42) + ' ' + f(cy + ry * .9) + 'Q' + f(cx + rx * .86) + ' ' + cy + ' ' + f(cx + rx * .42) + ' ' + f(cy - ry * .86) + 'z"/>';
    s += '<path class="ln" d="M' + f(cx - rx * .5) + ' ' + (eye - 6.6) + 'q4-2.2 8 0M' + f(cx + rx * .5 - 8) + ' ' + (eye - 6.6) + 'q4-2.2 8 0"/>';    // brows
    s += '<path class="ln" d="M49.6 ' + (eye + 4) + 'l-2.4 7.4h4.4"/><path class="ln" d="M' + (cx - 5) + ' ' + f(cy + ry * .62) + 'q5 2.4 10 0"/>';                  // nose + mouth
    s += '<path class="sh" d="M' + f(cx - rx * .86) + ' ' + f(cy + ry * .3) + 'q3 ' + f(ry * .78) + ' ' + f(rx * .86) + ' ' + f(ry * .78) + 'q' + f(rx * .86 - 3) + ' 0 ' + f(rx * .86) + ' ' + f(-ry * .78) + 'q-3 ' + f(ry * .32) + ' ' + f(-rx * .86) + ' ' + f(ry * .38) + 'q' + f(-rx * .86 + 3) + ' 0 ' + f(-rx * .86) + ' ' + f(-ry * .38) + 'z" opacity=".32"/>';
    var hair = o.hair != null ? o.hair : Math.floor(r() * 6), top = cy - ry;
    if (o.bare) hair = -1;
    if (hair === 0) s += '<path class="hr" d="M' + f(cx - rx - 1) + ' ' + (cy - 3) + 'Q' + f(cx - rx - 2) + ' ' + f(top - 4) + ' 50 ' + f(top - 4.5) + 'Q' + f(cx + rx + 2) + ' ' + f(top - 4) + ' ' + f(cx + rx + 1) + ' ' + (cy - 3) + 'Q' + f(cx + rx - 3) + ' ' + f(top + 4) + ' 50 ' + f(top + 3) + 'Q' + f(cx - rx + 3) + ' ' + f(top + 4) + ' ' + f(cx - rx - 1) + ' ' + (cy - 3) + 'z"/>';
    if (hair === 1) s += '<path class="hr" d="M' + f(cx - rx - 1) + ' ' + (cy - 5) + 'Q' + f(cx - rx - 1) + ' ' + f(top - 2) + ' ' + f(cx - 4) + ' ' + f(top - 3) + 'Q' + f(cx + rx - 4) + ' ' + f(top - 3) + ' ' + f(cx + rx + 1) + ' ' + (cy - 6) + 'Q' + f(cx + rx - 1) + ' ' + f(top + 2) + ' ' + f(cx + 4) + ' ' + f(top + 4) + 'Q' + f(cx - 6) + ' ' + f(top + 1) + ' ' + f(cx - rx + 2) + ' ' + f(top + 8) + 'z"/><path class="hi-l" d="M' + f(cx - 6) + ' ' + f(top - 1) + 'q10-3 18 1"/>';
    if (hair === 2) s += '<path class="hr" d="M' + f(cx - rx - 1) + ' ' + (cy - 1) + 'Q' + f(cx - rx - 3) + ' ' + f(top - 6) + ' 50 ' + f(top - 6) + 'Q' + f(cx + rx + 3) + ' ' + f(top - 6) + ' ' + f(cx + rx + 1) + ' ' + (cy - 1) + 'Q' + f(cx + rx - 2) + ' ' + f(top + 2) + ' ' + f(cx + 2) + ' ' + f(top + 2) + 'Q' + f(cx - 8) + ' ' + f(top + 2) + ' ' + f(cx - rx + 2) + ' ' + (cy - 1) + 'z"/><path class="hi-l" d="M' + f(cx - 10) + ' ' + f(top - 3) + 'q12-4 22 0"/>';
    if (hair === 3) { for (var i = 0; i < 9; i++) { var a = Math.PI * (1.02 + i * .12); s += '<circle class="hr" cx="' + f(cx + Math.cos(a) * (rx + 1)) + '" cy="' + f(cy - 3 + Math.sin(a) * (ry - 1)) + '" r="' + f(4.2 + r() * 1.4) + '"/>'; } s += '<path class="hr" d="M' + f(cx - rx) + ' ' + (cy - 3) + 'Q50 ' + f(top - 1) + ' ' + f(cx + rx) + ' ' + (cy - 3) + 'Q50 ' + f(top + 6) + ' ' + f(cx - rx) + ' ' + (cy - 3) + 'z"/>'; }
    if (hair === 4) s += '<path class="hr" d="M' + f(cx - rx - 1) + ' ' + (cy + 2) + 'Q' + f(cx - rx - 3) + ' ' + f(top - 5) + ' 50 ' + f(top - 6) + 'Q' + f(cx + rx + 3) + ' ' + f(top - 5) + ' ' + f(cx + rx + 1) + ' ' + (cy + 2) + 'L' + f(cx + rx - 1) + ' ' + (cy + 10) + 'L' + f(cx + rx - 3) + ' ' + f(top + 6) + 'Q50 ' + f(top - 1) + ' ' + f(cx - rx + 3) + ' ' + f(top + 6) + 'L' + f(cx - rx + 1) + ' ' + (cy + 10) + 'z"/>';
    var fh = o.face != null ? o.face : Math.floor(r() * 5);
    if (fh === 1) s += '<path class="hr" d="M43 ' + f(cy + ry * .5) + 'q7-3.4 14 0q-2 3.4-7 3q-5 .4-7-3z"/>';                                               // moustache
    if (fh === 2) s += '<path class="hr" d="M' + f(cx - rx + 1) + ' ' + (cy + 4) + 'q1 ' + f(ry * .98) + ' ' + f(rx - 1) + ' ' + f(ry * 1.02) + 'q' + f(rx - 1) + ' 0 ' + f(rx - 1) + ' ' + f(-ry * 1.02) + 'q-3 ' + f(ry * .6) + ' ' + f(-rx + 1) + ' ' + f(ry * .66) + 'q' + f(-rx + 1) + ' 0 ' + f(-rx + 1) + ' ' + f(-ry * .66) + 'z" opacity=".86"/><path class="sk" d="M44 ' + f(cy + ry * .62) + 'q6 3 12 0v2q-6 2.4-12 0z"/>';  // beard
    if (fh === 3) s += '<path class="hr" d="M45 ' + f(cy + ry * .5) + 'q5-2.4 10 0q-1 2.4-5 2.4q-4 0-5-2.4z"/><path class="hr" d="M47 ' + f(cy + ry * .96) + 'h6v3.2h-6z"/>'; // moustache + chin patch
    s += '<path class="hi-l" d="M' + f(cx - rx * .62) + ' ' + f(cy - ry * .55) + 'q-1 ' + f(ry * .5) + ' 1 ' + f(ry * .9) + '" opacity=".5"/>';                           // cheek light
    return s;
  }
  function glasses(cy) { return '<circle class="gl" cx="43.5" cy="' + cy + '" r="5.2"/><circle class="gl" cx="56.5" cy="' + cy + '" r="5.2"/><path class="gl" d="M48.7 ' + cy + 'h2.6M38.3 ' + (cy - 1) + 'l-3.4-1.2M61.7 ' + (cy - 1) + 'l3.4-1.2"/>'; }
  var SH = 'M6 100c2-26 17-38 44-38s42 12 44 38z';
  function suit(r, col) { return '<path class="' + (col || 's1') + '" d="' + SH + '"/><path class="hatch" d="' + SH + '"/>'; }
  function shirt(tie, r) {
    return '<path class="shirt" d="M40 63l10 18 10-18-3-2h-14z"/><path class="ln" d="M40 63l10 18 10-18"/>' +
      (tie ? '<path class="ac" d="M47.6 66l2.4 3 2.4-3-1 3 3 20-4.4 5-4.4-5 3-20z"/><path class="ln" d="M50 69v22"/>' : '<path class="ln" d="M50 66v18"/>') +
      '<path class="lap" d="M30 66l12-4 8 20-8 10-14-12z"/><path class="lap" d="M70 66l-12-4-8 20 8 10 14-12z"/>' +
      '<path class="ln" d="M36 80l6 6M64 80l-6 6"/><circle class="hi" cx="58" cy="76" r="1.2"/>';
  }
  function pocket(r) { return '<path class="ln" d="M60 86h12"/><path class="hi" d="M62 82l3-3 3 3z" opacity=".7"/>'; }

  var ART = {};
  ART.person = { eye: 37, draw: function (r) {   // mugshot height chart
    var bg = '<rect class="s3" x="0" y="0" width="100" height="100"/>', i;
    for (i = 0; i < 8; i++) bg += '<path class="ln2" d="M0 ' + (12 + i * 11) + 'h' + (i % 2 ? 12 : 20) + 'M100 ' + (12 + i * 11) + 'h' + (i % 2 ? -12 : -20) + '"/>';
    bg += '<text class="ch" x="3" y="10">180</text><text class="ch" x="3" y="43">170</text><text class="ch" x="3" y="76">160</text><text class="ch" x="84" y="10">180</text>';
    return bg + suit(r) + shirt(r() > .5, r) + head(r, { eye: 37 });
  } };
  ART.agent = { eye: 38, draw: function (r) {   // trench coat, fedora, venetian-blind light
    var bg = '<rect class="s3" width="100" height="100"/><rect fill="url(#un-spot)" width="100" height="100"/>', i, x;
    for (i = 0; i < 9; i++) bg += '<path class="lt" opacity=".13" d="M' + (-10 + i * 14) + ' 0l16 0-30 100h-16z"/>';
    bg += '<g class="s1">'; for (x = 0, i = 0; x < 100; i++) { var w = 8 + r() * 10, hh = 10 + r() * 26; bg += '<rect x="' + f(x) + '" y="' + f(100 - hh) + '" width="' + f(w) + '" height="' + f(hh) + '"/>'; x += w + 1; } bg += '</g>';
    for (i = 0; i < 22; i++) bg += '<rect class="hi" opacity=".5" x="' + f(r() * 96) + '" y="' + f(74 + r() * 24) + '" width="1.6" height="1.6"/>';
    var coat = '<path class="s2" d="M2 100c3-28 18-40 48-40s45 12 48 40z"/><path class="hatch" d="M2 100c3-28 18-40 48-40s45 12 48 40z"/>' +
      '<path class="shirt" d="M42 61l8 14 8-14z"/><path class="ac" d="M48 66l2 2.6 2-2.6-.8 2.6 2 18-3.2 3-3.2-3 2-18z"/>' +
      '<path class="s1" d="M26 66l16-8 6 22-8 20-22-8z"/><path class="s1" d="M74 66L58 58l-6 22 8 20 22-8z"/><path class="ln" d="M28 70l14 6M72 70l-14 6M40 80l8 14M60 80l-8 14"/>' +
      '<path class="s1" d="M30 64c4-8 10-12 20-12s16 4 20 12l-6 6c-4-5-9-7-14-7s-10 2-14 7z"/><circle class="hi" cx="40" cy="88" r="1.4"/><circle class="hi" cx="40" cy="95" r="1.4"/>';
    var hat = '<path class="s3" d="M17 31c7-4 19-5 33-5s26 1 33 5c-6 4-18 6-33 6s-27-2-33-6z"/><path class="s2" d="M33 30c0-13 6-20 17-20s17 7 17 20z"/><path class="s3" d="M33 28h34v5H33z"/><path class="lt" d="M33 27h34v1.4H33z" opacity=".7"/><path class="hatch" d="M33 30c0-13 6-20 17-20s17 7 17 20z"/><path class="sh" d="M34 36h32l2-4H32z" opacity=".6"/>';
    return bg + coat + head(r, { eye: 38, cy: 41, rx: 14, ry: 16, bare: true, face: pick(r, [0, 0, 1, 3]) }) + hat;
  } };
  ART.official = { eye: 36, draw: function (r) {   // suit or uniform, flag drape and wall panel
    var bg = '<rect class="s3" width="100" height="100"/><rect class="s1" x="0" y="0" width="22" height="100"/>', i;
    for (i = 0; i < 5; i++) bg += '<path class="s2" opacity=".7" d="M' + (i * 4.4) + ' 0q3 50 0 100h4q3-50 0-100z"/>';
    bg += '<rect class="ln2" x="70" y="14" width="22" height="28" fill="none"/><rect class="s2" x="73" y="17" width="16" height="22"/><circle class="hi" opacity=".5" cx="81" cy="28" r="4"/><rect fill="url(#un-spot)" width="100" height="100"/>';
    var uni = r() > .45, body;
    if (uni) body = suit(r, 's2') + '<path class="shirt" d="M42 62l8 14 8-14z"/><path class="ac" d="M48 66l2 2 2-2-.6 2 1.6 12-3 3-3-3 1.6-12z"/><path class="s1" d="M34 64l14-3 2 24-12 12z M66 64l-14-3-2 24 12 12z"/>' +
      '<path class="hi" d="M16 70l16-3 2 5-16 3z M84 70l-16-3-2 5 16 3z"/><path class="ln" d="M17 73l14-2.6M83 73l-14-2.6"/><g class="hi">' + (function () { var t = ''; for (var j = 0; j < 4; j++) t += '<rect x="' + (62 + (j % 2) * 5) + '" y="' + (74 + Math.floor(j / 2) * 4.5) + '" width="4" height="3"/>'; return t; })() + '</g><circle class="hi" cx="50" cy="88" r="1.5"/><circle class="hi" cx="50" cy="94" r="1.5"/>';
    else body = suit(r) + shirt(true, r) + pocket(r);
    var cap = uni ? '<path class="s3" d="M30 28c0-10 8-15 20-15s20 5 20 15z"/><path class="s1" d="M28 28h44v5H28z"/><path class="hi" d="M44 18h12v6H44z" opacity=".75"/><path class="s3" d="M32 33h36l-3 3H35z"/>' : '';
    return bg + body + head(r, { eye: 36, bare: uni, face: pick(r, [0, 1, 1, 2]) }) + cap;
  } };
  ART.leader = { eye: 39, draw: function (r) {   // sunburst, sash, medals, peaked cap
    var bg = '<rect class="s3" width="100" height="100"/>', i;
    for (i = 0; i < 18; i++) { var a0 = i * Math.PI / 9, a1 = a0 + Math.PI / 18; bg += '<path class="s2" opacity="' + (i % 2 ? .55 : .25) + '" d="M50 44L' + f(50 + Math.cos(a0) * 90) + ' ' + f(44 + Math.sin(a0) * 90) + 'L' + f(50 + Math.cos(a1) * 90) + ' ' + f(44 + Math.sin(a1) * 90) + 'z"/>'; }
    var body = suit(r, 's2') + '<path class="shirt" d="M42 62l8 14 8-14z"/><path class="ac" d="M24 66l12-4 50 36h-14z" opacity=".85"/><path class="ln" d="M24 66l48 32"/>' +
      '<path class="s1" d="M32 64l14-2 4 26-14 10zM68 64l-14-2-4 26 14 10z"/><g class="hi"><circle cx="30" cy="79" r="2.4"/><circle cx="36" cy="82" r="2.4"/><circle cx="30" cy="86" r="2.4"/><rect x="62" y="76" width="8" height="3"/><rect x="62" y="81" width="8" height="3"/></g>' +
      '<path class="hi" d="M12 74l14-3 2 5-14 3zM88 74l-14-3-2 5 14 3z"/>';
    var cap = '<path class="s3" d="M28 31c0-12 9-19 22-19s22 7 22 19z"/><path class="s2" d="M24 31h52v5H24z"/><path class="hi" d="M44 18h12l-1.5 8h-9z"/><circle class="ac" cx="50" cy="22" r="2.4"/><path class="s3" d="M30 36h40l-4 4H34z"/><path class="ln" d="M24 33h52"/>';
    return bg + body + head(r, { eye: 39, cy: 41, bare: true, face: pick(r, [0, 1, 1, 3]) }) + cap;
  } };
  ART.dissident = { eye: 38, draw: function (r) {   // glasses, scarf, shelf of books
    var bg = '<rect class="s3" width="100" height="100"/>', i, x;
    for (i = 0; i < 3; i++) { bg += '<rect class="s2" x="0" y="' + (30 + i * 24) + '" width="100" height="2.4"/>'; x = 1; while (x < 100) { var w = 3 + r() * 5, hh = 9 + r() * 12; bg += '<rect class="' + pick(r, ['s1', 's2', 'lt-b', 's1']) + '" x="' + f(x) + '" y="' + f(30 + i * 24 - hh) + '" width="' + f(w) + '" height="' + f(hh) + '"/>'; x += w + .6; } }
    bg += '<rect fill="url(#un-spot)" width="100" height="100"/>';
    var body = suit(r, 's1') + '<path class="shirt" d="M42 62l8 12 8-12z"/><path class="lap" d="M30 66l12-4 8 18-8 10-14-12z"/><path class="lap" d="M70 66l-12-4-8 18 8 10 14-12z"/>' +
      '<path class="ac" d="M26 64c8 8 16 11 24 11s16-3 24-11l5 5c-9 10-18 14-29 14s-20-4-29-14z" opacity=".9"/><path class="ln" d="M30 70c6 5 12 8 20 8s14-3 20-8M33 74c5 4 10 6 17 6s12-2 17-6"/><path class="ac" d="M42 80l-4 18h8l2-14z"/>' +
      '<path class="hi" d="M70 84l14-14 3 3-14 14z" opacity=".75"/>';
    return bg + body + head(r, { eye: 38, face: pick(r, [1, 2, 2, 0]), hair: pick(r, [0, 1, 2, 3, 4]) }) + glasses(38);
  } };
  ART.militant = { eye: 40, draw: function (r) {   // balaclava, rifle strap, concrete wall, barbed wire
    var bg = '<rect class="s3" width="100" height="100"/><rect fill="url(#un-brick)" width="100" height="100"/>', i;
    for (i = 0; i < 6; i++) bg += '<circle class="s1" cx="' + f(r() * 100) + '" cy="' + f(30 + r() * 60) + '" r="' + f(1 + r() * 2.4) + '"/>';
    bg += '<path class="hi-l" d="M0 14l7 6 7-6 7 6 7-6 7 6 7-6 7 6 7-6 7 6 7-6 7 6 7-6 7 6 7-6" opacity=".75"/><path class="hi-l" d="M0 19h100" opacity=".5"/>';
    var body = suit(r, 's1') + '<path class="s2" d="M6 100c2-26 17-38 44-38s42 12 44 38z" opacity=".5"/><path class="hatch" d="' + SH + '"/>' +
      '<path class="s3" d="M20 98l62-44 6 6-62 44z"/><path class="hi" d="M20 98l62-44" opacity=".5"/><path class="s3" d="M74 38l22-16 1.6 2.2-22 16z"/><rect class="s2" x="28" y="76" width="10" height="9"/><rect class="s2" x="42" y="76" width="10" height="9"/><rect class="ln2" x="28" y="76" width="10" height="9" fill="none"/>';
    var mask = '<path class="s1" d="M29 54c0-26 8-37 21-37s21 11 21 37v6c-6 5-13 8-21 8s-15-3-21-8z"/><path class="hatch" d="M29 54c0-26 8-37 21-37s21 11 21 37v6c-6 5-13 8-21 8s-15-3-21-8z"/>' +
      '<path class="ln" d="M33 28q17-9 34 0M32 56q18 8 36 0M36 62q14 6 28 0"/><path class="s3" d="M33 36h34v9H33z"/><path class="hi-l" d="M36 49q14 4 28 0" opacity=".6"/>';
    return bg + body + '<path class="sk2" d="M41 56h18v12H41z"/>' + mask;
  } };
  ART.trader = { eye: 36, draw: function (r) {   // port crane, crates, briefcase
    var bg = '<rect class="s3" width="100" height="100"/><rect fill="url(#un-spot)" width="100" height="100"/><path class="s2" d="M70 0h4v46h-4z M62 12h30v3H62z M64 12l8-8 8 8" /><path class="ln" d="M90 15v22"/><rect class="ac" x="86" y="37" width="8" height="6" opacity=".8"/>';
    for (var i = 0; i < 3; i++) bg += '<rect class="' + (i % 2 ? 's1' : 's2') + '" x="' + (4 + i * 15) + '" y="' + (62 - (i % 2) * 14) + '" width="14" height="' + (24 + (i % 2) * 14) + '"/><path class="ln2" d="M' + (4 + i * 15) + ' ' + (68 - (i % 2) * 14) + 'h14"/>';
    var body = suit(r) + shirt(true, r) + '<rect class="s3" x="60" y="78" width="30" height="20"/><rect class="s2" x="60" y="84" width="30" height="3"/><path class="hi-l" d="M69 78v-5h12v5"/><rect class="hi" x="73" y="83" width="4" height="5"/><path class="ln" d="M60 78h30v20H60z"/>';
    var hat = r() > .5 ? '<path class="s3" d="M32 25c2-10 9-14 18-14s16 4 18 14z"/><rect class="s2" x="28" y="25" width="44" height="4"/>' : '';
    return bg + body + head(r, { eye: 36, bare: !!hat, face: pick(r, [0, 1, 2, 3]) }) + hat;
  } };

  /* ---------- groups, places, events ---------- */
  ART.org = { draw: function (r) {   // institution: three kinds of building
    var v = Math.floor(r() * 3), s = '<rect class="s3" width="100" height="100"/><rect fill="url(#un-spot)" width="100" height="100"/>', i;
    for (i = 0; i < 12; i++) s += '<rect class="hi" opacity=".5" x="' + f(r() * 98) + '" y="' + f(r() * 30) + '" width="1.2" height="1.2"/>';
    if (v === 0) {         // columned hall
      s += '<path class="s2" d="M10 34L50 12l40 22z"/><path class="s1" d="M20 33L50 17l30 16z"/><circle class="ac" cx="50" cy="27" r="3"/><path class="ln" d="M10 34L50 12l40 22"/><rect class="s2" x="10" y="35" width="80" height="6"/><path class="ln2" d="M12 38h76"/>';
      for (i = 0; i < 6; i++) s += '<rect class="s1" x="' + (14 + i * 13) + '" y="42" width="7" height="38"/><path class="ln2" d="M' + (16 + i * 13) + ' 43v36M' + (19 + i * 13) + ' 43v36"/><rect class="s2" x="' + (12.5 + i * 13) + '" y="42" width="10" height="3"/><rect class="s2" x="' + (12.5 + i * 13) + '" y="78" width="10" height="3"/>';
      s += '<rect class="s2" x="8" y="82" width="84" height="4"/><rect class="s2" x="4" y="86" width="92" height="4"/><rect class="s2" x="0" y="90" width="100" height="10"/><path class="ln2" d="M0 94h100M0 97h100"/><rect class="shirt" x="42" y="48" width="16" height="3" opacity=".6"/>';
    } else if (v === 1) {  // tower block
      s += '<rect class="s2" x="24" y="14" width="52" height="82"/><rect class="s1" x="30" y="20" width="40" height="76"/><rect class="s3" x="46" y="2" width="2" height="12"/><circle class="ac" cx="47" cy="3" r="1.6"/>';
      for (var yy = 0; yy < 8; yy++) for (var xx = 0; xx < 5; xx++) s += '<rect class="' + (r() > .6 ? 'hi' : 's3') + '" x="' + (33 + xx * 7.2) + '" y="' + (24 + yy * 9) + '" width="4.6" height="5.4"' + (r() > .6 ? ' opacity=".8"' : '') + '/>';
      s += '<rect class="s3" x="0" y="80" width="26" height="20"/><rect class="s3" x="74" y="72" width="26" height="28"/><rect class="s2" x="42" y="82" width="16" height="14"/><path class="ln" d="M50 82v14"/>';
    } else {               // domed rotunda
      s += '<path class="s2" d="M24 54a26 26 0 0 1 52 0z"/><path class="hatch" d="M24 54a26 26 0 0 1 52 0z"/><path class="ln" d="M50 28v26M38 31l4 23M62 31l-4 23M30 40l9 14M70 40l-9 14"/><rect class="s3" x="48.6" y="16" width="2.8" height="12"/><path class="ac" d="M51 16l8 2.6-8 2.6z"/>' +
        '<rect class="s2" x="18" y="54" width="64" height="5"/><rect class="s1" x="22" y="59" width="56" height="28"/>';
      for (i = 0; i < 7; i++) s += '<path class="s3" d="M' + (25 + i * 7.4) + ' 86v-17a2.6 2.6 0 0 1 5.2 0v17z"/>';
      s += '<rect class="s2" x="12" y="87" width="76" height="4"/><rect class="s2" x="6" y="91" width="88" height="9"/>';
    }
    s += '<g class="redact"><rect x="26" y="' + (v === 1 ? 90 : 62) + '" width="22" height="2.8"/><rect x="52" y="' + (v === 1 ? 90 : 62) + '" width="14" height="2.8"/></g>';
    return s;
  } };
  ART.state = { draw: function (r) {   // draped flag on a pole, globe lines behind
    var s = '<rect class="s3" width="100" height="100"/><circle class="s3-s" cx="58" cy="50" r="44"/><path class="s3-s" d="M58 6a20 44 0 0 0 0 88a20 44 0 0 0 0-88M14 50h88M22 28h72M22 72h72"/><rect fill="url(#un-spot)" width="100" height="100"/>';
    s += '<rect class="s2" x="18" y="8" width="4.4" height="88"/><circle class="hi" cx="20.2" cy="7" r="3.4"/><rect class="s2" x="12" y="94" width="16" height="5"/>';
    var bands = r() > .5 ? ['s1', 'lt-b', 's2'] : ['s2', 's1', 's3'], y0 = 14, hh = 11, bx = 22.4, ww = 68;
    for (var b = 0; b < 3; b++) { var yb = y0 + b * hh, d = 'M' + bx + ' ' + yb;
      for (var k = 0; k <= 4; k++) d += 'Q' + f(bx + ww * (k + .5) / 4) + ' ' + f(yb + (k % 2 ? 5 : -5)) + ' ' + f(bx + ww * (k + 1) / 4) + ' ' + f(yb + (k % 2 ? 3 : -3) * 0);
      d += 'V' + (yb + hh); for (k = 4; k >= 0; k--) d += 'Q' + f(bx + ww * (k + .5) / 4) + ' ' + f(yb + hh + (k % 2 ? 5 : -5)) + ' ' + f(bx + ww * k / 4) + ' ' + f(yb + hh);
      s += '<path class="' + bands[b] + '" d="' + d + 'z"/>'; }
    s += '<path class="hatch" d="M' + bx + ' 9q17 -8 34 0t34 0V' + 49 + 'q-17 8 -34 0t-34 0z"/><path class="hi-l" d="M26 22q16 -7 32 0t30 0" opacity=".5"/>';
    s += pick(r, ['<path class="hi" d="M52 31l1.6 4.4 4.6.2-3.7 2.8 1.3 4.5-3.8-2.6-3.8 2.6 1.3-4.5-3.7-2.8 4.6-.2z"/>', '<path class="hi" d="M58 31a7 7 0 1 0 4 12a5.6 5.6 0 1 1-4-12z"/>', '<circle class="hi" cx="56" cy="37" r="5" opacity=".8"/>']);
    s += '<text class="ch" x="28" y="76">STATE</text><rect class="redact" x="28" y="80" width="30" height="3"/><rect class="redact" x="28" y="86" width="20" height="3"/>';
    return s;
  } };
  ART.place = { draw: function (r) {   // contour map, route, pin, compass
    var s = '<rect class="s3" width="100" height="100"/>', i;
    for (i = 6; i >= 1; i--) { var rr = i * 7.2, pts = []; for (var a = 0; a < 12; a++) { var an = a / 12 * Math.PI * 2, d = rr * (.82 + r() * .4); pts.push([f(50 + Math.cos(an) * d * 1.18), f(52 + Math.sin(an) * d * .9)]); }
      s += '<path class="' + (i % 2 ? 'cl' : 'cl2') + '" d="M' + pts[0] + pts.slice(1).map(function (p) { return 'L' + p; }).join('') + 'z"/>'; }
    for (i = 1; i < 5; i++) s += '<path class="ln2" d="M' + (i * 20) + ' 0v100M0 ' + (i * 20) + 'h100"/>';
    s += '<path class="ac-l" d="M8 90q16-18 30-8t28-12 26-30" fill="none" stroke-dasharray="3 2.4"/><circle class="s3" cx="8" cy="90" r="2.4"/>';
    s += '<ellipse class="s3" cx="52" cy="76" rx="9" ry="3" opacity=".8"/><path class="pin" d="M50 24c-12 0-20 8-20 20 0 15 20 33 20 33s20-18 20-33c0-12-8-20-20-20zm0 12a8 8 0 1 1 0 16 8 8 0 0 1 0-16z" fill-rule="evenodd"/>';
    s += '<g transform="translate(84 18)"><circle class="ln2" r="9" fill="none"/><path class="hi" d="M0-9l2.6 9h-5.2zM0 9l-2.6-9h5.2z" opacity=".8"/><text class="ch" y="-11" x="-2" >N</text></g>';
    s += '<path class="hi-l" d="M6 96h22M6 94v4M17 94.6v2.8M28 94v4" />';
    return s;
  } };
  ART.airfield = { draw: function (r) {   // runway, tower, windsock, jet seen from above
    var s = '<rect class="s3" width="100" height="100"/><rect fill="url(#un-dots)" width="100" height="100"/>', i;
    s += '<rect class="s1" x="38" y="0" width="24" height="100"/><rect class="hatch" x="38" y="0" width="24" height="100"/><path class="lt" opacity=".75" d="M49 4h2v8h-2zM49 20h2v8h-2zM49 36h2v8h-2zM49 52h2v8h-2zM49 68h2v8h-2zM49 84h2v8h-2z"/>';
    for (i = 0; i < 6; i++) s += '<rect class="lt" opacity=".6" x="' + (41 + i * 3.4) + '" y="2" width="1.6" height="9"/><rect class="lt" opacity=".6" x="' + (41 + i * 3.4) + '" y="89" width="1.6" height="9"/>';
    s += '<rect class="s1" x="62" y="62" width="30" height="7"/><rect class="s1" x="12" y="24" width="26" height="6"/><rect class="s2" x="70" y="30" width="18" height="12"/><rect class="s2" x="76" y="20" width="6" height="12"/><rect class="s3" x="74" y="16" width="14" height="6"/><rect class="hi" opacity=".8" x="75" y="18" width="12" height="2"/>';
    s += '<g class="s2"><rect x="8" y="64" width="12" height="20"/><rect x="22" y="70" width="10" height="14"/></g><path class="ln2" d="M8 74h12"/><path class="ac" d="M16 12l14 4-14 4z"/><path class="ln" d="M16 8v24"/>';
    s += '<g transform="translate(0 0)"><ellipse class="s3" cx="53" cy="56" rx="22" ry="7" opacity=".5"/><path class="lt" d="M50 22l3 9 1 10 26 16 3 7-29-8-1 12 8 8v4l-11-3-11 3v-4l8-8-1-12-29 8 3-7 26-16 1-10z"/><path class="s2" d="M50 28l1 12 22 14M50 28l-1 12-22 14" opacity=".6"/><path class="ln" d="M50 24v46"/></g>';
    return s;
  } };
  ART.mapped = { draw: function (r) {   // street plan with coast, pin ringed in teal
    var s = '<rect class="s3" width="100" height="100"/><path class="water" d="M0 0h100v26q-24 10-46 4T0 38z"/><path class="ln2" d="M0 38q24-6 54-8t46-4"/>', i, x, y;
    for (x = 0; x < 5; x++) for (y = 0; y < 4; y++) s += '<rect class="' + ((x + y) % 3 ? 's1' : 's2') + '" x="' + (6 + x * 19) + '" y="' + (44 + y * 14) + '" width="' + f(14 + r() * 3) + '" height="' + f(9 + r() * 2) + '"/>';
    s += '<path class="road" d="M0 94L100 40M30 100L96 62M8 56H100"/><path class="road" d="M52 40v60M74 44v56M28 46v54"/>';
    s += '<circle class="ring" cx="50" cy="48" r="20"/><circle class="ring" cx="50" cy="48" r="30" opacity=".5"/><path class="mp" d="M50 22c-11 0-19 8-19 19 0 14 19 31 19 31s19-17 19-31c0-11-8-19-19-19zm0 11a8 8 0 1 1 0 16 8 8 0 0 1 0-16z" fill-rule="evenodd"/>';
    s += '<text class="ch" x="4" y="97">TRIPOLI</text>';
    return s;
  } };
  ART.event = { draw: function (r) {   // blast: shock rings, shards, halftone, hot core
    var s = '<rect class="s3" width="100" height="100"/><rect fill="url(#un-dots)" width="100" height="100"/>', i;
    for (i = 4; i >= 1; i--) s += '<circle class="s3-s" cx="50" cy="52" r="' + (i * 11) + '" opacity="' + (1 - i * .15) + '"/>';
    var pts = [], n = 18; for (i = 0; i < n * 2; i++) { var a = i / (n * 2) * Math.PI * 2, d = i % 2 ? 22 : 42 + r() * 6; pts.push(f(50 + Math.cos(a) * d) + ' ' + f(52 + Math.sin(a) * d)); }
    s += '<path class="s2" d="M' + pts.join('L') + 'z"/><path class="hatch" d="M' + pts.join('L') + 'z"/>';
    pts = []; for (i = 0; i < n * 2; i++) { var a2 = i / (n * 2) * Math.PI * 2 + .1, d2 = i % 2 ? 11 : 26 + r() * 4; pts.push(f(50 + Math.cos(a2) * d2) + ' ' + f(52 + Math.sin(a2) * d2)); }
    s += '<path class="ac" d="M' + pts.join('L') + 'z"/><circle class="hi" cx="50" cy="52" r="8" opacity=".9"/><circle class="s3" cx="50" cy="52" r="3.4"/>';
    for (i = 0; i < 14; i++) { var a3 = r() * Math.PI * 2, d3 = 30 + r() * 20; s += '<path class="lt" opacity=".6" transform="translate(' + f(50 + Math.cos(a3) * d3) + ' ' + f(52 + Math.sin(a3) * d3) + ') rotate(' + Math.floor(r() * 180) + ')" d="M0-3l1.6 3-1.6 3-1.6-3z"/>'; }
    s += '<rect class="redact" x="20" y="88" width="60" height="4"/>';
    return s;
  } };
  ART.unknown = { eye: 37, draw: function (r) {   // an unidentified figure in static
    var s = '<rect class="s3" width="100" height="100"/><rect fill="url(#un-dots)" width="100" height="100"/>', i;
    for (i = 0; i < 26; i++) s += '<rect class="s2" opacity=".5" x="' + f(r() * 90) + '" y="' + f(r() * 98) + '" width="' + f(6 + r() * 20) + '" height="1.2"/>';
    s += suit(r, 's1') + '<path class="shirt" d="M42 62l8 12 8-12z" opacity=".5"/>' + head(r, { eye: 37, bare: true, face: 0 }) +
      '<path class="s1" d="M30 31c1-12 9-18 20-18s19 6 20 18c-6-4-13-6-20-6s-14 2-20 6z"/>' +
      '<path class="hi" d="M44 14c0-4 3-7 7-7s7 3 7 7c0 5-6 6-6 11h-3c0-7 6-8 6-11 0-2-2-4-4-4s-4 2-4 4zM50 28h3v3h-3z" transform="translate(0 2)"/>';
    return s;
  } };

  /* the finishing pass: vignette, scanlines and a corner tick, so every card looks like a scanned file */
  function finish() { return '<rect fill="url(#un-vig)" width="100" height="100"/><rect fill="url(#un-scan)" width="100" height="100"/><path class="tick" d="M3 10V3h7M90 3h7v7M97 90v7h-7M10 97H3v-7"/>'; }

  window.ATLAS_ART = {
    defs: defs, finish: finish, rng: rng,
    cls: function (p, seed) { var r = rng((seed || 1) + 91), t = 't' + Math.floor(r() * 4), hh = 'h' + Math.floor(r() * 4), a = /^(person|agent|official|leader|dissident|militant|trader|unknown)$/.test(p) ? ' a' + Math.floor(r() * 3) : ''; return t + ' ' + hh + a; },
    eye: function (p) { return ART[p] && ART[p].eye; },
    draw: function (p, seed) { var a = ART[p] || ART.unknown; return a.draw(rng((seed || 1) * 2654435761 + p.length * 977)); }
  };
})();
