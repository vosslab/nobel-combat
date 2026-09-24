# Next Nobel fighter: Marie Curie

## Objective

Extend the working Warburg game, with its existing AI now driving Marie Curie's presentation, as the
second real Nobel fighter. Use a
locally vendored CC0 adult female humanoid, preserve the deterministic Match contract, and introduce
only the smallest selection flow needed for the player to choose Warburg or Curie while the AI picks
the other. Continue without a human approval or visual-inspection gate.

Curie is a strong second choice because the Nobel record credits her jointly in Physics in 1903 for
research on radiation phenomena and individually in Chemistry in 1911 for discovery and isolation of
radium and polonium and study of their nature and compounds. Her 1911 lecture describes measuring
activity after each chemical separation and concentrating that activity. See the [1903 Nobel
facts](https://www.nobelprize.org/prizes/physics/1903/marie-curie/facts/), [1911 Nobel
lecture](https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/lecture/), and [official Curie
research history](https://www.nobelprize.org/prizes/themes/marie-and-pierre-curie-and-the-discovery-of-polonium-and-radium/).

## Constraints

- Match remains the source of truth for positions, attacks, damage, hit states, rounds, and winner.
- Visible assets and effects do not become hitboxes or status authority.
- Use existing local CC0 Mesh2Motion assets and direct same-rig clips if the candidate passes the
  adult-proportion and Babylon checks. No runtime download, procedural body, or remote animation.
- Do not use radiation-as-cure language or present Curie's research as a deliberate combat method.
  A fictional move must say which documented measurement or chemistry idea inspired it.
- Keep fighter-specific combat rules direct. Do not create an ability registry, skeleton framework,
  customization system, or generalized roster model.
- The Franklin secret unlock remains a later, separate milestone. Do not present her as a laureate.

## Milestones

| Milestone | Owner                  | Outcome                                                                                                                                                                    | Automated validation                                                                                                                                                                                                                                                                                |
| --------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1        | Asset integration      | Complete: selected `female_31.glb`, an existing adult female CC0 GLB from the pinned Mesh2Motion source.                                                                   | Verified its license and SHA-256, 1,211 triangles, one ordered 66-joint skeleton, natural idle/jab in Babylon, and local load with no mapping warnings.                                                                                                                                             |
| C2        | Visual integration     | Complete: load Curie locally as a second independent rig while preserving Warburg's model, clips, and combat.                                                              | Browser checks prove two independent skeletons/materials/clips, finite rendered root transforms within 0.0001 units/radians of authoritative x/z/yaw after draw frames during traversal, all state mappings, deterministic captures, and zero asset errors.                                         |
| C3        | Research design        | Complete: document Curie's direct Separation Step with source limits and concrete balance values.                                                                          | [`CURIE_SOURCE_DOSSIER.md`](../CURIE_SOURCE_DOSSIER.md) defines the trace, including hit, block, whiff, recovery, cooldown, and invariants.                                                                                                                                                         |
| C4        | Combat implementation  | Complete: added the direct Curie role and Separation Step rule to `Match`.                                                                                                 | Node checks pass for active timing, one-hit behavior, block, whiff, recovery, cooldown, KO, round/reset, restart, and unchanged Warburg/AI contracts.                                                                                                                                               |
| C5        | Presentation           | Complete: retain Curie's direct same-rig state clips and show a bounded fraction/activity readout only during Separation Step.                                             | Browser harness verifies state clips, authoritative cue progress and cleanup after recovery/interruption, and captures idle, move, attack, block, hit, down, get-up, and Separation Step.                                                                                                           |
| C6A       | Role-pair persistence  | Complete: `Match.selectPlayer()` assigns a selected Nobel fighter to slot 0 and the complementary Nobel fighter to slot 1, preserving the pair through rounds and restart. | Deterministic Match checks retain the Warburg-versus-standard-opponent default, reject invalid roles, and cover both selected orders, round reset, and both restart paths.                                                                                                                          |
| C6B       | Role-aware rendering   | Complete: presentation follows each current fighter role rather than a fixed red/blue mesh or name.                                                                        | Browser debug scenarios force Warburg-versus-Curie and Curie-versus-Warburg, then verify per-slot rig identity, independent roots, transform following, HUD/ARIA health and wins, role-specific cues, and KO/match winner text.                                                                     |
| C6C       | Accessible chooser     | Complete: added an accessible, initially focused Warburg-or-Curie confirmation surface before a live match.                                                                | Browser checks verify native radio semantics, forward/backward modal focus wrapping, blocked background focus, Escape retention, paused fighters, dynamic help, held/repeated keyboard and gamepad input, South/Start release gating, valid input immediately after release, and no browser errors. |
| C6D       | Selection input parity | Complete: the chooser uses the established keyboard and synthetic standard-gamepad controls.                                                                               | Pure mapping checks and browser fixtures verify keyboard/gamepad select and confirm the same role, reject unrelated/nonstandard input, and retain the selected pair.                                                                                                                                |
| C6E       | Pairing acceptance     | Complete: exercise both selected pairings through combat, rounds, victory, and restart.                                                                                    | Six live browser matches verify keyboard Warburg-versus-Curie and synthetic-gamepad Curie-versus-Warburg, player and AI victories, selected roles before combat and after restart, and zero console errors.                                                                                         |
| C7A       | Repository and build   | Complete: repository checks and production build pass with repository TypeScript standards intact.                                                                         | `./check_codebase.sh` passed all 28 Node tests, strict type checks, lint, and formatting; `./build_github_pages.sh` passed; `git diff --check` is clean; both tsconfig files are unchanged.                                                                                                         |
| C7B       | Browser acceptance     | Complete: the full deterministic and live browser suite passes against the production build.                                                                               | `./run_playwright_tests.sh --build --workers=1` passed all eight tests: chooser, input parity, both role orders, six live matches, KO/round/restart, traversal/camera, endurance, and browser-console checks.                                                                                       |
| C7C       | Assets and evidence    | Complete: verified local assets, provenance, dependency health, and deterministic state captures.                                                                          | `npm audit --audit-level=high` found 0 vulnerabilities; all four vendored GLBs in `dist/` match their source SHA-256 hashes; captures cover eight states plus Separation Step with zero browser errors.                                                                                             |
| C7D       | First-playable closure | Complete: Curie's first-playable milestone is closed with automated evidence and recorded residual uncertainty.                                                            | C1-C7C have executable automated checks; repository and browser evidence pass; no human or physical-hardware gate remains. Synthetic gamepad parity and measured camera, movement, and combat checks bound the residual physical-controller uncertainty.                                            |
| C8        | Franklin handoff       | Complete: defined the secret Franklin unlock after Curie acceptance.                                                                                                       | [`franklin_secret_fighter.md`](franklin_secret_fighter.md) records source facts, CC0 asset/licensing, unlock trigger, AI/playability, and automated secrecy/unlock checks.                                                                                                                          |

## C1-C2 evidence

The selected source is `static/models-variation/human/female_31.glb` at Mesh2Motion commit
`3ce7f9d97d25e608b4779ce797da343775ded62b`. The vendored file is 421,708 bytes with SHA-256
`72c50339c0caa248b19ec11a5c188d52f6e2bf8e16bd0dd64e98ae756680ceb3`, one mesh, 1,211 triangles,
and one 66-joint skin. Its ordered joint names exactly equal the existing `doctor_m` and `male_5`
rigs. The upstream `LICENSE-CC0.MD` places models, rigs, and animations under CC0 1.0 Universal;
[`assets/README.md`](../../assets/README.md) records the local provenance.

Babylon's local NullEngine experiment loaded the model as two meshes with one 66-bone skeleton. It
started and sought `Fighting Idle` and `Fighting Left Jab`, resolving all 198 animation targets to
Curie's instantiated skeletal nodes. Production Chromium then loaded the local Warburg, Curie, and
both curated animation GLBs without browser errors. The browser harness asserts the ordered fighter
identities, independent root IDs, active state-to-clip mapping, and authoritative position following.
It captured idle, move, light, heavy, block, hit, down, and get-up under
`test-results/rig-states-curie-c2/`; these ignored artifacts are evidence, not approval gates.

## C3: Research design

[`CURIE_SOURCE_DOSSIER.md`](../CURIE_SOURCE_DOSSIER.md) records the source basis, the limits of
the game interpretation, and the direct **Separation Step** contract. C4 implements only that
contract: `light + block` starts a 24-tick Curie-only special with a six-tick startup, seven-tick
active window, 12-tick recovery, 1.95-unit range, 16/3 unblocked/blocked damage, 16 hit-stun ticks,
and a 72-tick cooldown. It has no forced movement, projectile, knockdown, status effect, health
effect, or persistent resource.

The C4 deterministic trace must demonstrate first contact on post-input tick six, a single hit in
the active window, unchanged fighter position, block/whiff handling, recovery, cooldown expiry,
KO/round behavior, and restart reset. The checks retain Warburg's J+L behavior and all standard AI
contracts unchanged.

## C4 evidence

`Match` now recognizes the direct `curie` role while retaining the current default
Warburg-versus-`opponent` construction until C6 selection. Curie's `light + block` chord starts
Separation Step only for that role. It uses the dossier's 24-tick light state, 18..12 active window,
1.95 range, 16/3 damage, 16-tick hit response, one-hit guard, and 72-tick cooldown. The simulation
adds no movement, projectile, persistent resource, health effect, or special knockback rule.

`node --import tsx --test tests/test_match.mjs tests/test_debug_harness.mjs` passed 14 tests after
covering the C4 trace. `npx tsc --noEmit -p tsconfig.lint.json` passed with the existing strict
configuration. The browser harness now accepts bounded Curie role and Separation Step snapshot
fields while C6 remains responsible for exposing Curie through player input and selection.

Review correction: strike resolution now clears an interrupted target's active Separation Step flag
alongside Lactate Drive. Focused light-hit and heavy-knockdown traces assert the flag clears at the
same tick as the hit/down transition, the 72-tick cooldown continues without reset, and neither
attacker can apply a second hit from the interrupted exchange. The cooldown trace also supplies the
chord while its value is one and verifies activation on that same 72nd post-start tick.

## C5 evidence

Curie's existing direct same-rig clips remain presentation-only observers of the eight `Fighter`
states. During an authoritative Curie `separationStep`, the HUD adds a short **FRACTION / ACTIVITY**
readout. Its 0-to-100 percent fill derives only from the active fighter's 24-tick state timer; it
does not add a hitbox, resource, status effect, or radiation claim. The readout hides immediately
when the authoritative flag clears after normal recovery or interruption. Browser scenarios force
the direct role, assert start/progress/cleanup, and capture the active frame alongside the existing
eight state captures under ignored `test-results/` evidence paths.

## C6A-C6B evidence

`Match.selectPlayer()` retains the legacy Warburg-versus-`opponent` startup until a Nobel fighter is
selected, then makes slot 0 the selected player fighter and slot 1 the complementary Nobel AI. C6B
keeps that combat authority intact: its presentation lookup maps each current `Fighter.role` to the
already loaded Warburg or Curie rig, with the temporary standard `opponent` role retaining Curie's
existing visual. The debug probe reports rigs in fighter-slot order, rather than source-load order.

HUD fighter names, health-bar ARIA labels, round KO text, and match-victory text resolve from the
same slot roles. Warburg's rings and labels follow Warburg whichever slot holds him; Curie's
fraction/activity indicator follows Curie's authoritative Separation Step. The localhost-only debug
snapshot exposes cue visibility and position so browser fixtures can force a successful Oxygen
Transfer and Aerobic Glycolysis in both Nobel pair orders. They assert each cue follows its
role-resolved fighter or target, alongside independent roots, 0.0001 transform following, dynamic
identity and health/win presentation, and both winner names. C6C adds the actual chooser controls;
C6B deliberately supplies no selection interface.

## C6C evidence

The live page now starts behind a compact modal chooser with a labelled native radio group, a
visible confirmation button, and an initially focused Warburg fallback. Its local Tab handler wraps
the radio-group tab stop and confirmation button in both directions, while native modal inertness
keeps outside controls unfocusable. The match does not receive ticks before confirmation, so its
default state remains a stable presentation placeholder rather than an unselected fight. Confirming
invokes the existing `Match.selectPlayer()` boundary exactly once, gives slot 0 to the chosen
fighter, and gives slot 1 to the complementary AI. Local debug mode remains a harness bypass and
keeps its legacy direct state setup.

The chooser reads the already established pure selection mapper but owns its edge detection. A held
keyboard key, repeated keydown, D-pad direction, or left-stick direction changes selection once
until released; held confirm similarly starts one match. The visible control summary changes with
the selected role, so Curie's help describes Separation Step and never advertises Warburg-only
moves. The focused Playwright fixture loads the normal localhost playtest mode, proves the
pre-confirm fighter state does not advance while the live camera settles, checks radio
semantics/default/focus and modal wrapping, then exercises held keyboard, repeated-keydown, stick,
D-pad, and confirm input. A post-confirm release gate discards gameplay actions while a chooser
control remains held, preventing south-confirm from leaking into light attack and Start-confirm
from leaking into restart; camera handling remains live. The fixture asserts the
Curie-versus-Warburg pair, neutral player combat state during held south, successful light input on
the first post-release frame, and AI movement while Start is held, then captures browser errors as
failures. It needs no physical controller or human approval.

## C6E evidence

The existing live six-match matrix now confirms the chooser before each match. Keyboard chooses
Warburg for Warburg-versus-Curie, while the synthetic standard gamepad selects and confirms Curie
for Curie-versus-Warburg. Each device retains its existing AI-win, player-win, player-win sequence,
so all six complete matches cover both player/AI winners without increasing the matrix.

The scenario asserts the selected fighter roles before combat and again after the normal live
restart path, alongside the existing health, win, match-over, and browser-error checks. The live
traversal scenario likewise confirms Warburg through each device before crossing, edge movement,
camera visibility, attack/block, and restart checks. `npx playwright test tests/playwright/agent_scenarios.spec.ts -g
"live browser completes six"` passed in 1.7 minutes, and the focused live traversal test passed in
25.7 seconds against a fresh production build.

## C7 closure evidence

`./run_playwright_tests.sh --build --workers=1` passed all eight serial browser tests against the
production build. The suite includes deterministic endurance, the six complete keyboard and
synthetic-standard-gamepad matches, traversal and camera framing, chooser behavior, and input
parity. It recorded no browser errors.

`./check_codebase.sh` passed all 28 Node tests, strict TypeScript checks, lint, and formatting, and
`./build_github_pages.sh` passed. `git diff --check` is clean. `tsconfig.json` and
`tsconfig.lint.json` remain unchanged, preserving the existing repository TypeScript standards.

`npm audit --audit-level=high` found 0 vulnerabilities. The four local vendored GLBs and their
production copies have matching SHA-256 hashes. Deterministic captures under
`test-results/rig-states-curie-final/` cover idle, move, light, heavy, block, hit, down, get-up,
and Separation Step with zero browser errors. These ignored artifacts are evidence, not a manual
approval gate.

The remaining uncertainty is physical-controller feel on hardware. It is nonblocking: synthetic
standard Gamepad API parity and measurable input, camera, movement, combat-transition, and
endurance checks pass. The earlier successful GitHub Pages deployment applies only to commit
`ccaf03d00486d190b2dbe9d01a824da829e437f0`; it does not claim this uncommitted local work.

### Final presentation correction

The C1-C2 rows above record the initial `female_31` model selection and its compatibility experiment.
The final Curie presentation instead uses the CC0 OpenGameArt Old Lady model in
`assets/models/curie_period.glb`; Babylon maps the local combat clips with the Curie-only bone map.
The current asset and output digests are in [`assets/README.md`](../../assets/README.md).
The build now ships only the three role models. Mesh2Motion `male_5` remains a source-level rig
compatibility fixture and is excluded from `dist/`; the earlier C7C four-model copy check records
the historical package contents.

## C8 evidence

[`franklin_secret_fighter.md`](franklin_secret_fighter.md) is the completed follow-on plan.
It names Franklin accurately as a hidden contributor rather than a laureate; records direct Nobel,
King's College London, and primary-paper sources; reuses the already vendored CC0
`female_31.glb` candidate as proposed at handoff; and keeps the two-slot deterministic combat contract intact. Its F1-F8
milestones separately cover role pairing, a strict versioned unlock reducer, presentation, the
accessible chooser and match-over change route, live persistence, automated secrecy and endurance,
and closure. Every completion condition is automated. The final implementation's local asset
loading is not a secrecy boundary; the chooser and progression state remain hidden until unlock. The
plan fails closed when storage reads or writes fail, and announces Franklin only once after the
second distinct player-role victory is durably written. The Franklin plan records its final
`female_9` execution correction.

## Recovery rules

- If a female asset fails the same-rig or adult-proportion tests, compare the remaining local CC0
  candidates. Do not salvage a poor silhouette by constructing a body procedurally.
- If Babylon loads a candidate but its clips fail, reject it unless a small, deterministic direct
  mapping fixes the issue; do not start speculative retargeting.
- If a proposed Curie move implies an unsupported biomedical claim, replace its metaphor while
  retaining the source-grounded measurements and bounded gameplay contract.
- If the C4 trace finds that Separation Step outperforms Warburg's established specials at their
  intended ranges, reduce Curie's direct range or damage before adding another move. Keep one
  source-bound move and rerun the same hit, block, whiff, recovery, KO, and reset checks.
- If its existing chord collides with a non-Curie action, dispatch the role-specific input mapping
  as a focused C4 experiment; preserve keyboard and synthetic-gamepad parity and avoid a shared
  ability layer.
- Keep each milestone independently verifiable. A missing screenshot is an artifact-generation
  defect to fix automatically, never a human sign-off gate.
