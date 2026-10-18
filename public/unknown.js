/* The Unknown: a separate black plane showing the people, groups and outside places that the declassified files connect.
   Data: data/unknown.js (scripts/build-unknown.py). Pictures are symbolic stand-ins drawn here, never likenesses. */
(function () {
  'use strict';
  var API = window.ATLAS_API, h = API.h;
  var NS = 'http://www.w3.org/2000/svg';
  var D = null, root = null, svg = null, vp = null, edgeEls = [], nodeEls = [], adj = [], sel = null, hover = null, typeFilter = null;
  var view = { x: 0, y: 0, k: 1 };

  /* ---------- the pictures (viewBox 0 0 100 100; classes set the tones) ---------- */
  var SHOULDERS = '<path class="s1" d="M8 100c2-24 18-36 42-36s40 12 42 36z"/>';
  var PICS = {
    person: { eye: 36, body: SHOULDERS + '<circle class="s1" cx="50" cy="38" r="17"/><path class="s2" d="M33 38a17 17 0 0 1 34 0c-4-9-11-12-17-12s-13 3-17 12z"/>' },
    agent: { eye: 38, body: '<path class="s1" d="M6 100c3-26 17-38 44-38s41 12 44 38z"/><path class="s2" d="M36 62l14 22 14-22 8 6-22 32-22-32z"/><circle class="s1" cx="50" cy="40" r="15"/>' +
      '<path class="s3" d="M22 30c8-3 18-4 28-4s20 1 28 4c-6 3-16 4-28 4s-22-1-28-4z"/><path class="s3" d="M35 29c0-11 6-17 15-17s15 6 15 17z"/><rect class="s2" x="35" y="23" width="30" height="4"/>' },
    official: { eye: 35, body: '<path class="s1" d="M8 100c2-24 18-36 42-36s40 12 42 36z"/><path class="lt" d="M40 64l10 22 10-22z"/><path class="s3" d="M47.5 67h5l2 20-4.5 6-4.5-6z"/>' +
      '<circle class="s1" cx="50" cy="37" r="16"/><path class="s3" d="M34 33c1-10 8-15 16-15s15 5 16 15c-5-5-10-7-16-7s-11 2-16 7z"/>' },
    leader: { eye: 39, body: '<path class="s1" d="M8 100c2-24 18-36 42-36s40 12 42 36z"/><rect class="s2" x="16" y="70" width="18" height="6"/><rect class="s2" x="66" y="70" width="18" height="6"/>' +
      '<circle class="s1" cx="50" cy="40" r="15"/><path class="s3" d="M28 30h44l-6-14H34z"/><path class="s2" d="M30 30h40v4H30z"/><rect class="s3" x="36" y="36" width="28" height="7"/>' },
    dissident: { eye: 38, body: '<path class="s1" d="M8 100c2-24 18-36 42-36s40 12 42 36z"/><path class="s2" d="M30 66c6 6 13 9 20 9s14-3 20-9l4 6c-7 7-15 10-24 10s-17-3-24-10z"/>' +
      '<circle class="s1" cx="50" cy="38" r="16"/><path class="s3" d="M33 36c0-12 8-19 17-19s17 7 17 19c-3-6-6-8-9-9-4 4-12 5-25 9z"/>' +
      '<circle class="lt-s" cx="43" cy="40" r="4.5"/><circle class="lt-s" cx="57" cy="40" r="4.5"/><path class="lt-s" d="M47.5 40h5"/>' },
    militant: { eye: 40, body: '<path class="s1" d="M8 100c2-24 18-36 42-36s40 12 42 36z"/><path class="s1" d="M30 52c0-24 8-34 20-34s20 10 20 34v8c-6 5-13 7-20 7s-14-2-20-7z"/>' +
      '<rect class="lt" x="35" y="37" width="30" height="7"/><circle class="s3" cx="42" cy="40.5" r="2.4"/><circle class="s3" cx="58" cy="40.5" r="2.4"/><path class="s2" d="M30 60c6 5 13 7 20 7s14-2 20-7v6c-6 5-13 7-20 7s-14-2-20-7z"/>' },
    trader: { eye: 36, body: '<path class="s1" d="M8 100c2-24 18-36 42-36s40 12 42 36z"/><path class="lt" d="M43 64l7 16 7-16z"/><circle class="s1" cx="50" cy="38" r="16"/>' +
      '<path class="s3" d="M34 34c2-10 8-14 16-14s14 4 16 14c-6-4-11-5-16-5s-10 1-16 5z"/><rect class="s3" x="58" y="76" width="30" height="20"/><rect class="s2" x="58" y="82" width="30" height="3"/><path class="s2" d="M67 76v-4h12v4h-3v-1.5h-6V76z"/>' },
    org: { body: '<path class="s2" d="M14 34L50 14l36 20z"/><rect class="s2" x="14" y="36" width="72" height="6"/><rect class="s1" x="20" y="44" width="8" height="36"/><rect class="s1" x="36" y="44" width="8" height="36"/>' +
      '<rect class="s1" x="56" y="44" width="8" height="36"/><rect class="s1" x="72" y="44" width="8" height="36"/><rect class="s2" x="10" y="82" width="80" height="6"/><rect class="s3" x="6" y="90" width="88" height="6"/>' },
    state: { body: '<rect class="s2" x="22" y="10" width="5" height="84"/><rect class="s3" x="14" y="92" width="22" height="5"/><path class="s1" d="M27 14c12-5 22 4 34 0s18-4 26 0v34c-8-4-14-4-26 0s-22-5-34 0z"/>' +
      '<path class="s3" d="M27 31c12-5 22 4 34 0s18-4 26 0v4c-8-4-14-4-26 0s-22-5-34 0z"/>' },
    place: { body: '<circle class="s3-s" cx="50" cy="50" r="38"/><circle class="s3-s" cx="50" cy="50" r="24"/><path class="s3-s" d="M50 4v92M4 50h92"/>' +
      '<path class="s1" d="M50 22c-12 0-21 9-21 21 0 16 21 37 21 37s21-21 21-37c0-12-9-21-21-21zm0 13a8 8 0 1 1 0 16 8 8 0 0 1 0-16z" fill-rule="evenodd"/>' },
    airfield: { body: '<rect class="s3" x="40" y="4" width="20" height="92"/><path class="s2" d="M49 10h2v10h-2zM49 28h2v10h-2zM49 46h2v10h-2zM49 64h2v10h-2zM49 82h2v10h-2z"/>' +
      '<path class="s1" d="M50 30l3 8 1 9 24 14 2 6-26-7-1 13 7 6v3l-10-3-10 3v-3l7-6-1-13-26 7 2-6 24-14 1-9z"/>' },
    mapped: { body: '<rect class="s3" x="8" y="8" width="84" height="84"/><path class="map-s" d="M8 34h84M8 64h84M34 8v84M66 8v84"/>' +
      '<path class="mp" d="M50 18c-12 0-21 9-21 21 0 16 21 37 21 37s21-21 21-37c0-12-9-21-21-21zm0 13a8 8 0 1 1 0 16 8 8 0 0 1 0-16z" fill-rule="evenodd"/>' },
    event: { body: '<path class="s1" d="M50 6l8 22 20-12-8 22 24 4-20 14 16 18-24-4 2 24-18-16-18 16 2-24-24 4 16-18-20-14 24-4-8-22 20 12z"/><circle class="s3" cx="50" cy="50" r="12"/>' },
    unknown: { body: '<path class="s1" d="M8 100c2-24 18-36 42-36s40 12 42 36z"/><circle class="s1" cx="50" cy="38" r="17"/>' +
      '<path class="lt" d="M44 30c0-4 3-7 7-7s7 3 7 7c0 5-6 6-6 11h-3c0-7 6-8 6-11 0-2-2-4-4-4s-4 2-4 4zM50 44h3v3h-3z"/>' }
  };
  var PIC_LABEL = {
    agent: 'Person in intelligence, covert or security work', official: 'Person: official or officer', leader: 'Person: head of state', dissident: 'Person: dissident, exile or student',
    militant: 'Person: gunman or militant', trader: 'Person in business or the arms trade', person: 'Person', org: 'Organisation', state: 'Country', place: 'Place outside the Tripoli map',
    airfield: 'Airfield or air base outside the map', mapped: 'Place on the Tripoli map', event: 'Event', unknown: 'Not identified'
  };
  var LEGEND = [['agent', 'Covert work'], ['official', 'Officials'], ['dissident', 'Dissidents'], ['militant', 'Gunmen'], ['trader', 'Trade'], ['org', 'Organisations'], ['state', 'Countries'],
    ['place', 'Places'], ['mapped', 'On the map'], ['event', 'Events'], ['unknown', 'Unidentified']];
  function picOf(n) { return n.pic === 'place' && /air ?field|air ?base|airport/i.test(n.name) ? 'airfield' : (PICS[n.pic] ? n.pic : 'unknown'); }
  function famOf(p) { return { leader: 'official', person: 'unknown', airfield: 'place' }[p] || p; }
  function caseNo(i) { return 'UNK-' + String(i + 1).padStart(4, '0'); }
  function size(n) { return Math.round(36 + Math.min(44, Math.sqrt(n.n) * 9)); }

  /* a small picture for lists and the panel header */
  function picSvg(n, px) {
    var p = picOf(n), flip = n.seed % 2 ? ' transform="translate(100 0) scale(-1 1)"' : '';
    var bar = PICS[p].eye ? '<rect class="redact" x="27" y="' + (PICS[p].eye - 4) + '" width="46" height="8"/>' : '';
    return '<svg class="un-pic' + (p === 'mapped' ? ' on-map' : '') + '" viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true"><rect class="bg" width="100" height="100"/><g' + flip + '>' + PICS[p].body + '</g>' + bar + '</svg>';
  }
  function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  /* ---------- build the plane ---------- */
  function build() {
    D = window.ATLAS_UNKNOWN; if (!D) return;
    adj = D.nodes.map(function () { return []; });
    D.edges.forEach(function (e, i) { adj[e.s].push(i); adj[e.t].push(i); });
    root = h('div', { id: 'unknown', role: 'region', 'aria-label': 'The Unknown: people and groups linked in the files', hidden: '' });
    var head = h('div', { class: 'un-head' }, [
      h('div', { class: 'un-title' }, [h('h2', { text: 'The Unknown' }), h('p', { text: 'People, groups and places beyond Tripoli that the declassified files tie together. The pictures are stand-ins, not likenesses.' })]),
      h('div', { class: 'un-tools' }, [
        h('input', { type: 'search', id: 'un-q', placeholder: 'Find a name', 'aria-label': 'Find a name in The Unknown', autocomplete: 'off' }),
        h('button', { class: 'btn', type: 'button', id: 'un-fit', text: 'Show all' }),
        h('button', { class: 'btn primary', type: 'button', id: 'un-back', text: 'Back to the map' })])
    ]);
    svg = el('svg', { class: 'un-svg', role: 'img', 'aria-label': D.nodes.length + ' entities and ' + D.edges.length + ' links' });
    var defs = el('defs', {});
    defs.innerHTML = '<filter id="un-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .8  0 0 0 0 .78  0 0 0 0 .72  0 0 0 .55 0"/></filter>';
    svg.appendChild(defs);
    vp = el('g', {}); svg.appendChild(vp);
    var eg = el('g', { class: 'un-edges' }), ng = el('g', { class: 'un-nodes' });
    vp.appendChild(eg); vp.appendChild(ng);
    D.edges.forEach(function (e, i) {
      var a = D.nodes[e.s], b = D.nodes[e.t];
      var ln = el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'stroke-width': (0.8 + Math.log(1 + e.n) * 0.9).toFixed(2), pathLength: '1', class: 'un-e' });
      ln.style.animationDelay = (Math.min(1, Math.hypot(a.x, a.y) / 700) * 0.9).toFixed(2) + 's';
      eg.appendChild(ln); edgeEls.push(ln);
    });
    D.nodes.forEach(function (n, i) {
      var s = size(n), p = picOf(n);
      var g = el('g', { class: 'un-n f-' + famOf(p) + (n.n >= 4 ? ' big' : ''), transform: 'translate(' + n.x + ' ' + n.y + ')', tabindex: '0', role: 'button', 'aria-label': n.name + ', ' + PIC_LABEL[p] });
      g.innerHTML = '<rect class="shadow" x="' + (-s / 2 + 3) + '" y="' + (-s / 2 + 3) + '" width="' + s + '" height="' + s + '"/>' +
        '<g transform="translate(' + (-s / 2) + ' ' + (-s / 2) + ')">' + picSvg(n, s) + '</g>' +
        '<rect class="frame" x="' + (-s / 2) + '" y="' + (-s / 2) + '" width="' + s + '" height="' + s + '"/>' +
        '<text class="cn" x="' + (-s / 2) + '" y="' + (s / 2 + 11) + '">' + caseNo(i) + '</text>' +
        '<text class="nm" x="' + (-s / 2) + '" y="' + (s / 2 + 24) + '"></text>';
      g.querySelector('.nm').textContent = n.name.length > 34 ? n.name.slice(0, 32) + '…' : n.name;
      g.addEventListener('pointerenter', function () { hover = i; paint(); });
      g.addEventListener('pointerleave', function () { if (hover === i) { hover = null; paint(); } });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(i, true); } });
      g._i = i; ng.appendChild(g); nodeEls.push(g);
    });
    var grain = h('div', { class: 'un-grain', 'aria-hidden': 'true' });
    var legend = h('div', { class: 'un-legend', role: 'group', 'aria-label': 'Picture types' });
    var counts = {}; D.nodes.forEach(function (n) { var f = famOf(picOf(n)); counts[f] = (counts[f] || 0) + 1; });
    LEGEND.forEach(function (l) {
      if (!counts[l[0]]) return;
      var b = h('button', { type: 'button', 'aria-pressed': 'false', title: PIC_LABEL[l[0]] }, [h('span', { class: 'lg-pic', html: picSvg({ pic: l[0], seed: 0, name: '' }, 22) }), h('span', { text: l[1] }), h('small', { text: String(counts[l[0]]) })]);
      b.addEventListener('click', function () { typeFilter = typeFilter === l[0] ? null : l[0]; legend.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); if (typeFilter) b.setAttribute('aria-pressed', 'true'); paint(); });
      legend.appendChild(b);
    });
    var note = h('p', { class: 'un-note', text: 'Names and links were read from CIA, FBIS, JPRS and State Department files by AI (Claude Haiku). They can be wrong: open a card to see the documents behind it.' });
    root.appendChild(svg); root.appendChild(grain); root.appendChild(head); root.appendChild(legend); root.appendChild(note);
    document.body.appendChild(root);
    $id('un-back').onclick = close;
    $id('un-fit').onclick = function () { fit(true); };
    var q = $id('un-q');
    q.addEventListener('input', function () { paint(); });
    q.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { var m = matches(); if (m.length) select(m[0], true); } if (ev.key === 'Escape') { q.value = ''; paint(); } });
    wire();
  }
  function $id(x) { return document.getElementById(x); }
  function matches() {
    var v = ($id('un-q').value || '').trim().toLowerCase(); if (v.length < 2) return [];
    var out = []; D.nodes.forEach(function (n, i) { if ((n.name + ' ' + (n.aka || []).join(' ')).toLowerCase().indexOf(v) >= 0) out.push(i); }); return out;
  }

  /* ---------- highlight state ---------- */
  function paint() {
    var focus = sel != null ? sel : hover;
    var hot = {}, hotE = {};
    if (focus != null) { hot[focus] = 1; adj[focus].forEach(function (ei) { hotE[ei] = 1; hot[D.edges[ei].s] = 1; hot[D.edges[ei].t] = 1; }); }
    var m = matches(), mm = {}; m.forEach(function (i) { mm[i] = 1; });
    var filtering = focus != null || m.length || typeFilter;
    root.classList.toggle('dim', !!filtering);
    nodeEls.forEach(function (g, i) {
      var on = focus != null ? hot[i] : m.length ? mm[i] : typeFilter ? famOf(picOf(D.nodes[i])) === typeFilter : false;
      g.classList.toggle('hot', !!on); g.classList.toggle('sel', i === sel);
    });
    edgeEls.forEach(function (e, i) {
      var on = focus != null ? hotE[i] : false;
      if (!on && typeFilter && focus == null) { var a = D.nodes[D.edges[i].s], b = D.nodes[D.edges[i].t]; on = famOf(picOf(a)) === typeFilter && famOf(picOf(b)) === typeFilter; }
      e.classList.toggle('hot', !!on);
    });
  }

  /* ---------- pan and zoom ---------- */
  function apply() { vp.setAttribute('transform', 'translate(' + view.x.toFixed(1) + ' ' + view.y.toFixed(1) + ') scale(' + view.k.toFixed(3) + ')'); root.classList.toggle('near', view.k > 1.15); root.classList.toggle('far', view.k < 0.55); }
  function box() { var r = svg.getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; }
  function fit(anim, onlyMain) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    D.nodes.forEach(function (n) { if (onlyMain && n.c !== 0) return; x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); });
    var b = box(), padT = b.w < 900 ? 150 : 110, padB = b.w < 900 ? 90 : 70;
    var k = Math.min((b.w - 60) / (x1 - x0 + 80), (b.h - padT - padB) / (y1 - y0 + 80));
    go({ k: k, x: b.w / 2 - (x0 + x1) / 2 * k, y: padT + (b.h - padT - padB) / 2 - (y0 + y1) / 2 * k }, anim);
  }
  var raf = null;
  function go(t, anim) {
    cancelAnimationFrame(raf);
    if (!anim || matchMedia('(prefers-reduced-motion: reduce)').matches) { view = t; apply(); return; }
    var f = Object.assign({}, view), t0 = performance.now();
    (function step(now) { var u = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - u, 3); view = { x: f.x + (t.x - f.x) * e, y: f.y + (t.y - f.y) * e, k: f.k + (t.k - f.k) * e }; apply(); if (u < 1) raf = requestAnimationFrame(step); })(t0);
  }
  function zoomAt(px, py, factor) {
    var k = Math.max(0.15, Math.min(4, view.k * factor)); factor = k / view.k;
    view = { k: k, x: px - (px - view.x) * factor, y: py - (py - view.y) * factor }; apply();
  }
  function centerOn(i) {
    var n = D.nodes[i], b = box(), k = Math.max(view.k, 1.1), side = window.matchMedia('(min-width: 900px)').matches ? 220 : 0;
    go({ k: k, x: (b.w - side * 2) / 2 - n.x * k, y: b.h * (window.matchMedia('(min-width: 900px)').matches ? 0.52 : 0.3) - n.y * k }, true);
  }
  function wire() {
    var pts = {}, start = null, moved = 0, pinch = null;
    svg.addEventListener('wheel', function (ev) { ev.preventDefault(); var b = box(); zoomAt(ev.clientX - b.l, ev.clientY - b.t, Math.exp(-ev.deltaY * 0.0015)); }, { passive: false });
    svg.addEventListener('pointerdown', function (ev) {
      pts[ev.pointerId] = { x: ev.clientX, y: ev.clientY }; svg.setPointerCapture(ev.pointerId);
      var ids = Object.keys(pts);
      if (ids.length === 1) { start = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y, target: ev.target }; moved = 0; }
      if (ids.length === 2) { var a = pts[ids[0]], c = pts[ids[1]]; pinch = { d: Math.hypot(a.x - c.x, a.y - c.y), k: view.k }; }
    });
    svg.addEventListener('pointermove', function (ev) {
      if (!pts[ev.pointerId]) return; pts[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      var ids = Object.keys(pts), b = box();
      if (ids.length === 2 && pinch) { var a = pts[ids[0]], c = pts[ids[1]], d = Math.hypot(a.x - c.x, a.y - c.y); zoomAt((a.x + c.x) / 2 - b.l, (a.y + c.y) / 2 - b.t, (pinch.k * d / pinch.d) / view.k); moved = 99; return; }
      if (start) { var dx = ev.clientX - start.x, dy = ev.clientY - start.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); if (moved > 4) { view.x = start.vx + dx; view.y = start.vy + dy; apply(); root.classList.add('dragging'); } }
    });
    function up(ev) {
      var wasTap = start && moved <= 4 && Object.keys(pts).length === 1;
      delete pts[ev.pointerId]; if (Object.keys(pts).length < 2) pinch = null;
      root.classList.remove('dragging');
      if (wasTap) {
        var g = start.target.closest ? start.target.closest('.un-n') : null;
        if (g) select(g._i, false); else if (sel != null) { sel = null; paint(); }
      }
      if (!Object.keys(pts).length) start = null;
    }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    window.addEventListener('resize', function () { if (root && !root.hidden && sel == null) fit(false, true); });
  }

  /* ---------- the panel ---------- */
  function select(i, center) {
    sel = i; paint(); if (center) centerOn(i);
    var n = D.nodes[i], p = picOf(n);
    var docs = {}, links = adj[i].map(function (ei) { var e = D.edges[ei]; e.docs.forEach(function (d) { docs[d.id] = d; }); return { e: e, other: e.s === i ? e.t : e.s }; });
    links.sort(function (a, b) { return b.e.n - a.e.n; });
    API.sheet('The Unknown', picSvg(n, 40), function (body) {
      body.appendChild(h('div', {}, [h('h1', { class: 'd-title', text: n.name })]));
      body.appendChild(h('div', { class: 'un-portrait', html: picSvg(n, 132) }, [h('span', { class: 'un-case', text: caseNo(i) })]));
      body.appendChild(API.facts([['What it is', PIC_LABEL[p]], ['Role in the files', (n.roles || []).join('; ')], ['Also called', (n.aka || []).join(', ')],
        ['Documents', n.n], ['Years in the files', n.y0 ? (n.y1 && n.y1 !== n.y0 ? n.y0 + '–' + n.y1 : String(n.y0)) : ''], ['Connections', links.length], ['Case file', caseNo(i)]]));
      if (n.map) body.appendChild(h('div', { class: 'row-btns' }, [h('button', { class: 'btn primary', text: 'Show on the Tripoli map', onclick: function () { close(); API.openPlace(n.map); } })]));
      var box = h('div', { class: 'links un-links' });
      links.forEach(function (x) {
        var o = D.nodes[x.other];
        box.appendChild(h('button', { onclick: function () { select(x.other, true); } }, [h('span', { class: 'un-mini', html: picSvg(o, 30) }), h('span', {}, [o.name, h('small', { text: x.e.why[0] || '' })])]));
      });
      body.appendChild(API.section('Linked in the files', [box]));
      var list = h('ol', { class: 'srcs un-docs' });
      Object.keys(docs).map(function (k) { return docs[k]; }).sort(function (a, b) { return String(a.d).localeCompare(String(b.d)); }).forEach(function (d) {
        var li = h('li', {}, [h('a', { href: d.u, target: '_blank', rel: 'noopener', text: d.t }), d.d ? h('small', { text: ' ' + String(d.d).slice(0, 10) }) : null]);
        if (d.r) API.recordExists(d.r).then(function (ok) { if (ok) li.appendChild(h('button', { class: 'linkish', type: 'button', text: 'Open in archive', onclick: function () { API.openRecordById(d.r); } })); });
        list.appendChild(li);
      });
      body.appendChild(API.section('In the files', [list]));
      body.appendChild(API.section('How this was made', [h('p', { class: 'd-text', text: 'Claude Haiku read each document and noted who or what it connects. Spellings were merged where they clearly name the same person. The picture only shows the kind of entity; nobody’s face is known or drawn.' })]));
    });
  }

  /* ---------- open and close ---------- */
  var loading = null;
  function load() {
    if (window.ATLAS_UNKNOWN) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = 'data/unknown.js'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
    return loading;
  }
  function open() {
    load().then(function () {
      if (!root) build();
      if (!root) return;
      root.hidden = false; root.classList.remove('intro'); void root.offsetWidth; root.classList.add('intro');
      document.body.classList.add('unknown-on');
      API.markBase('unknown'); API.closeDrawer();
      fit(false, true);
    });
  }
  function close() {
    if (!root || root.hidden) return;
    root.hidden = true; document.body.classList.remove('unknown-on'); sel = null; hover = null; paint();
    API.markBase(null);
  }
  window.ATLAS_UNKNOWN_OPEN = open;
  window.ATLAS_UNKNOWN_CLOSE = close;
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && root && !root.hidden && document.activeElement && document.activeElement.id !== 'un-q' && sel != null) { sel = null; paint(); } });
})();
