/* Workstation shell: icon rail, top bar, status bar, resizable panels, the places table, right-click menu,
   export and keyboard shortcuts. Everything here drives the map through window.ATLAS_API (see the end of app.js);
   nothing here talks to the server. */
(function () {
  var A = window.ATLAS_API; if (!A) return;
  var map = A.map, h = A.h, store = A.store, SITES = A.sites, LAYERS = A.layers, LEVELS = A.levels;
  function $(id) { return document.getElementById(id); }
  function wide() { return A.desktop.matches; }
  function typing(e) { var t = e.target, n = t && t.tagName; return n === 'INPUT' || n === 'TEXTAREA' || n === 'SELECT' || (t && t.isContentEditable); }

  /* ---------- drawer tabs: Layers, Table, Legend ---------- */
  var showLayers = $('tab-layers').onclick, showLegend = $('tab-legend').onclick, tab = 'layers';
  function setTab(t) {
    tab = t;
    if (t === 'legend') showLegend(); else showLayers();
    $('table-body').hidden = t !== 'table';
    if (t === 'table') { $('layers-body').hidden = true; $('tab-layers').setAttribute('aria-selected', 'false'); drawTable(); }
    $('tab-table').setAttribute('aria-selected', t === 'table' ? 'true' : 'false');
    syncRail();
  }
  $('tab-layers').onclick = function () { setTab('layers'); };
  $('tab-legend').onclick = function () { setTab('legend'); };
  $('tab-table').onclick = function () { setTab('table'); };
  function drawerOpen() { return $('drawer').classList.contains('open'); }
  function railTab(t) {
    if (drawerOpen() && tab === t) { $('drawer-close').click(); return; }
    setTab(t);
    if (!drawerOpen()) $('btn-layers').click();
  }
  // the Layers button keeps its own handler in app.js; step in first so it can also switch tabs
  $('btn-layers').addEventListener('click', function (e) { if (e.isTrusted || e.detail) { e.stopImmediatePropagation(); railTab('layers'); } }, true);
  $('btn-table').onclick = function () { railTab('table'); };
  $('btn-legend').onclick = function () { railTab('legend'); };
  $('btn-timeline').onclick = function () { A.timeline(); syncRail(); };
  $('btn-intel').onclick = function () { if (window.ATLAS_UNKNOWN_OPEN) window.ATLAS_UNKNOWN_OPEN(); };
  $('btn-home').onclick = function () { A.home(); };
  function syncRail() {
    var open = drawerOpen();
    $('btn-layers').setAttribute('aria-expanded', open && tab === 'layers' ? 'true' : 'false');
    $('btn-table').setAttribute('aria-pressed', open && tab === 'table' ? 'true' : 'false');
    $('btn-legend').setAttribute('aria-pressed', open && tab === 'legend' ? 'true' : 'false');
    $('btn-timeline').setAttribute('aria-pressed', A.timelineOn() ? 'true' : 'false');
    $('btn-intel').setAttribute('aria-pressed', document.body.classList.contains('unknown-on') ? 'true' : 'false');
  }
  new MutationObserver(syncRail).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ---------- top bar: search, theme, account ---------- */
  $('top-q').addEventListener('input', function () {
    var v = this.value; if (!v) return; this.value = '';
    A.openTerm(v);
    setTimeout(function () { var q = $('term-q'); try { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } catch (e) {} }, 60);
  });
  $('top-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') A.openTerm(); });
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function toggleTheme() { A.setTheme(isDark() ? 'light' : 'dark'); }
  $('btn-theme').onclick = toggleTheme;

  var menuEl = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; document.querySelectorAll('[aria-haspopup="menu"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); } }
  /* items: [label, shortcut, action] | [label, shortcut, href] | '-' | { hd: text } */
  function openMenu(items, x, y, anchor) {
    closeMenu();
    menuEl = h('div', { class: 'ws-menu', role: 'menu' }, items.filter(Boolean).map(function (it) {
      if (it === '-') return h('hr');
      if (it.hd) return h('div', { class: 'hd', text: it.hd });
      var kids = [h('span', { text: it[0] }), it[1] ? h('kbd', { text: it[1] }) : null];
      if (typeof it[2] === 'string') return h('a', { role: 'menuitem', href: it[2] }, kids);
      return h('button', { type: 'button', role: 'menuitem', onclick: function () { closeMenu(); it[2](); } }, kids);
    }));
    document.body.appendChild(menuEl);
    var r = menuEl.getBoundingClientRect();
    if (anchor) { var a = anchor.getBoundingClientRect(); x = a.right > innerWidth / 2 ? a.right - r.width : a.left; y = a.bottom + 2; if (a.left < 60 && wide()) { x = a.right + 4; y = Math.min(a.top, innerHeight - r.height - 8); } anchor.setAttribute('aria-expanded', 'true'); }
    menuEl.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + 'px';
    menuEl.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 4)) + 'px';
    var first = menuEl.querySelector('button, a'); if (first) first.focus();
  }
  document.addEventListener('pointerdown', function (e) { if (menuEl && !menuEl.contains(e.target) && !(e.target.closest && e.target.closest('[aria-haspopup="menu"]'))) closeMenu(); }, true);
  document.addEventListener('keydown', function (e) {
    if (!menuEl) return;
    if (e.key === 'Escape') { e.stopPropagation(); closeMenu(); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    var list = [].slice.call(menuEl.querySelectorAll('button, a')), i = list.indexOf(document.activeElement);
    list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length].focus();
  }, true);
  map.on('movestart zoomstart', closeMenu);

  $('user-lbl').textContent = !A.gated ? 'Local copy' : A.publicView ? 'Visitor' : 'Family';
  $('btn-user').onclick = function () {
    if (menuEl) { closeMenu(); return; }
    openMenu([
      { hd: !A.gated ? 'Local copy of the map' : A.publicView ? 'Visitor: read-only, no AI guide' : 'Signed in with the family password' },
      A.gated ? (A.publicView ? ['Family sign-in', '', '/login'] : ['Sign out on this device', '', '/logout']) : null,
      '-',
      ['Settings', ',', A.openSettings],
      [isDark() ? 'Light theme' : 'Dark theme', 'D', toggleTheme],
      ['Start screen', '', A.openDoor],
      ['Keyboard shortcuts', '?', showKeys]
    ], 0, 0, $('btn-user'));
  };

  /* ---------- selection: one current place, plus an optional set picked in the table ---------- */
  var picked = {};
  function pickedList() { return SITES.filter(function (s) { return picked[s.id]; }); }
  function paintPicked() {
    SITES.forEach(function (s) { var m = A.marker(s.id), el = m && m.getElement && m.getElement(), mk = el && el.querySelector('.mk'); if (mk) mk.classList.toggle('multi', !!picked[s.id]); });
    syncStatus(); markRows();
  }

  /* ---------- status bar ---------- */
  function syncStatus() {
    var shown = SITES.filter(A.visible).length, n = Object.keys(picked).length || (A.selected() ? 1 : 0);
    $('sb-sel').innerHTML = '';
    $('sb-sel').appendChild(document.createTextNode('SEL '));
    $('sb-sel').appendChild(h('b', { text: String(n) }));
    $('sb-sel').appendChild(document.createTextNode('  SHOWN '));
    $('sb-sel').appendChild(h('b', { text: shown + '/' + SITES.length }));
  }
  function syncConn() {
    var on = navigator.onLine !== false, el = $('sb-conn');
    el.className = on ? '' : 'off';
    el.innerHTML = '';
    el.appendChild(h('i', { class: 'dot' }));
    el.appendChild(document.createTextNode(on ? (!A.gated ? 'LOCAL' : A.publicView ? 'ONLINE  READ-ONLY' : 'ONLINE  FAMILY') : 'OFFLINE'));
  }
  window.addEventListener('online', syncConn); window.addEventListener('offline', syncConn); syncConn();
  // when the place data was last published: the server's date for the data file
  if (location.protocol !== 'file:') fetch('data/sites.js', { method: 'HEAD' }).then(function (r) {
    var d = r.headers.get('Last-Modified'); if (!d) return;
    $('sb-data').textContent = 'DATA ' + new Date(d).toISOString().slice(0, 16).replace('T', ' ') + 'Z';
  }).catch(function () {});

  /* ---------- crumbs ---------- */
  function crumb(name) {
    var c = $('crumbs'); c.innerHTML = '';
    var view = document.body.classList.contains('unknown-on') ? 'Intelligence' : 'Map';
    [view].concat(name ? [name] : []).forEach(function (t) { c.appendChild(h('i', { text: '/' })); c.appendChild(h('span', { text: t })); });
  }

  /* ---------- resizable panels ---------- */
  function resizer(panel, varName, key, min, max, sign) {
    var saved = store.get(key, 0); if (saved) document.documentElement.style.setProperty(varName, saved + 'px');
    var g = h('div', { class: 'ws-rz', title: 'Drag to resize. Double-click to reset.', role: 'separator', 'aria-orientation': 'vertical' });
    g.addEventListener('pointerdown', function (e) {
      e.preventDefault(); g.classList.add('on');
      var x0 = e.clientX, w0 = panel.getBoundingClientRect().width, w = w0;
      var mv = function (ev) { w = Math.max(min, Math.min(max, w0 + sign * (ev.clientX - x0))); document.documentElement.style.setProperty(varName, w + 'px'); };
      var up = function () { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); g.classList.remove('on'); store.set(key, Math.round(w)); window.dispatchEvent(new Event('resize')); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
    g.addEventListener('dblclick', function () { document.documentElement.style.removeProperty(varName); store.set(key, 0); window.dispatchEvent(new Event('resize')); });
    panel.appendChild(g);
  }
  resizer($('drawer'), '--left-w', 'leftW', 240, 560, 1);
  resizer($('sheet'), '--right-w', 'rightW', 280, 640, -1);
  // the map is docked between the panels: tell Leaflet whenever its box changes
  if (window.ResizeObserver) { var rzT; new ResizeObserver(function () { clearTimeout(rzT); rzT = setTimeout(function () { map.invalidateSize({ pan: false }); }, 40); }).observe($('map')); }

  /* ---------- places table ---------- */
  var COLS = [
    { k: 'name', t: 'Name', w: '50%', get: function (s) { return s.name; } },
    { k: 'type', t: 'Type', w: '22%', get: function (s) { return LAYERS[s.layer].label; }, pick: function () { return Object.keys(LAYERS).map(function (k) { return LAYERS[k].label; }); } },
    { k: 'y0', t: 'From', w: '14%', num: true, get: function (s) { return s.y0 == null ? '' : s.y0; } },
    { k: 'y1', t: 'To', w: '14%', num: true, get: function (s) { return s.y1 == null ? '' : s.y1; } }
  ];
  var sort = store.get('tblSort', { k: 'y0', d: 1 }), filt = {}, rows = [], lastIdx = -1, built = false;
  function fold(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function matches(c, s) {
    var f = filt[c.k]; if (!f) return true;
    var v = c.get(s);
    if (c.pick) return v === f;
    if (c.num) { var m = /^\s*([<>]=?|=)?\s*(\d{4})\s*(?:[-–]\s*(\d{4}))?\s*$/.exec(f); if (!m) return String(v).indexOf(f.trim()) === 0; if (v === '') return false;
      var a = +m[2]; return m[3] ? v >= a && v <= +m[3] : m[1] === '<' ? v < a : m[1] === '<=' ? v <= a : m[1] === '>' ? v > a : m[1] === '>=' ? v >= a : v === a; }
    return fold(v + ' ' + (s.ar || '')).indexOf(fold(f)) >= 0;
  }
  function buildTable() {
    built = true;
    var body = $('table-body');
    body.appendChild(h('div', { class: 'ws-tools' }, [h('span', { id: 'tbl-count' }), h('span', { class: 'grow' }),
      h('button', { class: 'btn ghost', type: 'button', text: 'Clear', title: 'Clear filters and selection', onclick: function () { filt = {}; picked = {}; body.querySelectorAll('tr.f input, tr.f select').forEach(function (i) { i.value = ''; }); drawTable(); paintPicked(); } }),
      h('button', { class: 'btn ghost', type: 'button', id: 'tbl-export', 'aria-haspopup': 'menu', 'aria-expanded': 'false', text: 'Export', onclick: function () { exportMenu($('tbl-export')); } })]));
    var head = h('tr', {}, COLS.map(function (c) { return h('th', { style: 'width:' + c.w, 'data-k': c.k, scope: 'col' }, [h('button', { type: 'button', title: 'Sort by ' + c.t.toLowerCase(), onclick: function () { sort = { k: c.k, d: sort.k === c.k ? -sort.d : 1 }; store.set('tblSort', sort); drawTable(); } }, [h('span', { text: c.t }), h('span', { class: 'ar' })])]); }));
    var frow = h('tr', { class: 'f' }, COLS.map(function (c) {
      var inp = c.pick ? h('select', { 'aria-label': 'Filter by ' + c.t.toLowerCase() }, [h('option', { value: '', text: 'All' })].concat(c.pick().map(function (v) { return h('option', { value: v, text: v }); })))
        : h('input', { type: 'text', dir: c.num ? null : 'auto', placeholder: c.num ? '>1980' : 'Filter', 'aria-label': 'Filter by ' + c.t.toLowerCase(), title: c.num ? 'A year, a range such as 1980-1986, or >1980' : 'Latin or Arabic name' });
      inp.addEventListener(c.pick ? 'change' : 'input', function () { filt[c.k] = inp.value; drawTable(); });
      return h('th', {}, [inp]);
    }));
    var tb = h('tbody', { id: 'tbl-rows' });
    body.appendChild(h('div', { class: 'ws-scroll' }, [h('table', { class: 'ws-table', 'aria-label': 'Places shown on the map', 'aria-multiselectable': 'true' }, [h('thead', {}, [head, frow]), tb])]));
    tb.addEventListener('click', function (e) {
      var tr = e.target.closest('tr'); if (!tr) return;
      var i = +tr.getAttribute('data-i'), s = rows[i];
      if (e.shiftKey && lastIdx >= 0) { for (var j = Math.min(i, lastIdx); j <= Math.max(i, lastIdx); j++) picked[rows[j].id] = 1; paintPicked(); }
      else if (e.ctrlKey || e.metaKey) { if (picked[s.id]) delete picked[s.id]; else picked[s.id] = 1; lastIdx = i; paintPicked(); }
      else { picked = {}; lastIdx = i; paintPicked(); A.focusSite(s); }
    });
    tb.addEventListener('keydown', function (e) {
      var tr = e.target.closest('tr'); if (!tr) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tr.click(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var n = e.key === 'ArrowDown' ? tr.nextElementSibling : tr.previousElementSibling; if (n) n.focus(); }
    });
    tb.addEventListener('contextmenu', function (e) {
      var tr = e.target.closest('tr'); if (!tr) return; e.preventDefault();
      var s = rows[+tr.getAttribute('data-i')];
      openMenu([{ hd: s.name }, ['Open details', 'Enter', function () { A.focusSite(s); }], ['Street-level 3D', '', function () { A.openStreet(s.lat, s.lon, s.name); }],
        ['Copy coordinates', '', function () { copy(s.lat.toFixed(5) + ', ' + s.lon.toFixed(5)); }], '-',
        [picked[s.id] ? 'Remove from selection' : 'Add to selection', 'Ctrl+Click', function () { if (picked[s.id]) delete picked[s.id]; else picked[s.id] = 1; paintPicked(); }]], e.clientX, e.clientY);
    });
  }
  function drawTable() {
    if (!built) buildTable();
    if ($('table-body').hidden) return;
    var c = COLS.filter(function (x) { return x.k === sort.k; })[0] || COLS[0];
    rows = SITES.filter(A.visible).filter(function (s) { return COLS.every(function (x) { return matches(x, s); }); });
    rows.sort(function (a, b) { var x = c.get(a), y = c.get(b); if (x === '' || y === '') return (x === '') - (y === ''); return (c.num ? x - y : String(x).localeCompare(String(y))) * sort.d || a.name.localeCompare(b.name); });
    $('table-body').querySelectorAll('thead th[data-k]').forEach(function (th) { var on = th.getAttribute('data-k') === sort.k; if (on) th.setAttribute('aria-sort', sort.d > 0 ? 'ascending' : 'descending'); else th.removeAttribute('aria-sort'); th.querySelector('.ar').textContent = on ? (sort.d > 0 ? '▲' : '▼') : ''; });
    var tb = $('tbl-rows'); tb.innerHTML = '';
    rows.forEach(function (s, i) {
      var lay = LAYERS[s.layer];
      tb.appendChild(h('tr', { 'data-i': i, 'data-id': s.id, tabindex: '0', title: s.name + (s.ar ? ' · ' + s.ar : '') + ' · ' + LEVELS[s.level] }, [
        h('td', {}, [h('span', { class: 'g-shp v-' + s.level, html: A.shapeSvg(lay.shape, lay.color) }), s.name, s.ar ? h('span', { class: 'ws-name-ar', lang: 'ar', dir: 'rtl', text: s.ar }) : null]),
        h('td', { text: lay.label }), h('td', { class: 'ws-num', text: String(c0(s.y0)) }), h('td', { class: 'ws-num', text: String(c0(s.y1)) })]));
    });
    if (!rows.length) tb.appendChild(h('tr', {}, [h('td', { colspan: '4', class: 'ws-empty', text: 'No places match. Clear the filters or switch more layers on.' })]));
    $('tbl-count').textContent = rows.length + ' of ' + SITES.length + ' places';
    markRows();
  }
  function c0(v) { return v == null ? '' : v; }
  function markRows() {
    var cur = A.selected(), tb = $('tbl-rows'); if (!tb) return;
    [].forEach.call(tb.children, function (tr) { var id = tr.getAttribute('data-id'); if (!id) return; tr.setAttribute('aria-selected', picked[id] || id === cur ? 'true' : 'false'); tr.classList.toggle('cur', id === cur); });
  }

  /* ---------- export ---------- */
  function exportSet() { var p = pickedList(); return p.length ? p : (rows.length && !$('table-body').hidden && drawerOpen() ? rows : SITES.filter(A.visible)); }
  function download(name, type, text) {
    var a = h('a', { href: URL.createObjectURL(new Blob([text], { type: type })), download: name }); document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csvCell(v) { v = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function props(s) { return { id: s.id, name: s.name, name_ar: s.ar || '', type: LAYERS[s.layer].label, evidence: LEVELS[s.level], from: c0(s.y0), to: c0(s.y1), period: s.period || '', uncertainty_km: s.r, lat: s.lat, lon: s.lon,
    sources: (s.sources || []).map(function (x) { return x.u || x.t; }).join(' | ') }; }
  function exportCsv() { var list = exportSet().map(props), keys = Object.keys(list[0] || props(SITES[0]));
    download('tripoli-places.csv', 'text/csv;charset=utf-8', '﻿' + [keys.join(',')].concat(list.map(function (p) { return keys.map(function (k) { return csvCell(p[k]); }).join(','); })).join('\r\n')); A.status(list.length + ' places exported as CSV.', 3000); }
  function exportGeo() { var list = exportSet();
    download('tripoli-places.geojson', 'application/geo+json', JSON.stringify({ type: 'FeatureCollection', features: list.map(function (s) { var p = props(s); delete p.lat; delete p.lon; return { type: 'Feature', geometry: { type: 'Point', coordinates: [s.lon, s.lat] }, properties: p }; }) }, null, 1)); A.status(list.length + ' places exported as GeoJSON.', 3000); }
  function exportMenu(anchor) {
    if (menuEl) { closeMenu(); return; }
    var n = exportSet().length, what = Object.keys(picked).length ? 'selected' : 'shown';
    openMenu([{ hd: n + ' places ' + what + ', each with its sources' }, ['Spreadsheet (CSV)', '', exportCsv], ['Map data (GeoJSON)', '', exportGeo], ['Printable booklet', '', function () { A.print(exportSet()); }]], 0, 0, anchor);
  }
  $('btn-export').onclick = function () { exportMenu($('btn-export')); };
  function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { A.status('Copied ' + t, 2500); }, function () { A.status(t, 6000); }); }

  /* ---------- right-click on the map ---------- */
  window.ATLAS_CTX = function (e) {
    if (!wide()) return false;
    var ll = e.latlng, pos = ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5), oe = e.originalEvent;
    openMenu([{ hd: pos },
      ['What is here?', '', function () { A.openSpot(ll); }],
      A.canReport ? ['Add a place here', '', function () { A.openReportForm({ lat: ll.lat, lon: ll.lng }); }] : null,
      ['Street-level 3D', '', function () { A.openStreet(ll.lat, ll.lng, ''); }],
      ['Copy coordinates', '', function () { copy(pos); }], '-',
      ['Zoom in here', '', function () { map.setView(ll, Math.min(19, map.getZoom() + 2)); }],
      ['Show all of Tripoli', 'H', A.home]], oe.clientX, oe.clientY);
    return true;
  };

  /* ---------- map corners: legend and north ---------- */
  var legendOpen = store.get('mapLegend', true), legendBox = null;
  var Legend = L.Control.extend({ options: { position: 'bottomright' }, onAdd: function () {
    legendBox = h('div', { class: 'ws-legend leaflet-control' }); L.DomEvent.disableClickPropagation(legendBox); L.DomEvent.disableScrollPropagation(legendBox); return legendBox; } });
  new Legend().addTo(map);
  function drawMapLegend() {
    if (!legendBox) return;
    legendBox.innerHTML = '';
    legendBox.appendChild(h('button', { type: 'button', 'aria-expanded': String(legendOpen), onclick: function () { legendOpen = !legendOpen; store.set('mapLegend', legendOpen); drawMapLegend(); } }, [h('span', { text: 'Legend' }), h('span', { text: legendOpen ? '–' : '+' })]));
    if (!legendOpen) return;
    var counts = {}; SITES.forEach(function (s) { if (A.visible(s)) counts[s.layer] = (counts[s.layer] || 0) + 1; });
    var keys = Object.keys(LAYERS).filter(function (k) { return counts[k]; });
    legendBox.appendChild(h('ul', {}, keys.length ? keys.map(function (k) { return h('li', {}, [h('span', { class: 'g-shp', html: A.shapeSvg(LAYERS[k].shape, LAYERS[k].color) }), h('span', { text: LAYERS[k].label.replace(/^Gaddafi's residences & seats/, 'Seats') }), h('span', { class: 'n', text: String(counts[k]) })]); })
      : [h('li', { text: 'Nothing shown' })]));
  }
  var North = L.Control.extend({ options: { position: 'topright' }, onAdd: function () { return h('div', { class: 'ws-north leaflet-control', title: 'North is up', html: '<div><svg viewBox="0 0 10 12" aria-hidden="true"><path d="M5 0 10 12 5 9 0 12z"/></svg>N</div>' }); } });
  new North().addTo(map);

  /* ---------- keyboard shortcuts ---------- */
  var KEYS = [['/', 'Search'], ['L', 'Layers'], ['B', 'Table of places'], ['G', 'Legend'], ['T', 'Timeline'], ['E', 'Export'], ['H', 'Show all of Tripoli'], ['D', 'Light or dark'], [',', 'Settings'], ['Esc', 'Close the open panel'], ['← →', 'Step the timeline (when it has focus)']];
  function showKeys() { openMenu([{ hd: 'Keyboard shortcuts' }].concat(KEYS.map(function (k) { return [k[1], k[0], function () {}]; })), innerWidth / 2 - 130, 80); }
  document.addEventListener('keydown', function (e) {
    if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('.modal:not([hidden]):not(.float), .term:not([hidden]), #street:not([hidden])')) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    var run = { l: function () { railTab('layers'); }, b: function () { railTab('table'); }, g: function () { railTab('legend'); }, t: function () { $('btn-timeline').click(); },
      e: function () { exportMenu($('btn-export')); }, h: A.home, d: toggleTheme, ',': A.openSettings, '?': showKeys }[k];
    if (run) { e.preventDefault(); run(); }
  });

  /* ---------- keep everything in step with the map ---------- */
  A.onSelect = function (id) {
    var s = id && SITES.filter(function (x) { return x.id === id; })[0];
    crumb(s ? s.name : ''); syncStatus(); markRows();
    var tr = id && $('tbl-rows') && $('tbl-rows').querySelector('tr.cur'); if (tr && tr.scrollIntoView) tr.scrollIntoView({ block: 'nearest' });
  };
  A.onRefresh = function () { syncStatus(); drawMapLegend(); if (built && !$('table-body').hidden) drawTable(); syncRail(); };
  new MutationObserver(function () { if (!$('sheet').classList.contains('open')) crumb(''); else if (!A.selected()) { var t = $('sheet-body').querySelector('.pp-title, .d-title'); crumb(t ? t.textContent : $('sheet-kind').textContent); } }).observe($('sheet'), { attributes: true, attributeFilter: ['class'] });
  crumb(''); syncStatus(); drawMapLegend(); syncRail();
  setTimeout(function () { map.invalidateSize({ pan: false }); }, 0);
})();
