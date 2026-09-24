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

### Realistic humanoid asset-selection boundary

**Decision.** Do not select Quaternius as the game character source. Use a bounded comparison of
MakeHuman, MB-Lab, and an already-rigged open asset to select an anatomically proportioned adult
human that loads locally in Babylon.js and demonstrates idle, walk, and punch before dual-fighter
integration.

**Why.** The Quaternius candidate's blocky low-poly silhouette conflicts with the requested visual
target. Asset selection is unresolved; committing the runtime to a technically convenient source
would lock the game into the wrong presentation direction.

**Consequence.** Existing Quaternius files are comparison evidence only and must not be described as
the selected runtime asset. The selected future source records its exact license, source URL,
vendored digest, local loading result, and animation path. `Match` remains independent of all mesh,
bone, and animation data.

**Owner.** `docs/active_plans/active/first_nobel_fighter.md`; final implementation ownership is
assigned only after the H1-H4 experiment closes.
