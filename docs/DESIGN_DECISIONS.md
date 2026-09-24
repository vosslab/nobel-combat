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

### AI randomness is isolated from rendering

**Decision.** Give the AI controller its own seeded 32-bit random source. A normal app session draws
one seed; local browser playtests use the fixed seed `1`.

**Why.** Reproducible AI actions make live match scenarios repeatable and prevent unrelated browser
randomness from advancing the combat controller's sequence.

**Consequence.** `createAi` continues to accept an injected random source, while Babylon rendering
and asset loading cannot change subsequent AI decisions. Match state and combat rules remain
independent of the random generator.

**Owner.** `src/ai.ts`, `src/main.ts`, and `tests/test_ai.mjs`.

### Warburg uses a scientist rig

**Decision.** Present Otto Heinrich Warburg with the local CC0 Mesh2Motion `doctor_m` GLB and its
direct same-rig base and addon animation clips. Keep Mesh2Motion `male_5` as a source-level
compatibility test fixture; it is not loaded at runtime or copied into production. The exact
sources and SHA-256 digests are recorded in
[`assets/README.md`](../assets/README.md).

**Why.** `doctor_m` gives Warburg a distinct adult scientist presentation while sharing the
66-joint skeleton used by the vendored animation libraries. The earlier `male_5` experiment proved
the asset pipeline before the character-specific models were selected.

**Consequence.** `Match` remains independent of meshes, bones, and clips. Rendering maps this rig to
the Warburg role and follows authoritative fighter state. A future model change repeats local-load,
animation-state, and rendered-match checks.

**Owner.** `src/rigged_fighter.ts`, `assets/README.md`, and
[`docs/archive/first_nobel_fighter.md`](archive/first_nobel_fighter.md).

### Warburg's apparatus follows the existing rig

**Decision.** Attach a small belt gauge and forearm manometer to Warburg's existing pelvis and arm
transforms. Drive the gauge needle and iron-red flow pulse from the authoritative heavy-attack
state and fixed simulation ticks.

**Why.** The source dossier connects Warburg's visual signature to historical manometric methods.
The two small apparatus details make Oxygen Transfer readable while reusing the current model and
skeletal hierarchy.

**Consequence.** The accessories are presentation-only. They do not supply collision geometry,
affect Fighter state, or add animation timing. Browser captures verify attachment presence, attack
progress, needle response, and reset after the move.

**Owner.** `src/rigged_fighter.ts` and `tests/playwright/capture_rig_states.mjs`.

### Camera framing protects readable fighters

**Decision.** Frame both human silhouettes using their projected horizontal and vertical extents in
camera space, fit each extent to its matching FOV axis, and include the nearer fighter's depth.

**Why.** The original circumscribed-sphere fit charged its diagonal radius to the narrower FOV on
both axes. This kept fighters visible but made them too small in ordinary landscape play. Axis-based
perspective fitting makes the fighters larger while retaining headroom for the current GLB sizes,
camera orbit, pitch, and practical separation. The first camera frame snaps to the loaded pair so
fighters never appear undersized while the live tracking camera smoothly follows later movement.
Time-based follow responds quickly to viewport changes, and a per-render displacement bound keeps
reframing continuous. The opening pair starts 3.6 world units apart, and the close-range framing
floor is 5.5 units; this keeps the human silhouettes prominent at the start while the pair-based fit
continues to pull back at practical maximum separation.

**Consequence.** Camera tests cover crossing, circling, edge movement, and maximum separation. The
live fixture waits for rendered frames after resize and uses separate fresh knockdown windows for
its aspect-ratio separation trials. At the default landscape start, both models must occupy at least
27% of viewport height. View controls stay available and player movement remains camera-relative.
Live projections verify center, feet, model tops, and conservative head anchors from 0 to 2.7 m; they
do not prove every animated limb extremum, and pitch/zoom endpoints are not cross-producted with
maximum separation.

**Owner.** `src/main.ts` and browser traversal fixtures.

### Fighters cast soft stage shadows

**Decision.** Loaded rigged fighter meshes cast soft shadows onto the arena floor. Keep shadow
generation in Babylon presentation; the `Match` positions and collision volumes remain authoritative.

**Why.** The flat arena made foot placement difficult to read against the floor. Subtle contact
shadows ground the existing human models without changing their geometry or combat state.

**Consequence.** The renderer owns one bounded shadow map for all local fighter assets, while disabled
role models remain hidden. Browser state captures check the rendered path for all three fighter rigs.

**Owner.** `src/main.ts`, `src/rigged_fighter.ts`, and the existing rig-state capture tests.

### Hit feedback follows damage

**Decision.** Show a brief gold ring when a fighter takes unblocked damage and a blue ring when a
held block absorbs a strike. Anchor each cue near the affected fighter and expire it using render
elapsed time.

**Why.** The attack and hit animations communicate motion, but confirmed contact also needs a quick
visual signal that remains readable across camera angles and hit reactions.

**Consequence.** Cue activation observes health loss after `Match` resolves the hit. It does not
change damage, collision, animation timing, or fighter state. Local debug snapshots expose cue kind,
position, alpha, and visibility so the browser scenario can verify the presentation contract.

**Owner.** `src/main.ts`, `src/playtest_probe.ts`, and
`tests/playwright/agent_scenarios.mjs`.

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

### Curie uses a period-dress rig

**Decision.** Present Marie Curie as the AI opponent with the vendored CC0 OpenGameArt `Old Lady`
model, which has a long high-necked dress, gray updo, feminine face, and 84-joint rig. Retarget the
existing local combat clips with Babylon.js `AnimatorAvatar` and one explicit asset-specific bone
map. Rosalind Franklin continues to use the CC0 Mesh2Motion `female_9.glb` model and native clips.

**Why.** The previous Curie model's contemporary clothing did not fit the historical character.
OpenGameArt's CC0 `Old Lady` asset already provides a rigged period-style dress and an explicitly
authored feminine face. Babylon supports animation-group retargeting across differently named rigs;
the selected model's local animation map covers at least 50 joints in each combat clip. Automated
captures exercise every current state without browser errors.

**Consequence.** `Match` still identifies the blue fighter only as the existing `opponent` role and
owns AI behavior, combat state, position, hit volumes, and timing. The visual layer identifies that
opponent as Curie and retains an independent skeleton and animation groups. The model stays local;
the single explicit map does not generalize the animation system.

**Owner.** `src/rigged_fighter.ts`, `src/main.ts`, `src/playtest_probe.ts`,
`build_github_pages.sh`, `assets/README.md`, and the rig-boundary browser tests.

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
slot 1; round reset and restart preserve that pair. The existing `female_9` rig supplies the
visual representation, with its display name resolved from the fighter role.

**Owner.** `src/match.ts` and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin unlock reduction stays separate from browser storage

**Decision.** Keep the versioned Franklin win record reducer pure. The storage adapter in
`src/franklin_storage.ts` owns reads and writes for
`nobel-combat.franklin-unlock.v1`; the progression observer in `src/franklin_progression.ts` consumes a completed player
Warburg or Curie match victory and exposes an unlock only after a changed durable write. Live match
ticks and explicit `DebugHarness.tick` calls use the same edge observer; `DebugHarness.forceMatch`
only sets a fixture snapshot and does not invoke it.

**Why.** This preserves deterministic progression tests and keeps browser failures outside `Match`
and the unlock calculation.

**Consequence.** `readFranklinUnlock` returns `{ state, readFailed }`; malformed records decode to
locked and thrown reads set `readFailed` while keeping the game playable. `writeFranklinUnlock`
returns `{ written }`; a failed write leaves Franklin hidden and emits no unlock announcement.
Storage writes alone do not change the chooser or live region: the progression observer consumes
successful changed writes before application state, chooser reveal, or the unlock-announcement
handler. AI wins, round wins,
restart, repeated render/tick calls, direct forced-phase fixtures, and Franklin matches add no
progress. A debug tick that reaches a real player match-over edge uses the same observer, allowing
the integration harness to validate idempotence after the already-recorded win. Startup, read, and
write failures remain locked and playable. Browser tests cover durable reload and denied storage
at the controller boundary. Both real full Nobel-win orders remain locked after
the first win, unlock durably with one announcement after the second, and reload silently. The
startup storage fixture covers denied reads; a denied write preserves the partial record, leaves the session
locked, and produces no unlock or browser error.

**Owner.** `src/franklin_unlock.ts`, `src/franklin_storage.ts`, `src/franklin_progression.ts`,
`src/debug_harness.ts`, the application controller in `src/main.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin reuses the authored female_9 presentation

**Decision.** Use the locally vendored `female_9` rig for Franklin, resolve its display identity
from `FighterRole`, and retain the asset's authored appearance without adding a Franklin palette.

**Why.** Curie and Franklin are never concurrent in supported match pairs. Reusing the tested
CC0 rig keeps the asset pipeline small while Warburg still receives an independent human rig.

**Consequence.** The Franklin-versus-Warburg presentation has independent roots, skeletons,
materials, and animation instances; all eight current combat states map to clips. A separate
palette requires measurable visual evidence before it is added.

**Owner.** `src/rigged_fighter.ts`, `src/main.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin chooser derives fixture state through the strict decoder

**Decision.** Keep chooser browser fixtures at the same validation boundary as production progression:
they serialize a candidate unlock record and create the native Franklin option only from
`decodeFranklinUnlock`'s result.

**Why.** A raw unlocked object would bypass the strict record contract that F3 establishes. The
decoder-backed fixture proves the chooser consumes the bounded locked/unlocked state while the
storage adapter and progression observer retain ownership of browser storage.

**Consequence.** Before a valid fixture record, the native chooser has exactly Warburg and Curie;
after decoding a valid unlocked record, it creates Franklin after Curie. Keyboard, D-pad, and stick
navigation use that dynamic order, and Franklin's help remains limited to her actual standard
controls. `localStorage` and durable progression remain in the storage adapter and progression
observer; the application calls the announcement handler only after a successful durable write.

**Owner.** `src/main.ts`, `src/franklin_unlock.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin unlock presentation follows durable progress

**Decision.** Keep the post-commit unlock handler and match-over `Change fighter` route
storage-free. The progression observer calls the handler only after a changed
`localStorage.setItem` succeeds; the
playtest-only hook that reaches it remains isolated to `playtestMode`.

**Why.** The interface can announce a newly durable unlock and reopen fighter selection without
making UI code responsible for persistence or allowing a failed write to expose Franklin.

**Consequence.** A decoded already-unlocked record produces no announcement, a failed or unchanged
write reaches no announcement handler, and `Change fighter` is available only at match-over. It preserves
a valid current Curie or Franklin choice, otherwise falls back to Warburg, while combat stays paused
until chooser confirmation.

**Owner.** Application presentation in `src/main.ts`; durable storage and the post-write call site
belong to `src/franklin_storage.ts` and `src/franklin_progression.ts` in
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Debug camera telemetry excludes intentional restart snaps

**Decision.** Treat the debug harness camera displacement at an intentional restart as synthetic
snap telemetry, reset its baseline after the restart, and retain live rendered-frame continuity as
the camera smoothness gate.

**Why.** The debug harness advances manual simulation batches and snaps its camera to expose state.
Comparing positions across a match restart measures that deliberate reset rather than camera motion.
Live browser endurance checks measure the rendered camera on consecutive frames.

**Consequence.** Debug stress retains a 4.5-unit physical bound per 12-tick batch away from reset;
the restart assertion establishes a valid new baseline. The live browser endurance check keeps its stricter
under-2.5-units-per-rendered-frame continuity check. Both paths preserve actionable diagnostics.

**Owner.** `tests/playwright/agent_scenarios.mjs`,
`tests/playwright/franklin_endurance.spec.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).
