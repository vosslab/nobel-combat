# Human guidance

<!-- VENDORED HEADER: START -->

Record the durable guidance Neil Voss states, or approves for preservation here, in his own words:
first person or close paraphrase, one to three lines per bullet. Material he supplies as a source
may inform [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) once it is settled, and an entry of uncertain
origin belongs there too. Rules: [REPO_STYLE.md](REPO_STYLE.md).
[PROPAGATED HEADER - ENTRIES BELOW ARE YOURS]
<!-- VENDORED HEADER: END -->

- Keep combat state and gameplay geometry authoritative as fighter appearances evolve. Verify
  complete matches with automated keyboard and gamepad checks.
- Plans must have no human-dependent completion gates. Managers and subagents need captured
  fixtures, synthetic transitions, debug harnesses, and automated behavior checks to finish
  unattended.
- Prefer more, smaller milestones with clear outcomes, dependencies, and recovery paths over broad milestones.
- Treat human play feel and physical-controller observations as non-blocking uncertainty; use
  measurable automated proxies and turn later observations into reproducible bug fixtures.
- Let the player change the camera view; keep movement camera-relative after orbiting.
- Make the fighters larger on screen while keeping both visible during crossings and separation.
- Use open-license rigged adult-human assets rather than procedural character geometry. Require
  human anatomical proportions; simplified older-Tekken-like rendering is acceptable, while blocky,
  chibi, voxel, Roblox-like, and exaggerated cartoon proportions are not.
- Evaluate MakeHuman, MB-Lab, and credible already-rigged open assets before selecting the source.
  Treat Mixamo-compatible skeletons and animations as a practical interoperability preference.
- Keep compatibility fixtures out of production builds; do not return to the chunky Quaternius look.
- Keep visible meshes separate from gameplay hit geometry. Do not build a generalized retargeting
  framework, roster, or customization system without a demonstrated need.
- Capture deterministic state screenshots as artifacts and validate asset load, skeletons, animation
  selection, and browser behavior automatically; human visual approval is not a completion gate.
- Otto Heinrich Warburg is the signature and deliberately strongest fighter, with powers based on
  cellular respiration, tumor metabolism, and the Warburg effect. Rosalind Franklin is a secret
  unlockable fighter.
- Always use Otto Heinrich Warburg's full name; Heinrich is important.
- Give Marie Curie a visibly distinct feminine face without facial hair; her current hairstyle is
  acceptable.
- Marie Curie should wear period-appropriate clothing, not modern female street clothes.
