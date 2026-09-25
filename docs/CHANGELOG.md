# Changelog

## 2026-09-25

### Additions and New Features

- Promoted Barbara McClintock's reviewed canonical-rig body. The 1947 laboratory cues are built
  into the asset, so the registry no longer adds a duplicate wire-glasses accessory.
- Added `devel/capture_candidate_body.sh` to compute a candidate body's SHA and capture all eight
  rig states in both roster positions. On macOS, the command must be launched with escalation so
  Chromium runs outside the sandbox.
- Recorded the photo-reference workflow: search for laureate portraits, including `young <name>` for
  early-career views; verify identity/date against reliable sources and record supported cues in
  dossiers.
- Re-captured the current Hodgkin, Goodenough, and Buck bodies through the repository wrapper and
  had an independent visual review inspect every state in both positions. All three candidates
  still fail source-cue requirements and remain in M22; their concrete findings are in the active
  roster status.
- Started M22's Hodgkin, Goodenough, and Buck authored canonical-body lanes in parallel with
  M14's McClintock canonical-body/export-order experiment. This records the initial authoring state;
  McClintock later passed and was promoted.
- Rebuilt Curie's runtime body with Mesh2Motion `female_31` and native combat clips. The retired
  period-dress asset is excluded from the runtime model manifest.
- Re-read the active fighters after fixed-step simulation and before presentation. A restart or
  round reset can replace `Match.fighters` during that step; rendering now uses the replacement
  objects for rigs, hit cues, and camera framing in the same frame.
- Extended the rig-state capture runner with explicit player/opponent pairs and permanent Curie
  coverage in both ordinary slots across idle, move, light, heavy, block, hit, down, and getup.
  Independent review of the fresh captures found no spider-like deformation. Curie uses the shared
  native-rig path; no production special case was added.
- Added a quiet floor-level ring and presentation-only boundary marks to give the arena a clearer
  playable frame while leaving fighter silhouettes, HUD, captions, and combat state unchanged.

### Fixes and Maintenance

- Bound the opt-in candidate-body capture override to a selected participant's canonical roster
  body URL and a comparison fighter with a distinct body URL before browser launch, then publish
  its receipt only after all browser-error assertions pass.
- Added a fail-closed authored-body repair command that restores Blender's
  reordered skin joints while preserving joint influences and inverse-bind rows.
- Added accessible, actionable recovery for fighter-pair model loading: a `Retry fighter load`
  button retries the selected pair, and retry state clears after success, selection changes, or a
  match restart.
- Made the Pages build check the generated model manifest without rewriting the tracked source
  file. Special-effect meshes now grow only as needed and reuse disabled meshes, preserving all
  overlapping projectile visuals. The capture helper now accepts every valid registry pair, and
  roster smoke checks actual projected enabled-mesh bounds rather than debug flags. Corrected the
  TypeScript Node-test command and made the super-card unit fixture generic.
- Removed the unused fighter chooser wrapper and `NobelFighterId` type.
- Corrected README prototype flow and Curie rig wording, marked stale plan baselines as historical,
  aligned Markdown link labels and Playwright selector/wait style, consolidated the locked-page
  progress-hook check into the existing secrecy test, removed stale selector and visual tuning
  assertions, escaped authored Unicode punctuation, and updated the vertical-slice report's
  current browser-suite counts.
- Removed the chooser's no-op per-fighter help callback and made model-manifest filesystem failures
  visible. Added or corrected browser selector-contract comments.
- Marked M3 kit recommendations historical. Kept the distinct projectile-pattern contract and
  moved implementation-only proofs plus the long Franklin endurance matrix to `tests/_temp/`.

### Decisions and Failures

- Preliminary M22 candidate-capture evidence keeps Goodenough on HOLD: his enlarged jacket does
  not read as a dark suit. Hodgkin's pose is stable after skirt removal but she remains
  indistinguishable from Curie. Buck remains FAIL: `female_8` conflicts with her dossier and its
  blue chest shell becomes an oval at the back or hip in twisted poses.
- Retired whole-body `clothingTint` and generic garment geometry from the appearance-kit design,
  including lab coats, jackets, shirts/ties, and skirts. Hair, clothing, and silhouette require
  authored canonical-rig bodies; Tier B is limited to supported rigid accessories.
- McClintock's unsupported generic lab coat was removed and her appearance gate reopened. The
  appearance-kit cleanup is complete: its runtime and compile-time contracts retain only glasses,
  facial hair, and the manometer, with owned-resource cleanup on failed construction.

### Developer Tests and Notes

- Rebuilt `dist/` and passed the focused serial Playwright capture (1/1). The browser fetched
  `mesh2motion_female_31.glb`; an independent review of all eight captured Curie states found no
  spider-like deformation or detached geometry.
- An earlier check passed with 51/51 Node tests, strict TypeScript, lint, and formatting. The live
  Franklin endurance scenario also passed with fighter and rig states synchronized through rounds.
- The earlier full serial Playwright suite passed 37/37 in 11.0 minutes after a fresh build. Fresh
  full-HUD captures in both idle slot perspectives confirmed that the floor ring frames play and
  remains subordinate to fighters and HUD.
- Earlier audit verification: `./check_codebase.sh` passed 47/47 Node tests; the Pages build passed;
  the serial browser run passed 36/36 with all 35 permanent browser cases plus the endurance matrix
  later demoted to `tests/_temp/`. `npx playwright test --list` confirms 35 permanent cases.
  Markdown links and `git diff --check` pass. All six independent audit passes completed.
- Follow-up audit verification: `./check_codebase.sh` passed 48/48 Node tests with strict
  TypeScript, lint, and format checks; the Pages build, Markdown-link check, and `git diff --check`
  passed. Focused roster-smoke and paused-chooser cases passed, and the full serial Playwright suite
  passed 35/35 in 9.6 minutes. A standalone McClintock capture was not produced because direct
  Chromium launch failed with macOS `MachPortRendezvous` permission denied; M14's visual appearance
  gate therefore remains open. The lowercase `docs/proposed-combat-roster.md` name remains
  intentional until M33 closeout.

## 2026-09-24

### Additions and New Features

- Started the 25-fighter roster expansion. Recorded the game's fun-first design and data-driven
  roster decision, kept `proposed-combat-roster.md` temporary until closeout, and added the M2
  schema report and typed draft for all 75 specials and 25 ordinary attack profiles.
- Completed M3's look test and bounded CC0 model survey. The approved Steitz, Hodgkin, and Tsien
  appearance pieces passed rendered review; tested motion candidates did not support a Tier A
  assignment.
- Completed M4's 22 source dossiers, including dated likeness evidence, independently checked
  research hooks, and one fictional caption for every proposed special. Transferred the 66 captions
  into their matching laureate drafts; the original fighters' captions remain unchanged.
- Completed M11's pooled special visuals, per-fighter HUD banners, and seeded AI cadence review.
  Muted court boundary ticks add orientation while keeping the action and captions clear.
- Completed M16's nonblocking tier-3 card. It announces only the special name politely, retriggers
  for repeated identical supers, and uses render time so the simulation continues.
- Completed M15's shared meter controls: every fighter releases specials with `I` or standard
  gamepad button 3, and the earlier button chords are retired. Warburg's manometer follows active
  `specialTicks`, not the shared heavy pose.
- Completed M17's roster-driven chooser with category cards, vertical selection, fighter details,
  prize links, and a viewport-bounded responsive grid. The dialog now keeps readable text and fits
  its card grid inside the available content width.
- Completed M18's explicit player/opponent pairing. `Match` owns the validated pair, opponent picks
  come from unlocked fighters through a seeded source, and changing fighters rerolls the opponent.
  G1 passed (45/45), the focused reroll check passed, and the full serial Playwright suite passed
  (36/36).
- An initial Curie foot/toe-channel pruning reduced the spider-like pose in one capture, but it did
  not establish safe animation compatibility. M20 replaced the incompatible period-dress rig with
  the native Mesh2Motion body and direct clips.
- Completed M21's roster smoke harness. Every registered fighter loads, releases a tier-three
  special, and renders with a visible opponent; the full serial Playwright gate passed 37/37 in
  11.1 minutes.
- Implemented M19's initial shared appearance kit with glasses, facial hair, clothing tint,
  jacket/lab coat, an initial primitive skirt, and manometer. Rendered review later retired the
  garment and tint features because they could not remain coherent through combat poses; generic
  hair and cardigan overlays were also removed after they detached or hovered.
- Added the typed roster registry for the three existing fighters, including Franklin's explicit
  non-laureate status, prize links, body paths, attack profiles, AI values, and unlock rules.
- Replaced combat role fields with registry fighter ids. Match light and heavy startup, hit windows,
  reach, damage, stun, and knockback now read from each fighter's `FighterStats`; the default pair is
  Warburg and Curie, and the original special fields remain until M15.
- Moved fighter names, labels, match status, and control help into `src/ui/hud.ts`; generated the
  chooser radios from roster entries, resolved loaded models by roster body path, and sourced camera
  heights from the roster. `src/main.ts` is now 590 lines.
- Isolated AI behavior behind a seeded random source; local browser playtests use a fixed seed so
  live winner and progression scenarios remain repeatable.
- Added a brief gold impact spark for unblocked damage and a blue spark for blocked damage; both
  follow the struck fighter and fade on render time.
- Added soft directional shadows from loaded fighter meshes so their foot contact reads against the
  arena floor.
- Added restrained arena boundary ticks beside the court center line to make the playable space
  easier to read without pulling attention from the fighters.
- Linked the live game near the README opening with descriptive link text.
- Added the Franklin player role against Warburg AI while retaining `warburg | curie` as the
  Nobel-fighter vocabulary used by unlock progression. Franklin currently uses the existing
  `female_9` rig and the HUD identifies her as Rosalind Franklin; chooser unlock and
  progression remain separate milestones.
- Added the on-demand two-instance rig loader. It caches source GLBs by scene and URL, creates
  independent fighter resources for mirror matches, and disposes the current pair when a matchup
  changes.
- Generated `assets/models/MANIFEST.txt` from registry body paths and made the Pages build copy
  and verify each listed model.
- Added `Action.special` on keyboard `I` and standard gamepad button 3, plus a per-fighter
  three-segment 0..300 meter. Successful combat events gain meter after the fighter's `meterGain`
  multiplier, capped at 300: landed hits gain 20, blocked hits 8, taken hits 12, and blocks 10.
- A rising Special press in `idle` or `move` selects the affordable tier, spends 100, 200, or 300
  meter, carries meter into the next round, and clears meter on restart. The accessible HUD previews
  the next special name. M9 only selects and spends a tier; M10 owns each special's pose and effects.
- Completed M10's deterministic special interpreter: slot-owned authored blocks schedule effects,
  run the authored pose and duration, honor guard and `ignoresBlock`, and clean effects after a KO.
  The all-75 Match and DebugHarness proof, 25-row M32 budget diagnostic, G1 (57/57), Pages build,
  and independent review passed; the broad diagnostic values remain tuning evidence, not product rules.
- Added the pure, versioned Franklin unlock reducer for wins as both Nobel player roles; browser
  storage remains outside the reducer.
- Completed M12's generic AI profile interpreter and M13's v2 unlock progression. Successful player
  match wins are persisted before chooser updates and announcements; G1, Pages build, progression
  matrix, and live-role browser checks passed.
- M20 replaced Curie's incompatible period-dress IK rig with CC0 Mesh2Motion `female_31` and direct
  native clip cloning; the runtime cross-rig mapping path was removed. The Gobkit Scholar Swordsman
  survey candidate had intact limbs and full channel coverage but failed named-state readability,
  so no new Tier A body was accepted.
- Mapped Franklin to the existing female_9 rig with role-resolved names and combat-state clips,
  while retaining the asset's authored appearance and independent resources from Warburg.
- Added serial Playwright captures for Curie's and Franklin's eight combat-state screenshots in
  ignored evidence directories.
- Added a browser regression asserting that Otto Heinrich Warburg's full name remains in both
  player and AI HUD and accessibility labels.
- Refit the camera to each screen-space axis and nearest-fighter depth, and frame the pair on their
  first visible render. Both rigged fighters are larger during ordinary play; live browser checks
  require at least 27% viewport-height presence at the default landscape start and preserve
  traversal visibility and continuity.
- Replaced Curie's contemporary outfit with a local CC0 OpenGameArt rigged long-dress model and
  retargeted the existing eight combat clips through one explicit Babylon.js bone map.
- Added a small belt pressure gauge and forearm manometer attached to Warburg's existing rig; the
  needle and oxygen-flow pulse follow Oxygen Transfer ticks without changing combat state.
- Aligned keyboard and synthetic-gamepad live-match scenarios to Curie versus Warburg AI, paced
  heavy attacks from fighter recovery states, and checked both outcomes per input group rather than
  requiring a particular winner in each repeated match.
- Made the Franklin chooser's final gamepad assertion inspect the mapped light action directly so an
  AI hit during browser navigation cannot mask successful input mapping.

### Behavior or Interface Changes

- Kept the keyboard, camera, and gamepad control legend inside the viewport and clear of match
  actions from 320-pixel phones through desktop widths.
- Updated the HUD, fighter chooser, accessibility labels, and match presentation to use Otto
  Heinrich Warburg's full name.
- `Match.selectPlayer("franklin")` places Franklin only in the player slot, preserves the
  Franklin-versus-Warburg pair through round reset and both restart paths, and leaves the legacy
  Warburg-versus-opponent default unchanged.
- Completed the F5A chooser milestone: the native chooser creates Franklin only from a
  strict-decoder-backed local fixture, orders options Warburg, Curie, then Franklin, and keeps its
  keyboard, D-pad, and stick navigation, focus, pause, and input-release behavior aligned. Franklin
  help now describes the standard light/heavy/block controls without claiming Curie's move.
- Completed the storage-free F5B presentation boundary: a private post-commit handler produces one
  polite atomic unlock announcement only for a decoded newly unlocked record, and match-over now
  offers `Change fighter`. It preserves a valid Curie or Franklin selection, otherwise selects
  Warburg, pauses at the chooser, and resumes only after confirmation.
- Completed F6A's versioned browser-storage boundary. The local adapter reads and strictly decodes
  `nobel-combat.franklin-unlock.v1`, returns an explicit read-failure result, and writes only encoded
  records with an explicit success result; failed storage remains locked and playable without an
  optimistic chooser update or announcement.
- Completed F6B's winner-edge progression boundary. Only a completed player victory as Warburg or
  Curie can advance progress, and a changed durable write completes before application state,
  chooser reveal, or F5B's post-commit announcement seam. AI wins, round wins, restart, repeated
  edges, direct forced-phase fixtures, and Franklin wins cannot advance progression.
- Completed F6C's durable browser progression scenarios. Both real full Nobel-win orders remain
  locked after one win, unlock durably with one announcement after the second, and reload silently.
  The existing F6A startup fixture covers denied reads; a denied write preserves the partial record,
  leaves the session locked, and produces no unlock or browser error.
- Completed F6D's live-role acceptance without changing production gameplay. Durable Franklin
  selection works through keyboard and synthetic standard-gamepad input; automated matches cover
  Franklin player and Warburg AI victories, KO and round transitions, and restart during and after
  match-over.
- Completed F7A secrecy/accessibility and F7B live-progression evidence. Browser scenarios verify
  chooser/announcement selector contracts with frame waits, durable announcement behavior, and
  production progression idempotence: AI wins preserve empty or partial progress, while a repeated
  live Warburg win produces no write or announcement.
- Completed F7C endurance and camera validation. Camera framing now fits a padded two-fighter
  silhouette sphere to the narrower FOV axis; viewport fixtures wait for rendered frames after
  resize and use fresh knockdown windows for each aspect-ratio separation trial.
- Closed Franklin F8 with automated evidence: strict repository checks and 45/45 Node tests,
  production build, 31/31 serial browser tests, local GLB-to-`dist` identity, local Markdown links,
  dependency audit, and diff hygiene all passed without changing either TypeScript configuration.

### Fixes and Maintenance

- Clarified Curie's appearance guidance with direct wording about her face and facial hair.
- Corrected the `npm run clean` alias to call the existing light-clean script, repaired literal
  control-help separators, and updated browser-contract comments to point at the current chooser
  logic.
- Recorded the downloadable Curie source file's digest and identified the missing GLB export
  settings; clarified that the runtime model set excludes compatibility fixtures.
- Removed the unused `male_5` compatibility model from production build output while retaining it for
  source-level rig compatibility checks.
- Replaced rig clip-map type assertions with explicit required-clip checks and corrected the stale
  TypeScript test quickstart clean-command reference.
- Corrected the fighter-asset design record to name Warburg's runtime `doctor_m` rig and identify
  `male_5` as a compatibility fixture.
- Reduced the center-floor mark's contrast and width; its bright stripe previously bisected the
  fighters and dominated the arena view.
- Replaced Curie's contemporary clothing model with the CC0 OpenGameArt `Old Lady` asset; combat
  state, gameplay geometry, and Franklin's `female_9` presentation remain unchanged.
- Kept inactive character models hidden until their roles enter the match, preventing a ghost fighter and
  idle animation work in the background; browser captures assert exactly two visible fighters.
  Asset load errors now name the combined fighter asset set.
- Made live camera tracking time-based and bounded per rendered frame so portrait and landscape
  resizing reframes quickly without a discontinuous camera jump.
- Brought the fighters' opening positions 2.4 units closer and lowered the close-range camera floor
  from 6.5 to 5.5 units; the live browser invariant now requires both humans to occupy at least 27%
  of viewport height at the default landscape start while retaining full-separation framing.
- Kept the Franklin milestone plan's F3 reducer pure and assigned concrete browser storage reads,
  writes, persistence, and failure behavior to F6A-F6D after independent plan review.
- Synchronized shared style guides, tests, and repository support files from the starter template.

### Developer Tests and Notes

- M1 and M2 passed `./check_codebase.sh` (49/49 Node tests) and
  `source source_me.sh && python3 tests/test_markdown_links.py`. A one-time roster-shape check
  reported 25 drafts and 75 specials.
- M5 passed `./check_codebase.sh` with strict TypeScript, lint, formatting, and 52/52 Node tests;
  the new registry invariant spec covers unique ids, three specials, valid unlock references, and
  reachability from a starter.
- M6 passed `./check_codebase.sh` with strict TypeScript, lint, formatting, and 52/52 Node tests;
  existing numeric combat expectations remain unchanged, and Match and debug fixtures use registry
  ids.
- M7 passed `./check_codebase.sh`, `./build_github_pages.sh`, and all 15 focused Playwright tests
  across `fighter_selection.spec.ts` and `control_help_layout.spec.ts`.
- M8 passed `./check_codebase.sh` (53/53 Node tests), `./build_github_pages.sh`, and a temporary
  Playwright mirror capture (1/1); snapshots confirmed distinct roots, skeletons, and materials for
  Warburg vs Warburg. The screenshot is in ignored `tests/_temp/m8-warburg-mirror.png`.
- M9 passed `./check_codebase.sh` (56/56 Node tests with strict TypeScript, lint, and formatting),
  `./build_github_pages.sh`, and focused Playwright input parity (2/2), control-help layout (1/1),
  fighter selection (14/14), and Franklin accessibility (6/6) checks. Local Markdown links passed.
- M15, M17, and M19 passed the current `./check_codebase.sh` gate (45/45 Node tests), and the
  GitHub Pages build passed. M15's named control-help and input-parity browser tests passed 3/3.
  M17's latest-code selection and Franklin secrecy browser tests passed 15/15; the corrected chooser
  grid test passed 2/2 and captures at 390x844, 768x1024, and 1280x800 passed independent image
  review. M19's appearance-kit lifecycle tests passed 2/2; its 26-mesh capture had no browser errors
  and passed independent image review.
- After the arena shadow update, `./check_codebase.sh` passed 46/46 Node tests plus strict
  TypeScript, lint, and formatting; `./build_github_pages.sh` passed; the focused browser suite
  passed 4/4 for deterministic combat/camera/endurance, six keyboard/gamepad matches, traversal,
  and all eight Curie/Franklin rig-state captures without browser errors.
- The impact cue scenario verifies visible hit/block state, camera-forward fighter placement, and
  hit-cue expiration through the rendered browser snapshot; its deterministic combat/camera/
  endurance scenario passed without browser errors.
- Added a built-page Playwright regression for help layout in fight and match-over states at
  320x568, 375x667, 768x1024, and 1280x800; text bounds, button separation, and browser errors pass.
- Verified Franklin's `female_9` GLB's ordered 66-joint rig and native animation clips, and captured
  its deterministic combat states without browser errors.
- Verified Curie's 84-joint CC0 model, its asset-specific mapping coverage for all eight clips,
  independent two-fighter visibility, and deterministic browser captures with no errors.
- Made the live knockdown/recovery fixture track the intended fighter index so an opposing KO cannot
  be mistaken for the target's successful down-to-get-up transition.
- Replaced the live traversal test's short fixed-window light taps with a state-driven probe: it
  restarts into a clean match, approaches using current fighter positions, and waits for the light
  state and target damage. The focused keyboard/gamepad traversal scenario passed three repeats.
- Final integrated validation after the traversal fix: `./check_codebase.sh` passed 49/49 Node tests,
  strict TypeScript, lint, and formatting; `./run_playwright_tests.sh --build --workers=1` passed
  33/33 serial browser tests; the build and `git diff --check` passed; both TypeScript configs are
  unchanged; and `npm audit --audit-level=high` reported zero vulnerabilities.
- Final validation after Curie's period-dress integration: `./check_codebase.sh` passed 46/46 Node
  tests plus strict TypeScript, lint, and formatting; `./build_github_pages.sh` passed; the full
  serial Playwright suite passed 33/33 with no browser errors. Curie and Franklin captures include
  all eight combat states in ignored `test-results/` directories; TypeScript config files are
  unchanged.
- Franklin F2 focused match/debug tests passed 18/18, `./check_codebase.sh` passed 30/30 Node tests
  plus strict TypeScript, lint, and formatting, and `./build_github_pages.sh` passed. Independent
  code review accepted F2; `tsconfig.json` and `tsconfig.lint.json` remain unchanged.
- Franklin F3 decoder/reducer tests passed 7/7, including malformed and duplicate-key records,
  role restrictions, idempotence, and locked/partial/unlocked round trips. Independent review
  accepted F3; strict source TypeScript checking passed.
- Franklin F4 presentation assertions and the automated eight-state capture passed with zero
  browser errors; rig-boundary tests passed 3/3, the production build passed, and independent
  review accepted F4. The integrated serial Playwright suite passed 9/9, including six live matches,
  traversal, deterministic endurance, chooser/input parity, and captures.
- Franklin F5A passed 37/37 repository Node tests plus strict TypeScript, lint, and formatting;
  `./build_github_pages.sh`; and the focused five-case chooser browser suite. Independent review
  accepted the final help-text and per-device navigation-wrap fixes; `git diff --check` passed and
  both TypeScript configuration diffs remain empty.
- Franklin F5B passed 37/37 repository Node tests plus strict TypeScript, lint, and formatting;
  `./build_github_pages.sh`; and the focused seven-case chooser Playwright suite. Independent review
  accepted the post-commit handler and debug-mode hidden-dialog reopen fix; `git diff --check`
  passed and both TypeScript configuration diffs remain empty.
- Franklin F6A passed 41 repository Node tests plus strict TypeScript, lint, and formatting;
  `./build_github_pages.sh`; and a serial focused nine-case Playwright suite. Independent review
  accepted the storage boundary; `git diff --check` passed and both TypeScript configuration diffs
  remain empty.
- Franklin F6B passed 45 repository Node tests plus strict TypeScript, lint, and formatting;
  `./build_github_pages.sh`; and a focused serial 11-case Playwright suite. Independent review also
  verified 15 focused unlock/storage/progression Node tests, both TypeScript configurations,
  Prettier, `git diff --check`, and the 11/11 browser run.
- Franklin F6C's deterministic seeded serial browser suite passed 14/14. `./check_codebase.sh`
  passed 45 Node tests plus strict TypeScript, lint, and formatting; the production build, Prettier,
  and `git diff --check` passed; both TypeScript configuration diffs remain empty. Independent review
  accepted F6C.
- Franklin F6D's combined serial browser suite passed 18/18, including the focused live-role suite
  2/2. Independent review accepted the final validation with no reported page or console errors.
- Franklin F7A's serial suite passed 5/5 and its real durable-announcement scenario passed 1/1;
  the full repository check passed. F7B's serial production matrix passed 3/3 with strict style
  checks. Independent reviews accepted both milestones.
- The fresh F7C command `PW_PORT=4174 ./run_playwright_tests.sh --build
tests/playwright/franklin_endurance.spec.ts --workers=1` passed 1/1 in 1.4 minutes; independent
  review accepted it. Live visibility checks cover fighter center, feet, and head anchors from
  0 to 2.7 m, rather than animated limb extrema; pitch/zoom endpoints are not cross-producted with
  maximum separation.
- Final F8 evidence: `./check_codebase.sh` passed strict typecheck, lint typecheck, ESLint,
  Prettier, and 45/45 Node tests; `./build_github_pages.sh` passed with a 7.3 MB `dist/main.js`;
  serial `PW_PORT=4174 ./run_playwright_tests.sh --workers=1` passed 31/31 in 8.4 minutes with no
  page or console errors; and the F7C focused rerun passed 1/1 in 1.5 minutes. `npm audit
--audit-level=high` reported zero vulnerabilities, Markdown links passed 39 tests, all local
  GLBs matched `dist/`, and `git diff --check` passed. The debug camera fixture resets telemetry at
  intentional restart snaps while live continuity remains the smoothness gate. The prior Pages
  success belongs only to commit `ccaf03d00486d190b2dbe9d01a824da829e437f0`, not uncommitted work.

## 2026-09-23

### Additions and New Features

- Added the first playable 3D Red Dummy versus Blue Dummy match, fixed-tick combat, AI, keyboard and gamepad controls, HUD, and restart.
- Added deterministic combat checks and local play instructions.
- Replaced the broad first-fighter plan with narrow automated M1 milestones and an evidence-led
  realistic-human asset experiment, each with an owner, dependency, evidence, and recovery path.
- Started a comparison of MakeHuman, MB-Lab, and credible already-rigged open assets before
  selecting a runtime humanoid source.
- Added orbit, tilt, and zoom controls with camera-relative player movement.
- Added a bounded deterministic combat harness, rig boundary checks, AI checks, and browser scenario gates.
- Selected the CC0 Mesh2Motion `male_5` adult-human model at source commit
  `3ce7f9d97d25e608b4779ce797da343775ded62b`, with direct same-rig base and addon animation GLBs,
  as the generic fighter asset path. Provenance and SHA-256 digests are recorded in `assets/README.md`.
- GitHub Pages reported a successful deployment for commit `ccaf03d00486d190b2dbe9d01a824da829e437f0`.
- Started the first Nobel-fighter milestone: Otto Heinrich Warburg is the signature, deliberately
  stronger fighter; the active plan covers his local scientist model, research-based moves, and automated
  acceptance before the next roster step.
- Integrated the vendored CC0 Mesh2Motion `doctor_m` scientist model for Otto Heinrich Warburg while
  keeping `male_5` as the independently animated AI opponent. The HUD and browser identity now name the
  Warburg-versus-AI match.
- Made Warburg's Oxygen Transfer heavy faster and stronger than the standard AI heavy, and added
  fixed-tick Lactate Drive and Aerobic Glycolysis moves with explicit cooldown and controller-chord
  rules. Combat remains independent of rendering.
- Added presentation-only move labels, an Oxygen Transfer contact ring, and an Aerobic Glycolysis
  output ring. Browser scenarios capture each Warburg move at deterministic combat frames.
- Corrected hit resolution so a newly struck fighter receives the full hit-stun or knockdown duration
  regardless of fighter update order.
- Added the complete CC0 1.0 legal text and mapped source code and vendored Mesh2Motion assets to
  their respective licenses from the root README.
- Closed the first Nobel-fighter acceptance: all 19 repository tests pass, the Pages build succeeds,
  the dependency audit reports zero vulnerabilities, and all five Playwright tests pass. The browser
  suite includes six complete matches, movement/camera traversal, input parity, and a 14,760-tick
  randomized/idle endurance scenario.
- Captured all eight combat states and four Warburg-move moments under ignored `test-results/` paths;
  the final browser capture and suite report no errors.
- Started the second-Nobel-fighter plan with Marie Curie, official 1903/1911 Nobel sources, a CC0
  female-asset feasibility milestone, minimal two-character selection, and Franklin's later secret
  unlock handoff.
- Completed Curie's C1-C2 asset and visual milestones with the vendored CC0 Mesh2Motion
  `female_31` model. The live AI still uses the existing opponent combat role, while the browser
  truthfully identifies and renders Marie Curie with independent native-rig animation clips.
- Completed Curie's C4 combat milestone: added the direct `curie` role and its bounded Separation
  Step `light + block` rule, with no change to the current Warburg-versus-standard-opponent default.
- Completed Curie's C5 presentation milestone: the existing native state clips remain driven by
  `Fighter` state, while a temporary FRACTION / ACTIVITY meter follows only authoritative Separation
  Step ticks and clears after recovery or interruption.
- Completed Curie's C6A-C6B role foundation: selection retains a complementary Nobel pair through
  match resets, while rig assignment, HUD names and ARIA labels, research cues, KO text, and match
  victory text now follow each fighter's current role in either slot.
- Extended the localhost-only browser probe with role-resolved presentation-cue coordinates, so
  automated C6B scenarios verify Oxygen Transfer and Aerobic Glycolysis visuals in both pair orders.
- Added the Curie C6C pre-match chooser: accessible native radio choices for Otto Heinrich Warburg
  and Marie Curie, a visible confirmation action, keyboard and standard-gamepad selection edges, modal focus
  wrapping, and a paused simulation until the selected pair begins. The control summary follows the
  selected fighter.
- Prevented held chooser confirmation from leaking into the first gameplay tick: gamepad south no
  longer starts a light attack and Start no longer restarts the freshly selected match before those
  controls are released.
- Completed Curie's C6D keyboard and synthetic-gamepad chooser parity with the existing pure input
  mapping. Browser fixtures require no physical controller.
- Completed Curie's C6E live pairing acceptance: the unchanged six-match matrix now confirms
  keyboard Warburg-versus-Curie and synthetic-gamepad Curie-versus-Warburg, retaining the selected
  roles after restart while covering both player and AI match victories without browser errors.
- Split final acceptance into C7A repository/build checks, C7B browser acceptance, C7C
  asset/dependency/screenshot evidence, and C7D milestone closure so each remains independently
  dispatchable and automatically verifiable.
- Completed C7A repository/build checks: all 28 Node tests, strict TypeScript, lint, formatting, and
  the Pages-ready build pass; `tsconfig.json` and `tsconfig.lint.json` remain unchanged.
- C7C dependency audit reports zero vulnerabilities, and all four vendored GLB SHA-256 hashes match
  their production `dist/assets/` copies.
- Closed Curie's C7B-C7D first-playable acceptance without a human or physical-hardware gate. The
  serial production browser suite passes all eight scenarios, including deterministic endurance,
  chooser/input parity, six keyboard and synthetic-gamepad matches, traversal/camera, KO/round,
  match victory, and restart checks.
- Captured Curie's idle, move, light, heavy, block, hit, down, get-up, and Separation Step states
  under `test-results/rig-states-curie-final/`; the capture run reported zero browser errors.
- Closed Curie's C8 handoff with the active Franklin secret-fighter plan. It records Franklin's
  non-laureate historical framing, existing CC0 `female_31` asset provenance, a strict persistent
  two-Nobel-win unlock, player-only Franklin-versus-Warburg pairing, accessibility, and automated
  secrecy, input, combat, camera, and endurance evidence.
- Clarified the Franklin implementation plan: repository link checks validate local links while
  consulted external sources are non-gating; Franklin presentation is verified against concurrent
  Warburg AI and Curie in its own pairing; the dynamic third choice is ordered Warburg, Curie,
  Franklin; and storage exceptions fail closed with no optimistic unlock or announcement. The
  unlock announcement occurs once only after the second distinct player-role victory is durably
  written; reloading a saved unlock does not announce again.
- Completed Franklin F1 planning evidence: the local Markdown-link checker passed 39 tests, the
  consulted historical sources remain non-gating, and existing provenance, rig, and SHA-256
  evidence confirms the vendored `female_31` asset contract.

### Fixes and Maintenance

- Kept get-up active for 18 simulation ticks so recovery is visible and the fighter cannot act during it.
- Tightened adaptive camera framing to make the fighters larger on screen, while adding
  separation and steep-orbit headroom verified by randomized browser movement.
- Repaired a dangling mesh reference in the trimmed animation GLB and limited animation target lookup to skeleton nodes, resolving two browser asset-load errors.
- Ignored generated browser evidence and Python bytecode alongside the production build directory.
- Extended the lint type-check input list with `src/**/*.ts` while retaining the original tests and tools targets.
- Retired the generated humanoid direction after visual evidence showed it was unsuitable for the
  requested recognizable-human milestone.
- Removed the rejected Quaternius and generated humanoid runtime assets and generator after the
  Mesh2Motion replacement passed all eight animation-state captures.
- Held the keyboard restart key across simulation ticks in the six-match browser check so the
  synthetic input reflects a real key press.
- Removed blanket material multiplication from the second fighter so Curie's authored clothing and
  adult-human proportions render unchanged.
- Cleared Curie's active Separation Step flag when an incoming strike causes hit stun or knockdown,
  so presentation and combat state cannot retain an interrupted special after the fighter changes
  state. Focused traces retain the elapsed cooldown and confirm one-hit behavior.
- Archived the completed Warburg and Curie plans; Franklin is now the active fighter plan.

### Developer Tests and Notes

- `npm install @babylonjs/core` completed with a writable npm cache; dependency audit reported zero vulnerabilities.
- `./build_github_pages.sh`, focused combat checks, and six complete browser matches passed (three keyboard, three gamepad, including player and AI victories).
- Browser traversal checks crossed the opponent, reached arena edges, exercised light and block, and restarted with both devices; projected fighter centers remained on screen and no page errors were reported.
- R and gamepad Start also restarted completed matches to round one with full health and zero wins.
- Curie's source GLB passed SHA-256 verification, 66-joint ordered-rig and animation-target checks,
  production build, five serial browser scenarios, and eight deterministic state captures with no
  browser errors.
- Browser traversal now compares Babylon rig-root positions and yaw against authoritative `Match`
  fighter state, closing the C2 position-following test gap.
- Curie's deterministic combat tests cover Separation Step startup, active contact, block, whiff,
  recovery, cooldown, KO, round transition, restart, and default Warburg/opponent regression.
- `./run_playwright_tests.sh --build --workers=1` passed all eight serial browser tests. The final
  C7 check also confirms 28 Node tests, strict TypeScript, lint, formatting, the production build,
  a clean `git diff --check`, unchanged `tsconfig.json` and `tsconfig.lint.json`, matching source/
  `dist` GLB SHA-256 hashes, and `npm audit --audit-level=high` with 0 vulnerabilities.

### Decisions and Failures

- Replaced the physical-controller sign-off gate with an agent-run evidence plan for closing the dummy fight and building the first Nobel fighter.
- Made human play feel and physical hardware variability documented residual uncertainty rather
  than a completion dependency.
- Rejected the Quaternius candidate for the runtime visual direction because its blocky low-poly
  silhouette does not meet the requested anatomically proportioned adult-human target.
- Rejected the Vitruvian plus external-animation path after direct browser evidence showed that its
  retargeted clips distorted the adult body. The Mesh2Motion source avoids retargeting by supplying
  the model and selected clips on the same rig.
- Deferred Warburg and all other Nobel-character work until the selected generic human replacement
  passed its automated visual and gameplay checks; the next active plan now starts Warburg.
- Physical-controller feel remains a nonblocking uncertainty. Synthetic standard Gamepad API parity
  and measurable input, camera, movement, combat-transition, and endurance checks provide the
  automated closure path. The successful GitHub Pages deployment remains evidence only for its
  earlier commit `ccaf03d00486d190b2dbe9d01a824da829e437f0`, not this uncommitted local work.
