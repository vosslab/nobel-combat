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

### Generic adult-human presentation asset

**Decision.** Use the CC0 Mesh2Motion `male_5` GLB with Mesh2Motion's direct same-rig base and
addon animation libraries for the generic Red and Blue fighters. The vendored source is commit
`3ce7f9d97d25e608b4779ce797da343775ded62b`; exact paths, license link, and SHA-256 digests are in
[`assets/README.md`](../assets/README.md).

**Why.** The model has an adult human silhouette, a local GLB loading path, and compatible clips on
the same skeleton. The comparison rejected Quaternius for its chunky low-poly silhouette and
rejected the Vitruvian body plus external-clip experiment because it required unreliable retargeting.

**Consequence.** `Match` remains independent of meshes, bones, and clips. Rendering can only observe
fighter state. Red and Blue must each receive independent skeleton, material, and animation-group
instances. A later visual source change repeats the local-load and state-animation browser checks.

**Owner.** `src/rigged_fighter.ts`, `assets/README.md`, and
`docs/active_plans/active/first_nobel_fighter.md`.

### Camera framing protects readable fighters

**Decision.** Frame the adaptive camera more tightly while preserving a separation-dependent radius
for the farthest valid fighter positions.

**Why.** Fighters need a larger, more readable screen presence, including during attacks and hit
states. A fixed tight radius would crop them at maximum practical separation.

**Consequence.** Camera tests cover crossing, circling, edge movement, and maximum separation. View
controls stay available and player movement remains camera-relative.

**Owner.** `src/main.ts` and browser traversal fixtures.

### Warburg starts the Nobel roster

**Decision.** Make Otto Warburg the first research-based fighter and signature character after the
generic fighter foundation. Use a locally vendored, same-rig adult scientist model. Make Warburg
stronger than the standard AI opponent through explicit character-specific combat rules.

**Why.** This follows the game's scientific theme and the requested roster direction. Warburg's
respiratory-enzyme research, tumor-metabolism work, and the later-named Warburg effect offer distinct
sources for moves without inventing a general ability framework.

**Consequence.** Preserve deterministic 60 Hz simulation and keep character rules explicit until a
second real fighter demonstrates a need for shared roster data. Attribute his 1931 Nobel Prize to
the respiratory enzyme; describe tumor-metabolism and aerobic-glycolysis powers as game adaptations,
not as the award citation or a cancer-treatment claim.

**Owner.** `docs/active_plans/active/first_nobel_fighter.md`, `docs/WARBURG_SOURCE_DOSSIER.md`, and
the existing Match/rig boundaries.
