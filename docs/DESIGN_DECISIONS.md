# Design decisions

<!-- VENDORED HEADER: START -->

Record each durable decision about how this code and repository are shaped, once it is settled, with
the reasoning a later reader needs. Guidance Neil Voss states belongs in
[HUMAN_GUIDANCE.md](HUMAN_GUIDANCE.md), dated history in `docs/CHANGELOG.md`, open discussion in
`docs/active_plans/decisions/`. [PROPAGATED HEADER - ENTRIES BELOW ARE YOURS]
<!-- VENDORED HEADER: END -->

Write each decision as a level-three heading with these four fields. `Owner` names the
authoritative code or contract document, rather than a person.

```markdown
### <decision title>

**Decision.** <the durable direction>

**Why.** <the reason it was chosen>

**Consequence.** <the constraint a future change preserves>

**Owner.** <the authoritative code or contract doc>
```

### First playable combat contract

**Decision.** Use plain TypeScript for fixed 60 Hz combat state and Babylon.js for rendering. Each fight starts immediately with Red under player control and Blue under AI control.

**Why.** A complete dummy match tests movement, camera, and hit readability before character production.

**Consequence.** Keep two ground axes, bounded movement, one hit per swing, block, knockdown, recovery, 100 health, two rounds to win, and a restart action. Map only documented controls and clamp gamepad values (ASVS 2.1.1, 2.2.1); advance explicit match phases (ASVS 2.3.1).

**Owner.** `src/match.ts` and `src/main.ts`.

### Generic adult-human presentation asset

**Decision.** Use the CC0 Mesh2Motion `male_5` GLB with Mesh2Motion's direct same-rig base and
addon animation libraries for the generic Red and Blue fighters. The vendored source is commit
`3ce7f9d97d25e608b4779ce797da343775ded62b`; exact paths, license link, and SHA-256 digests are in
[`assets/README.md`](../assets/README.md).

**Why.** The model has an adult human silhouette, a local GLB loading path, and compatible clips on
the same skeleton. The comparison rejected Quaternius for its chunky low-poly silhouette and
rejected the Vitruvian body plus external-clip experiment because it required unreliable retargeting.

**Consequence.** `Match` remains independent of meshes, bones, and clips. Rendering can only observe
fighter state. Red and Blue must each receive independent skeleton, material, and animation-group
instances. A later visual source change repeats the local-load and state-animation browser checks.

**Owner.** `src/rigged_fighter.ts`, `assets/README.md`, and
`docs/archive/first_nobel_fighter.md`.

### Camera framing protects readable fighters

**Decision.** Frame both human silhouettes using their projected horizontal and vertical extents in
camera space, fit each extent to its matching FOV axis, and include the nearer fighter's depth.

**Why.** The original circumscribed-sphere fit charged its diagonal radius to the narrower FOV on
both axes. This kept fighters visible but made them too small in ordinary landscape play. Axis-based
perspective fitting makes the fighters larger while retaining headroom for the current GLB sizes,
camera orbit, pitch, and practical separation.

**Consequence.** Camera tests cover crossing, circling, edge movement, and maximum separation. The
live fixture waits for rendered frames after resize and uses separate fresh knockdown windows for
its aspect-ratio separation trials. At the default landscape start, both models must occupy at least
20% of viewport height. View controls stay available and player movement remains camera-relative.
Live projections verify center, feet, model tops, and conservative head anchors from 0 to 2.7 m; they
do not prove every animated limb extremum, and pitch/zoom endpoints are not cross-producted with
maximum separation.

**Owner.** `src/main.ts` and browser traversal fixtures.

### Warburg starts the Nobel roster

**Decision.** Make Otto Heinrich Warburg the first research-based fighter and signature character
after the generic fighter foundation. Use a locally vendored, same-rig adult scientist model. Make Warburg
stronger than the standard AI opponent through explicit character-specific combat rules.

**Why.** This follows the game's scientific theme and the requested roster direction. Warburg's
respiratory-enzyme research, tumor-metabolism work, and the later-named Warburg effect offer distinct
sources for moves without inventing a general ability framework.

**Consequence.** Preserve deterministic 60 Hz simulation and keep character rules explicit until a
second real fighter demonstrates a need for shared roster data. Attribute his 1931 Nobel Prize to
the respiratory enzyme; describe tumor-metabolism and aerobic-glycolysis powers as game adaptations,
not as the award citation or a cancer-treatment claim.

Warburg's current concrete moves are Oxygen Transfer (faster, longer-reach heavy), Lactate Drive
(a fixed-distance rush and jab), and Aerobic Glycolysis (a timed movement window and one powered
ordinary light). The moves use existing attack inputs plus two explicit chords; they add no healing,
stacking, or shared ability framework. Their exact tick values and test contracts are in the active
plan and source dossier.

**Owner.** `docs/archive/first_nobel_fighter.md`, `docs/WARBURG_SOURCE_DOSSIER.md`, and
the existing Match/rig boundaries.

### Curie uses a native rig

**Decision.** Present Marie Curie as the AI opponent with the vendored CC0 Mesh2Motion
`female_31.glb` model and existing direct same-rig clips. Preserve her authored clothing and
proportions instead of multiplying every material by a fighter color.

**Why.** The pinned asset has a natural adult-human silhouette, 1,211 triangles, and the same ordered
66-joint rig as Warburg and the curated local animation libraries. Browser captures show each current
combat state without load or mapping errors.

**Consequence.** `Match` still identifies the blue fighter only as the existing `opponent` role and
owns AI behavior, combat state, position, hit volumes, and timing. The visual layer identifies that
opponent as Curie and must retain independent skeletons, materials, and animation groups.

**Owner.** `src/rigged_fighter.ts`, `src/index.html`, `assets/README.md`, and
`docs/archive/next_nobel_fighter.md`.

### Curie uses a direct Separation Step rule

**Decision.** Add Curie's fictional Separation Step as a direct `Match` rule on the existing
`light + block` chord. It has a fixed 24-tick attack, 18..12 active ticks, 1.95-unit reach,
16/3 damage through ordinary/held block contact, 16 hit-stun ticks, and a 72-tick cooldown.

**Why.** Curie's documented chemical separations and activity measurements support a staged,
timing-led metaphor. The bounded rule distinguishes her from Warburg without changing the
authoritative combat model or creating an ability abstraction.

**Consequence.** Only the `curie` role receives the chord behavior. The direct rule keeps existing
positions, geometry, one-hit guarding, block response, KO, round, restart, Warburg, and standard
opponent contracts intact. It adds no movement, projectile, persistent resource, health effect, or
special knockback behavior.

**Owner.** `src/match.ts`, `src/debug_harness.ts`, `tests/test_match.mjs`, and
`docs/CURIE_SOURCE_DOSSIER.md`.

### Franklin is a player-only selectable role

**Decision.** Add Rosalind Franklin as a player-selectable fighter paired with Warburg AI, while
keeping `NobelFighterRole` limited to Warburg and Curie for unlock progression.

**Why.** Franklin was not a Nobel laureate. Her secret role is earned through wins as both existing
Nobel fighters, and the two-slot match does not need opponent selection or roster infrastructure.

**Consequence.** `Match.selectPlayer("franklin")` always creates Franklin in slot 0 and Warburg in
slot 1; round reset and restart preserve that pair. The existing `female_31` rig supplies the
visual representation, with its display name resolved from the fighter role.

**Owner.** `src/match.ts` and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin unlock reduction stays separate from browser storage

**Decision.** Keep the versioned Franklin win record reducer pure. The F6A adapter in
`src/franklin_storage.ts` owns reads and writes for
`nobel-combat.franklin-unlock.v1`; F6B in `src/franklin_progression.ts` consumes only a live,
non-debug complete player Warburg or Curie match victory and exposes an unlock only after a changed
durable write.

**Why.** This preserves deterministic progression tests and keeps browser failures outside `Match`
and the unlock calculation.

**Consequence.** `readFranklinUnlock` returns `{ state, readFailed }`; malformed records decode to
locked and thrown reads set `readFailed` while keeping the game playable. `writeFranklinUnlock`
returns `{ written }`; a failed write leaves Franklin hidden and emits no unlock announcement.
Storage writes alone do not change the chooser or live region: F6B consumes successful changed
writes before application state, chooser reveal, or the F5B post-commit seam. AI wins, round wins,
restart, repeated render/tick calls, forced debug fixtures, and Franklin matches add no progress.
Startup, read, and write failures remain locked and playable. Browser tests cover durable reload
and denied storage at the controller boundary. Both real full Nobel-win orders remain locked after
the first win, unlock durably with one announcement after the second, and reload silently. F6A's
startup fixture covers denied reads; a denied write preserves the partial record, leaves the session
locked, and produces no unlock or browser error.

**Owner.** `src/franklin_unlock.ts`, `src/franklin_storage.ts`, `src/franklin_progression.ts`, the application controller in `src/main.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin reuses the authored female_31 presentation

**Decision.** Use the locally vendored `female_31` rig for Franklin, resolve its display identity
from `FighterRole`, and retain the asset's authored appearance without adding a Franklin palette.

**Why.** Curie and Franklin are never concurrent in supported match pairs. Reusing the tested
CC0 rig keeps the asset pipeline small while Warburg still receives an independent human rig.

**Consequence.** The Franklin-versus-Warburg presentation has independent roots, skeletons,
materials, and animation instances; all eight current combat states map to clips. A separate
palette requires measurable visual evidence before it is added.

**Owner.** `src/rigged_fighter.ts`, `src/main.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin chooser derives fixture state through the strict decoder

**Decision.** Keep F5A browser fixtures at the same validation boundary as production progression:
they serialize a candidate unlock record and create the native Franklin option only from
`decodeFranklinUnlock`'s result.

**Why.** A raw unlocked object would bypass the strict record contract that F3 establishes. The
decoder-backed fixture proves the chooser consumes the bounded locked/unlocked state while F6A-F6D
retain ownership of browser storage.

**Consequence.** Before a valid fixture record, the native chooser has exactly Warburg and Curie;
after decoding a valid unlocked record, it creates Franklin after Curie. Keyboard, D-pad, and stick
navigation use that dynamic order, and Franklin's help remains limited to her actual standard
controls. `localStorage` and durable progression remain F6A-F6D work; F5B owns announcement
presentation, which F6B invokes only after a successful durable write.

**Owner.** `src/main.ts`, `src/franklin_unlock.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin unlock presentation follows durable progress

**Decision.** Keep F5B's post-commit unlock handler and match-over `Change fighter` route
storage-free. F6B calls the handler only after a changed `localStorage.setItem` succeeds; the
playtest-only hook that reaches it remains isolated to `playtestMode`.

**Why.** The interface can announce a newly durable unlock and reopen fighter selection without
making UI code responsible for persistence or allowing a failed write to expose Franklin.

**Consequence.** A decoded already-unlocked record produces no announcement, a failed or unchanged
write reaches no F5B commit seam, and `Change fighter` is available only at match-over. It preserves
a valid current Curie or Franklin choice, otherwise falls back to Warburg, while combat stays paused
until chooser confirmation.

**Owner.** F5B controller behavior in `src/main.ts`; durable storage and the post-write call site
belong to F6A-F6B in
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Debug camera telemetry excludes intentional restart snaps

**Decision.** Treat the debug harness camera displacement at an intentional restart as synthetic
snap telemetry, reset its baseline after the restart, and retain live rendered-frame continuity as
the camera smoothness gate.

**Why.** The debug harness advances manual simulation batches and snaps its camera to expose state.
Comparing positions across a match restart measures that deliberate reset rather than camera motion.
Live browser endurance checks measure the rendered camera on consecutive frames.

**Consequence.** Debug stress retains a 4.5-unit physical bound per 12-tick batch away from reset;
the restart assertion establishes a valid new baseline. Production F7C keeps its stricter
under-2.5-units-per-rendered-frame continuity check. Both paths preserve actionable diagnostics.

**Owner.** `tests/playwright/agent_scenarios.mjs`,
`tests/playwright/franklin_endurance.spec.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).
