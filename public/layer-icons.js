/* Layer icons. One 24-unit drawing per layer of the map, drawn from what each thing is on the ground, in the position the
   viewer is in: footprints for sites seen from above on the declassified film, a silhouette for what is known by its height.
   Rules (archive/design/not-claude-style.md): flat; one 2-unit stroke with square caps and mitred joins; solid fill only
   where the real object is massive; one colour (currentColor); no container, no letters, nothing that depends on colour.
   Markers on the map stay the validated shapes in app.js; these icons are for the places that have room for a drawing:
   hover cards, the place panel, lists.
   Each entry is [outline markup, solid path]. ATLAS_ICON_SVG(key) returns the whole <svg>; the fill and stroke sit on
   inner groups so a page rule such as ".ic svg { fill: #fff }" cannot fill the outlines. */
(function () {
  var ICONS = {
    // Prison compound from above: perimeter wall, a tower at each corner, one cell block inside.
    detention: ['<rect x="4" y="6" width="16" height="12"/>', 'M1 3h6v6H1zM17 3h6v6h-6zM1 15h6v6H1zM17 15h6v6h-6zM8 10.5h8v3H8z'],
    // Police or security station from above: the building, and the boom barrier of its gate with the post that holds it.
    security: ['<rect x="5" y="3" width="14" height="10"/><path d="M3 19H14"/>', 'M14 16h6v6h-6z'],
    // Garrison: a long barracks block, a flagpole rising from it and the flag. Seen from the side because a flag has no footprint.
    military: ['<path d="M7 3V15"/>', 'M8 3h10v6H8zM2 15h20v5H2z'],
    // Bomb crater from above, as it shows on reconnaissance film: the ring of the crater and uneven throw-out rays.
    airstrike: ['<circle cx="12" cy="12" r="4"/><path d="M18.5 9.5L22.5 8M14 5L14.5 2M6.5 7.5L3 4.5M5 14L2.5 14.5M9.5 18.5L8 22.5M17.5 16.5L19.5 18"/>', ''],
    // The map idiom for an attack: two axes of advance ending short of the line they attack.
    battle: ['<path d="M2 8H14M11 4.5L15 8L11 11.5M2 16H14M11 12.5L15 16L11 19.5"/>', 'M19 3h3v18h-3z'],
    // A long strip of ground with drafting hatch across it: ground where people were killed. No figure, no weapon, no mark of the act.
    massacre: ['<rect x="3" y="8" width="18" height="8"/><path d="M4 15L10 9M9 15L15 9M14 15L20 9"/>', ''],
    // Walled residence or seat of power from above: the wall with the gate left open at the front, a solid inner building.
    power: ['<path d="M10 21H3V3H21V21H14"/>', 'M8 8h8v8H8z'],
    // A monument seen from the side: shaft, point and base.
    landmark: ['', 'M8 20L9 8L12 3L15 8L16 20zM5 20h14v3H5z']
  };
  window.ATLAS_ICONS = ICONS;
  window.ATLAS_ICON_SVG = function (key, cls) {
    var i = ICONS[key]; if (!i) return '';
    return '<svg class="' + (cls || 'lic') + '" viewBox="0 0 24 24" aria-hidden="true">' +
      (i[0] ? '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">' + i[0] + '</g>' : '') +
      (i[1] ? '<path fill="currentColor" stroke="none" d="' + i[1] + '"/>' : '') + '</svg>';
  };
})();
