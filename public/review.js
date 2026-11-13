/* Owner review queue. Candidates come from the archive (scripts/build-review.mjs); each shows the documents that
   mention it and the passage from each stored text. The owner approves, rejects or puts off; nothing reaches the
   map from here. Approved items are written up, with their sources, in a later research pass. */
(function () {
  var CFG = window.ATLAS_CONFIG || {}, KEY = 'atlas.owner';
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag), k;
    for (k in attrs || {}) { if (attrs[k] == null) continue; if (k === 'text') e.textContent = attrs[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function code() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function setCode(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} }
  function call(review) {
    var url = (location.protocol !== 'file:' && !/github\.io$/.test(location.hostname)) ? '/api' : CFG.aiEndpoint;
    return fetch(url, { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Owner-Code': code() }, body: JSON.stringify({ owner: true, review: review }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.error) { var e = new Error(j.error || r.status); e.code = r.status; throw e; } return j; }); });
  }

  var state = { status: 'open', kind: '', q: '', multi: false }, items = [], cur = -1, curCand = null, more = false;
  var VERDICT = { approve: 'Approved: place it', unplaced: 'Approved: no location', reject: 'Rejected', defer: 'Put off' };
  var FOUND = { exact: ['Name is in the text', 'ok'], word: ['Part of the name is in the text', 'warn'], none: ['Name not found in the text', 'bad'], 'no-text': ['No stored text', 'bad'] };

  function msg(t) { $('msg').textContent = t || ''; }
  function load(append) {
    msg('Loading…');
    return call({ status: state.status, kind: state.kind, q: state.q, multi: state.multi, offset: append ? items.length : 0 }).then(function (j) {
      items = append ? items.concat(j.items) : j.items; more = j.items.length === 100;
      $('signin').hidden = true; $('app').hidden = false; msg('');
      drawCounts(j.counts); drawList();
      if (!append) { if (items.length) open(0); else { cur = -1; curCand = null; $('detail').innerHTML = ''; $('detail').appendChild(el('p', { class: 'empty', text: 'Nothing in this view.' })); } }
    }).catch(function (e) {
      if (e.code === 401 || e.code === 429) { setCode(''); $('signin').hidden = false; $('app').hidden = true; $('signin-msg').textContent = e.code === 401 ? 'That owner password is not right.' : e.message; }
      else msg('Could not load: ' + e.message);
    });
  }
  function drawCounts(counts) {
    var by = {}, total = 0; counts.forEach(function (c) { by[c.v] = (by[c.v] || 0) + c.n; total += c.n; });
    var done = total - (by.open || 0);
    $('progress').textContent = done + ' of ' + total + ' decided';
    $('bar').style.width = total ? (100 * done / total).toFixed(1) + '%' : '0';
    [['open', 'To review'], ['approve', 'Place it'], ['unplaced', 'No location'], ['defer', 'Put off'], ['reject', 'Rejected'], ['all', 'All']].forEach(function (s) {
      var b = $('st-' + s[0]); b.textContent = s[1] + ' ' + (s[0] === 'all' ? total : (by[s[0]] || 0)); b.setAttribute('aria-selected', state.status === s[0] ? 'true' : 'false');
    });
  }
  function drawList() {
    var tb = $('rows'); tb.innerHTML = '';
    items.forEach(function (it, i) {
      tb.appendChild(el('tr', { 'data-i': i, tabindex: '0', 'aria-selected': i === cur ? 'true' : 'false', class: it.verdict ? 'v-' + it.verdict : '' }, [
        el('td', { class: 'k', text: it.kind === 'place' ? 'PLACE' : 'EVENT' }), el('td', { class: 'num', text: it.date || '' }),
        el('td', { text: it.name, title: it.name }), el('td', { class: 'num', text: String(it.docs), title: it.docs + ' document' + (it.docs > 1 ? 's' : '') }),
        el('td', { class: 'f ' + (it.found ? 'ok' : 'bad'), text: it.found ? '●' : '○', title: it.found ? 'Found in the stored text of ' + it.found + ' document' + (it.found > 1 ? 's' : '') : 'Not found in any stored text' })]));
    });
    $('more').hidden = !more;
    $('count').textContent = items.length + (more ? '+' : '') + ' shown';
  }
  function mark(text, hit) {
    var p = el('p', { class: 'passage' }); if (!text) return p;
    var i = hit ? text.toLowerCase().indexOf(hit.toLowerCase()) : -1;
    if (i < 0) { p.textContent = text; return p; }
    p.appendChild(document.createTextNode(text.slice(0, i))); p.appendChild(el('mark', { text: text.slice(i, i + hit.length) })); p.appendChild(document.createTextNode(text.slice(i + hit.length)));
    return p;
  }
  function open(i) {
    if (i < 0 || i >= items.length) return;
    cur = i;
    [].forEach.call($('rows').children, function (tr, k) { tr.setAttribute('aria-selected', k === i ? 'true' : 'false'); if (k === i && tr.scrollIntoView) tr.scrollIntoView({ block: 'nearest' }); });
    var id = items[i].id; $('detail').innerHTML = ''; $('detail').appendChild(el('p', { class: 'empty', text: 'Loading…' }));
    call({ get: id }).then(function (j) { if (items[cur] && items[cur].id === id) draw(j.cand, j.decision); }).catch(function (e) { msg('Could not open: ' + e.message); });
  }
  function draw(c, dec) {
    curCand = c; var d = $('detail'); d.innerHTML = ''; d.scrollTop = 0;
    d.appendChild(el('div', { class: 'head' }, [el('span', { class: 'tag', text: c.kind === 'place' ? 'Place not on the map' : 'Dated event' }), dec ? el('span', { class: 'tag v-' + dec.verdict, text: VERDICT[dec.verdict] }) : null]));
    d.appendChild(el('h1', { text: c.name }));
    var dl = el('dl');
    function row(k, v) { if (v == null || v === '') return; dl.appendChild(el('dt', { text: k })); dl.appendChild(typeof v === 'string' ? el('dd', { text: v }) : el('dd', {}, [v])); }
    row(c.kind === 'place' ? 'First mention' : 'Date', c.date);
    if (c.kind === 'event') { row('Place', c.place); row('Killed, as stated', c.killed); }
    row('Also written', (c.also || []).join('; '));
    row('Documents', c.docs + (c.docs > 1 ? ' separate documents' : ' document only'));
    row('Text check', c.found ? 'Found in ' + c.found + ' of ' + c.items.length + ' stored texts' : 'Not found in any stored text. Treat as unconfirmed.');
    if ((c.near || []).length) row('Possibly on the map already', c.near.join('; '));
    d.appendChild(dl);
    d.appendChild(el('h2', { text: 'What the documents say' }));
    c.items.forEach(function (it, n) {
      var f = FOUND[it.found] || FOUND.none;
      d.appendChild(el('section', { class: 'item' }, [
        el('div', { class: 'ih' }, [el('span', { class: 'num', text: String(n + 1) }), el('b', { text: it.title }), el('span', { class: 'num', text: it.date || 'undated' })]),
        el('p', { class: 'said' }, [el('span', { class: 'lab', text: 'Summary by the reading model ' }), it.detail]),
        el('div', { class: 'chk ' + f[1], text: f[0] }),
        it.passage ? mark(it.passage, it.hit) : null,
        el('div', { class: 'links' }, [it.url ? el('a', { href: it.url, target: '_blank', rel: 'noopener', text: 'Original' }) : null, it.mirror ? el('a', { href: it.mirror, target: '_blank', rel: 'noopener', text: 'Archive copy' }) : null,
          it.rec ? el('span', { class: 'num', title: 'Look this id up in the Encyclopedia on the map', text: it.rec }) : null])
      ]));
    });
    if (c.docs > c.items.length) d.appendChild(el('p', { class: 'empty', text: 'Showing the ' + c.items.length + ' most relevant of ' + c.docs + ' documents.' }));
    $('note').value = dec && dec.note ? dec.note : ''; $('reason').value = dec && dec.reason ? dec.reason : '';
    $('undo').hidden = !dec;
  }
  function decide(v) {
    if (cur < 0 || !items[cur]) return;
    var it = items[cur], reason = v === 'reject' ? $('reason').value : '';
    if (v === 'reject' && !reason) { msg('Pick a reason for the rejection first.'); $('reason').focus(); return; }
    msg('Saving…');
    call({ decide: { id: it.id, verdict: v, reason: reason, note: $('note').value } }).then(function () {
      msg(v === 'clear' ? 'Decision removed.' : VERDICT[v] + '.');
      it.verdict = v === 'clear' ? null : v;
      var keep = state.status === 'all' || (v !== 'clear' && state.status === v);
      if (!keep) { items.splice(cur, 1); drawList(); if (items.length) open(Math.min(cur, items.length - 1)); else load(); }
      else { drawList(); open(Math.min(cur + (v === 'clear' ? 0 : 1), items.length - 1)); }
      call({ status: 'none-list', offset: 1e9 }).then(function (j) { drawCounts(j.counts); }).catch(function () {});
    }).catch(function (e) { msg('Not saved: ' + e.message); });
  }

  $('signin').addEventListener('submit', function (e) { e.preventDefault(); var v = $('code').value.trim(); if (v) { setCode(v); $('signin-msg').textContent = ''; load(); } });
  ['open', 'approve', 'unplaced', 'defer', 'reject', 'all'].forEach(function (s) { $('st-' + s).onclick = function () { state.status = s; load(); }; });
  $('kind').onchange = function () { state.kind = this.value; load(); };
  $('multi').onchange = function () { state.multi = this.checked; load(); };
  var qt; $('q').oninput = function () { var v = this.value; clearTimeout(qt); qt = setTimeout(function () { state.q = v; load(); }, 300); };
  $('more').onclick = function () { load(true); };
  $('rows').addEventListener('click', function (e) { var tr = e.target.closest('tr'); if (tr) open(+tr.getAttribute('data-i')); });
  $('rows').addEventListener('keydown', function (e) { var tr = e.target.closest('tr'); if (tr && e.key === 'Enter') open(+tr.getAttribute('data-i')); });
  [['approve', 'approve'], ['unplaced', 'unplaced'], ['reject', 'reject'], ['defer', 'defer'], ['undo', 'clear']].forEach(function (b) { $(b[0]).onclick = function () { decide(b[1]); }; });
  $('signout').onclick = function () { setCode(''); location.reload(); };
  $('theme').onclick = function () { var d = document.documentElement, t = d.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; d.setAttribute('data-theme', t); try { localStorage.setItem('atlas.theme', JSON.stringify(t)); } catch (e) {} };
  document.addEventListener('keydown', function (e) {
    var t = e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey || $('app').hidden) return;
    var k = e.key.toLowerCase();
    if (k === 'j' || e.key === 'ArrowDown') { e.preventDefault(); open(cur + 1); }
    else if (k === 'k' || e.key === 'ArrowUp') { e.preventDefault(); open(cur - 1); }
    else if (k === 'a') decide('approve'); else if (k === 'u') decide('unplaced'); else if (k === 'r') decide('reject'); else if (k === 'd') decide('defer'); else if (k === 'z') decide('clear');
    else if (k === 'n') { e.preventDefault(); $('note').focus(); }
  });
  if (!CFG.aiEndpoint) { $('signin-msg').textContent = 'The server address is not set in data/config.js.'; return; }
  if (code()) load();
})();
