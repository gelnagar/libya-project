/* Moved out of requests.html so the site can refuse inline scripts. */
(function () {
  var CFG = window.ATLAS_CONFIG || {};
  var KEY = 'atlas.owner';
  function get() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function set(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} }
  function call(code, body) {
    var url = (location.protocol !== 'file:' && !/github\.io$/.test(location.hostname)) ? '/api' : CFG.aiEndpoint;
    return fetch(url, { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Owner-Code': code }, body: JSON.stringify(Object.assign({ owner: true }, body)) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.code = r.status; throw e; } return j; }); });
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function render(items, code) {
    var box = document.getElementById('items'); box.innerHTML = '';
    document.getElementById('count').textContent = items.length ? items.length + ' open request' + (items.length > 1 ? 's' : '') : 'No open requests.';
    items.forEach(function (it) {
      var c = el('article', 'card');
      var meta = el('div', 'meta');
      meta.appendChild(el('span', null, new Date(it.at).toLocaleString()));
      meta.appendChild(el('span', null, it.name ? 'From ' + it.name : 'No name given'));
      c.appendChild(meta);
      c.appendChild(el('h2', null, it.title || '(no title)'));
      if (it.details) c.appendChild(el('p', 'details', it.details));
      if (it.context) c.appendChild(el('p', 'ctx', 'They had asked: ' + it.context));
      var done = el('button', null, 'Mark done');
      done.onclick = function () { done.disabled = true; call(code, { done: it.key }).then(function () { c.remove(); load(code); }).catch(function () { done.disabled = false; }); };
      c.appendChild(done);
      box.appendChild(c);
    });
  }
  function renderReports(reps, code) {
    var box = document.getElementById('reps'); box.innerHTML = '';
    document.getElementById('rcount').textContent = reps.length ? reps.length + ' report' + (reps.length > 1 ? 's' : '') + ' added by family.' : 'No family reports yet.';
    reps.forEach(function (it) {
      var c = el('article', 'card'), meta = el('div', 'meta');
      meta.appendChild(el('span', null, new Date(it.at).toLocaleString()));
      meta.appendChild(el('span', null, (it.by ? 'From ' + it.by : 'No name given') + ' · ' + it.cat));
      c.appendChild(meta);
      c.appendChild(el('h2', null, it.title + (it.when ? ' (' + it.when + ')' : '')));
      c.appendChild(el('p', 'details', it.text));
      if (it.src) c.appendChild(el('p', 'ctx', 'Source: ' + it.src));
      if (it.targetName) c.appendChild(el('p', 'ctx', 'About: ' + it.targetName));
      if (it.lat != null) c.appendChild(el('p', 'ctx', 'Position: ' + it.lat + ', ' + it.lon));
      if (it.held) c.appendChild(el('p', 'msg', 'Held: visitors cannot see this until you approve it.'));
      var ap = el('button', it.held ? 'primary' : null, it.held ? 'Approve for visitors' : 'Hold back from visitors');
      ap.onclick = function () { ap.disabled = true; call(code, { approveReport: it.id, hold: !it.held }).then(function () { load(code); }).catch(function () { ap.disabled = false; }); };
      c.appendChild(ap);
      var rm = el('button', null, 'Remove from map');
      rm.onclick = function () { if (!confirm('Remove “' + it.title + '” from the map?')) return; rm.disabled = true; call(code, { removeReport: it.id }).then(function () { c.remove(); }).catch(function () { rm.disabled = false; }); };
      c.appendChild(rm); box.appendChild(c);
    });
  }
  function renderCorrections(list, code) {
    var box = document.getElementById('corr'); box.innerHTML = '';
    var open = list.filter(function (x) { return !x.done; }).length;
    document.getElementById('ccount').textContent = list.length ? open + ' open, ' + (list.length - open) + ' answered.' : 'No correction or removal requests yet.';
    list.forEach(function (it) {
      var c = el('article', 'card');
      var meta = el('div', 'meta');
      meta.appendChild(el('span', null, new Date(it.at).toLocaleString()));
      meta.appendChild(el('span', null, (it.kind === 'removal' ? 'Removal' : 'Correction') + (it.done ? ' · answered' : ' · open')));
      c.appendChild(meta);
      c.appendChild(el('h2', null, it.name || it.item || '(no entry named)'));
      if (it.item) c.appendChild(el('p', 'ctx', 'Entry id: ' + it.item));
      c.appendChild(el('p', 'details', it.text || ''));
      c.appendChild(el('p', 'ctx', it.contact ? 'Reply to: ' + it.contact : 'No way to reply was left.'));
      var b = el('button', null, it.done ? 'Reopen' : 'Mark answered');
      b.onclick = function () { b.disabled = true; call(code, { correctionDone: it.id, reopen: !!it.done }).then(function () { load(code); }).catch(function () { b.disabled = false; }); };
      c.appendChild(b);
      box.appendChild(c);
    });
  }
  function load(code) {
    var msg = document.getElementById('login-msg');
    msg.textContent = 'Loading…';
    return call(code, {}).then(function (j) {
      set(code); msg.textContent = '';
      document.getElementById('login').hidden = true; document.getElementById('list').hidden = false;
      render(j.items || [], code); renderReports(j.reports || [], code); renderCorrections(j.corrections || [], code);
    }).catch(function (e) {
      document.getElementById('login').hidden = false; document.getElementById('list').hidden = true;
      msg.textContent = e.code === 401 ? 'That owner password is not right.' : e.code === 503 ? 'Storage is not set up in Cloudflare yet (ATLAS_KV).' : 'Could not reach the relay. Check your connection.';
      set('');
    });
  }
  if (!CFG.aiEndpoint) { document.getElementById('login-msg').textContent = 'The AI relay address is not set in data/config.js.'; return; }
  document.getElementById('login').addEventListener('submit', function (e) { e.preventDefault(); var c = document.getElementById('code').value.trim(); if (c) load(c); });
  document.getElementById('reload').onclick = function () { load(get()); };
  document.getElementById('logout').onclick = function () { set(''); location.reload(); };
  if (get()) load(get());
})();
