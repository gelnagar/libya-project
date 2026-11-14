// Correction and removal requests: sent to the Worker, held for the owner (requests.html), never shown on the site.
(function () {
  var CFG = window.ATLAS_CONFIG || {}, $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search), item = (q.get('item') || '').replace(/[^\w:.-]/g, '').slice(0, 120), name = (q.get('name') || '').slice(0, 200);
  if (name) $('name').value = name;
  if (item) { $('entry').hidden = false; $('entry').textContent = 'Entry id: ' + item; }
  if (q.get('kind') === 'removal') document.querySelector('input[value="removal"]').checked = true;
  var url = (location.protocol !== 'file:' && !/github\.io$/.test(location.hostname)) ? '/api' : CFG.aiEndpoint;
  $('f').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('msg'), text = $('text').value.trim();
    msg.className = 'msg';
    if (text.length < 10) { msg.className = 'msg err'; msg.textContent = 'Please say what is wrong (at least a sentence).'; $('text').focus(); return; }
    if (!url) { msg.className = 'msg err'; msg.textContent = 'Requests cannot be sent from this copy of the site.'; return; }
    $('send').disabled = true; msg.textContent = 'Sending…';
    fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correction: { kind: document.querySelector('input[name="kind"]:checked').value, item: item, name: $('name').value.trim(), text: text, contact: $('contact').value.trim() } }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'The request was not received.'); return j; }); })
      .then(function () { var replied = $('contact').value.trim(); msg.className = 'msg ok'; msg.textContent = 'Received. Thank you.' + (replied ? ' You will have a reply.' : ''); $('f').reset(); $('entry').hidden = true; $('send').disabled = false; })
      .catch(function (err) { msg.className = 'msg err'; msg.textContent = err.message; $('send').disabled = false; });
  });
})();
