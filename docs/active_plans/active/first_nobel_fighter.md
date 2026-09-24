# Plan: Anatomically proportioned humanoid asset experiment

## Context

The deterministic Red-versus-Blue fight is already the authority for movement, combat, rounds,
AI, camera, input, and restart. Visual character work has an unresolved failure: procedural and
Quaternius candidates do not meet the requested adult-human silhouette. The problem is asset
selection, not character construction. This plan performs a bounded, automated comparison before
committing the game to any humanoid source.

## Objectives

- Select an open-license, rigged adult human asset with natural anatomical proportions and a local
  Babylon.js loading path.
- Prove one selected candidate can stand, idle, walk, and punch from vendored local files.
- Keep `Match` and `Fighter` authoritative throughout the experiment.
- Produce an unattended decision record and an implementation-ready follow-on plan for two fighters.

## Design philosophy

Use the repository's scientific-method principle: compare a small number of credible assets on the
actual Babylon loading path before choosing one. The visual target accepts simplified rendering but
requires adult human proportions and a readable human silhouette. Blocky, chibi, voxel,
Roblox-like, or exaggerated cartoon candidates fail that target even when their technical pipeline
works.

## Scope

- Compare MakeHuman-exported, MB-Lab-exported, and one credible already-rigged open-asset candidate.
- Record license, source URL, model format, skeleton details, polygon cost, animation compatibility,
  local Babylon load result, and rest-pose proportion metrics for each candidate.
- Vendor only temporary evaluation copies needed for the comparison and record their provenance.
- Run a one-human local asset experiment for the selected candidate: neutral standing pose, idle,
  walk, and punch.
- Capture deterministic browser screenshots and machine-readable skeleton, bounds, and animation
  metadata as evidence.
- Write a narrow follow-on plan for dual instances and combat-state synchronization after the
  experiment passes.

## Non-goals

- Do not construct, model, or rig procedural humans.
- Do not adopt Quaternius merely because its package is easy to automate.
- Do not change combat rules, hit geometry, AI, camera behavior, HUD, input mapping, or match state.
- Do not add retargeting frameworks, character customization, roster infrastructure, or Nobel fighters.
- Do not use manual viewing, physical hardware, or human approval as a completion gate.

## Current state summary

The repository contains a Quaternius comparison candidate and loader work from the previous visual
direction. It is evidence only: the user rejected its chunky low-poly visual language. Any existing
Quaternius vendored files remain isolated until a selected replacement passes the experiment; the
replacement patch then removes the rejected runtime path and its unused assets. No final humanoid
asset is selected.

The automated match and browser fixtures are the unchanged behavior baseline. They must continue to
exercise combat independently of visual meshes and skeletons.

## Architecture boundaries and ownership

`Match` and `Fighter` own gameplay state. Babylon presentation reads that state; visible geometry,
skeletons, and clips cannot write combat state or alter gameplay collision. Asset evaluation owns
only local source files and the experiment harness. A later dual-fighter patch may map concrete
combat states to concrete clips, after the chosen asset demonstrates that path.

### Mapping (milestones / workstreams -> components / patches)

| Milestone / Workstream | Component | Review boundary |
| --- | --- | --- |
| H1 candidate inventory | `assets/`, provenance record | Asset source, license, and evidence only |
| H2 local load experiment | Babylon loader and debug snapshot | One human, no gameplay changes |
| H3 animation experiment | Explicit idle/walk/punch selection | Presentation reads state only |
| H4 selection closure | Active plan and records | Decision evidence and cleanup boundary |
| H5 follow-on planning | Dual-instance plan | No implementation before H4 passes |

## Milestone plan

| M | Title | Summary | Goal |
| --- | --- | --- | --- |
| H1 | Candidate inventory | Compare three viable adult-human asset paths. | Establish evidence without selecting by assumption. |
| H2 | One-human local load | Load the leading candidate from vendored files. | Prove Babylon and skeleton compatibility. |
| H3 | Minimal motion evidence | Run idle, walk, and punch on one human. | Prove an animation path before dual-instance work. |
| H4 | Selection closure | Record the evidence-led result and retire failed candidates. | Select one source or document a bounded retry. |
| H5 | Dual-fighter handoff | Create the concrete follow-on work packages. | Keep the next implementation task dispatchable. |

### H1: Candidate inventory

- Depends on: none.
- Deliverables: A comparison record for MakeHuman, MB-Lab, and one already-rigged open-license
  adult-human candidate, including source URL, license, export or download method, glTF/GLB
  availability, skeleton naming, vertex/triangle count, animation path, local file size, and
  rest-pose landmark measurements.
- Done checks: Every candidate has an unattended acquisition path, an explicit license compatible
  with vendoring, and a reproducible metadata probe. The probe maps head, shoulder, hip, knee, and
  ankle landmarks and rejects a rest pose without two arms, two legs, a head, and a trunk. It records
  head-to-stature, shoulder-to-stature, and hip-to-ankle-to-stature ratios so the selection uses
  reproducible adult-human geometry rather than an approval gate. Quaternius is recorded as rejected
  comparison evidence because its silhouette misses the target.
- Entry criteria: none.
- Exit criteria: At least one candidate is suitable for H2 under the stated selection rule.
- Parallel-plan ready: yes; three independent candidate records, maximum three workstreams. Shared
  comparison-table editing has one integration owner.

### H2: One-human local load

- Depends on: H1, because the selected evaluation candidate determines file format and provenance.
- Deliverables: One vendored evaluation asset, a local Babylon load path, and a debug snapshot with
  load completion, skeleton count, joint names, finite root transform, bounds, and material count.
- Done checks: A production-style local build and browser fixture load the asset without network
  requests, page errors, or Babylon errors. The root has finite transform values and a non-empty
  skeleton.
- Entry criteria: H1 selection rule identifies a leading candidate.
- Exit criteria: The candidate satisfies all H2 checks.
- Parallel-plan ready: no; the exact local asset and loader contract must be known first.

### H3: Minimal motion evidence

- Depends on: H2, because animations must target the verified local skeleton.
- Deliverables: An explicit, small mapping from the selected asset's clips or compatible imported
  clips to `idle`, `move`, and `light`; deterministic screenshots for standing, idle, walk, and
  punch; a clip-transition trace.
- Done checks: Browser automation starts every mapped action, observes an active clip transition,
  confirms the visual root remains finite and follows the authoritative fighter position, and reports
  no page or Babylon errors. The gameplay trace is identical with the visual disabled.
- Entry criteria: H2 passes.
- Exit criteria: Every minimal action has a concrete clip or a documented, intentional fallback.
- Parallel-plan ready: no; the mapping is specific to the selected skeleton.

### H4: Selection closure

- Depends on: H3, because the final decision requires real loading and motion evidence.
- Deliverables: A selected-asset provenance record, comparison result, SHA-256 digest, license link,
  and an explicit note about Mixamo-compatible skeleton/animation interoperability where supported.
- Done checks: The selected asset satisfies the selection rule: a rest-pose skeleton with two arms,
  two legs, head, and trunk; head-to-stature in 10-20%, shoulder-to-stature in 15-35%, and
  hip-to-ankle-to-stature in 40-60%; permissive vendorable license; local Babylon skeleton load;
  idle, walk, and punch; and no combat dependency on visual data. Failed candidate files are removed
  only after the replacement is validated.
- Entry criteria: H3 passes.
- Exit criteria: A concrete asset source and follow-on clip source are recorded without a runtime
  downloader.
- Parallel-plan ready: no; one owner integrates the evidence record.

### H5: Dual-fighter handoff

- Depends on: H4, because cloning and full combat-state mapping depend on the chosen rig.
- Deliverables: A small implementation plan whose milestones are: dual independent instances;
  red/blue material distinction; remaining combat-state map; automated state synchronization;
  browser/endurance rerun; cleanup.
- Done checks: Each milestone has one owner, dependency, files, automated validation, recovery
  action, and no human completion gate.
- Entry criteria: H4 closes with a selected asset.
- Exit criteria: The first dual-instance work package is dispatchable without a product decision.
- Parallel-plan ready: no; it is a serial planning handoff.

## Acceptance criteria and gates

- H1 passes only when every candidate is compared against the same recorded criteria. A license,
  local-load, or silhouette failure rejects the candidate.
- H2 passes only with a local, successful Babylon load and a populated skeleton snapshot.
- H3 passes only with automated idle, walk, and punch transitions and unchanged deterministic combat
  traces while presentation is disabled.
- H4 passes only when a candidate satisfies H1-H3. There is no visual-human approval gate.
- If no candidate passes H2-H3, close the experiment with its evidence and start another bounded
  candidate inventory; do not start dual-instance or full combat animation work.

## Test and verification strategy

- Use temporary metadata probes for source comparison, clip enumeration, skeleton inspection, and
  screenshots; retain only tests that protect durable contracts after selection.
- Keep permanent behavior tests for local asset loading, valid skeleton presence, independent future
  instances, explicit animation-state mappings, and presentation independence from `Match`.
- Run the existing deterministic match, input-parity, camera traversal, browser scenario, randomized
  endurance, production build, and dependency-audit checks unchanged after any loader integration.
- Store screenshot paths and trace summaries as artifacts, not as approval requests.

## Risk register

| Risk | Impact | Trigger | Owner | Mitigation |
| --- | --- | --- | --- | --- |
| Candidate lacks a vendorable license | Blocks use | License cannot be verified | Asset evaluator | Reject at H1 and retain only comparison metadata. |
| Candidate has no usable animation path | Delays mapping | No compatible idle/walk/punch clips | Animation evaluator | Test a compatible clip source in H3; reject if it requires a generalized retargeting system. |
| Rig fails in Babylon | Blocks presentation | H2 skeleton or loading error | Rendering owner | Fix local format only once; otherwise reject and return to H1. |
| Scope expands into character creation | Delays playable game | New modeling or rigging work proposed | Integration owner | Enforce this plan's non-goals and select an existing asset. |
| Rejected Quaternius path leaks into runtime | Incorrect visual result | Active loader/build references it after H4 | Integration owner | Remove unused runtime references and vendor files in the selected replacement patch. |

## Documentation close-out requirements

- Record user visual guidance in `docs/HUMAN_GUIDANCE.md`.
- Record the selected source boundary, only after H4, in `docs/DESIGN_DECISIONS.md`.
- Record the comparison outcome and any rejected visual direction in `docs/CHANGELOG.md`.
- Update `README.md` only when the selected runtime asset is integrated; until then it must state that
  the humanoid replacement is under evidence-led evaluation.

## Open questions and decisions needed

- Manager/subagent decision procedure: select the simplest candidate that meets the H1-H3 gates. A
  candidate with an open source but no usable local skeleton or minimal animation path loses to a
  slightly less convenient candidate that passes all gates.
- Mixamo compatibility is a practical interoperability preference, not a reason to add retargeting.
  Record it if demonstrated by the chosen asset; otherwise preserve direct compatible clips only.
- The next implementation decision is deliberately deferred until H4: whether to clone the selected
  mesh with shared skeleton data or load two independent skeleton instances. The choice needs actual
  asset evidence.
