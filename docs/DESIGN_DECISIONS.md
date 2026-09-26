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

### Pausing freezes combat and animation while preserving view control

**Decision.** Pause match ticks and Babylon animation groups together. Keep rendering and camera
input active so a paused pose can be framed and screenshotted. Reset accumulated time on pause and
resume so no delayed combat steps run after resuming.

**Why.** The pause control supports visual review of character appearance, attacks, and poses. A
frozen match with an active camera lets reviewers inspect the same combat moment from another view.

**Consequence.** The Pause/Resume button and P/Space keys share one paused state; orbit, tilt, and
zoom continue to update the camera while combat and visual effects stay frozen. Shift+Page Up/Down
pans the paused view vertically to frame a face without changing the fighter pose. Paused zoom and
vertical pan return to the match-safe view when play resumes.

**Owner.** `src/main.ts`, `src/ui/hud.ts`, and `tests/playwright/pause_match.spec.ts`.

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

**Owner.** `src/rig/loader.ts`, `src/rig/clips.ts`, `src/rig/presentation.ts`,
`assets/README.md`, and
[`docs/archive/first_nobel_fighter.md`](archive/first_nobel_fighter.md).

### Rig loader retains source assets per scene

**Decision.** Cache imported GLB containers by scene and URL, and instantiate only the active two
fighters with independent skeletons, materials, and animation groups. Generate the shipped model
manifest from unique roster body paths.

**Why.** Match loading then scales with the two fighters in play rather than with the full roster,
and mirror matches can use separate instances of the same cached source model.

**Consequence.** Match changes dispose fighter instances and reuse cached source containers. The
Pages build validates and copies the models named by the generated manifest.

**Owner.** `src/rig/loader.ts`, `devel/write_model_manifest.mjs`, and `build_github_pages.sh`.

### Accepted character bodies are preserved before roster registration

**Decision.** After a body passes its two-position visual and rig gate, promote the exact
SHA-sealed capture copy to `assets/models/` and record it in `assets/README.md` as accepted but
unregistered. Keep `assets/models/MANIFEST.txt` generated exclusively from `FighterDef.body`
paths; do not manually list candidates there.

**Why.** Character-model waves can finish and preserve accepted artwork before their later fighter
data waves register the fighter. The build ships only registry-backed models, so a second manual
asset list would drift and could advertise assets the game does not load.

**Consequence.** An accepted unregistered model is durable in the repository but is not copied into
the Pages build or loaded at runtime. When its `FighterDef.body` path lands, regenerate the manifest;
the existing build then ships it. The handoff keeps the capture SHA as provenance.

**Owner.** `docs/NEW_CHARACTER_RECIPE.md`, the active roster expansion plan,
`assets/README.md`, and `devel/write_model_manifest.mjs`.

### Warburg's apparatus follows the existing rig

**Decision.** Attach a small belt gauge and forearm manometer to Warburg's existing pelvis and arm
transforms. Drive the gauge needle and iron-red flow pulse only from an active special's authoritative
`specialTicks`, never from its shared heavy pose.

**Why.** The source dossier connects Warburg's visual signature to historical manometric methods.
The two small apparatus details make Oxygen Transfer readable while reusing the current model and
skeletal hierarchy.

**Consequence.** The accessories are presentation-only. They do not supply collision geometry,
affect Fighter state, or add animation timing. Browser captures verify attachment presence, ordinary
heavy inactivity, special progress, needle response, and reset after the move.

**Owner.** `src/rig/presentation.ts` and `tests/playwright/capture_rig_states.mjs`.

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

**Owner.** `src/main.ts`, `src/rig/loader.ts`, and the existing rig-state capture tests.

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

**Superseded.** The roster's shared meter release supersedes the earlier fixed-input move rules.
Warburg's three data-defined specials now use one Special input and the generic block scheduler;
his tuned ordinary heavy remains in `FighterStats`.

**Owner.** `docs/archive/first_nobel_fighter.md`, `docs/WARBURG_SOURCE_DOSSIER.md`, and
the existing Match/rig boundaries.

### Nobel Combat is a fun, silly fighting game

**Decision.** Make the game fun and silly, not an educational product. Riff on each scientist's
real Nobel-related work so the attacks are recognizable; any attack outcome beyond the real work
is openly game fiction.

**Why.** Scientific accuracy makes the humor land. A player might get curious and read more about
a scientist, but teaching is not a product goal.

**Consequence.** Judge a design by whether it makes Nobel Combat more fun, distinctive, and absurd
while keeping the scientific connection recognizable. Do not judge it by whether it teaches.

**Owner.** The roster source material and the shared combat, presentation, and roster modules.

### Fighter identity comes from roster data

**Decision.** Define each fighter's identity and combat choices in shared roster data: name,
research-inspired verb, ordinary attack stats, specials, AI profile, unlock rule, and body.

**Why.** The planned 25-fighter game is a demonstrated need for shared roster data. Repeating
identity checks across combat, AI, loading, and presentation would make the roster harder to extend.

**Consequence.** Runtime systems interpret generic fighter data and special blocks. Character-
specific ideas remain welcome when their joke or fighting identity needs them, but they do not add
fighter-id branches to shared runtime code. This supersedes the earlier decision to keep fighter
rules explicit until a second real fighter demonstrated a need for shared data.

**Owner.** `src/roster/`, the match and AI interpreters, and the rig loader.

### Meter release selects a special tier

**Decision.** Give each fighter a 0..300 meter. Apply each combat meter event to the fighter who
caused or received that successful event, multiplied by that fighter's `meterGain` and capped at
300: a landed hit gains 20, a blocked hit gains 8, taking a hit gains 12, and blocking gains 10.
A rising `Action.special` press in `idle` or `move` releases tier `min(3, floor(meter / 100))` when
the meter holds at least 100, then spends `tier * 100`. Preserve meter between rounds and reset it
on restart or new fighter selection.

**Why.** One bounded meter and one button give every roster fighter the same understandable special
entry point while `meterGain` supplies a small data-owned balance lever. Rising-edge input prevents
a held button from retriggering after recovery or a round transition.

**Consequence.** The held-input state carries across a round transition. The HUD can derive the
next special name from the affordable tier without owning combat state. M9 records tier selection
and spend only; M10 consumes the selected special to run its pose and deterministic blocks/effects.

**Owner.** `src/match.ts`, `src/input.ts`, `src/ui/hud.ts`, and
`docs/active_plans/indexed-tumbling-quokka.md`.

### Special effects use combat slots

**Decision.** Model every released special as deterministic effects owned by a fighter slot. A
release uses the authored pose and `ticks`, records `specialTicks`, and schedules its authored
blocks; ordinary strikes cannot resolve during that lifecycle. Scheduled blocks honor delay and
repeat. Projectiles expire on contact or range, zones expire on contact or duration, and shields
and modifiers remain through their exact authored duration. Guard prevents contact unless a block
sets `ignoresBlock`; a connected `onHit` activates its follow-on blocks. A shield counter schedules
its follow-on blocks for the next simulation tick.

**Why.** Slot ownership keeps effects tied to the two-fighter deterministic match model. The
authored special schema already supplies pose, duration, timing, and blocks, so a separate ability
runtime is unnecessary.

**Consequence.** `Match` owns effect scheduling, activation, status aging, guard resolution, and
KO cleanup. A KO clears active and pending effects before the next round or match-over state.

**Owner.** `src/match.ts`, `src/specials.ts`, and `src/roster/fighter_def.ts`.

### Persistent special visuals follow active effects

**Decision.** Derive persistent special visuals from the active simulation effects. Effect records
own projectile count, current position, and zone radius; the authored motif selects shared geometry.
Keep visual indicator scale in presentation so it cannot change collision or duration.

**Why.** Release-only shapes drift away from moving effects and obscure whether a zone or projectile
is still active. Reading the simulation's current effects keeps the visuals synchronized while
allowing their size and silhouette to stay legible in the arena.

**Consequence.** `SpecialVfx` renders the current projectile, zone, and modifier records and caps a
zone ring for screen legibility while `Match` retains its full gameplay radius. Motif-specific
geometry remains generic and does not branch on fighter identity.

**Owner.** `src/vfx.ts`, `src/specials.ts`, and `tests/test_vfx.mjs`.

### Damage tracking records health loss

**Decision.** Track each fighter's `damageTaken` for the current round as actual HP lost after
defense and shield absorption. Healing does not reduce that value.

**Why.** A `damageTaken`-scaled special needs a monotonic record of damage suffered in the round,
rather than a measure that can change when health is restored.

**Consequence.** Round reset creates new fighters and clears `damageTaken`; special damage can use
the value through the authored `scaleWith` field without changing normal health or healing rules.

**Owner.** `src/match.ts` and `src/roster/fighter_def.ts`.

### Combat bodies use the canonical native rig

**Decision.** Curie uses the reviewed `mesh2motion_curie_period.glb` body and shared native combat
clips. `female_31` remains donor/provenance material. Every registered body retains the canonical
ordered 66-joint Mesh2Motion skeleton, and the runtime clones clips directly onto those joints.
Runtime cross-rig retarget maps are not a supported body path.

**Why.** The live `female_31` route rendered an older bearded man. The reviewed period asset restores
Curie's feminine face, gray updo, and maroon dress while retaining the proven combat skeleton. The
earlier rig investigation still showed why body selection must prove bind pose, bone roll, skin
weights, and rendered deformation rather than joint-name similarity alone.

**Consequence.** Curie's `FighterDef.body` stays `mesh2motion_curie_period.glb`. Body variation is a
data choice; animation compatibility is an asset contract. `tests/test_rig_boundary.mjs` checks every
registered body against the canonical ordered skeleton and every combat clip against its complete
joint set. A future model with a different rig must be authored to this skeleton and pass the same
eight-state gate before registration.

**Owner.** `src/roster/fighters_originals.ts`, `src/rig/clips.ts`, `src/rig/loader.ts`,
`tests/test_rig_boundary.mjs`, `assets/models/MANIFEST.txt`, and `assets/README.md`.

### Curie direct chord rule (superseded)

**Decision.** This historical prototype used Curie's fictional Separation Step as a direct `Match`
rule on the `light + block` chord.

**Why.** Curie's documented chemical separations and activity measurements supported a staged,
timing-led metaphor before the shared special schema existed.

**Consequence.** The shared meter release and `SpecialDef` blocks supersede this direct rule. Curie
now uses the same one-button, tiered-special contract as every fighter.

**Owner.** `src/match.ts`, `src/debug_harness.ts`, `tests/test_match.mjs`, and
`docs/CURIE_SOURCE_DOSSIER.md`.

### Franklin player-only role (superseded)

**Decision.** The original Franklin prototype made her a player-only secret fighter paired with
Warburg AI and limited unlock progression to Warburg and Curie.

**Why.** Franklin was not a Nobel laureate. Her secret role is earned through wins as both existing
Nobel fighters, which established an appropriate first unlock goal before the roster needed generic
fighter selection.

**Consequence.** The generic roster and explicit `Match` pair supersede the fixed Franklin-Warburg
pair. `main.ts` selects an opponent from the unlocked roster, excluding the selected player, and
round reset and restart preserve that selected pair.

**Owner.** `src/roster/roster.ts`, `src/match.ts`, `src/main.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin v1 unlock flow (superseded)

**Decision.** The original Franklin prototype used a pure, versioned Franklin-specific win reducer
with separate browser storage and a completed-player-match observer.

**Why.** This preserves deterministic progression tests and keeps browser failures outside `Match`
and the unlock calculation. That boundary remains useful after the roster expanded.

**Consequence.** The generic v2 progression contract supersedes the v1 Franklin reducer, storage
key, and observer APIs. `decodeProgress` rejects malformed data to the starter state; `readProgress`
and `writeProgress` isolate browser storage failures; and `consumeCompletedPlayerMatchWin` exposes
newly unlocked roster fighters only after a successful durable write. The chooser and live region
derive their state from that committed v2 result.

**Owner.** `src/progress/unlocks.ts`, `src/progress/storage.ts`, `src/progress/progression.ts`,
`src/main.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin reuses the authored female_9 presentation (superseded)

**Decision.** Use the locally vendored `female_9` rig for Franklin, resolve her display identity
from the roster fighter id, and retain the asset's authored appearance without adding a Franklin
palette.

**Why.** Roster data may pair any two distinct unlocked fighters, including Curie and Franklin.
Reusing the tested CC0 rig keeps the asset pipeline small, while the loader creates independent
instances for each match slot.

**Consequence.** Every requested fighter pair, including pairs that reuse one source GLB, has
independent roots, skeletons, materials, and animation instances; all eight current combat states
use native cloned clips. A separate palette requires measurable visual evidence before it is added.

**Owner.** `src/roster/fighters_originals.ts`, `src/rig/loader.ts`, `src/rig/clips.ts`,
`src/rig/presentation.ts`, `src/main.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

**Superseded by current appearance review.** The `female_9` asset still proves the independent
two-instance loader and native clip contract, but its long straight hair and contemporary black
outfit fail Franklin's face-first identity gate. The runtime body and its derived chooser portrait
must be replaced together once a detailed Franklin source clears the visual and motion gates; a
new portrait alone would hide the wrong in-game body. See the
[Franklin visual rebuild](active_plans/workstreams/franklin_visual_rebuild.md).

### Franklin chooser fixture decoder (superseded)

**Decision.** The original Franklin chooser fixtures decoded a Franklin-specific candidate unlock
record before they exposed the secret fighter.

**Why.** A decoder-backed fixture preserves the production validation boundary and prevents a raw
object from bypassing the bounded progression state.

**Consequence.** `decodeProgress` now supplies the same generic v2 validation boundary for chooser
fixtures and production. The chooser derives every available option from its decoded unlocked set;
keyboard, D-pad, and stick navigation use that roster-derived order.

**Owner.** `src/progress/unlocks.ts`, `src/main.ts`, and
[`docs/archive/franklin_secret_fighter.md`](archive/franklin_secret_fighter.md).

### Franklin v1 unlock presentation (superseded)

**Decision.** The original Franklin-specific post-commit unlock handler and match-over `Change
fighter` route remained storage-free.

**Why.** The interface can announce a newly durable unlock and reopen fighter selection without
making UI code responsible for persistence or allowing a failed write to expose a fighter.

**Consequence.** The v2 progression edge now reports a durable committed state for any newly
unlocked roster fighter. `main.ts` owns its announcement and the storage-free `Change fighter`
route; an unsuccessful write leaves the current match playable without an unlock announcement.

**Owner.** `src/main.ts`, `src/progress/storage.ts`, and `src/progress/progression.ts` in
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

### Progress v2 starts without migration

**Decision.** Store progression only under `nobel-combat.progress.v2` and do not import the
short-lived v1 Franklin record.

**Why.** The v1 key was introduced after the last Pages deployment, so no deployed player progress
needs preservation. A generic record of fighter wins and total wins is the smaller durable contract
for the expanding roster.

**Consequence.** A v1 value is ignored and players begin with the roster starters until they earn
new v2 progress. The chooser derives its available fighters from v2 unlock rules, and a successful
player match win writes the v2 record before it exposes any newly unlocked fighter or announces it.

**Owner.** `src/progress/unlocks.ts`, `src/progress/storage.ts`,
`src/progress/progression.ts`, and `src/main.ts`.

### Special release events carry their authored tier

**Decision.** Include the released tier in the presentation-only `SpecialRelease` record.

**Why.** Tier-three card behavior should follow the authored release event instead of inferring a
tier from fighter or special identity.

**Consequence.** The super card appears only for tier three, while the normal banner can present
every release. The live match owns the event; the view never changes simulation timing or focus.

**Owner.** `src/match.ts`, `src/ui/super_card.ts`, and `src/main.ts`.


### Shared appearance kits use rigid accessories only

**Decision.** Supersede the prior garment and hair allowances in `AppearanceKit`. Keep only rigid
head and prop accessories: glasses, facial hair, and the manometer. Remove whole-body
`clothingTint` and all generic garment geometry: lab coats, jackets, shirts/ties, and skirts.

**Why.** Rendered cap, wave, cardigan, and skirt treatments lost attachment or silhouette coherence.
The M22 two-slot captures found Goodenough's enlarged jacket unreadable as a dark suit and Buck's
blue chest shell becoming an oval at the back or hip in twisted poses. These failures show that
generic garment geometry cannot meet the full combat-pose contract.

**Consequence.** Hair, clothes, and silhouette come from authored canonical-rig body assets. A Tier
B fighter may use only the supported rigid accessories and must independently pass the source-cue,
two-position, eight-state visual gate. McClintock's unsupported generic lab coat is removed and her
appearance gate reopens.

**Owner.** `src/roster/fighter_def.ts`, `src/rig/appearance_kit.ts`, and
`tests/test_appearance_kit.mjs`.

### Preserve qualifying donor mesh detail through rig adaptation

**Decision.** Choose candidate sources by their rendered gameplay-scale quality. When a compatible
licensed donor has a detailed human mesh and materials that support the fighter, preserve them
through canonical-rig adaptation. Add only the source-supported hair, clothing, and silhouette
details that the donor lacks. Use a fully authored body only when no available donor can meet the
visual bar.

**Why.** Current in-game captures show the detailed `female_9`, Warburg, and prior Curie bodies
clearly outperforming primitive-built Goodenough, Steitz, and current McClintock bodies. Rig
structure alone did not predict character quality. The old armature-only rule discarded useful
detail and made a smooth primitive replacement the default.

**Consequence.** `devel/check_candidate_body.mjs` checks the candidate's one canonical ordered
66-joint skin, skin-0 mesh assignment, default-scene reachability, and basic GLB structure. It does
not reject retained donor mesh names or decide appearance quality. Babylon loading, exact-SHA
in-game captures, and visual review establish runtime rendering, sampled deformation, and identity.
Record the rig donor separately from the capture host: the host selects the intercepted FighterDef
body URL and applies that fighter's height and appearance kit, but it does not supply the candidate
skeleton or repair order.

**Owner.** `docs/NEW_CHARACTER_RECIPE.md`, `devel/check_candidate_body.mjs`,
`devel/capture_candidate_body.sh`, and `tests/playwright/capture_rig_states.mjs`.

Before Chromium starts, `devel/capture_candidate_body.sh` also loads the candidate through Babylon's
glTF loader under NullEngine. This catches malformed assets such as invalid material references
that pass structural checks but fail in the game loader.

### Candidate authoring source stays tracked

**Decision.** Keep each active fighter authoring script in `devel/roster_candidates/` and its
handoff in `docs/active_plans/workstreams/`. Keep generated GLBs, capture receipts, and screenshots
in ignored repo-local `tests/_temp/roster_work/`. In Graphify, allowlist only
`devel/roster_candidates/` within the otherwise ignored `devel/` tree. The capture wrapper saves a
SHA-named copy of the candidate in the capture directory and serves that copy.

**Why.** Work kept only under ignored or external temporary directories is unavailable to normal
repository search and Graphify's source map. Graphify excludes maintainer tooling by default, so
moving source into `devel/` alone does not make it discoverable. Authoring scripts are source code
worth preserving; generated models and screenshots are review evidence that would add binary churn
if tracked.

**Consequence.** The tracked script and handoff remain the discoverable lane record. The handoff
points to the working candidate SHA and capture receipt. `.graphifyignore` re-includes only this
authoring subtree while keeping the rest of `devel/` out of the graph. Each capture keeps the exact
served bytes under its SHA-named copy, so later authoring cannot replace the model that was reviewed.
Before promoting a model, the integrator uses the captured copy.

**Owner.** `docs/NEW_CHARACTER_RECIPE.md`, `devel/roster_candidates/`, and
`docs/active_plans/workstreams/`.

### Test and authoring evidence have separate ownership

**Decision.** Treat `tests/_temp/` as disposable evidence and the workspace for external
checkouts, not as a pytest or Playwright naming source. Keep historical asset-authoring provenance
in `devel/roster_candidates/` so Graphify can index it, and exclude that subtree from generic
application-Python hygiene through the repository registry in `tests/conftest.py`. Each active
proof owns its focused compile, render, and asset gates.

**Why.** Broad collection found 39 external collection errors, and generic style scanning reported
310 failures in historical authoring scripts. Those files record experiments rather than maintained
application behavior; applying app-test naming and hygiene contracts to them obscures useful failures
and makes ordinary validation unreliable.

**Consequence.** Pytest and Playwright discover only their maintained test lanes. Evidence remains
available beside its authoring handoff, Graphify retains the reproducible source, and an active
proof records the focused checks that establish its own validity. No additional generic test is
introduced for this boundary.

**Owner.** `tests/conftest.py`, `tests/test_test_naming_conventions.py`,
`devel/roster_candidates/`, and `docs/NEW_CHARACTER_RECIPE.md`.

### Match owns an explicit fighter pair

**Decision.** Store and validate both fighter ids on `Match`; let `main.ts` choose the opponent from
the progression-derived unlocked set using its seeded random source.

**Why.** Combat needs an explicit pair for reset, restart, and match setup. Opponent availability is
application policy derived from player progress, so it belongs at the application boundary rather
than inside combat rules.

**Consequence.** Reset and restart preserve the selected pair. "Change fighter" selects a new
eligible opponent, and playtests can reproduce picks with a fixed seed.

**Owner.** `src/match.ts`, `src/main.ts`, and `tests/playwright/fighter_selection.spec.ts`.

### Arena orientation stays quiet and presentation-only

**Decision.** Use a floor-level center ring and muted boundary marks only as arena orientation
details. They frame the playable court without affecting fighter state, collision, camera, HUD, or
captions.

**Why.** Fresh full-HUD captures from each idle slot perspective showed the floor ring improves the
readability of the play space while remaining subordinate to the fighters and interface.

**Consequence.** Keep arena markings low-profile, floor-bound, and presentation-only. Any future
arena detail must retain ordinary combat readability in both roster slots before it is kept.

**Owner.** `src/main.ts` and `tests/playwright/capture_rig_states.mjs`.

### Fighter integration follows direct readiness

**Decision.** Integrate each roster fighter when its own body has passed the visual and rig gate,
its exact accepted asset and provenance are available, and the registry contains every direct
`FighterDef` prerequisite named by its actual unlock rule.

**Why.** A model or integration delay for one fighter does not affect the correctness of an
unrelated fighter. Whole-wave and predecessor-wave dependencies made independent ready fighters
wait without protecting an actual runtime or progression contract.

**Consequence.** Wave milestones summarize their assigned fighters and close when all of those
fighters ship, but do not gate other lanes. The existing unlock tree remains authoritative; no
temporary or unrelated unlock changes may bypass a missing direct prerequisite.

**Owner.** `docs/active_plans/indexed-tumbling-quokka.md`,
`docs/active_plans/active/roster_expansion.md`, and the roster integrator.

### Chooser portraits show the fighter's actual face and hair

**Decision.** Give every registered `FighterDef` a portrait captured from its
current runtime body in the paused game. Frame the face and hair as the main
subject so players can identify the character at a glance.

**Why.** The chooser needs a recognizable face, and the actual fighter render
keeps the selection image honest when a model's face or hairstyle still needs
work.

**Consequence.** Keep the portrait path on each `FighterDef`, validate that its
PNG exists before the destructive Pages build, and copy roster portraits with
the game. Do not substitute donor photos or unrelated art for the in-game
character.

**Owner.** `src/roster/fighter_def.ts`, `src/ui/chooser.ts`,
`devel/capture_fighter_portraits.mjs`, `devel/write_model_manifest.mjs`, and
`build_github_pages.sh`.

### Face-source review distinguishes geometry from unfinished presentation

**Decision.** Judge a source proof's face geometry separately from missing or broken appearance
information. Repair an incomplete UV, material, iris, hair, or crop once on fixed geometry before
rejecting that source for an appearance-only failure. Reject a source whose visible face outline,
jaw, brow, nose, or other primary structure is already incompatible.

**Why.** Recent head proofs combined real geometry mismatch with missing texture and hair evidence.
Treating either condition as proof of the other would discard a potentially useful source or spend
iterations polishing a structurally wrong head.

**Consequence.** A focused correction remains source-only and does not authorize a head graft,
rig, costume, GLB, or FighterDef. The normal paused front and three-quarter review remains the
gate for further work.

**Owner.** `docs/NEW_CHARACTER_RECIPE.md`, `devel/roster_candidates/`, and the relevant tracked
candidate handoff.

### Roster identity uses gameplay-scale caricatures

**Decision.** Use an existing coherent human donor with a small set of distinguishing cues as the
default character-production route. Treat Curie and Warburg as the fidelity reference. Use
photo-to-3D, generated heads, or grafts only as bounded comparisons when that route fails at normal
gameplay scale.

**Why.** The product needs 25 distinct, fun fighters, and extra head geometry can obscure the cues
that make a character readable. Portrait reconstruction has not demonstrated enough value to be the
default cost for each lane.

**Consequence.** Face shape and hair remain the first identity cues, but paused close views diagnose
broken geometry and placement rather than demanding portrait likeness. A candidate can proceed when
its ordinary game view is recognizable, coherent, and rig-correct; elaborate experiments must show
a visible gameplay improvement over the cleaned-up donor.

**Owner.** `docs/NEW_CHARACTER_RECIPE.md` and the active roster-expansion plan.
