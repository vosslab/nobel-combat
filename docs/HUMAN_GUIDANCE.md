# Human guidance

<!-- VENDORED HEADER: START -->
Record the durable guidance Neil Voss states, or approves for preservation here, in his own words:
first person or close paraphrase, one to three lines per bullet. Material he supplies as a source
may inform [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) once it is settled, and an entry of uncertain
origin belongs there too. Rules: [REPO_STYLE.md](REPO_STYLE.md).
[PROPAGATED HEADER - ENTRIES BELOW ARE YOURS]
<!-- VENDORED HEADER: END -->

- Build the first playable as Red Dummy versus Blue Dummy before Nobel content; test a complete fight with keyboard and gamepad.
- Plans must have no human-dependent completion gates; managers and subagents need captured fixtures, synthetic transitions, debug harnesses, and automated behavior checks to finish unattended.
- Prefer more, smaller milestones with clear outcomes, dependencies, and recovery paths over broad milestones.
- Treat human play feel and physical-controller observations as non-blocking uncertainty; use
  measurable automated proxies and turn later observations into reproducible bug fixtures.
- Let the player change the camera view; keep movement camera-relative after orbiting.
- Make the fighters larger on screen while keeping both visible during crossings and separation.
- Stop procedural character geometry. Use an existing open-license rigged humanoid asset instead.
- Human anatomical proportions and silhouette are required. Simplified older-Tekken-like rendering
  is acceptable; blocky, chibi, voxel, Roblox-like, or exaggerated cartoon proportions are not.
- Evaluate MakeHuman, MB-Lab, and credible already-rigged open assets before selecting the source.
  Treat Mixamo-compatible skeletons and animations as a practical interoperability preference.
- Keep visible meshes separate from gameplay hit geometry. Do not create a Nobel character,
  retargeting framework, roster, or customization system for this visual milestone.
- Capture deterministic state screenshots as artifacts and validate asset load, skeletons, animation
  selection, and browser behavior automatically; human visual approval is not a completion gate.
