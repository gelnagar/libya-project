// Checks which source sites the GitHub runner can reach (used once to plan downloads).
const urls = process.argv.slice(2);
for (const u of urls) {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (research archive; github.com/gelnagar/libya-project)' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    const t = await r.text();
    console.log(r.status, r.headers.get('content-type'), t.length, u, '|', t.replace(/\s+/g, ' ').slice(0, 160));
  } catch (e) { console.log('ERR', u, e.message); }
}
