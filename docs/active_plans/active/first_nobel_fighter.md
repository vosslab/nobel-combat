# Plan: Otto Warburg signature fighter

## Context

The first playable foundation now has a fixed 60 Hz combat simulation, a human-proportioned
Mesh2Motion rig, camera controls, AI, and automated browser acceptance. This plan moves the game to
its first research-based fighter while keeping that combat model authoritative.

Use the existing CC0 Mesh2Motion pipeline. Its `doctor_m` model is an adult scientist with glasses,
gray hair, beard, and lab coat. It has the same ordered 66-joint skeleton as `male_5`, so the current
curated clips can animate it directly. Provenance is recorded in [`assets/README.md`](../../../assets/README.md).

Warburg is the signature fighter and must be deliberately stronger than the standard AI opponent.
His research-based moves should draw from cellular respiration, tumor metabolism, and aerobic
glycolysis commonly called the Warburg effect. Keep historical framing accurate: his 1931 Nobel was
for the respiratory enzyme; do not imply it was awarded for a cancer theory or treatment. The
[source dossier](../../WARBURG_SOURCE_DOSSIER.md) records evidence and design limits.

## Contract

- `Match` remains the source of truth for health, movement, attacks, collision, timing, and rounds.
- Fighter-specific mechanics are explicit and concrete for Warburg and the current opponent. Do not
  create a general ability or roster framework before additional fighters require one.
- Skeletal animation, materials, props, and effects observe authoritative fighter state.
- The existing local model and animation files remain vendored; no runtime download is introduced.
- Every milestone has a manager/subagent-only completion path and automated evidence.

## Milestones

| Milestone | Owner | Outcome | Automated validation |
| --- | --- | --- | --- |
| W1 | Asset integration | Complete: Red is the rigged scientist; Blue remains the generic AI opponent. | Local build and browser fixture confirm both models, independent skeletons, state clips, and no console errors. |
| W2 | Warburg combat | Complete: Oxygen Transfer is faster, stronger, and longer than the standard AI heavy. | Deterministic checks prove faster startup, 28/6 damage, 2.45 reach, 72-tick knockdown, held-block behavior, and unchanged AI values. |
| W3 | Research powers | Add distinct Lactate Drive and Aerobic Glycolysis rules without a generic ability framework. | Fixed-tick checks cover action chords, reach, movement, damage, block, cooldown, output-window expiry, charge use, and keyboard/gamepad parity. |
| W4 | Fighter presentation | Name Warburg in the HUD and connect each move to readable rig animation and sourced visual cues. | Forced-state browser capture checks animation, cue timing, screen bounds, and Match/presentation separation. |
| W5 | First-fighter acceptance | Run complete Warburg-vs-AI matches, endurance, and repository gates. | Full browser suite covers both win paths, all moves, restart, crossings, max separation, and zero browser errors. |
| W6 | Roster handoff | Record the smallest next milestone for additional Nobel fighters and Franklin's secret unlock. | Plan identifies source evidence, asset path, concrete owner, and no-human validation for the next fighter. |

## W1: Scientist model (complete)

**Success condition.** Load vendored `doctor_m` for Warburg and `male_5` for the AI from local files.
Both instances remain independently animated by the existing clips and follow the current fighter
positions. The HUD identifies the scientist and opponent.

**Recovery.** Use only the pinned CC0 `doctor_m` GLB and its verified same-rig clips. If Babylon
rejects its transforms, repair the local asset integration without replacing the model with
procedural character geometry.

## W2: Stronger signature move (complete)

**Success condition.** Warburg's existing heavy input launches a named Oxygen Transfer attack with
32 total ticks, active ticks 23 through 16 remaining, 28 unblocked / 6 held-block damage, 2.45 reach,
and 72-tick knockdown. The standard AI heavy remains 36 ticks, active ticks 22 through 15, 24 / 5
damage, 2.2 reach, and 70-tick knockdown. One-hit-per-swing and round rules remain fixed-tick.

**Recovery.** Keep the change inside the concrete Warburg/opponent match contract. Do not buff the
opponent or all heavy attacks to simulate Warburg's strength.

## W3: Metabolism powers

**Success condition.** `J+K` (standard gamepad south+east) triggers Lactate Drive: 16 total ticks,
0.72 units of forward movement during 10 startup ticks, a six-tick active window at 2.0 range, 18
damage / 4 through block, 14-tick hit stun, and a 44-tick cooldown. `J+L` (south+right shoulder)
triggers Aerobic Glycolysis: a 72-tick output window and 150-tick cooldown; movement rises from
0.095 to 0.115 units per tick, and the next ordinary light that connects during the window deals 14
damage / 4 through block and 14-tick stun. A blocked contact consumes the light boost. Neither move
heals or stacks. Tests verify each rule and controller parity. They are bounded game metaphors, not
claims about cancer mechanism or treatment.

**Recovery.** Prefer adapting existing input/state paths. Add a new input or state only when it is
required by the move design; test keyboard and standard-gamepad parity.

## W4: Presentation

**Success condition.** Warburg's scientist silhouette and each move are readable during actual
play. Presentation follows `Match`; it does not alter gameplay volumes or timing.

**Recovery.** Use the existing rig, materials, and small attached visual cues. Avoid procedural human
construction, generalized retargeting, and hypothetical character frameworks.

## W5: Acceptance

**Success condition.** All repository checks, production build, dependency audit, deterministic
combat scenarios, browser match scenarios, and endurance checks pass with Warburg selected by
default and the AI as opponent.

**Residual uncertainty.** Automation measures timing, combat advantage, animation selection,
visibility, and state invariants. Subjective game feel remains non-blocking feedback.

## W6: Next fighter

**Success condition.** Document a dispatchable next milestone for a second Nobel laureate and the
secret Franklin unlock, based on demonstrated needs from Warburg. Do not build roster infrastructure
before a second playable fighter requires it.
