// Checks public/name-fold.js: spelling variants of one name become the same text, and different names stay different.
//   node scripts/test-search.mjs
import fs from 'node:fs'; import vm from 'node:vm';
const w = {}; vm.runInNewContext(fs.readFileSync('public/name-fold.js', 'utf8'), { window: w }); const f = w.ATLAS_NAMEFOLD;
let pass = 0, fail = 0; const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const same = (...xs) => ok('same: ' + xs.join(' = '), new Set(xs.map(f)).size === 1);
const diff = (a, b) => ok('different: ' + a + ' / ' + b, f(a) !== f(b));
same('Gaddafi', 'Qaddafi', 'Kadhafi', 'Gadhafi', 'Khadafy', 'Qadhafi');
same('Tajoura', 'Tajura'); same('Tarhouna', 'Tarhuna'); same('Ben Ashour', 'Bin Ashur'); same('Mitiga', 'Mitiqa');
same('Benghazi', 'Benghazy'); same('Ghadames', 'Gadames'); same('Souq al-Jumaa', 'Suq al-Jumaa');
diff('Tripoli', 'Tarhuna'); diff('Misrata', 'Sirte'); diff('Zawiya', 'Zliten'); diff('Abu Salim', 'Ain Zara');
ok('Arabic passes through', f('أبو سليم') === 'أبو سليم'); ok('digits kept', f('1984') === '1984'); ok('empty', f('') === '' && f(null) === '');
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
