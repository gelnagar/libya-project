// Refuses a push that would put a secret in the public repository.
//   node scripts/check-secrets.mjs
// Scans every tracked text file (archive/ and public/data/ hold other people's documents and are skipped except for
// the word list below). Looks for:
//   1. key-shaped strings (Anthropic, Resend, GitHub, AWS, bearer tokens);
//   2. a secret's name (FAMILY_CODE, OWNER_CODE, ...) in a table row, assignment or "name: value" whose value is a
//      real-looking word, not a placeholder;
//   3. any word listed in `.secret-words` (one per line; git-ignored, so the list is never published). Put every
//      password that was ever written down in a public place there. The words are never printed.
// Exit code 1 if anything is found. A `pre-push` hook runs it (see PUSH-CHECKLIST.md).
import fs from 'node:fs'; import { execSync } from 'node:child_process';

const files = execSync('git ls-files -z', { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0').filter(Boolean);
const TEXT = /\.(md|js|mjs|json|jsonc|html|css|yml|yaml|sh|py|txt|sql|toml)$/i;
const SKIP = /^(archive\/|public\/data\/|public\/maps\/|brag-output|work\/)/;
const SELF = new Set(['scripts/check-secrets.mjs', 'scripts/test-worker.mjs']);
const NAMES = 'FAMILY_CODE|OWNER_CODE|SESSION_SECRET|STATS_SALT|ANTHROPIC_API_KEY|RESEND_API_KEY|USGS_TOKEN|USGS_USERNAME|ALERT_EMAIL';

const words = fs.existsSync('.secret-words') ? fs.readFileSync('.secret-words', 'utf8').split(/\r?\n/).map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 4) : [];
const shapes = [
  ['Anthropic key', /sk-ant-[A-Za-z0-9_-]{20,}/], ['Resend key', /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}\b|\bre_[A-Za-z0-9]{28,}\b/],
  ['GitHub token', /\b(ghp|gho|ghs|github_pat)_[A-Za-z0-9_]{20,}/], ['AWS key', /\bAKIA[0-9A-Z]{16}\b/],
  ['bearer token', /Bearer\s+[A-Za-z0-9._~+\/-]{32,}/],
];
// a value that is plainly a description or a placeholder
const PLACEHOLDER = /^(your|the|any|a|an|one|optional|never|choose|set|see|long|random|secret|text|name|value|key|code|password|here|todo|none|true|false|undefined|null|string|\.\.\.|…|<|\$|%|\{|\*)/i;

const found = [];
for (const f of files) {
  if (!TEXT.test(f) || SELF.has(f)) continue;
  let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (t.length > 3e6) continue;
  const lines = t.split(/\r?\n/);
  const lower = words.length ? t.toLowerCase() : '';
  for (const w of words) if (lower.includes(w)) found.push([f, 0, 'a word from .secret-words is written here']);
  if (SKIP.test(f)) continue;
  lines.forEach((line, i) => {
    for (const [what, re] of shapes) if (re.test(line)) found.push([f, i + 1, what]);
    // table row: | NAME | Secret | `value` |   (a backticked last cell is a value, not a description)
    const row = line.match(new RegExp('^\\s*\\|\\s*`?(' + NAMES + ')`?\\s*\\|[^|]*\\|\\s*(.+?)\\s*\\|?\\s*$'));
    if (row && /^`[^`]+`/.test(row[2]) && !PLACEHOLDER.test(row[2].replace(/^`/, ''))) found.push([f, i + 1, row[1] + ' has a value in a table']);
    // NAME = value, NAME: value, NAME="value"
    const as = line.match(new RegExp('\\b(' + NAMES + ')\\b\\s*[=:]\\s*[\'"`]?([^\\s\'"`,;)]+)'));
    if (as && as[2].length >= 6 && !PLACEHOLDER.test(as[2]) && !/^(env|process|request|body|c\.|this|await|[A-Z_]+$)/.test(as[2]) && /\.(md|txt|json|jsonc|ya?ml|toml|sh)$/i.test(f)) found.push([f, i + 1, as[1] + ' is given a value']);
  });
}
if (!found.length) { console.log(`check-secrets: clean (${files.length} tracked files, ${words.length} listed word${words.length === 1 ? '' : 's'} checked)`); process.exit(0); }
for (const [f, n, what] of found) console.log('FOUND ' + f + (n ? ':' + n : '') + '  ' + what);
console.log(`check-secrets: ${found.length} finding${found.length === 1 ? '' : 's'}. Remove the value, rotate the secret if it is real, then run again.`);
process.exit(1);
