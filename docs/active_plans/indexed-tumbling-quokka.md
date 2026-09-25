# Plan: Expand the Nobel Combat roster to 22 new laureates

## Context

`docs/proposed-combat-roster.md` is the temporary source for 22 new laureate fighters. Each one has a modeling
reference, a combat verb, and three ridiculous special attacks riffing on the laureate's
prize-winning research.

### Game identity and design intent

Decision test for every later choice in this plan: **does this make Nobel Combat more fun,
distinctive, and absurd, while keeping the scientific connection recognizable?** Nothing is judged
by whether it teaches anything.

Nobel Combat is a fun, silly fighting game built around Nobel laureates and exaggerated
attacks inspired by their scientific work. It is not meant to teach the science. The research
supplies recognizable themes, jokes, visual ideas, and absurd finishing moves. Scientific
grounding matters because it makes the joke better. If a player wonders what a 50S ribosomal
subunit is after Steitz drops one on them, or reads more about a scientist, that is a bonus, not a
design requirement.

### Why the code must change

The game ships three fighters: Warburg, Curie, and Franklin. None of them is data-driven:

- Role unions and `role ===` branches appear in about 8 source files: `match.ts`, `main.ts`,
  `ai.ts`, `debug_harness.ts`, `rigged_fighter.ts`, `playtest_probe.ts`, `index.html`, and
  `style.css`.
- Specials are one-off `Fighter` fields (`lactateDrive*`, `aerobic*`, `separationStep*`) triggered
  by J+K and J+L chords.
- Models load as a fixed three-model tuple, one instance per role, so a mirror match is impossible.
- Unlock progress is a Franklin-only v1 record.
- `main.ts` has 826 lines and `agent_scenarios.mjs` has 907, near the 1000-line limit.
- `docs/DESIGN_DECISIONS.md` keeps character rules explicit "until a second real fighter
  demonstrates a need for shared roster data". A roster of 25 fighters is that need.

User decisions:

- Deliver all 22 fighters.
- Keep controls simple: specials are a charged power-up released with one button, with no motion
  inputs or chords.
- Offer some starter fighters and unlock the rest through a tree.
- Mix the models: some fighters get a uniquely selected CC0 body, others share bodies with
  appearance kits.
- Nothing may depend on a human; manager and subagents finish the whole plan.
- Keep it simple (KISS), and add permanent tests only when they earn their place.

The revision follows a review. That review asked to:

- Gather early evidence on the special schema, the look strategy, and Tier A sourcing.
- Complete one representative new fighter end to end early, then use what it teaches while the
  roster continues.
- Parallelize research.
- Drop git staging machinery.
- Tier the gates.
- Reconsider v1 migration.
- Reframe the balance tournament.

## Objectives

- Players choose from 25 fighters, the 3 originals plus 22 laureates, each with three signature
  specials.
- Every special fires from one Special button that releases a charged research meter.
- Every special has a short research-inspired name and caption. They reinforce the joke and
  connect the ridiculous attack to the scientist's real work. The HUD shows them on release, and a
  tier-3 super gets a title card.
- The chooser's detail pane links each laureate's nobelprize.org page, for players who get
  curious.
- Fighters are defined as data in one roster registry, and the runtime has no fighter-specific
  branches.
- Six starters are playable immediately, and the rest unlock through a thematic win tree.

## Design philosophy

- Trade-off: the plan pays for one refactor up front: a roster registry, a meter, and a small set
  of special building blocks. It rejects both a general ability-scripting system (too much
  machinery) and continued per-fighter branching (does not scale past three fighters).
- Prove and improve while building. Use the scientific method (`docs/REPO_STYLE.md`): the schema
  proof (M2), the look test (M3), and the McClintock end-to-end fighter (M14) are implementation
  milestones for the full 25-fighter goal. Their evidence strengthens the shared architecture
  while the rest of the roster work continues. None of them is a permission gate on the roster.
- KISS:
  - Specials reuse the existing eight animation clips through a `pose` field.
  - The plan adds no new clips, physics, dependencies, or format conversion.
  - A special the schema cannot express is simplified before the schema grows.
- Evidence strategy for uncertain methods: every uncertain choice below has a recorded experiment,
  a success condition, and a fixed fallback, so no step waits on a person.

## Scope

- Encode all 75 specials (22 new fighters plus the 3 originals) against a proposed schema before
  implementing it.
- Run a look test and a Tier A candidate survey before building the kit system.
- Research all 22 dossiers concurrently.
- Add a roster registry and move the originals into it with no behavior change.
- Replace every per-fighter branch with registry lookups.
- Add a Special input, a three-segment research meter, tiered release, special building blocks, and
  procedural visual effects.
- Show the special's name and caption in the HUD on release, and a super card for tier 3.
- Replace the role branches in `ai.ts` with one generic AI interpreter.
- Replace the Franklin v1 record with a clean v2 unlock record.
- Rebuild the chooser as a grouped card grid with 2-D navigation.
- Choose the opponent with the seeded random source from unlocked fighters.
- Load fighters lazily, two instances per match.
- Ship McClintock end to end first, then integrate the rest of the roster in waves while her
  lessons improve the shared modules.
- Run a seeded AI tournament as a gross-balance diagnostic.

## Non-goals

- Add no new animation clips, motion inputs, combos, or chords.
- Add no online play, local two-player mode, or arena variants.
- Convert no model formats: accept only ready-made GLB or glTF CC0 files.
- Add no npm dependencies.
- Leave vendored configuration and docs unedited.
- Claim no photographic likeness: fighters are recognizable caricatures, and game fiction is
  labeled.
- Treat AI-vs-AI win rates as a gross-outlier signal only, never as proof of competitive balance.
- Leave commits and deployment to humans; agents maintain `docs/CHANGELOG.md`.

## Historical pre-M5 baseline

This summary records the original design before roster refactoring.

- Combat runs at 60 Hz in `src/match.ts`.
  - States: `idle, move, light, heavy, block, hit, down, getup`.
  - Action: `{x, z, light, heavy, block}`.
  - Hit test: distance plus a front half-plane (`:221-231`).
- AI (`src/ai.ts`) uses a seeded LCG (`:7-13`) and role branches (`:56-90`).
- Rigs live in `src/rig/`: `loader.ts` creates independent model instances and `clips.ts`
  resolves skeletal nodes and clones native animation groups.
  - Every registered body has the canonical ordered 66-joint Mesh2Motion skeleton; the rig-boundary
    test enforces that contract and complete clip targets.
  - Curie uses the CC0 Mesh2Motion `female_31` body. The incompatible `curie_period` rig remains
    retired provenance and is not in the model manifest.
  - Warburg has a bone-parented prop.
- Available CC0 bodies: `doctor_m`, `female_9`, `female_31`, and the unshipped `male_5`;
  `curie_period` is a retired candidate.
- Unlock storage: `nobel-combat.franklin-unlock.v1`. The storage module was added in commit
  `79a6aff` on 2026-09-24. The last recorded Pages success is commit `ccaf03d` on 2026-09-23,
  which predates it. Any v1 records are therefore at most about a day old, from playtests.
- Chooser: a `<dialog>` radio group with 1-D navigation (`main.ts:280-493`).
- Build: `build_github_pages.sh` lists each GLB by hand.

## Architecture boundaries and ownership

| Component | Path | Responsibility |
| --- | --- | --- |
| Roster registry | `src/roster/` | The only home of fighter identity, stats, specials, captions, AI profile, unlock rule, and body |
| Match | `src/match.ts`, `src/specials.ts` | Deterministic combat, meter, and special building blocks; no DOM or Babylon |
| AI | `src/ai.ts` | Generic interpreter of the AI profiles |
| Progress | `src/progress/` | Pure unlock rules, storage adapter, winner-edge progression |
| Rig | `src/rig/` | Loader, native clips, appearance kits, props |
| UI | `src/ui/` | HUD, super card, chooser; `main.ts` keeps boot and the frame loop |
| VFX | `src/vfx.ts` | Procedural effect shapes |
| Build | `build_github_pages.sh`, `assets/` | Model manifest and provenance |

### Mapping (milestones / workstreams -> components / patches)

| Milestone / Workstream | Component | Review boundary |
| --- | --- | --- |
| M1 | docs | Docs patch |
| M2 | Roster schema draft | Schema report plus draft data |
| M3 | Rig look test | Report plus captures, no production code |
| M4 | Dossiers | Docs patch |
| M5-M7 | Registry, Match, UI | Behavior-preserving patches |
| M8 | Rig loader, build | Loader patch |
| M9-M12 | Input, Match, VFX, AI | Special-system patches |
| M13 | Progress | Unlock v2 patch |
| M14 | All components (McClintock) | First-fighter patch plus friction report |
| M15-M21 | Match, UI, Rig, tests | Generalization patches |
| M22-M31 | Roster data, assets, docs | One patch per wave milestone |
| M32-M33 | Roster data, docs | Balance and closeout |

## Milestone plan

| M | Title | Summary | Goal |
| --- | --- | --- | --- |
| M1 | Docs baseline | Rename the roster doc, record decisions and guidance, file the plan | Authority in place |
| M2 | Special schema proof | Encode all 75 specials plus attack stats in tracked drafts; report misfits | Proven schema baseline |
| M3 | Look test and Tier A survey | Build 3 fighters' looks by hand; survey CC0 bodies | Model strategy proven |
| M4 | Roster dossiers | 22 research dossiers, researched in parallel | Research off the critical path |
| M5 | Roster registry | Types plus the originals as data | Single source of identity |
| M6 | Match on registry | Fighter ids replace role unions in combat code | No role branches in combat |
| M7 | Presentation on registry | HUD, help, names, and chooser list come from data; `main.ts` split | No role branches in UI |
| M8 | Two-instance loader | Lazy per-match loading, mirror matches, manifest build | Loading scales |
| M9 | Special input and meter | `I` key and gamepad button 3; meter with tiered release | Power-up model |
| M10 | Special building blocks | Proven schema implemented in `src/specials.ts` | Specials from data |
| M11 | Special effects and captions | Procedural shapes, HUD name and caption on every release | Specials loud and funny |
| M12 | Generic AI | Profile interpreter replaces role branches | AI scales |
| M13 | Unlock v2 | Clean v2 rules, storage, progression, announcements | Unlock tree logic live |
| M14 | McClintock end-to-end fighter | First new fighter shipped; friction feeds shared modules | Architecture strengthened |
| M15 | Originals on meter | Warburg, Curie, Franklin get 3 specials each; chords retired | One rule for all |
| M16 | Super card | Tier-3 title card | Supers celebrate research |
| M17 | Chooser grid | Grouped cards, 2-D navigation, locked cards, detail pane | Chooser scales |
| M18 | Opponent selection | Seeded pick from unlocked fighters | Varied matches |
| M19 | Appearance kits | Kit builder scoped by M3 findings | Distinct looks |
| M20 | Native rig adaptation | Curie uses the canonical `female_31` body; direct clip cloning | Safe body variants |
| M21 | Roster smoke harness | Permanent roster smoke spec plus temporary capture script | Scalable validation |
| M22-M31 | Waves 1-5 | Per wave: b = models, c = fighters | Roster shipped |
| M32 | Balance diagnostic | Seeded tournament with a shared AI profile | Gross outliers fixed |
| M33 | Closeout | Docs, `tests/_temp/` review, final integration gate, archive | Plan complete |

### Execution graph

Milestone numbers are labels. This graph is the order. Arrows mean "must exit before".

```text
M1 -> {M2, M3, M4} in parallel
M2 -> M5 -> M6 -> M7 -> {M8, M9} ; M9 -> M10 -> {M11, M12} ; M5 -> M13
{M2, M4} -> WP-CAPTIONS -> M11
{M3, M8} -> M19 (appearance kits; runs beside M9-M13)
{M3, M8} -> M20 (Tier A; runs beside M9-M15)
{M4, M11, M12, M13, M19, WP-CAPTIONS} -> M14 (McClintock, first new fighter)
M11 -> {M15, M16} ; {M14, M15} -> distinctiveness check
{M13, M16} -> M17 -> M18
{M18, M19, M20} -> M21
M21 -> wave b milestones (any order) ; wave c: M23 -> M25 -> M27 -> M29 -> M31
each wave c also needs its own wave b ; M31 -> M32 -> M33
```

Critical path: M1, M2, M5-M7, M9, M10, M11, M14 (also waits for M8 via M19), M16, M17, M18, M21, the wave c
chain, M32, M33.

### Milestone: M1 docs baseline

- Depends on: none.
- Deliverables:
  - Keep `docs/proposed-combat-roster.md` as the temporary roster source while implementation is
    underway. At M33 closeout, publish the implemented roster as
    `docs/ACTIVE_COMBAT_ROSTER.md` and fix links.
  - A DESIGN_DECISIONS entry "Roster is data-driven", superseding the "explicit until a second
    fighter" consequence.
  - A DESIGN_DECISIONS entry "Game identity", carrying the design-intent paragraph and the
    decision test from this plan's Context. Reviewers of later milestones use that test.
  - A correction to the stale `opponent` line at DESIGN_DECISIONS `:175`.
  - HUMAN_GUIDANCE bullets for the user's choices, including the tone: "this is a fun and silly
    game and is not meant to have any educational value, though it might encourage players to read
    more about the scientists".
  - This plan copied to `docs/active_plans/active/roster_expansion.md` with a status table.
- Workstreams: WS-DOC.
- Entry criteria: none.
- Exit criteria: G1 (see "Acceptance criteria and gates"), plus the Markdown links test.
- Parallel-plan ready: no. This is one small docs patch that everything else cites.

### Milestone: M2 special schema proof

- Depends on: M1.
- Deliverables:
  - `src/roster/fighter_def.ts` holds the proposed types:
    - `SpecialDef` fields: `name`, `caption`, `pose` (`light`, `heavy`, or `block`), `ticks`,
      `blocks`, and an optional `meterRefund`.
    - `Block` is one of eight kinds: `strike`, `projectile`, `zone`, `stun`, `reposition`,
      `shield`, `heal`, `modifier`.
    - The shared optional block fields are `delay`, `repeat`, `ignoresBlock`, `homing`, `onHit`
      (a block list), and `scaleWith: "damageTaken"`.
  - `FighterStats` includes each fighter's ordinary attack data: light and heavy ticks, active
    window, reach, damage, stun, and knockback. Warburg's tuned heavy (Oxygen Transfer, currently
    role checks at `match.ts:173,207,211`) becomes plain values in his stats.
  - `src/roster/special_drafts.ts` is tracked and typechecked by `./check_codebase.sh`. It encodes
    all 75 specials: the 66 for the 22 new fighters plus the 9 for Warburg, Curie, and Franklin.
    It also holds all 25 fighters' ordinary attack stats.
    - Consumers: M10's proof run, M14, M15, and each wave c milestone.
    - Each wave c milestone moves its fighters' entries into the category files.
    - M33 deletes the file once it is empty.
  - `docs/active_plans/reports/special_schema_report.md` lists every special whose roster-doc
    intent does not fit the schema, and resolves each one with this rule, in order:
    1. Express the special with existing blocks and fields.
    2. Add one generic field or block kind when the joke needs it. One fighter can justify it, as
       long as the capability is generic (usable by any fighter) rather than keyed to a fighter
       id. The `architect` decides and records the reason.
    3. Simplify the special only when the joke and the scientific hook survive. Examples: Tsien's
       GFP "reveal" becomes a slow plus a big green glow; Doudna's "mark" becomes an `onHit`
       slow.

    The schema serves the roster, not the reverse.
- Workstreams: WS-CORE, owned by the `architect`.
- Entry criteria: M1 exit.
- Exit criteria:
  - All 75 specials and 25 stat blocks typecheck.
  - The report shows no special that needs a fighter-specific runtime branch.
  - The schema becomes the proven baseline in `fighter_def.ts`.
- Schema revision path after M2: a later milestone that finds friction (M10, M14, or a wave c)
  files a schema-change work package, `WP-SCHEMA-<n>`, to the `architect`. The package lands in
  `fighter_def.ts` and `special_drafts.ts` together, so drafts never drift from the schema.
  WS-CORE owns the change, and it is applied serially: one schema writer at a time.
- Parallel-plan ready: yes. It runs alongside M3 and M4, which touch disjoint files; up to 3 lanes.

### Milestone: M3 look test and Tier A survey

- Depends on: M1.
- Deliverables:
  - Historical look test: `tests/_temp/look_test.mjs` hand-builds three caricatures on existing
    bodies using Babylon `MeshBuilder` pieces parented to bones:
    - Steitz: white side hair, chin-strap beard, wire glasses.
    - Hodgkin: dark wavy hair, cardigan tint, skirt.
    - Tsien: a deliberately generic academic, as the control.
  - A lineup capture of the three in idle and heavy poses, beside the originals.
    This experiment determines which rigid pieces are viable. Its hair, cardigan tint, and skirt
    trials do not establish production kit support; M19 admits only the pieces that pass its
    rendered review.
  - Tier A survey. "Tier A" is a unique CC0 human body with useful clothing or build that uses the
    canonical ordered 66-joint Mesh2Motion skeleton. It never means a model of the actual scientist.
    Tier B uses a body already in the roster with only the supported rigid-accessory kit. It cannot
    supply hair, clothing, or silhouette cues.
    - Search Quaternius, Kenney, OpenGameArt (CC0 filter), and Poly Pizza (CC0).
    - List candidates that are rigged GLB or glTF, carry an explicit CC0 statement, show a distinct
      garment or build, and match the canonical skeleton exactly.
  - Tier A motion proof: candidate GLB files must preserve the canonical ordered skeleton and every
    combat clip target. Capture all 8 combat states using direct native clip cloning. The
    `image_evaluator` records whether each state reads correctly with no collapsed limbs or frozen
    bones.
    - A body with a different rig is rejected; runtime cross-rig retargeting is not supported.
    - If a native-rig candidate fails the visual gate, try the next one, up to 3.
    - A failed candidate is excluded. A fighter whose defining cues need hair, clothing, or a
      distinct silhouette requires another authored canonical-rig body; Tier B is valid only when
      its rigid accessories make the dossier's remaining cues readable.
  - `docs/active_plans/reports/look_test_report.md` records:
    - The `image_evaluator` findings on the lineup: which pieces read as intended, which clip or
      float.
    - The minimal kit piece set worth building.
    - The Tier A candidate table: URL, license quote, garment, and joint count.
    - The motion-proof result, with mapped-joint coverage for each clip.
    - The Tier A slot assignment: only fighters with a matching candidate that passed the motion
      proof, or whose rig family matches one that passed, get Tier A.
- Workstreams: WS-RIG. `expert_coder` builds; a `general-purpose` agent runs the survey;
  `image_evaluator` scores.
- Entry criteria: M1 exit.
- Exit criteria:
  - The evaluator confirms that Steitz and Hodgkin are distinguishable from each other and from
    the control by their defining features.
  - Kit scope and the Tier A slots are fixed in the report.
  - Correction path: if a piece type fails twice, drop it from the kit. Use a rigid prop only when
    it is a supported, readable dossier cue; otherwise use an authored canonical-rig body asset and
    note the decision in the report.
- Parallel-plan ready: yes (see M2).

### Milestone: M4 roster dossiers

- Depends on: M1. Research is independent of unlock order and integration.
- Deliverables:
  - `docs/ROSTER_SOURCE_DOSSIER_<CATEGORY>.md`, one file per roster category (6 files), each under
    1000 lines.
  - Each fighter section contains:
    - The Nobel citation, verified on nobelprize.org.
    - An image-led likeness record. Photographs are the primary evidence; text sources give
      provenance and period context only.
      - Search for photos from at least two career periods: Wikimedia Commons, institutional
        archives, nobelprize.org, and university pages.
      - Download 2-4 reference images to the session scratchpad (not the repo; images stay
        uncommitted for copyright).
      - A vision-capable subagent (`image_evaluator`) views them and records the chosen period and
        defining features: hair, facial hair, glasses, build, and typical clothing.
      - Record each image's page URL and date for provenance.
    - For each special: the real piece of work the joke riffs on (for example "the 50S ribosomal
      subunit"), with one link, so the joke points at something true. The exaggeration is openly
      fiction and needs no sourcing.
    - A short caption per special: a research-inspired joke line.
    - The laureate's nobelprize.org page URL, used by the chooser link.
- Workstreams: WS-ROSTER. One `general-purpose` lane per fighter, at most 6 concurrent. One
  `integrator` owns each category file.
- Entry criteria: M1 exit.
- Exit criteria:
  - All 22 sections are present.
  - A `reviewer` checks that names, prizes, years, and each special's real-work reference are
    correct. A wrong fact spoils the joke, so it goes back to the owning lane.
  - M4 writes captions only in the dossiers. It never edits `src/roster/special_drafts.ts`.
- Follow-on `WP-CAPTIONS`:
  - Owner: WS-CORE, the single writer of `special_drafts.ts`.
  - Depends on: M2 and M4.
  - Work: copy the dossier captions into the drafts.
  - Must finish before M11, where captions first display, and before M14.
  - G1.
- Parallel-plan ready: yes. There are 22 independent lanes, capped at 6 concurrent to bound
  integration.

### Milestone: M5 roster registry

- Depends on: M2 (the proven schema baseline).
- Deliverables:
  - `FighterDef` in `src/roster/fighter_def.ts` with these fields: `id`, `name`, `category`,
    `prize`, `verb`, `body`, `height`, `stats`, `meterGain`, `specials` (a 3-tuple), `ai`, and
    `unlock`.
  - `src/roster/fighters_originals.ts` holds the current values for the three originals.
  - `src/roster/roster.ts` exports `ROSTER` and `fighterById`.
  - Permanent `tests/test_roster_registry.mjs` enforces the data contract:
    - ids are unique;
    - every fighter has three specials;
    - unlock rules reference existing ids;
    - every fighter is reachable from the starters.
- Workstreams: WS-CORE.
- Entry criteria: M2 exit.
- Exit criteria: G1.
- Parallel-plan ready: no. These types gate all runtime work.

### Milestone: M6 Match on registry

- Depends on: M5.
- Deliverables:
  - `FighterId` replaces the role unions at `match.ts:3-5`.
  - `selectPlayer(id)` and `debug_harness.ts` validate ids against the registry.
  - Light and heavy attacks read `FighterStats`. Warburg's heavy role checks
    (`match.ts:173,207,211`) are deleted, and his tuned heavy stays identical because it now comes
    from data.
  - The originals' one-off special fields stay until M15.
  - Test fixtures use ids.
- Workstreams: WS-CORE.
- Entry criteria: M5 exit.
- Exit criteria: G1, with the numeric expectations in `test_match.mjs` unchanged.
- Parallel-plan ready: no. The work is serial on `match.ts`.

### Milestone: M7 presentation on registry

- Depends on: M6.
- Deliverables:
  - `main.ts` is split: `src/ui/hud.ts` holds names, labels, KO/win text, and help.
  - Chooser radios are generated from the registry. The list stays 1-D and wraps, as today.
  - Heights come from the registry (`main.ts:783`, `playtest_probe.ts:76`).
  - The `modelForRole` and `fighterName` switches are removed.
- Workstreams: WS-UI.
- Entry criteria: M6 exit.
- Exit criteria:
  - G1, plus the `fighter_selection` and `control_help_layout` specs.
  - `main.ts` is under 600 lines.
- Parallel-plan ready: no. The work is serial on `main.ts`.

### Milestone: M8 two-instance loader

- Depends on: M7 (shared `main.ts` wiring).
- Deliverables:
- `rigged_fighter.ts` is split into `src/rig/loader.ts`, `src/rig/clips.ts`, and
    `src/rig/presentation.ts`.
  - `loadMatchFighters(playerId, opponentId)` loads exactly two instances on demand and caches base
    GLBs by URL.
  - `createSourceRelease(3, ...)` and the pairwise independence list are removed.
  - `assets/models/MANIFEST.txt` lists the shipped GLBs. It is generated by
    `devel/write_model_manifest.mjs` from the registry's `body` fields.
  - `build_github_pages.sh` copies the manifest entries and fails on any missing file.
  - `test_rig_boundary.mjs` reads the manifest.
- Workstreams: WS-RIG.
- Entry criteria: M7 exit.
- Exit criteria: G1; a temporary capture shows Warburg vs Warburg with two independent skeletons.
- Parallel-plan ready: yes. It runs alongside M9, with disjoint files; 2 lanes.

### Milestone: M9 special input and meter

- Depends on: M7 (help text).
- Deliverables:
  - `Action.special`, bound to keyboard `I` and gamepad button 3.
  - Meter range 0..300, in three segments.
  - Base meter gains, each multiplied by the fighter's `meterGain`:

    | Event | Meter gain |
    | --- | --- |
    | Land a hit | 20 |
    | Land a blocked hit | 8 |
    | Take a hit | 12 |
    | Block a hit | 10 |

  - On a Special press in `idle` or `move` with meter >= 100, fire tier
    `min(3, floor(meter/100))` and spend `tier*100`.
  - The meter carries across rounds and resets on restart.
  - HUD meter showing the name of the next special.
  - Permanent tests:
    - The meter tier and spend case in `test_match.mjs`.
    - `input_parity.spec.ts` extended so `I` and gamepad button 3 map to the same action.
- Workstreams: WS-CORE.
- Entry criteria: M7 exit.
- Exit criteria: G1 plus `input_parity`.
- Parallel-plan ready: yes (see M8).

### Milestone: M10 special building blocks

- Depends on: M9.
- Deliverables:
  - `src/specials.ts` implements the frozen M2 schema deterministically.
    - A special plays its `pose` state for `ticks`.
    - Projectiles and zones live in `Match.effects` until they expire or hit.
  - A damage budget gives the data a consistent starting point. It is a tuning aid, not a product
    rule; intentional asymmetry that makes a fighter funnier stays (Warburg is meant to hit hard).
    Tiers start at about 14, 20, and 30
    damage-equivalent points. Conversions:
    - 1 stun tick = 0.3 points.
    - 1 heal HP = 1 point.
    - 1 shield HP = 0.8 points.
    - A modifier = 0.1 points per tick at 1.3x.
  - Temporary per-block proofs in `tests/_temp/`.
  - One permanent case, "effects are deterministic and expire", which protects the seeded-replay
    contract that browser scenarios rely on.
- Workstreams: WS-CORE, owned by `expert_coder`.
- Entry criteria: M9 exit.
- Exit criteria:
  - G1.
  - A temporary harness runs every entry in `src/roster/special_drafts.ts` through the
    implementation, and every special resolves without errors. A misfit goes back to M2's revision
    path as `WP-SCHEMA-<n>`.
- Parallel-plan ready: no. There is one core module.

### Milestone: M11 special effects and captions

- Depends on: M10.
- Deliverables:
  - `src/vfx.ts` draws pooled `MeshBuilder` shapes: `ring`, `beam`, `orb`, `helix`, `crystal`,
    `cloud`, `chain`, and `burst`.
  - The existing Oxygen Transfer and Aerobic Glycolysis rings (`main.ts:125-150`) move into it.
  - Every special release shows the special name and caption in a small banner on that fighter's
    HUD side. The banner never covers the fighters and replaces any banner already showing. Screen
    readers announce the name only, and only for supers (M16), to avoid announcement noise.
  - Cadence check (temporary): record a seeded AI match and have an `image_evaluator` review the
    frame sequence. Tune the banner duration so it lands the joke without cluttering play.
  - A probe hook reports the active effect count.
- Workstreams: WS-UI.
- Entry criteria: M10 exit.
- Exit criteria: G1; in a temporary capture, an `image_evaluator` confirms each shape is visible and
  distinct.
- Parallel-plan ready: yes. It runs alongside M12 and M13 in disjoint files; 3 lanes.

### Milestone: M12 generic AI

- Depends on: M10.
- Deliverables:
  - `FighterDef.ai` holds `{preferredRange, blockChance, heavyChance, specialRange per tier}`.
  - `ai.ts` becomes one interpreter:
    1. Block after being hit.
    2. Release a special when meter and range allow.
    3. Otherwise close to `preferredRange` and attack.
  - The role branches are removed and the seeded LCG is kept.
  - In `test_ai.mjs`, the role-specific cases are replaced by one case, "releases a special when
    meter and range allow". The seeded long-match case is kept.
- Workstreams: WS-AI.
- Entry criteria: M10 exit.
- Exit criteria: G1.
- Parallel-plan ready: yes (see M11).

### Milestone: M13 unlock v2

- Depends on: M5 (unlock rules).
- Deliverables:
  - The Franklin files move with `git mv` into `src/progress/`: `unlocks.ts`, `storage.ts`, and
    `progression.ts`.
  - The record is `{version: 2, wonAs: FighterId[], wins: number}`.
    - `wonAs` is the set of fighters the player has won a match as.
    - `wins` is the total number of player match wins.
  - Unlock rules:
    - `starter`.
    - `winAs: ids`.
    - `wins: count` (compares against the `wins` total).
  - `unlockedSet` is derived from the record and the rules.
  - The storage key is `nobel-combat.progress.v2`. A strict decoder is kept, and a failed read or
    write keeps only the starters unlocked.
  - Any player match win adds that fighter to `wonAs`. The durable write completes before the
    chooser reveals a new fighter and before the one polite announcement per unlock.
  - **No v1 migration.** Evidence: v1 storage was first committed on 2026-09-24, after the last
    recorded Pages deploy. At most, a playtester re-earns Franklin. Record this in
    DESIGN_DECISIONS.
  - `test_franklin_*.mjs` becomes `tests/test_unlocks.mjs`, which keeps:
    - The decode round-trip.
    - Malformed-record rejection.
    - The `winAs` and `wins` unlock rules.
  - The storage literals in the `franklin_*.spec.ts` specs are updated to v2.
- Workstreams: WS-PROG.
- Entry criteria: M5 exit.
- Exit criteria: G1 plus `franklin_progression_matrix` and `franklin_live_role`.
- Parallel-plan ready: yes (see M11).

### Milestone: M14 McClintock end-to-end fighter

This is the first new fighter shipped: an implementation milestone, not a go/no-go gate. Its
friction report feeds fixes into the shared modules while M15-M21 and wave research and models
proceed.

- Depends on: M4 (dossier), M11, M12, M13, M19 (production appearance kit).
- Deliverables:
  - McClintock is added using only data and the existing modules:
    - A registry entry covering stats, body, and kit data rendered by M19's production
      `appearance_kit.ts`.
    - Three specials:
      1. Ac/Ds: homing projectiles.
      2. Maize Chromosome: a zone plus a strike.
      3. TRANSPOSON: a reposition behind the opponent plus a strike.
    - An AI profile.
    - Starter unlock status.
    - Chooser listing.
  - `docs/active_plans/reports/vertical_slice_report.md` lists every file touched, confirms that no
    fighter-specific branch was added, and records friction found.
  - Each friction item becomes a work package, `WP-M14-F<n>`, dispatched with this rule:
    - The manager assigns it to the workstream that owns the affected module, using the ownership
      table.
    - There is one writer per module at a time. The fix queues in that workstream's lane, right
      after its in-flight package. It never runs concurrently with another package touching the
      same files.
    - A schema change goes through `WP-SCHEMA-<n>`.
    - Each fix is its own patch, with a focused test only if it protects a lasting contract.
    - McClintock's registry entry stays data. If a fix blocks her, M14 waits for that fix, not for
      unrelated lanes.
- Workstreams: WS-ROSTER, owned by `expert_coder`, with an independent `reviewer`.
- Entry criteria: all dependencies have exited.
- Exit criteria:
  - G2 (see "Acceptance criteria and gates").
  - McClintock is playable as a starter.
  - A temporary capture of her 3 specials passes `image_evaluator` review against her dossier's
    defining features.
  - Her appearance passes the same match-camera visual gate required for wave bodies: both ordinary
    roster positions, idle through getup, with every defining cue readable and no detached geometry.
    The current status and failed generic-kit experiment are recorded in
    `docs/active_plans/reports/vertical_slice_report.md`; M14 remains open until this criterion
    passes or the visual contract is explicitly revised.
  - A seeded 20-match temporary run against Warburg completes with every special used.
  - McClintock's own patch touches only roster data and asset files. Shared-module changes she
    needed exist as separate `WP-M14-F<n>` patches.
- Improvement path: the fixes run in their owning lanes in parallel with M15-M20. Wave c milestones
  pick up the improved modules; no roster work waits on a verdict.
- Parallel-plan ready: no for McClintock herself. Her friction fixes fan out into up to 3 lanes in
  the owning modules.

### Milestone: M15 originals on meter

- Depends on: M10 (blocks), M11 (visuals).
- Deliverables:
  - Warburg: Lactate Drive (reposition dash plus strike), Aerobic Glycolysis (self modifier), and
    Oxygen Transfer Surge (strike plus ring zone). His tuned heavy already lives in his
    `FighterStats`, set in M6.
  - Curie: Separation Step (strike), Radium Glow (slowing zone), and Polonium Burst (projectile
    burst). Her new specials are added to `CURIE_SOURCE_DOSSIER.md` with fiction labeled.
  - Franklin: Photo 51 (X-pattern projectiles), Crystal Fiber (stun), and Double Helix (zone plus
    strike). These are added to a dossier section.
  - The one-off fields, chord detection, and matching debug ranges are deleted.
  - Tests that protected the chords are rewritten to use meter release. A case is kept only if it
    protects distinct behavior.
- Workstreams: WS-CORE.
- Entry criteria: M11 exit.
- Exit criteria:
  - G1 plus `control_help_layout` and `input_parity`.
  - Distinctiveness check (temporary): once M14 and M15 both exit, capture frame sequences of every
    special for Warburg, Curie, Franklin, and McClintock. Also capture the Hodgkin and Steitz
    drafts, loaded on stand-in bodies through the debug harness. An `image_evaluator` reports
    which specials read alike.
  - Each "reads alike" finding becomes a `WP-M14-F<n>` improvement: VFX shape parameters, scale,
    pose, timing, or one generic capability. This is not a gate.
- Parallel-plan ready: yes. It runs alongside M14, M16, and M20 in disjoint files; up to 4 lanes.
  M14's friction fixes queue into the owning lane rather than running concurrently.

### Milestone: M16 super card

- Depends on: M11.
- Deliverables:
  - `src/ui/super_card.ts` shows a tier-3 title card for about 1 s of render time, with the fighter
    name, special name, and caption.
  - The simulation keeps running while it shows.
  - Screen readers get one polite announcement of the super's name.
- Workstreams: WS-UI.
- Entry criteria: M11 exit.
- Exit criteria: G1.
- Parallel-plan ready: yes (see M15).

### Milestone: M17 chooser grid

- Depends on: M13, M16 (shared UI lane).
- Deliverables:
  - `src/ui/chooser.ts` builds a radio-group card grid grouped by category.
    - The CSS grid uses `auto-fill`, from 2 columns on a phone to 5 on desktop.
    - `SelectionInput` gains `up` and `down`, with row/column navigation.
  - Locked cards show a silhouette and a hint generated from the unlock rule, for example "Win as
    Hodgkin". Franklin stays fully hidden until unlocked.
  - A detail pane shows the focused fighter's prize line, verb, and three special names with their
    captions. It also has a "Read about <name>" link to their nobelprize.org page, which opens in a
    new tab and works from both keyboard and gamepad focus.
  - Focus, pause, and input-release behavior are preserved.
  - `fighter_selection.spec.ts` derives its counts from the roster and is split if it passes 900
    lines.
  - The current registry contains only starters plus fully hidden Franklin, so a non-Franklin locked
    card cannot be rendered yet. The first wave that adds a non-starter includes browser proof for
    the silhouette and rule-derived hint instead of introducing fake roster data.
- Workstreams: WS-UI.
- Entry criteria: M16 exit.
- Exit criteria:
  - G1 plus `fighter_selection` and `franklin_secrecy_accessibility`.
  - A temporary capture at phone, tablet, and desktop widths passes an `image_evaluator` check for
    clipping.
- Parallel-plan ready: no. This is the UI lane.

### Milestone: M18 opponent selection

- Depends on: M17.
- Deliverables:
  - `Match.selectPlayer(id, opponentId)`.
  - `main.ts` picks the opponent with the seeded source from unlocked fighters other than the
    player.
  - Round reset and restart keep the pair; "Change fighter" re-rolls the opponent.
  - The hard-coded pairing at `match.ts:73-77` is removed.
  - Playtest mode fixes the seed.
  - `agent_scenarios.mjs` stays under 900 lines and pins opponents explicitly; split it by concern
    only if future growth requires it.
- Workstreams: WS-CORE.
- Entry criteria: M17 exit.
- Exit criteria: G2.
- Parallel-plan ready: no. This is integration.

### Milestone: M19 appearance kits

- Depends on: M3 (approved piece set), M8 (loader).
- Deliverables:
  - `src/rig/appearance_kit.ts` is the production kit component. It implements only the rigid
    accessories that pass rendered review across supported bodies:
    - glasses;
    - facial hair;
    - one bone prop.

    The kit has no generic garment geometry or whole-body `clothingTint`: no lab coat, jacket,
    shirt/tie, or skirt. Hair, clothes, and silhouette are authored and skinned in canonical-rig
    body assets.

    It lands before M14, so McClintock uses it directly and no throwaway kit code exists. Kit
    friction from M14 returns to WS-RIG as `WP-M14-F<n>`.
  - Warburg's gauge becomes a prop entry.
  - Body height scaling comes from `FighterDef.height`.
  - `male_5` and `female_31` are promoted into the manifest when used.
- Workstreams: WS-RIG.
- Entry criteria: M8 exit.
- Exit criteria: G1; a temporary capture of every piece on two bodies passes the `image_evaluator`
  check.
- Parallel-plan ready: yes. It runs alongside M9-M13 (WS-RIG files only); 1 lane.

### Milestone: M20 native rig adaptation

- Depends on: M3 (candidate table), M8.
- Deliverables:
  - Keep combat animation on one contract: each registered body has the canonical ordered 66-joint
    Mesh2Motion skeleton and each required clip targets that complete skeleton.
  - Use `src/rig/clips.ts` for direct clip cloning; do not select runtime retarget maps by fighter
    or body id.
  - Curie uses the CC0 Mesh2Motion `female_31` body on the native skeleton. The separately rigged
    period-dress candidate remains documented as retired provenance.
  - `test_rig_boundary.mjs` checks every unique roster body against the canonical skeleton and each
    clip against its complete ordered joint set.
  - Reject differently rigged candidates. A future body variation must use the canonical skeleton
    and pass the eight-state visual gate before it enters the manifest.
  - The external candidates recorded in the M3/M20 reports remain unassigned after failing their
    eight-state readability checks.
- Workstreams: WS-RIG. One lane per native-rig body; one `integrator` owns `assets/README.md` and
  the manifest.
- Entry criteria: M8 exit.
- Exit criteria: G1; in a temporary capture, Curie and every registered body render all 8 states.
- Parallel-plan ready: yes (see M15).

### Milestone: M21 roster smoke harness

- Depends on: M18, M19, M20.
- Deliverables:
  - Permanent `tests/playwright/roster_smoke.spec.ts`. With all fighters unlocked through a v2
    storage fixture, for each roster fighter it:
    - selects the fighter;
    - sets the meter to 300 through the debug harness;
    - releases a special;
    - asserts both fighters are visible and there are no page or console errors.

    This protects the one thing every fighter must do. It is not an opponent or viewport matrix.
  - Tracked `devel/capture_roster.mjs` is a maintainer tool that takes a fighter-id argument and
    writes the idle lineup plus special-pose captures to `test-results/roster/`. It is tracked
    because M22-M32 and future roster additions depend on it; its outputs stay ignored. M3's look
    test seeds it.
- Workstreams: WS-TEST.
- Entry criteria: M18, M19, and M20 exit.
- Exit criteria: G2, with the smoke spec passing for the 3 originals and McClintock.
- Parallel-plan ready: no. This is one spec.

### Milestone: wave milestones M22-M31

Research for every wave is already done in M4. Each wave has two milestones:

- **b, models**: M22, M24, M26, M28, M30.
  - Depends on M21. A wave's b milestone may run as early as M21 exit, in parallel with earlier
    waves' c milestones.
  - Deliverables:
    - A Tier A authored canonical-rig body asset supplies every defining hair, clothing, and
      silhouette cue.
    - Tier B kit data uses only supported rigid head or prop accessories. It independently passes
      this wave's source-cue, two-position, and eight-state review.
    - A temporary capture scored by `image_evaluator` against the dossier's defining features in
      both ordinary roster positions: rear-facing player slot and front-facing opponent slot.
      Each position includes idle, move, light, heavy, block, hit, down, and getup states.
  - Pass condition: every source-defined feature is visible in an ordinary gameplay view, the
    silhouette is distinct from the shipped lineup, and the silhouette and pose remain coherent in
    both positions across all eight states, especially down and getup.
  - Correction: at most 2 revisions, then replace a failed candidate with an authored canonical-rig
    body. Tier B cannot substitute generic hair, clothes, or silhouette geometry.
  - One lane per fighter; an `integrator` owns the manifest and `assets/README.md`.
- **c, fighters**: M23, M25, M27, M29, M31.
  - Depends on the wave's own b milestone and the previous wave's c milestone. Unlock prerequisites
    must exist before a fighter's rule references them.
  - Deliverables: `FighterDef` entries in the category data file, using M2's encoded specials, the
    M4 captions, an AI profile, and the unlock rule.
  - Exit: G2, plus a temporary seeded 20-match run of each new fighter against Warburg in which
    every match completes and every special is used.
  - One lane per fighter; an `integrator` merges each category file.
- Parallel-plan ready: yes. Lanes are per fighter, at most 5 per wave. Shared files have one
  integrator owner.

Wave contents. Tier A slots are provisional until M3 assigns them. Tier B is available only where
supported rigid accessories meet the same visual gate; it is not a generic-body fallback.

| Wave | Fighters |
| --- | --- |
| 1 (M22-M23) | Hodgkin, Goodenough, Buck (McClintock shipped in M14) |
| 2 (M24-M25) | Doudna, Tsien, Strickland, Levi-Montalcini, Bertozzi |
| 3 (M26-M27) | Baker, Steitz, Frank, Anfinsen, Blackburn |
| 4 (M28-M29) | Kariko, Altman, Cech, Baltimore |
| 5 (M30-M31) | Sharpless, Bardeen, Gabor, Herzberg |

### Milestone: M32 balance diagnostic

- Depends on: M31.
- Deliverables:
  - `tests/_temp/roster_tournament.mjs` runs headless `Match` simulations without a browser.
  - First, measure throughput in matches per second, and size the round-robin to finish within
    about 10 minutes.
  - The question the diagnostic answers: is any kit grossly broken, and is the cause the kit
    itself or how the AI uses it? It has two parts:
    1. Scripted exercise. Each special fires at its designed range, once against a passive dummy
       and once against a dummy that is blocking. The script reports damage-equivalent delivered
       per 100 meter spent, compared with the budget rule. Delivered value far from budget means a
       mechanical problem, so tune the special's data.
    2. Tournaments. A round-robin runs twice: once with every fighter on one shared default AI
       profile, and once with each fighter's own profile. Flag a fighter whose field win rate is
       under 25% or over 75%, which is a gross outlier a player would notice.
  - Classification:
    - Scripted exercise off budget: kit problem. Tune the special data.
    - On budget, but flagged only with its own profile: usage problem. Tune the AI profile.
    - On budget, but flagged in both tournaments: inspect the kit geometry (range and movement),
      then tune stats.
  - Iterate up to 3 rounds. Residual flags are recorded in the changelog as follow-ups.
  - This is not a competitive ranking. Both the budget and the band only expose obvious mistakes.
    A fighter recorded as intentionally lopsided in its dossier keeps that personality and is not
    normalized; Warburg is the example.
- Workstreams: WS-BAL. The tournament runner has one owner; tuning has one lane per category file.
- Entry criteria: M31 exit.
- Exit criteria: G2; the report is saved to `output_roster/tournament.md`.
- Parallel-plan ready: yes, for the tuning lanes (at most 6).

### Milestone: M33 closeout

- Depends on: M32.
- Deliverables:
  - The README first paragraph and feature list are updated.
  - `docs/CODE_ARCHITECTURE.md` and `docs/FILE_STRUCTURE.md` are written with the `arch-docs`
    skill.
  - DESIGN_DECISIONS entries cover the meter, the building blocks, unlock v2, and body tiers.
  - Every file in `tests/_temp/` is reviewed. A check is promoted only if it protects a contract
    in the test strategy below; the rest are deleted.
  - `npm audit --audit-level=high` and the Markdown links test pass.
  - The implemented roster is published as `docs/ACTIVE_COMBAT_ROSTER.md`.
  - The plan is moved with `git mv` to `docs/archive/roster_expansion.md`.
- Workstreams: WS-DOC.
- Entry criteria: M32 exit.
- Exit criteria: G2.
- Parallel-plan ready: yes. There are 2 lanes: docs, and final gates.

## Workstream breakdown

### Workstream: WS-CORE

- Goal: registry, schema, Match, input, meter, building blocks, opponent selection.
- Owner: `architect` (M2), `expert_coder` (M5-M10, M15, M18).
- Work packages: WP-M2, WP-M5, WP-M6, WP-M9, WP-M10, WP-M15, WP-M18.
- Needs: M1 authority.
- Provides: `FighterId`, `FighterDef`, `SpecialDef`, and `Match.effects`.
- Review boundary, when modifying the repository: `src/roster/fighter_def.ts`, `src/roster/roster.ts`, `src/match.ts`,
  `src/specials.ts`, `src/input.ts`, `src/debug_harness.ts`.

### Workstream: WS-UI

- Goal: HUD, captions, effects, super card, chooser.
- Owner: `coder`.
- Work packages: WP-M7, WP-M11, WP-M16, WP-M17.
- Needs: the registry and the progress API.
- Provides: the rendered presentation.
- Review boundary, when modifying the repository: `src/ui/`, `src/vfx.ts`, `src/main.ts`,
  `src/index.html`, `src/style.css`.

### Workstream: WS-AI

- Goal: the generic AI interpreter.
- Owner: `coder`.
- Work packages: WP-M12.
- Needs: `SpecialDef` and the meter.
- Provides: support for AI profiles.
- Review boundary, when modifying the repository: `src/ai.ts`.

### Workstream: WS-PROG

- Goal: unlock v2.
- Owner: `coder`.
- Work packages: WP-M13.
- Needs: the registry's unlock rules.
- Provides: `unlockedSet` and unlock announcements.
- Review boundary, when modifying the repository: `src/progress/`.

### Workstream: WS-RIG

- Goal: look test, loader, kits, and native-rig body variants.
- Owner: `expert_coder`; `general-purpose` for the survey and sourcing; `image_evaluator` for
  scoring.
- Work packages: WP-M3, WP-M8, WP-M19, WP-M20, and the wave b milestones.
- Needs: `FighterDef.body`.
- Provides: fighter instances.
- Review boundary, when modifying the repository: `src/rig/`, `assets/`,
  `build_github_pages.sh`.

### Workstream: WS-ROSTER

- Goal: dossiers, the slice, and the wave fighter data.
- Owner: `general-purpose` (research), `coder` (data), `integrator` (shared files).
- Work packages: WP-M4, WP-M14, and the wave c milestones.
- Needs: the M2 draft specials and M21.
- Provides: shipped fighters.
- Review boundary, when modifying the repository: `docs/ROSTER_SOURCE_DOSSIER_*.md`, `src/roster/fighters_*.ts`.

### Workstream: WS-TEST, WS-BAL, WS-DOC

- Owner: `tester` (M21), `coder` (M32), `planner` (M1, M33).
- Review boundary, when modifying the repository: `tests/`, `docs/`.

## Work packages

Each milestone is one work package, WP-M1 through WP-M33. Wave milestones and M4 fan out into one
package per fighter, `WP-M<nn>-<fighter>`. Each package takes its owner, touch points, and
dependencies from its milestone. Its acceptance criteria are the milestone deliverables plus that
milestone's gate.

Obvious follow-ons are folded into their owners:

- The `main.ts` split is in M7.
- The `rigged_fighter.ts` split is in M8.
- The `agent_scenarios.mjs` split is in M18.
- The `fighter_selection.spec.ts` split is in M17.
- The DESIGN_DECISIONS correction is in M1.

### Unlock tree (registry data)

| Fighter | Unlock rule |
| --- | --- |
| Warburg, Curie, McClintock, Hodgkin, Goodenough, Buck | starter |
| Franklin | winAs Warburg and Curie |
| Doudna | winAs McClintock |
| Tsien | winAs Hodgkin |
| Strickland | winAs Goodenough |
| Levi-Montalcini | winAs Buck |
| Bertozzi | winAs Curie |
| Baker | winAs Doudna |
| Steitz | winAs Tsien |
| Frank | winAs Steitz |
| Anfinsen | winAs Baker |
| Blackburn | winAs Levi-Montalcini |
| Kariko | wins 5 |
| Altman | winAs Steitz |
| Cech | winAs Altman |
| Baltimore | winAs Kariko |
| Sharpless | winAs Bertozzi |
| Bardeen | winAs Goodenough and Strickland |
| Gabor | winAs Tsien |
| Herzberg | winAs Strickland |

The M2 schema proof starts from the per-fighter building-block sketches in
`docs/proposed-combat-roster.md` plus these defaults:

- Projectile-heavy fighters (Hodgkin, Kariko, Herzberg) differ in pattern and homing.
- Zone fighters (Buck, Levi-Montalcini) differ in placement.
- Movement fighters (McClintock, Cech, Anfinsen) use `reposition`.
- Defensive fighters (Goodenough, Blackburn, Altman) use `shield` and `heal`.
- Each fighter's verb stays distinct, as the roster doc requires.

## Acceptance criteria and gates

- G1, the atomic gate for every milestone:
  - `./check_codebase.sh` (typecheck, lint, format, Node tests).
  - The specs that milestone names.
  - One changelog entry.
- G2, the integration gate for M14, M18, M21, each wave c, M32, and M33:
  - G1.
  - `./build_github_pages.sh`.
  - The full serial Playwright suite (`--workers=1`).
  - A fresh `reviewer` accepts the work.
- Failure plan:
  - A red gate blocks only the milestones that depend on it; independent lanes continue.
  - The owning lane fixes the failure. A second failure goes to a fresh `expert_coder` with the
    failure output attached.
  - Integration failures after a wave are fixed before the next wave c starts.

## Test and verification strategy

Permanent tests. Each one protects a contract that players or data rely on:

| Test | Contract |
| --- | --- |
| `test_roster_registry.mjs` | Stable roster invariants only: unique ids, three specials each, unlock rules reference real fighters, every fighter reachable. No field-by-field schema snapshot |
| `test_match.mjs`: meter case | Tier selection and meter spend |
| `test_match.mjs`: effects case | Effects are deterministic and expire (seeded replay) |
| `test_vfx.mjs` | Each declared projectile pattern has a distinct projection; omitted pattern stays `single` |
| `test_ai.mjs` | AI releases specials; seeded matches complete |
| `test_unlocks.mjs` | v2 decode, rejection of bad records, unlock rules |
| `roster_smoke.spec.ts` | Every fighter loads, releases a special, and renders without errors |
| `input_parity.spec.ts` (updated) | Special maps identically on keyboard and gamepad |

- Existing specs are updated rather than multiplied; literal counts become roster-derived.
- Tracked working artifacts are not permanent tests. They are consumed across milestones and
  closed out in M33:
  - `src/roster/special_drafts.ts`, deleted when empty;
  - `devel/capture_roster.mjs`, kept as a maintainer tool.
- Temporary checks live in `tests/_temp/`, untracked, and are reviewed in M33:
  - the look test;
  - per-block proofs;
  - captures;
  - `image_evaluator` reports;
  - the wave 20-match runs;
  - the tournament.
- No pixel, byte, or elapsed-time assertions.
- Likeness is judged by `image_evaluator` against the dossier's written features.

## Risk register

| Risk | Impact | Trigger | Owner | Mitigation |
| --- | --- | --- | --- | --- |
| Schema misses special intents | Runtime branches creep in, or jokes get flattened | M2 report lists misfits | `architect` | Existing fields first, then one generic capability, then simplification that keeps the joke; revisions go through `WP-SCHEMA-<n>` |
| Kits look cheap or unrecognizable | Weak character appeal | M3 evaluator fails a piece | WS-RIG | Retire generic garment pieces; use authored canonical-rig bodies for hair, clothes, and silhouette |
| Too few Tier A bodies | Less body variety | M3 survey finds few candidates | WS-RIG | Tier A assigned only where a candidate exists; Tier B remains limited to supported rigid accessories |
| First fighter exposes a design flaw | Rework in shared modules | M14 needs a branch | Manager | Turn each flaw into a task for the owning module; roster work continues and picks up the fix |
| Bundle growth | Slow load | `dist/` more than doubles | WS-RIG | Shared bodies; lazy loading of two instances |
| Tournament misleads | Wrong tuning | AI behavior dominates results | WS-BAL | Shared AI profile; gross outliers only; inspect cause before tuning |
| Wrong name, prize, or reference | Joke falls flat | Reviewer finds an error | WS-ROSTER | Checked against nobelprize.org in M4 |
| Drift toward teaching | Wordy, unfunny UI | Captions grow into explanations | WS-UI | Captions stay one short joke line; details only behind the "Read about" link |
| File-size limit | Gate failure | A file reaches 900 lines | File owner | Split by responsibility inside the milestone |
| Plan drift | Wrong build | Code diverges from plan | Manager | Status table in the active plan updated at each exit |

## Documentation close-out requirements

- Active plan / progress tracker: `docs/active_plans/active/roster_expansion.md`, with the status
  table updated at each milestone exit. Reports go in `docs/active_plans/reports/`.
- docs/CHANGELOG.md entry: one per milestone. Rotate with `devel/rotate_changelog.py` past 800
  lines.
- Archive / closure notes: M33 archives the plan and updates DESIGN_DECISIONS and HUMAN_GUIDANCE.
  The dossiers and `assets/README.md` provenance remain.

## Patch plan and reporting format

- Patch 1: M1.
- Patches 2-4: M2, M3, and M4, which run in parallel.
- Patches 5-21: the foundation, the slice, and generalization.
- Patches 22-31: waves.
- Patch 32: balance.
- Patch 33: closeout.
- Report line per milestone: `M<n> <title>: G1|G2 pass | tests <n>/<n> | reviewer <result>`.

## Resolved decisions

- Special trigger: tap `I` or gamepad button 3 to release the highest charged tier (user:
  power-up, simple controls).
- The game is fun and silly, not educational (user). Captions are research-inspired joke lines.
  Science is kept accurate enough to make the joke land. Curiosity is served by an optional
  nobelprize.org link. Every release shows its name and caption; tier 3 adds a super card.
- Starters plus the unlock tree above.
- Tier A uses an authored canonical-rig body that supplies the fighter's hair, clothes, and
  silhouette. Tier B is limited to supported rigid accessories and must pass the same visual gate.
- No v1 migration. v1 storage postdates the last recorded deploy.
- Specials reuse the 8 existing clips through `pose`.
- No git staging protocol. Recovery comes from small milestones and reproducible gates.

## Open questions and decisions needed

- Manager/subagent decision procedure:
  - Decision owner or dedicated class: the `architect` owns schema changes. WS-RIG owns tier
    assignment through the M3 report. WS-BAL owns tuning within the budget rule.
  - Evidence and decision rule: as stated in M2, M3, M20, and M32. Each has a fixed fallback.
- Non-blocking follow-up:
  - Alternate skins, such as Bertozzi's bass-guitar era.
  - Per-fighter arenas.
  - Local two-player play.
