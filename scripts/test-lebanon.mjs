// Checks the "Tripoli in Lebanon" test shared by the collectors, the extraction and the review builder (lib/fetcher.mjs).
//   node scripts/test-lebanon.mjs
import { lebanonOnly } from './lib/fetcher.mjs';
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log('PASS ' + msg); } else { fail++; console.log('FAIL ' + msg); } };
ok(lebanonOnly('Heavy fighting in Tripoli, Lebanon, between militias.'), '"Tripoli, Lebanon" written out, Libya never named: set aside');
ok(lebanonOnly('Fighting continued around Tripoli and Zagharta.', 'MILITARY ACTIVITY TRIPOLI, LEBANON'), 'Lebanon in the title: set aside');
ok(lebanonOnly('Lebanese army ... Lebanon ... northern Lebanon ... Tripoli harbour'), 'Lebanon named three times: set aside');
// the President's Daily Brief of 13 Feb 1974: Tripoli is Libya's, Libya is never named, Beirut is quoted in passing
ok(!lebanonOnly('The conference of Arab oil ministers, scheduled to begin tomorrow in Tripoli, was postponed, according to a spokesman of the Kuwait Embassy in Beirut. Ceausescu arrived in Tripoli yesterday and will later visit Beirut, Damascus, and Baghdad.'), 'a passing mention of Beirut is not enough (PDB 13 Feb 1974)');
ok(!lebanonOnly('Qadhafi said the fighting in Tripoli, Lebanon will end. Libyan radio, Tripoli.'), 'a text that names Libya is kept even if it names Tripoli, Lebanon');
ok(!lebanonOnly('Explosion at Bab al-Aziziya barracks, Tripoli.'), 'an ordinary Tripoli text is kept');
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
