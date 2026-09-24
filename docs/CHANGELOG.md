# Changelog

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
- Started the first Nobel-fighter milestone: Otto Warburg is the signature, deliberately stronger
  fighter; the active plan covers his local scientist model, research-based moves, and automated
  acceptance before the next roster step.
- Integrated the vendored CC0 Mesh2Motion `doctor_m` scientist model for Otto Warburg while keeping
  `male_5` as the independently animated AI opponent. The HUD and browser identity now name the
  Warburg-versus-AI match.
- Made Warburg's Oxygen Transfer heavy faster and stronger than the standard AI heavy, and added
  fixed-tick Lactate Drive and Aerobic Glycolysis moves with explicit cooldown and controller-chord
  rules. Combat remains independent of rendering.
- Corrected hit resolution so a newly struck fighter receives the full hit-stun or knockdown duration
  regardless of fighter update order.
- Added the complete CC0 1.0 legal text and mapped source code and vendored Mesh2Motion assets to
  their respective licenses from the root README.

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

### Developer Tests and Notes

- `npm install @babylonjs/core` completed with a writable npm cache; dependency audit reported zero vulnerabilities.
- `./build_github_pages.sh`, focused combat checks, and six complete browser matches passed (three keyboard, three gamepad, including player and AI victories).
- Browser traversal checks crossed the opponent, reached arena edges, exercised light and block, and restarted with both devices; projected fighter centers remained on screen and no page errors were reported.
- R and gamepad Start also restarted completed matches to round one with full health and zero wins.

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
