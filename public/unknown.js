/* Intelligence: a separate black plane showing the people, groups and outside places that the declassified files connect.
   Data: data/unknown.js (scripts/build-unknown.py). Pictures are symbolic stand-ins drawn here, never likenesses. */
(function () {
  'use strict';
  var API = window.ATLAS_API, h = API.h;
  var NS = 'http://www.w3.org/2000/svg';
  var D = null, root = null, svg = null, vp = null, edgeEls = [], nodeEls = [], adj = [], sel = null, hover = null, typeFilter = null;
  var view = { x: 0, y: 0, k: 1 };

  /* ---------- the pictures (viewBox 0 0 100 100; classes set the tones) ---------- */
  var ART = window.ATLAS_ART;
  var PICS = { person: 1, agent: 1, official: 1, leader: 1, dissident: 1, militant: 1, trader: 1, org: 1, state: 1, place: 1, airfield: 1, mapped: 1, event: 1, unknown: 1 };
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
    ART.defs();
    var p = picOf(n), art = '<g class="' + ART.cls(p, n.seed) + '">' + ART.draw(p, n.seed) + '</g>', fin = ART.finish();
    if (n.img) return '<svg class="un-pic real" viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true"><rect class="bg" width="100" height="100"/>' + art + '<image class="ph" href="' + n.img.thumb.replace(/"/g, '&quot;') + '" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMin slice"/>' + fin + '</svg>';
    var eye = ART.eye(p), bar = eye ? '<rect class="redact" x="27" y="' + (eye - 4) + '" width="46" height="8"/>' : '';
    return '<svg class="un-pic' + (p === 'mapped' ? ' on-map' : '') + '" viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true"><rect class="bg" width="100" height="100"/>' + art + bar + fin + '</svg>';
  }
  function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  /* ---------- build the plane ---------- */
  function build() {
    D = window.ATLAS_UNKNOWN; if (!D) return;
    adj = D.nodes.map(function () { return []; });
    D.edges.forEach(function (e, i) { adj[e.s].push(i); adj[e.t].push(i); });
    root = h('div', { id: 'unknown', role: 'region', 'aria-label': 'Intelligence: people and groups linked in the files', hidden: '' });
    var head = h('div', { class: 'un-head' }, [
      h('div', { class: 'un-title' }, [h('h2', { text: 'Intelligence' }), h('p', { text: 'People, groups and places beyond Tripoli that the declassified files tie together. Real pictures appear where a free one exists; the rest are stand-ins, not likenesses.' })]),
      h('div', { class: 'un-tools' }, [
        h('input', { type: 'search', id: 'un-q', placeholder: 'Find a name', 'aria-label': 'Find a name in Intelligence', autocomplete: 'off' }),
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
    D.edges.forEach(function (e, i) {
      var a = D.nodes[e.s], b = D.nodes[e.t];
      var hit = el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'un-hit' }); hit._e = i;
      hit.appendChild(el('title', {})); hit.firstChild.textContent = a.name + ' ↔ ' + b.name + ': click to see why';
      eg.appendChild(hit);
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
  function apply() { vp.setAttribute('transform', 'translate(' + view.x.toFixed(1) + ' ' + view.y.toFixed(1) + ') scale(' + view.k.toFixed(3) + ')'); root.classList.toggle('near', view.k > 1.15); root.classList.toggle('far', view.k < 0.36); }
  function box() { var r = svg.getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; }
  function fit(anim, onlyMain) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    D.nodes.forEach(function (n) { if (onlyMain && n.c !== 0) return; x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); });
    var b = box(), padT = b.w < 900 ? 150 : 110, padB = b.w < 900 ? 90 : 70;
    var k = Math.min((b.w - 60) / (x1 - x0 + 80), (b.h - padT - padB) / (y1 - y0 + 80));
    if (onlyMain && k < 0.5) {  // small screens: start close enough to read, on the most-documented card
      var n0 = D.nodes[0]; k = 0.5;
      return go({ k: k, x: b.w / 2 - n0.x * k, y: padT + (b.h - padT - padB) / 2 - n0.y * k }, anim);
    }
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
        var g = start.target.closest ? start.target.closest('.un-n') : null, hl = start.target.closest ? start.target.closest('.un-hit') : null;
        if (g) select(g._i, false); else if (hl) why(hl._e); else if (sel != null) { sel = null; paint(); }
      }
      if (!Object.keys(pts).length) start = null;
    }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    window.addEventListener('resize', function () { if (root && !root.hidden && sel == null) fit(false, true); });
  }

  /* ---------- a connection ---------- */
  function why(ei) {
    var e = D.edges[ei], a = D.nodes[e.s], b = D.nodes[e.t];
    sel = null; hover = null; paint(); edgeEls.forEach(function (x, k) { x.classList.toggle('on', k === ei); });
    API.conn({ key: 'u:' + a.id + '|' + b.id, kicker: 'Link in the files', ends: [{ name: a.name, pic: picSvg(a, 64), open: function () { select(e.s, true); } }, { name: b.name, pic: picSvg(b, 64), open: function () { select(e.t, true); } }],
      level: e.n + ' document' + (e.n === 1 ? '' : 's'), why: e.why, docs: e.docs, same: 'person' });
  }

  /* ---------- the panel ---------- */
  function select(i, center) {
    sel = i; paint(); if (center) centerOn(i);
    var n = D.nodes[i], p = picOf(n);
    var docs = {}, links = adj[i].map(function (ei) { var e = D.edges[ei]; e.docs.forEach(function (d) { docs[d.id] = d; }); return { e: e, other: e.s === i ? e.t : e.s }; });
    links.sort(function (a, b) { return b.e.n - a.e.n; });
    API.sheet('Intelligence', picSvg(n, 40), function (body) {
      body.appendChild(h('div', {}, [h('h1', { class: 'd-title', text: n.name })]));
      body.appendChild(h('div', { class: 'un-portrait', html: picSvg(n, 132) }, [h('span', { class: 'un-case', text: caseNo(i) })]));
      body.appendChild(API.facts([['What it is', PIC_LABEL[p]], ['Role in the files', (n.roles || []).join('; ')], ['Also called', (n.aka || []).join(', ')],
        ['Documents', n.n], ['Years in the files', n.y0 ? (n.y1 && n.y1 !== n.y0 ? n.y0 + '–' + n.y1 : String(n.y0)) : ''], ['Connections', links.length], ['Case file', caseNo(i)]]));
      if (n.img || n.wiki) body.appendChild(h('p', { class: 'un-credit' }, [
        n.img ? h('span', { text: 'Picture: ' + n.img.artist + ', ' + n.img.lic + ', ' }) : null, n.img ? h('a', { href: n.img.url, target: '_blank', rel: 'noopener', text: 'Wikimedia Commons' }) : null,
        n.img && n.wiki ? h('span', { text: '. ' }) : null, n.wiki ? h('a', { href: n.wiki, target: '_blank', rel: 'noopener', text: 'Wikipedia article' }) : null]));
      if (n.map) body.appendChild(h('div', { class: 'row-btns' }, [h('button', { class: 'btn primary', text: 'Show on the Tripoli map', onclick: function () { close(); API.openPlace(n.map); } })]));
      var box = h('div', { class: 'links un-links' });
      links.forEach(function (x) {
        var o = D.nodes[x.other];
        box.appendChild(h('div', { class: 'un-lrow' }, [h('button', { onclick: function () { select(x.other, true); } }, [h('span', { class: 'un-mini', html: picSvg(o, 30) }), h('span', {}, [o.name, h('small', { text: x.e.why[0] || '' })])]),
          h('button', { class: 'un-why', type: 'button', title: 'Why are these connected?', 'aria-label': 'Why are ' + n.name + ' and ' + o.name + ' connected?', text: 'Why?', onclick: function () { why(D.edges.indexOf(x.e)); } })]));
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
  // If a picture cannot load (offline, blocked), fall back to the drawn stand-in underneath it.
  document.addEventListener('error', function (ev) { var t = ev.target; if (t && t.tagName && t.tagName.toLowerCase() === 'image' && t.closest && t.closest('.un-pic')) t.remove(); }, true);
  window.ATLAS_UNKNOWN_PIC = picSvg;
  window.ATLAS_UNKNOWN_OPEN = open;
  window.ATLAS_UNKNOWN_CLOSE = close;
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && root && !root.hidden && document.activeElement && document.activeElement.id !== 'un-q' && sel != null) { sel = null; paint(); } });
})();
