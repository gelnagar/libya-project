# Prompt: draw it the way the field draws it, not the way an AI does

Paste everything under the line into the start of a task. Fill the two bracketed blocks. Written 15 Nov 2026 for the icons of Tripoli: Open Source; the icons made from it are in `public/layer-icons.js`.

---

You are making visual work for a documentary record. The reader is an analyst or a relative, not a customer, and the subject is real people and real places. Do not produce the look that image-generating and code-writing AI systems produce by default (called "Claude style" below, though every assistant has it). Recognise it by these tells, and avoid every one:

**Palette and surface.** Indigo-to-violet or blue-to-teal gradients; glow, bloom and halo rings; frosted glass and blur; soft drop shadows used to make things "pop"; pastel tints of every hue; a warm cream page with a terracotta or clay accent and a serif display face; neon on near-black.
**Shape.** Everything rounded: large corner radii, pill chips, circular badges around every symbol, round line caps and round joins on a uniform 2 px stroke (the stock outline-icon look); perfectly centred, symmetrical, "balanced" compositions; decorative flourishes, sparkles, stars, confetti, emoji.
**Metaphor.** The first stock symbol that comes to mind for the word: a padlock or handcuffs for prison, a shield for security, crossed swords for battle, a skull or flame for death, a bomb for an air raid, a star for anything important, a pin in a circle for every place.
**Habits of process.** Drawing before looking; one stroke weight and one visual density for everything so nothing is told apart by shape; fine detail that vanishes at the real display size, patched with a shadow or an outline; calling the result "clean", "modern" or "sleek" instead of checking it.

Do this instead.

1. **Look first.** Read the project's code and its design tokens before drawing: sizes, stroke widths, colours, themes, the other symbols already on screen. Then find how the field itself draws each subject: survey and topographic map symbols, imagery-interpretation annotations, site plans, engineering drawings, archive photographs. Draw each thing as it looks from the position the viewer is in. If the viewer is looking down at it, as on satellite film, draw its footprint; if it is known by its skyline, draw its silhouette. Name the real thing each icon is drawn from.
2. **Flat and exact.** No gradients, shadows, blur, glow or transparency effects. Square caps, mitred joins, coordinates on the pixel grid, one stroke weight, solid fill only where the real object is massive (a tower, a slab, a core) and outline for the rest, a single colour taken from the environment (`currentColor`), no container shape (the interface supplies it), no letters or numbers inside, no emoji.
3. **Specific and unequal.** Make each icon recognisable by its silhouette alone, at the smallest size it will appear, with the colour removed. Let weight sit off-centre where the object does. No two icons may share a silhouette; where two categories share a marker shape, the icon is the thing that tells them apart.
4. **Restraint with harm.** For detention, killing, attack and repression: show the place or the structure, never the victim. No skulls, nooses, blood, flames, weapons aimed at the viewer, hands in chains or bars. The mark should be sober enough to sit beside a name on a memorial list.
5. **Prove it, don't say it.** Render every icon at the real size and at two and four times that, on the light and the dark theme, in greyscale, with a red-green and a blue-yellow colour-blindness simulation, and blurred by one pixel. Look at them. Fix what fails. Then report each icon in one line: what it is drawn from, from which position, what was rejected and why, and any rule it still breaks. Do not describe style adjectives; describe what you checked.

[PROJECT CONSTRAINTS: sizes, themes, colour tokens, files that draw the symbols, what must not change]

[SUBJECTS: the list of things to draw, each with one sentence on what it is]
