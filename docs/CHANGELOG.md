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

### Fixes and Maintenance

- Kept get-up active for 18 simulation ticks so recovery is visible and the fighter cannot act during it.
- Tightened adaptive camera framing to make the fighters larger on screen without changing gameplay size.
- Repaired a dangling mesh reference in the trimmed animation GLB and limited animation target lookup to skeleton nodes, resolving two browser asset-load errors.
- Ignored generated browser evidence and Python bytecode alongside the production build directory.
- Extended the lint type-check input list with `src/**/*.ts` while retaining the original tests and tools targets.
- Retired the generated humanoid direction after visual evidence showed it was unsuitable for the
  requested recognizable-human milestone.

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
  silhouette does not meet the requested anatomically proportioned adult-human target. Its
  provenance remains comparison evidence until replacement cleanup.
- Deferred Warburg and all other Nobel-character work until the selected generic human replacement
  passes its automated visual and gameplay checks.
