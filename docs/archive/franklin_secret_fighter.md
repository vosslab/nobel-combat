# Plan: Franklin secret fighter unlock

## Context

The current game has an accessible Warburg-or-Curie chooser, a two-slot deterministic `Match`,
and a local Mesh2Motion asset pipeline. A player can complete matches as either Nobel fighter, but
there is no persistent unlock record, no Franklin role, and no post-match route back to the chooser.
This plan adds one secret player-only character path without turning the two-fighter pairing into a
roster framework.

Rosalind Franklin is included as a hidden historical contributor, not as a Nobel laureate. The
[1962 Nobel Medicine summary](https://www.nobelprize.org/prizes/medicine/1962/summary/) names
Crick, Watson, and Wilkins. Nobel's [DNA history](https://www.nobelprize.org/stories/cells-nerves-genes/)
credits Franklin's research as enabling the discovery and records that she died in 1958. King's
College London documents that [Photograph 51](https://www.kcl.ac.uk/the-story-behind-photograph-51)
was taken by Rosalind Franklin with Raymond Gosling and explains its diffraction cross pattern.
The primary source is Franklin and Gosling, _Nature_ 171, 740-741 (1953),
[DOI 10.1038/171740a0](https://doi.org/10.1038/171740a0).

## Objectives

- Add a narrowly scoped, permanent browser-local Franklin unlock earned by complete wins as both Warburg and Curie in either order.
- Keep `Match` deterministic and independent of browser storage, animation, and chooser DOM.
- Make Franklin player-only and pair her with Warburg AI without adding opponent selection or a generalized roster.
- Prove unlock, secrecy, accessibility, presentation, combat, and endurance behavior with automated checks.

## Design philosophy

Apply **Atomic task decomposition** and **Use the scientific method** from `docs/REPO_STYLE.md`:
retain the proven two-slot combat contract, isolate persistence in a strict reducer, and make the
smallest observable extension at each boundary. Franklin's visual is a presentation reuse, while
the unlock is a browser-only progression fact; neither becomes combat authority.

## Scope

- Record the historical and asset provenance that bounds the Franklin implementation.
- Extend the role-pair contract only far enough to support player Franklin versus Warburg AI.
- Add one versioned, strictly decoded local unlock record for wins as both Nobel fighters.
- Reuse the vendored adult-proportioned `female_31.glb` with an independently cloned Franklin palette when render evidence supports it.
- Add Franklin to the native chooser only after a valid persisted unlock and announce the change accessibly.
- Reopen the chooser from match-over through `Change fighter` and preserve existing restart behavior.
- Expand deterministic, browser, synthetic-gamepad, capture, and endurance evidence for the unlock path.

## Non-goals

- Do not describe Franklin as a Nobel laureate or imply that she received the 1962 award.
- Do not add a radiation weapon, cure, or unsupported science-based attack.
- Do not create a third AI opponent, opponent selector, character roster, ability framework, downloader, geometry, or retargeting system.
- Do not derive hitboxes, damage, or match transitions from meshes, materials, storage, or animation clips.
- Do not make a human review, physical controller, or manual visual inspection a delivery gate.

## Current state summary

`Match.selectPlayer()` currently supports Warburg and Curie, places the selected role in player
slot 0, and uses the complementary Nobel fighter for AI in slot 1. Its historical default remains
Warburg versus `opponent`. The rendering layer already chooses a rig from `Fighter.role`, with
authoritative position and yaw remaining in the simulation. The native chooser pauses live
simulation, supports keyboard and synthetic standard-gamepad selection, wraps focus, and gates
held confirmation controls before gameplay begins.

`localStorage` has no current unlock or persistence contract. Franklin must therefore begin locked
after a missing, malformed, unsupported, or unavailable storage record. Browser storage failure is
recoverable: when a storage read or write throws, the game remains playable with the two existing
choices, Franklin remains locked for that session, and the UI neither announces nor optimistically
shows an unlock. A read failure always defaults to locked. A write failure after a valid prior
record leaves that durable record unchanged when the browser preserves it; the current session
still fails closed to locked rather than assuming that a new unlock persisted.

The initial visual baseline is already vendored as
`assets/models/mesh2motion_female_31.glb`: Mesh2Motion source
`static/models-variation/human/female_31.glb` at commit
`3ce7f9d97d25e608b4779ce797da343775ded62b`, CC0, SHA-256
`72c50339c0caa248b19ec11a5c188d52f6e2bf8e16bd0dd64e98ae756680ceb3`, 1,211 triangles, and a
66-joint ordered rig compatible with the local clips. The GLB is already requested for Curie, so
the secret is a role/chooser/progression contract rather than asset confidentiality.

## Architecture boundaries and ownership

- `Match` owns fighter roles, valid pair creation, rounds, combat, and AI slots. It receives a selected role and never reads or writes browser storage.
- The unlock reducer owns the versioned persisted value, strict decoding, role-win accumulation, and idempotent unlocked result. It has no Babylon or DOM dependency.
- The application controller owns storage I/O, winner-to-reducer notification, and selection
  gating. F6B calls F5B's private post-commit seam only after `localStorage.setItem` succeeds for
  a changed durable record; the local test hook that reaches that seam is isolated to
  `playtestMode`. F5B owns match-over `Change fighter` routing and the one-time accessible
  announcement, but never reads or writes storage.
- The presentation layer owns role names, cloned materials, rig instances, HUD labels, clips, and deterministic captures. It observes the authoritative fighter role and state.
- Browser tests own fixtures for storage, synthetic standard Gamepad API input, debug state transitions, and network-request secrecy assertions. Generated screenshots remain evidence artifacts.

### Mapping (milestones / workstreams -> components / patches)

| Milestone / Workstream | Owner                     | Component                             | Review boundary                                                                            |
| ---------------------- | ------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| F1                     | asset investigator        | Franklin dossier and asset provenance | Plan and provenance documentation only                                                     |
| F2                     | combat/progression coder  | Pair contract and safe identity       | `Match`, AI role selection, debug-harness role validation, and `main.ts` name/rig fallback |
| F3                     | combat/progression coder  | Unlock reducer                        | New pure TypeScript module and focused Node tests                                          |
| F4                     | engine/UI coder           | Role presentation                     | Rig lookup, material clone, HUD labels, clip mapping, capture fixture                      |
| F5A                    | engine/UI coder           | Dynamic accessible chooser            | Chooser DOM/CSS, role navigation, release gates, and Playwright accessibility scenarios    |
| F5B                    | engine/UI coder           | Match-over return and announcement    | Post-commit status announcement, `Change fighter` routing, and focused browser scenarios   |
| F6A                    | engine/UI coder           | Storage adapter boundary              | Versioned storage read/decode/write failure handling                                       |
| F6B                    | combat/progression coder  | Complete-match progression trigger    | Winner-edge consumption, durable write, and post-commit seam                               |
| F6C                    | browser-validation tester | Persistence and denial scenarios      | Both win orders, reload behavior, and denied-storage browser fixtures                      |
| F6D                    | browser-validation tester | Live role and input acceptance        | Franklin selection, complete live matches, and role persistence                            |
| F7A                    | browser-validation tester | Secrecy and accessibility evidence    | Playwright secrecy, chooser, and announcement fixtures                                     |
| F7B                    | browser-validation tester | Live progression and input evidence   | Production-browser progression and input-parity fixtures                                   |
| F7C                    | browser-validation tester | Endurance and capture evidence        | Seeded endurance checks and deterministic screenshots                                      |
| F8                     | browser-validation tester | Closure                               | Complete: final automated evidence and documentation closeout                              |

## Milestone plan

| M   | Owner                     | Title                               | Summary                                                                                                            | Goal                                                                  |
| --- | ------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| F1  | asset investigator        | Source and asset contract           | Complete: recorded Franklin's historical framing and existing CC0 asset facts.                                     | Give implementation a bounded, evidence-backed source of truth.       |
| F2  | combat/progression coder  | Deterministic role pair             | Complete: Franklin is a player-only pick versus Warburg AI with a compile-safe name and existing rig fallback.     | Preserve the two-slot match contract.                                 |
| F3  | combat/progression coder  | Unlock record reducer               | Complete: a strict v1 pure reducer counts each distinct Nobel player-role win once.                                | Make unlock progression deterministic and fail closed.                |
| F4  | engine/UI coder           | Role presentation                   | Complete: Franklin resolves to the existing female_31 rig with verified role identity and eight combat clips.      | Add a readable human placeholder without changing combat.             |
| F5A | engine/UI coder           | Dynamic accessible chooser          | Complete: derive two or three roles from strict-decoder-backed fixtures with accessible, parity-tested navigation. | Keep selection accessible and secret before eligibility.              |
| F5B | engine/UI coder           | Return and unlock announcement      | Complete: announce a synthetic post-commit unlock once and reopen the chooser from match-over.                     | Make the new role discoverable and reusable without storage coupling. |
| F6A | engine/UI coder           | Storage adapter boundary            | Complete: read/decode the versioned record and fail closed on storage exceptions.                                  | Make browser persistence explicit and bounded.                        |
| F6B | combat/progression coder  | Complete-match progression trigger  | Complete: consume eligible player match wins once, persist changed progress, then call F5B's seam.                 | Make the unlock event durable and exactly once per match.             |
| F6C | browser-validation tester | Persistence and denial scenarios    | Complete: exercise both win orders, reload, silent existing unlock, and denied storage.                            | Prove durable and fail-closed progression.                            |
| F6D | browser-validation tester | Live role and input acceptance      | Complete: select and play Franklin with keyboard and synthetic gamepad after durable unlock.                       | Prove the live role path remains playable.                            |
| F7A | browser-validation tester | Secrecy and accessibility evidence  | Complete: exercise locked/unlocked chooser, announcement, and focus behavior.                                      | Prove ordinary UI concealment and accessible selection state.         |
| F7B | browser-validation tester | Live progression and input evidence | Complete: exercise durable wins, reload, role play, and input parity.                                              | Prove the running progression path completes without browser error.   |
| F7C | browser-validation tester | Endurance and capture evidence      | Complete: exercise long deterministic runs and capture all role states.                                            | Prove state, camera, and capture stability without a human gate.      |
| F8  | browser-validation tester | Closure                             | Complete: repository, build, asset, audit, browser, and local-link evidence passed.                                | Close Franklin's first-playable path without a human gate.            |

### F1: Source and asset contract

- Depends on: none.
- Deliverables: the historical sources and exact existing Mesh2Motion provenance recorded in this plan; Franklin language rules for HUD and future source documentation.
- Status: Complete.
- Done checks: the repository-local Markdown-link checker passed 39 tests. The external historical
  sources above were consulted during plan research; their future availability is non-gating and
  was not part of local Markdown validation. Existing asset provenance and rig tests, plus the
  verified SHA-256, confirm that the path, commit, license, triangle count, and 66-joint rig agree
  with `assets/README.md` and the local asset inspection.
- Entry criteria: none.
- Exit criteria: the implementation owner can use the existing female rig without a download, geometry, or retargeting decision.
- Parallel-plan ready: no; this contract fixes terminology and asset boundary before role/UI work.

### F2: Deterministic role pair

- Status: Complete.
- Depends on: F1, because the role identity and player-only boundary are fixed there.
- Deliverables: a bounded `FighterRole`/selectable-role distinction, Franklin player pairing to Warburg AI, reset preservation, debug-harness validation, and the minimal compile-safe `main.ts` presentation fallback: Franklin resolves to the already loaded `female_31` instance and has the truthful display name `Rosalind Franklin`.
- Boundary: keep the chooser locked with its existing two Warburg/Curie options. F2 supplies no Franklin chooser option, material clone, palette choice, or state-capture work; F4 owns those presentation proofs.
- Done checks: focused Node tests cover valid Franklin selection; rejected invalid and AI-side Franklin selection; Franklin-versus-Warburg roles before and after round reset and both restart paths; unchanged default Warburg-versus-`opponent`, Warburg-versus-Curie, and Curie-versus-Warburg contracts.
- Completion evidence: focused match/debug tests passed (18/18); `./check_codebase.sh` passed
  (30/30 Node tests, strict TypeScript, lint, and formatting); `./build_github_pages.sh` passed;
  independent F2 review accepted; `tsconfig.json` and `tsconfig.lint.json` are unchanged.
- Entry criteria: F1 source/asset facts recorded.
- Exit criteria: all combat-facing roles are valid, only the intended pair can be constructed, and every new role has a truthful compile-safe name and rig resolution before F4 expands presentation.
- Parallel-plan ready: no; F3's winner reducer needs the final selectable-role vocabulary.

### F3: Unlock record reducer

- Status: Complete.
- Depends on: F2, because it records complete player wins by the finalized Nobel-role set.
- Deliverables: one strict, versioned Franklin unlock record and pure decode, encode, and reduction
  functions. The reducer publishes the typed result consumed by the application controller; it has
  no browser-storage adapter or DOM dependency.
- Done checks: Node tests cover missing record, malformed JSON, wrong primitive/container shape,
  extra or unsupported version, impossible fields, both win orders, duplicate wins, repeated
  winner notification, valid-role input, and encode/decode round trip. The reducer accepts only
  `NobelFighterRole`; F6B calls it only after a completed player match victory and proves that round
  wins, AI wins, restarts, and forced non-winning states add no progress. Concrete storage
  reads/writes, thrown-storage behavior, and announcement timing belong to F6A-F6C and are not part of
  the reducer.
- Entry criteria: F2 pair tests pass.
- Completion evidence: `node --import tsx --test tests/test_franklin_unlock.mjs` passed (7/7);
  strict source-specific TypeScript checking passed; independent F3 review accepted; both
  TypeScript config files remain unchanged.
- Exit criteria: every input maps to a bounded locked/unlocked state and success is idempotent.
- Parallel-plan ready: yes; after the record interface is agreed, F3 reducer tests and F4 material feasibility may proceed in two workstreams (maximum 2). Shared role definitions remain owned by F2's integrator.

### F4: Role presentation

- Status: Complete.
- Depends on: F2. It may run in parallel with F3 after F2 exits.
- Deliverables: complete Franklin presentation on the F2 local `female_31` fallback: an independently cloned palette/material when a deterministic render probe proves a visible distinction, role-resolved HUD/clip selection, and full state capture.
- Done checks: browser debug scenarios assert that Franklin's selected `female_31` rig root,
  skeleton, and material instances are independent from the concurrent Warburg AI while both
  remain role-resolved; they also assert authoritative root-transform following, finite material
  values, and selected clips for idle, move, light, heavy, block, hit, down, and get-up. Capture
  all eight states. Curie's compatibility remains a separate Warburg-versus-Curie or
  Curie-versus-Warburg scenario. If the palette probe cannot make a stable visible distinction,
  retain the same placeholder and prove the HUD identity instead; do not block F5A on cosmetics.
- Entry criteria: F2 pair contract passes and existing local asset load remains error-free.
- Completion evidence: deterministic Franklin-versus-Warburg browser assertions verify independent
  roots, skeletons, and materials, role-resolved names, authoritative transforms, and all eight
  clips. The standard Playwright suite now runs a separate Franklin capture test; its focused run
  passed and wrote all eight screenshots to ignored `test-results/rig-states-franklin-f4/` with
  `errors: []`. The integrated serial browser suite passed 9/9, including six live matches,
  traversal, chooser/input parity, deterministic endurance, and captures. The production build and
  rig-boundary tests (3/3) passed, independent F4 review accepted, and both TypeScript config files
  remain unchanged. The authored model appearance was retained without an extra palette change.
- Exit criteria: no presentation component changes combat geometry or source-of-truth positions.
- Parallel-plan ready: yes; see F3, maximum 2.

### F5A: Dynamic accessible chooser

- Status: Complete.
- Depends on: F3 and F4, because it consumes the unlock state and role presentation identity.
- Deliverables: locked chooser with exactly two native choices; unlocked chooser with one Franklin
  choice ordered Warburg, Curie, then Franklin; and revised help text and selection edge/release
  behavior. Local playtest fixtures serialize a candidate unlock record and derive chooser state
  only from `decodeFranklinUnlock`; F5A does not read browser storage.
- Done checks: pre-unlock browser fixtures find no Franklin label, role, radio option, selectable
  DOM data, or Franklin-specific network request; strict-decoder-backed unlocked fixtures find
  exactly one native Franklin option in Warburg-to-Curie-to-Franklin order. On initial chooser
  load, focus and selection begin on Warburg. Focus wraps forward and backward across available
  choices, and background controls remain unavailable; Escape retains the chooser. Keyboard,
  D-pad, and stick previous/next edges follow the same dynamic order and wrap in both directions;
  South and Start confirmation follow the same release gate, including held/repeated inputs, and
  neither confirmation nor movement leaks into gameplay. Franklin's help text documents its actual
  standard light/heavy/block controls and does not claim Curie's Separation Step. Concrete storage
  behavior is verified in F6A-F6C.
- Entry criteria: F3 returns a valid locked/unlocked result and F4 has a role identity mapping or declared HUD fallback.
- Exit criteria: chooser DOM is derived from the decoded unlock state every time it opens, rather than cached selection state.
- Completion evidence: `./check_codebase.sh` passed 37/37 Node tests plus strict TypeScript, lint,
  and formatting; `./build_github_pages.sh` passed; `PW_PORT=4187 npx playwright test
tests/playwright/fighter_selection.spec.ts --workers=1 --reporter=line` passed 5/5; `git diff
--check` passed; and `git diff -- tsconfig.json tsconfig.lint.json` was empty. Independent review
  accepted F5A after the Franklin help-text and per-device navigation-wrap fixes.
- Parallel-plan ready: no; UI behavior needs the stable reducer and role interfaces from F3/F4.

### F5B: Match-over return and unlock announcement

- Status: Complete.
- Depends on: F5A, because the return path reopens the completed dynamic chooser.
- Deliverables: a private storage-free post-commit handler that announces a decoded newly unlocked
  record through one polite atomic live region, plus a match-over `Change fighter` control that
  reopens the chooser. Its local test hook is isolated to `playtestMode`.
- Done checks: a synthetic second-role post-commit event announces the unlock once; a repeated event
  and an injected already-unlocked decoded result produce no announcement. `Change fighter` is
  visible only after match-over, preserves the current valid selection (or chooses Warburg if none
  is valid), pauses the next match, and resumes only after confirmation. Concrete storage success,
  failure, and persistence remain F6A-F6C responsibilities.
- Entry criteria: F5A keyboard/gamepad chooser tests pass for both locked and injected unlocked states.
- Exit criteria: return and announcement behavior do not read storage or advance combat before confirmation.
- Completion evidence: `./check_codebase.sh` passed 37/37 Node tests plus strict TypeScript, lint,
  and formatting; `./build_github_pages.sh` passed; the focused chooser Playwright suite passed
  7/7; `git diff --check` passed; and `git diff -- tsconfig.json tsconfig.lint.json` was empty.
  An independent reviewer accepted the storage-free post-commit handler, atomic polite live region,
  and match-over return path after the debug-mode hidden-dialog reopen fix.
- Parallel-plan ready: no; F5B consumes the tested F5A chooser state.

### F6A: Storage adapter boundary

- Owner: engine/UI coder.
- Status: Complete.
- Depends on: F5B, because the adapter's success result supplies the later post-commit seam.
- Deliverables: `src/franklin_storage.ts`, the concrete versioned `localStorage` adapter for
  `nobel-combat.franklin-unlock.v1`. It reads then strictly decodes the Franklin record at startup,
  writes only encoded records, and reports read/write results without exposing browser exceptions
  to gameplay.
- Done checks: missing, malformed, unsupported, and unreadable startup records decode to locked;
  successful reads recover only strict records; `readFranklinUnlock` returns `{ state, readFailed }`
  and `writeFranklinUnlock` returns `{ written }`. Read and write exceptions fail closed and leave
  the two-role game playable. Tests verify that writes do not produce an optimistic chooser option
  or announcement until F6B consumes confirmed write success.
- Entry criteria: F5B focused chooser scenarios pass.
- Exit criteria: storage ownership is contained at this browser boundary; F5A/F5B and the reducer
  remain storage-free.
- Completion evidence: independent review accepted F6A. `./check_codebase.sh` passed 41 Node tests
  plus strict TypeScript, lint, and formatting; `./build_github_pages.sh` passed; the serial focused
  Playwright suite passed 9/9; `git diff --check` passed; and
  `git diff -- tsconfig.json tsconfig.lint.json` was empty.
- Parallel-plan ready: no; F6B requires the adapter's explicit result contract.

### F6B: Complete-match progression trigger

- Owner: combat/progression coder.
- Status: Complete.
- Depends on: F6A, because eligible wins must use the tested storage result contract.
- Deliverables: `src/franklin_progression.ts`, a winner-edge trigger that reduces only live,
  non-debug complete player victories for `NobelFighterRole`, consumes each match once, persists
  only changed progress, and calls F5B's internal post-commit seam only after a successful
  `localStorage.setItem`.
- Done checks: only a complete player Warburg or Curie match victory records progress once. AI wins,
  round wins, restart, repeated render/tick calls, forced debug fixtures, and Franklin matches
  record nothing. The changed durable write occurs before application unlock state, chooser reveal,
  or F5B's post-commit seam; startup, read, and write failures fail closed. The second distinct
  player-role win reaches F5B exactly once after the changed durable write; a failed or unchanged
  write reaches no announcement seam. The local fixture hook is available only under `playtestMode`.
- Entry criteria: F6A storage tests pass.
- Exit criteria: match progress has one authoritative edge and cannot be advanced by presentation,
  restart, or test-only state forcing.
- Completion evidence: implementation checks passed `./check_codebase.sh` with 45 Node tests plus
  strict TypeScript, lint, and formatting; `./build_github_pages.sh`; the focused serial Playwright
  suite 11/11; `git diff --check`; and an empty TypeScript configuration diff. Independent review
  accepted F6B after verifying 15 focused unlock/storage/progression Node tests, both TypeScript
  configurations, Prettier, `git diff --check`, and the 11/11 Playwright run.
- Parallel-plan ready: no; F6C uses live durable records emitted by this trigger.

### F6C: Persistence and denial scenarios

- Owner: browser-validation tester.
- Status: Complete.
- Depends on: F6B, because this milestone proves the live records and post-write behavior.
- Deliverables: deterministic seeded browser scenarios for real full Warburg-then-Curie and
  Curie-then-Warburg win orders, reload, silent already-unlocked startup, and denied storage.
- Done checks: each real full win order remains locked after its first win and exposes Franklin only
  after the successful durable second win, with one unlock announcement. Reload restores the saved
  option without a duplicate announcement. F6A's existing startup test covers denied reads. A
  denied write preserves the partial durable record and leaves the session locked, with no unlock or
  page/console error.
- Entry criteria: F6B winner-edge tests pass.
- Exit criteria: durable and failed persistence behavior is measurable in a production browser
  without a human or physical-controller gate.
- Completion evidence: independent review accepted F6C. The deterministic seeded serial browser
  suite passed 14/14; `./check_codebase.sh` passed 45 Node tests plus strict TypeScript, lint, and
  formatting; `./build_github_pages.sh`, Prettier, and `git diff --check` passed; and
  `git diff -- tsconfig.json tsconfig.lint.json` was empty.
- Parallel-plan ready: no; F6D accepts the proven durable unlock path.

### F6D: Live role and input acceptance

- Owner: browser-validation tester.
- Status: Complete.
- Depends on: F6C, because Franklin selection must use a proven durable unlocked state.
- Deliverables: production-browser Franklin selection by keyboard and synthetic standard-gamepad,
  complete Franklin player and Warburg AI match fixtures, and role persistence through round and
  both restart paths.
- Done checks: keyboard and synthetic-pad input select Franklin from the unlocked chooser and start
  Franklin-versus-Warburg; separate complete matches prove a Franklin player victory and a Warburg
  AI victory. Assertions cover KO, round transition, match victory, restart during and after
  match-over, selection/pair persistence, and absence of page or console errors.
- Entry criteria: F6C persistence and denied-storage scenarios pass.
- Exit criteria: the production role path is playable with parity-tested supported input and no
  invalid state or browser error.
- Completion evidence: independent review accepted F6D. The combined serial browser suite passed
  18/18, including the focused live-role suite 2/2. It verified durable Franklin selection through
  keyboard and synthetic standard-gamepad input, Franklin player and Warburg AI match victories,
  KO and round transitions, and restart behavior during and after match-over. No production gameplay
  behavior changed; the browser evidence reported no page or console errors.
- Parallel-plan ready: no; F7 evidence consumes the completed live integration.

### F7A: Secrecy and accessibility evidence

- Status: Complete.
- Depends on: F6D, because secrecy and accessible UI evidence consumes the complete durable live path.
- Deliverables: production-browser request/DOM secrecy, chooser order, focus, announcement, and
  release-gate scenarios.
- Done checks: serial browser tests cover pre-unlock absence, ordinary UI/presentation concealment,
  chooser accessibility, Warburg-to-Curie-to-Franklin order, forward/backward wrapping, initial
  focus, keyboard/D-pad/stick navigation parity, South/Start release-gate parity, one post-write
  announcement, silent already-unlocked reload, and read/write-denied storage. Secrecy is not a
  tamper-resistant or anti-cheat boundary: client-side code and `localStorage` remain inspectable
  and mutable.
- Entry criteria: F6A-F6D focused scenarios pass.
- Exit criteria: chooser state remains accessible and honest, with no leak through ordinary UI or
  presentation before unlock.
- Completion evidence: independent review accepted F7A. The serial scenario suite passed 5/5;
  the real durable-unlock announcement scenario passed 1/1. Selector-contract assertions and frame
  waits verified the accessible chooser and announcement transitions, and the full repository check
  passed.
- Parallel-plan ready: yes; it may run with F7B and F7C after F6D, maximum 3 total F7 workstreams.

### F7B: Live progression and input evidence

- Status: Complete.
- Depends on: F6D, because this expanded matrix consumes the complete durable live path.
- Deliverables: production-browser fixtures for both win orders, reload persistence, Franklin
  selection, role play, restart paths, and keyboard/synthetic-gamepad input.
- Done checks: serial browser tests cover both complete-win orders, intermediate locked state,
  winner-only progress, idempotence, unlocked reload, keyboard and synthetic-gamepad Franklin
  selection, Franklin-versus-Warburg player and AI victories, KO, round transition, match victory,
  and restart during and after match-over. Assertions reject browser console/page errors and failed
  restarts.
- Entry criteria: F6A-F6D focused scenarios pass.
- Exit criteria: production-browser progression remains durable when storage works and fail closed
  when it does not.
- Completion evidence: independent review accepted F7B. The serial production matrix passed 3/3
  with strict style checks. AI victories preserved both empty and partial progress, and a repeated
  live Warburg player victory made zero storage writes and emitted no announcement.
- Parallel-plan ready: yes; it may run with F7A and F7C after F6D, maximum 3 total F7 workstreams.

### F7C: Endurance and capture evidence

- Status: Complete.
- Depends on: F6D, because endurance runs must begin from the fully integrated durable role path.
- Deliverables: long seeded endurance scenarios, movement/camera traversal checks, and deterministic
  Franklin state captures.
- Done checks: serial browser tests cover all clips; approach, retreat, crossings, circles, arena
  edges, maximum separation, blocks, repeated light/heavy attacks, knockdown/recovery,
  rapid/opposed input, idle, and seeded randomized matches. Assertions reject invalid health,
  repeated per-swing hits, impossible phase transitions, stuck states, lost fighters, camera
  discontinuities, and browser console/page errors. Capture idle, move, light, heavy, block, hit,
  down, and get-up; captures are generated evidence rather than approval gates.
- Entry criteria: F6A-F6D focused scenarios pass.
- Exit criteria: the production build provides durable quantitative movement, combat, camera, and
  presentation evidence without a human gate.
- Completion evidence: the camera-visibility correction fits a padded sphere around both human
  silhouettes to the narrower camera FOV axis. The endurance fixture now waits for rendered frames
  after viewport resize and runs separate fresh live knockdown windows for the two aspect-ratio
  maximum-separation trials. The fresh command
  `PW_PORT=4174 ./run_playwright_tests.sh --build tests/playwright/franklin_endurance.spec.ts --workers=1`
  passed 1/1 in 1.4 minutes; independent review accepted F7C.
- Residual measurement limit: live projections verify each fighter center plus feet and head anchors
  from 0 to 2.7 m, rather than all animated limb extrema. Pitch and zoom endpoints are also not
  cross-producted with maximum separation. These are bounded residual uncertainties for F8's final
  report, not human approval gates.
- Parallel-plan ready: yes; it may run with F7A and F7B after F6D, maximum 3 total F7 workstreams.

### F8: Closure

- Depends on: F6D, F7A, F7B, and F7C, because closure consumes the completed integration plus the
  secrecy/accessibility, live-progression/input, and endurance/capture evidence.
- Deliverables: completed active-plan rows, documented residual uncertainty, changelog/design/source notes required by repository rules, and release-ready command evidence.
- Done checks: `./check_codebase.sh`, `./build_github_pages.sh`, serial production
  `./run_playwright_tests.sh --build --workers=1`, `npm audit --audit-level=high`,
  `source source_me.sh && python3 -m pytest tests/test_markdown_links.py -q` for local Markdown
  links only, and `find assets -type f -name '*.glb' -print0 | while IFS= read -r -d '' asset; do
dist_asset="dist/$asset"; test -f "$dist_asset" || exit 1; cmp -s "$asset" "$dist_asset" ||
exit 1; done` for fail-fast source-to-`dist` identity of every local GLB, then `git diff --check`.
  Confirm `tsconfig.json` and `tsconfig.lint.json` changes are absent or separately justified
  through the existing repository standard.
- Entry criteria: F7A, F7B, and F7C browser reports are green.
- Exit criteria: Franklin's measurable behavior is complete; physical-controller feel remains explicitly nonblocking uncertainty bounded by synthetic standard-gamepad evidence.
- Completion evidence: `./check_codebase.sh` passed strict typecheck, lint typecheck, ESLint,
  Prettier, and 45/45 Node tests. `./build_github_pages.sh` passed (7.3 MB `dist/main.js`), and
  serial `PW_PORT=4174 ./run_playwright_tests.sh --workers=1` passed 31/31 in 8.4 minutes with no
  page or console errors. It includes six complete keyboard/synthetic-gamepad matches, traversal,
  eight combat-state captures, progression/accessibility/input checks, and production endurance.
  The focused F7C rerun passed 1/1 in 1.5 minutes. `npm audit --audit-level=high` reported zero
  vulnerabilities; `source source_me.sh && python3 -m pytest tests/test_markdown_links.py -q`
  passed 39 tests; every local GLB matched its `dist/` copy; and `git diff --check` passed.
  `git diff -- tsconfig.json tsconfig.lint.json` is empty, preserving repository TypeScript
  standards.
- Final execution correction: the F1/F4 rows above preserve the initial `female_31` proposal.
  Runtime presentation uses CC0 Mesh2Motion `female_9` at
  `assets/models/mesh2motion_female_9.glb` (SHA-256
  `9a60dd24d126f0118f4dd84a830495c094dc72b9ae89de122ca685f5a78950f8`) for Franklin. The game
  loads its local role models during startup, so secrecy protects chooser and progression state,
  not model network requests. The retained `female_31` file is not loaded or copied to production.
  The older F8 check that all four character-model GLBs match their source digests records the
  historical build-copy state; it is not the runtime asset manifest. The current build omits
  `male_5`, which remains a source-level rig compatibility fixture.
- Repairs confirmed by final validation: the synthetic debug camera telemetry now resets its
  baseline across the intentional restart snap and keeps a 4.5-unit per-12-tick physical bound;
  live rendered-frame continuity remains below 2.5 units per frame. Live fixture selection now
  confirms the default Warburg choice rather than sending an unintended Left input. A single
  head-anchor sample at y=-29.06 did not reproduce in the focused or two final full-suite runs;
  assertions retain detailed failure context rather than claiming a gameplay repair.
- Residual uncertainty: no physical controller or human-feel session was required. Synthetic
  standard-gamepad parity and measurable input, camera, movement, combat-transition, and endurance
  proxies passed. Projection evidence covers center, feet, and 0 to 2.7 m head anchors rather than
  animated limb extrema; pitch/zoom endpoints are tested separately from maximum separation.
  These limits are nonblocking. The reported Pages deployment applies only to
  `ccaf03d00486d190b2dbe9d01a824da829e437f0`, not this uncommitted local work.
- Parallel-plan ready: no; closure consumes final integrated evidence.

## Workstream breakdown

### Workstream: Role and progression contract

- Goal: implement player-only Franklin pairing and strictly bounded unlock state.
- Owner: combat/progression coder.
- Work packages: F2 role pair; F3 unlock reducer.
- Needs: F1 source and asset contract.
- Provides: typed role vocabulary and browser-independent unlock result for F5A/F6A.
- Review boundary, when modifying the repository: `Match`, pure progression module, debug harness, and focused Node tests.

### Workstream: Presentation and accessible selection

- Goal: expose Franklin only when progression permits it while preserving authoritative combat.
- Owner: engine/UI coder.
- Work packages: F4 role presentation; F5A chooser; F5B announcement/return.
- Needs: F2 role pair, then F3 unlock result.
- Provides: role-resolved visual/HUD state, accessible selection, and a storage-free post-commit
  seam for F6A-F6B.
- Review boundary, when modifying the repository: Babylon presentation, HTML/CSS, application controller, and targeted browser tests.

### Workstream: Integration evidence

- Goal: prove the integrated durable progression path, secrecy, input parity, combat, and long-run
  safety in the production browser after its implementation boundaries are complete.
- Owner: browser-validation tester.
- Work packages: F6C persistence/denial; F6D live role acceptance; F7A secrecy/accessibility; F7B
  progression/input; F7C endurance/captures; F8 closure commands.
- Needs: F5A and F5B production chooser behavior, followed by the F6A storage adapter and F6B
  winner trigger that supply its durable browser state.
- Provides: reproducible acceptance report and ignored screenshot artifacts.
- Review boundary, when modifying the repository: browser fixtures/scripts and documentation evidence
  only. F6A storage implementation remains owned by the engine/UI coder; F6B winner-edge and
  progression-trigger implementation remains owned by the combat/progression coder.

## Work packages

### Work package: Extend valid role pairing

- Owner: combat/progression coder.
- Touch points: role types, `Match.selectPlayer`, round/restart construction, AI assignment, debug snapshot validation, deterministic tests, and the minimal `main.ts` role-name/rig fallback.
- Depends on: F1.
- Acceptance criteria: selecting Franklin is only valid in player slot 0 and creates Warburg AI in slot 1; the new role compiles with the truthful `Rosalind Franklin` name and existing `female_31` rig fallback; the locked chooser remains its existing two-option Warburg/Curie UI; legacy pairing behavior remains identical.
- Evidence or review, when useful: focused deterministic role/reset/restart tests plus independent review of no storage import into `Match`.
- Obvious follow-ons: F3.

### Work package: Reduce persisted unlock progress

- Owner: combat/progression coder.
- Touch points: pure unlock module and Node tests; browser storage remains owned by F6A-F6D.
- Depends on: completed role pairing.
- Acceptance criteria: strict decoding fails closed and two distinct Nobel player match wins
  produce the unlocked reducer result without storage, DOM, or Babylon dependencies.
- Evidence or review, when useful: malformed-record and win-input matrix.
- Obvious follow-ons: F5A and F6A.

### Work package: Map Franklin presentation

- Owner: engine/UI coder.
- Touch points: role-to-rig lookup, material clone, fighter name/HUD lookup, capture/debug probe.
- Depends on: completed role pairing.
- Acceptance criteria: Franklin's selected local GLB supplies a separate rendered root, skeleton,
  and material instances from concurrent Warburg AI, with all current clips; optional palette
  change is accepted only with deterministic capture evidence. Curie's rig compatibility remains
  covered in its own two-role pairing scenario.
- Evidence or review, when useful: Franklin-versus-Warburg rig/material identity assertions,
  separate Curie pairing coverage, and eight state captures.
- Obvious follow-ons: F5A.

### Work package: Gate accessible role chooser

- Owner: engine/UI coder.
- Touch points: chooser DOM/CSS, dynamic role options, focus handling, input edges, help text, and browser accessibility tests.
- Depends on: unlock reducer and presentation mapping.
- Acceptance criteria: pre-unlock DOM exposes two options and no Franklin identity; injected
  fixture state derived by `decodeFranklinUnlock` exposes Warburg, Curie, and Franklin in order;
  keyboard/D-pad/stick navigation wraps consistently; South/Start confirmation observes release
  gates; and gameplay remains paused until valid confirmation. Real storage remains owned by F6A-F6D.
- Evidence or review, when useful: keyboard/D-pad/stick navigation, South/Start release-gate,
  focus-cycle, and strict-decoder-backed locked/unlocked browser fixtures.
- Obvious follow-ons: F5B.

### Work package: Announce unlock and return to fighter selection

- Owner: engine/UI coder.
- Touch points: accessible status announcement, match-over `Change fighter` control, chooser reopen,
  selection focus, and focused browser scenarios.
- Depends on: completed F5A chooser.
- Acceptance criteria: a synthetic post-commit event announces unlock once; repeated events or an
  already-unlocked initial state do not announce; `Change fighter` appears only after match-over,
  preserves a valid selection or falls back to Warburg, pauses combat, and resumes only after
  confirmation. F5B does not read browser storage.
- Evidence or review, when useful: event-count, live-region, match-phase, focus, pause, and resume assertions.
- Obvious follow-ons: F6A.

### Work package: Bound browser storage

- Owner: engine/UI coder.
- Touch points: application-controller storage adapter, startup record decode, write result contract,
  and focused browser failure fixtures.
- Depends on: completed F5B return and announcement boundary.
- Acceptance criteria: only the adapter reads or writes the versioned record; missing, malformed,
  unsupported, unreadable, and thrown read/write cases fail closed to a playable two-role session.
  Neither F5A nor F5B imports browser storage.
- Evidence or review, when useful: strict decoder startup matrix and denied-storage browser tests.
- Obvious follow-ons: F6B.

### Work package: Consume complete match wins once

- Owner: combat/progression coder.
- Touch points: application controller winner edge, reducer call, durable-write result, F5B internal
  commit seam, playtest-only fixture hook, and deterministic/browser tests.
- Depends on: completed F6A storage boundary.
- Acceptance criteria: only a completed player Nobel-role victory changes progress; each match is
  consumed once; F5B receives a commit notification only after a changed `localStorage.setItem`
  succeeds. The local hook exists only in `playtestMode`.
- Evidence or review, when useful: winner eligibility and repeated-render/tick/restart matrix.
- Obvious follow-ons: F6C.

### Work package: Prove durable and denied progression

- Owner: browser-validation tester.
- Touch points: serial production-browser fixtures for both win orders, reload, decoded unlocked
  startup, and denied storage.
- Depends on: completed F6B winner trigger.
- Acceptance criteria: both win orders persist the second victory, reload silently when already
  unlocked, and denied reads/writes remain locked and playable without page or console error.
- Evidence or review, when useful: durable-record and live-region event-count report.
- Obvious follow-ons: F6D.

### Work package: Accept Franklin live-role input

- Owner: browser-validation tester.
- Touch points: unlocked chooser, keyboard/synthetic-gamepad fixtures, live Franklin and Warburg
  match scripts, round/restart assertions, and browser error collection.
- Depends on: completed F6C persistence/denial scenarios.
- Acceptance criteria: keyboard and synthetic standard-gamepad select Franklin, Franklin can win,
  Warburg AI can win, and the selected role persists through round and both restart routes.
- Evidence or review, when useful: serial complete-match result and console/page-error report.
- Obvious follow-ons: F7A, F7B, and F7C.

### Work package: Run progression acceptance matrix

- Owner: browser-validation tester.
- Touch points: Playwright scenarios, capture script, ignored evidence paths, closure documentation.
- Depends on: F6D live role acceptance.
- Acceptance criteria: F6A-F6D plus F7A/F7B/F7C matrices pass serially against a production build
  with no page or console errors.
- Evidence or review, when useful: persisted artifact manifest and serial test report.
- Obvious follow-ons: F8.

## Acceptance criteria and gates

- Per-patch gate: run the narrow Node/browser tests for the touched ownership boundary, strict TypeScript/lint checks when source changes, and `git diff --check`.
- Integration gate: F6A-F6D must prove the bounded storage adapter, winner-only unlock, both win
  orders, the single post-write announcement, silent already-unlocked reload, fail-closed storage
  read/write behavior, and live role/input path before F7A/F7B/F7C expand evidence coverage.
- Secrecy gate: before unlock, Franklin has no chooser text, role value, selectable element, or
  newly unique asset request. After a valid unlock and reload, exactly one accessible option
  appears. This is ordinary UI/presentation concealment only; it is not a tamper-resistant or
  anti-cheat boundary because client-side code and `localStorage` are inspectable and mutable. This
  gate recognizes existing shared `female_31` asset requests as expected.
- Completion gate: F8 requires repository checks, production build, serial browser suite, audit,
  the explicit local-link and GLB identity commands, and documentation evidence. A failed gate
  blocks the dependent milestone and produces a narrow failure report before repair; it never
  becomes a human sign-off request.

## Test and verification strategy

- Unit: strict-decoder and reducer matrices, valid role pairing, reset/restart preservation, and winner-only event eligibility.
- Browser UI: chooser option count/absence, dynamic Warburg-to-Curie-to-Franklin order,
  focus containment and initial focus, exactly-once post-write announcement, silent
  already-unlocked reload, `Change fighter`, keyboard/D-pad/stick navigation parity,
  South/Start release-gate parity, storage failures, and reload.
- Browser simulation: debug-force every role/state, verify all Franklin clip choices, root-transform agreement, HUD/ARIA identity, and no presentation authority leak.
- Live acceptance: run both complete-win orders, Franklin-versus-Warburg player and AI wins, both input devices, all match phases, restart during and after match-over, and console/page error collection.
- Endurance: use a fixed random seed plus long idle and rapid/opposed-input traces; assert finite values, legal phases, bounded health/wins, one hit per swing, recovery completion, camera continuity, fighter visibility, and restart correctness.
- Artifact evidence: capture idle, move, light, heavy, block, hit, down, and get-up with zero browser errors. Capture presence proves the workflow, while automated state/clip assertions determine success.

## Risk register

| Risk                                              | Impact                                              | Trigger                                             | Owner                    | Mitigation                                                                                                                |
| ------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Storage shape drifts or is corrupted              | Hidden role leaks or false unlock                   | Decoder accepts malformed/unknown data              | progression coder        | Version one small record, reject unknown values, default locked, cover malformed matrix.                                  |
| Storage is unavailable                            | False unlock or unusable game                       | Browser read/write exception                        | engine/UI coder          | Catch adapter failures, default the session to locked, leave the two-choice game playable, and test denied reads/writes.  |
| Winner signal fires more than once                | Duplicate announcement or corrupted progress        | Repeated render/tick at match-over                  | progression coder        | Reduce idempotently by role, consume each completed match once, and announce only after the successful second-role write. |
| Shared female asset compromises secrecy assertion | False test failure or unjustified asset duplication | Curie already requests `female_31`                  | browser tester           | Assert role/DOM/request absence before unlock, not absence of the shared GLB.                                             |
| Palette change is unreadable                      | Fighter identity becomes unclear                    | Capture/material probe lacks stable differentiation | engine/UI coder          | Use cloned materials only when measured; fall back to truthful HUD identity.                                              |
| Role extension breaks existing pairings           | Regression in Curie/Warburg matches                 | Focused role or live suite fails                    | combat/progression coder | Preserve legacy default and existing tests; repair direct pair logic before UI work.                                      |
| Scope grows into a roster                         | Delayed first-playable progression                  | Additional fighter/opponent/ability concepts appear | integrator               | Keep all Franklin paths player-only against Warburg and reject generalized contracts.                                     |

## Rollout and release checklist

- [x] Complete F1 source, license, and asset record.
- [x] Land and verify F2 deterministic role contract.
- [x] Land and verify F3 pure progression reducer.
- [x] Land and verify F4 role presentation.
- [x] Land and verify F5A dynamic accessible chooser.
- [x] Land and verify F5B match-over return and announcement.
- [x] Run F6A storage adapter boundary checks.
- [x] Run F6B complete-match progression trigger checks.
- [x] Run F6C persistence and denied-storage browser scenarios.
- [x] Run F6D live role and input acceptance scenarios.
- [x] Run F7A secrecy/accessibility evidence.
- [x] Run F7B progression/input evidence.
- [x] Run F7C endurance/capture evidence, including the camera visibility fix path.
- [x] Run F8 repository/build/audit/hash/local-link checks and record results.
- [x] Keep Pages deployment evidence tied to the exact deployed commit; do not equate a prior deployment with uncommitted work.

## Documentation close-out requirements

- Active plan / progress tracker: mark each F1-F4, F5A-F5B, F6A-F6D, F7A-F7C, and F8 row complete
  only beside its command/test evidence; when the plan is complete and no longer active, move it with `git mv` to
  `docs/archive/franklin_secret_fighter.md`.
- `docs/CHANGELOG.md` entry: summarize Franklin unlock behavior, source/provenance, and final automated evidence.
- `docs/HUMAN_GUIDANCE.md`: preserve only new direct user guidance that changes the plan boundary.
- `docs/DESIGN_DECISIONS.md`: record any settled storage or material-fallback decision using its required Decision/Why/Consequence/Owner fields.
- Source documentation: add a Franklin dossier only if implementation adds a move or historical explanatory cue; the current standard-kit plan needs no speculative dossier.

## Patch plan and reporting format

- Patch F2: deterministic Franklin role pair and regression tests.
- Patch F3: pure versioned unlock reducer, strict decode, and focused tests.
- Patch F4: role-resolved rig/material/HUD mapping and deterministic state evidence.
- Patch F5A: strict-decoder-backed locked/unlocked chooser fixtures, dynamic input parity, and
  release-gate tests.
- Patch F5B: post-commit unlock announcement, match-over `Change fighter`, and pause/resume tests.
- Patch F6A: versioned storage adapter, startup decode, and fail-closed browser storage tests.
- Patch F6B: once-per-match winner edge, durable write, and post-commit seam tests.
- Patch F6C: both win-order persistence, silent reload, and denied-storage browser tests.
- Patch F6D: live Franklin keyboard/synthetic-gamepad selection, role persistence, and player/AI
  match acceptance.
- Patch F7A: secrecy, chooser order, accessibility, announcement, and release-gate fixtures.
- Patch F7B: live progression, persistence, role-play, and input acceptance fixtures.
- Patch F7C: parity, camera/endurance, and capture acceptance fixtures.
- Patch F8: repository checks, production build, audit/hash/link evidence, and documentation closeout.

Each report names the patch, owned files, commands run, observable results, discovered problem and
repair, and the next dependency. Reports distinguish a new local passing result from historical
Pages evidence.

## Open questions and decisions needed

- Manager/subagent decision procedure:
  - Decision owner or dedicated class: engine/UI coder owns the cloned palette decision; integrator reviews the capture/probe evidence.
  - Evidence and decision rule: retain a distinct palette only when deterministic render evidence shows independent material instances and a stable visual difference without asset or console error. Otherwise retain the shared placeholder and HUD identity; no user decision is required.
- Non-blocking follow-up: a later historically sourced Franklin move can be proposed only after the standard-kit unlock is complete and its direct source basis, gameplay limit, and deterministic contract are documented. It is outside F1-F8. The client-side unlock is ordinary UI/presentation concealment, not tamper-resistant anti-cheat protection.
