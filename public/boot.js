/* Sets the theme before first paint, so the page never flashes the wrong one. */
(function () {
  var t = 'light';
  try { if (JSON.parse(localStorage.getItem('atlas.theme')) === 'dark') t = 'dark'; } catch (e) {}
  var d = document.documentElement;
  d.setAttribute('data-theme', t);
  if (t === 'dark') d.classList.add('dark');
})();
