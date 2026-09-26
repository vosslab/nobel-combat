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
- Keep visible meshes separate from gameplay hit geometry. Keep retargeting specific to each body.
  The planned 25-fighter game demonstrates the need for a shared roster and appearance kits.
- Use the Pause/Resume button, P, or Space to freeze a useful combat pose for screenshots. Keep
  orbit, tilt, and zoom controls available while the fighters are paused.
- Capture deterministic state screenshots as artifacts and validate asset load, skeletons, animation
  selection, and browser behavior automatically; human visual approval is not a completion gate.
- Otto Heinrich Warburg is the signature and deliberately strongest fighter, with powers based on
  cellular respiration, tumor metabolism, and the Warburg effect. Rosalind Franklin is a secret
  unlockable fighter.
- Always use Otto Heinrich Warburg's full name; Heinrich is important.
- Give Marie Curie a visibly distinct feminine face without facial hair; her current hairstyle is
  acceptable.
- For Barbara McClintock's 1947 appearance, keep her clean-shaven, with short swept dark hair,
  small round glasses, and a light laboratory coat.
- Marie Curie should wear period-appropriate clothing, not modern female street clothes.
- Make Nobel Combat fun and silly, not an educational product. Research should make the humor
  recognizable; a player who gets curious and reads more about a scientist is a bonus.
- Build the full 25-fighter roster: the three existing fighters plus 22 laureates. Six fighters
  start available; unlock the others through a thematic win tree.
- Keep controls simple: release charged special attacks with one button, without motion inputs or
  button chords.
- Use recognizable caricatures and distinct fighting identities based on real Nobel-related work.
  Keep room for unusual character-specific ideas when they make the joke or fighter stronger.
- Use web image search to find laureate photos; include `young <name>` when an early-career look may
  help, then verify a chosen image's identity and date against a reliable source and record supported
  appearance cues in the source dossier.
- Reuse some adult CC0 bodies with appearance kits and give other fighters uniquely selected
  CC0 bodies. Keep visual meshes separate from authoritative combat state and hit geometry.
- Keep roster implementation and automated acceptance free of human-dependent completion gates.
- Keep `docs/proposed-combat-roster.md` as the temporary roster filename. Publish the implemented
  roster as `docs/ACTIVE_COMBAT_ROSTER.md` when it is complete.
- Fix the design that allowed incorrect behavior. Use a narrow fallback or special case only when
  it is part of the intended design.
- Prefer durable long-term changes. While the codebase is pre-production, improve foundational
  schemas, contracts, abstractions, and ownership boundaries when they make the system stronger.
- Apply KISS aggressively. Add mechanisms, abstractions, policies, state, and tests only for a
  demonstrated need.
- Add visual arena detail only when it stays quiet and does not compete with the fighters.
- On macOS, run Chromium-backed captures outside the sandbox with escalation. Use the repository
  candidate capture command for both roster positions; a script cannot grant itself that access.
- Use one [NEW_CHARACTER_RECIPE.md](NEW_CHARACTER_RECIPE.md) checklist for every new fighter lane
  so subagents repeat the sourced appearance, authoring, capture, and review steps.
- Keep fighter authoring scripts and handoffs in tracked repository paths so agents can find and
  graph the work; keep generated GLBs and capture images in ignored repo-local scratch.
- Keep the visual and rig bar steady: reject technically sound but generic candidates, preserve
  accepted models and their provenance, and keep independent model lanes moving in parallel.
- Prefer the richest compatible licensed body models that pass in-game review. Preserve useful
  donor mesh and material detail while adapting rigs; use screenshots at gameplay scale to decide.
- Aim for recognizable caricatures rather than photorealism. Match face shape and hair silhouette
  first, adding glasses and other strong identity cues where appropriate; at gameplay scale, I can
  be more tolerant of clothing and body-shape differences.
- Treat a detailed donor as starting material, not a finished fighter. Use a bounded source-only
  proof and paused close views to reject weak face or appearance directions before clothing,
  rigging, or full gameplay capture; retire failed source lines instead of patching them indefinitely.
- Favor adaptable foundations that can evolve as requirements change, but do not let a search for
  perfection delay a system that already meets the actual need.
- Let the established review pipeline increase playable fighter throughput. Move a source that
  passes the necessary gates toward a complete FighterDef with body, specials, captions, AI, and
  unlocks; extend review machinery only when a concrete new failure shows a gap.
- Use small experiments, comparisons, and measurements before committing to uncertain appearance
  methods. Spend review effort on decisions that affect fighter quality, correctness, maintenance,
  validation, or delivery rather than minor presentation details.
- Treat a painted face bitmap and mapped hair geometry as a bounded source experiment. They may
  reinforce cues on a compatible detailed head, but do not substitute for face geometry when
  front and three-quarter review still reads as the donor.
- Keep the browser game and ordinary authoring previews light on 3D load. Retain a native
  high-resolution source offline when useful, but reduce the mesh before repeated color review,
  rigging, or browser capture; use bounded, vectorized diagnostics and serialize heavyweight
  offline jobs under one owner.
- Keep generated Python bytecode visible rather than ignored. Run Python through `source_me.sh`
  with `PYTHONDONTWRITEBYTECODE=1`, and use in-memory syntax checks instead of `py_compile` or
  `compileall`, which write `.pyc` files by design.
- Use Curie and Warburg as the fidelity anchor: a decent human head plus the right hair, glasses,
  age, facial-hair cues, clothing, and silhouette can make a fun, recognizable caricature. Compare
  the simplest cleaned-up donor against elaborate face work at ordinary gameplay scale before
  investing further. Photo-to-3D and face-generation work remain bounded experiments, not the
  roster's assumed production route.
