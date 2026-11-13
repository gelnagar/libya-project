/* TEST FIXTURE, never published: two made-up pins used only to check that a second region loads and switches.
   Git ignores this file and build-claims.mjs skips files starting with "_". */
window.ATLAS_SITES.push(
  { id: 'zz-test-1', region: 'benghazi', layer: 'landmark', level: 'context', y0: 1970, y1: 1980, name: 'TEST PIN ONE (not real)', lat: 32.12, lon: 20.07, r: 1, period: 'test', relevance: 'test', text: 'Test fixture.', sources: [] },
  { id: 'zz-test-2', region: 'benghazi', layer: 'detention', level: 'suspected', y0: 1985, y1: 1985, name: 'TEST PIN TWO (not real)', lat: 32.10, lon: 20.10, r: 1, period: 'test', relevance: 'test', text: 'Test fixture.', sources: [] });
