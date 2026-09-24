# Plan: Otto Heinrich Warburg signature fighter

## Context

The first playable foundation now has a fixed 60 Hz combat simulation, a human-proportioned
Mesh2Motion rig, camera controls, AI, and automated browser acceptance. This plan moves the game to
its first research-based fighter while keeping that combat model authoritative.

Use the existing CC0 Mesh2Motion pipeline. Its `doctor_m` model is an adult scientist with glasses,
gray hair, beard, and lab coat. It has the same ordered 66-joint skeleton as `male_5`, so the current
curated clips can animate it directly. Provenance is recorded in [`assets/README.md`](../../assets/README.md).

Warburg is the signature fighter and must be deliberately stronger than the standard AI opponent.
His research-based moves should draw from cellular respiration, tumor metabolism, and aerobic
glycolysis commonly called the Warburg effect. Keep historical framing accurate: his 1931 Nobel was
for the respiratory enzyme; do not imply it was awarded for a cancer theory or treatment. The
[source dossier](../WARBURG_SOURCE_DOSSIER.md) records evidence and design limits.

## Contract

- `Match` remains the source of truth for health, movement, attacks, collision, timing, and rounds.
- Fighter-specific mechanics are explicit and concrete for Warburg and the current opponent. Do not
  create a general ability or roster framework before additional fighters require one.
- Skeletal animation, materials, props, and effects observe authoritative fighter state.
- The existing local model and animation files remain vendored; no runtime download is introduced.
- Every milestone has a manager/subagent-only completion path and automated evidence.

## Milestones

| Milestone | Owner                    | Outcome                                                                                                | Automated validation                                                                                                                                        |
| --------- | ------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1        | Asset integration        | Complete: Red is the rigged scientist; Blue remains the generic AI opponent.                           | Local build and browser fixture confirm both models, independent skeletons, state clips, and no console errors.                                             |
| W2        | Warburg combat           | Complete: Oxygen Transfer is faster, stronger, and longer than the standard AI heavy.                  | Deterministic checks prove faster startup, 28/6 damage, 2.45 reach, 72-tick knockdown, held-block behavior, and unchanged AI values.                        |
| W3        | Research powers          | Complete: add distinct Lactate Drive and Aerobic Glycolysis rules without a generic ability framework. | Fixed-tick and browser checks cover action chords, reach, movement, damage, block, cooldown, output-window expiry, charge use, and keyboard/gamepad parity. |
| W4        | Fighter presentation     | Complete: connect each move to its rig animation and a readable sourced visual cue.                    | Browser capture checks move labels, cue timing, screen bounds, and that presentation does not alter Match state.                                            |
| W5        | First-fighter acceptance | Complete: Warburg-versus-AI passes repository, build, audit, and browser acceptance.                   | Five browser tests pass, including six complete matches, 14,760 randomized/idle ticks, camera traversal, input parity, and state captures.                  |
| W6        | Roster handoff           | Complete: start the Marie Curie asset and research plan.                                               | `next_nobel_fighter.md` has owners, source evidence, asset checks, and automated completion gates.                                                          |

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

## W3: Metabolism powers (complete)

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

## W4: Presentation (complete)

**Success condition.** Oxygen Transfer shows a brief ring on contact; Lactate Drive uses the jab clip
while its authoritative rush advances the fighter; Aerobic Glycolysis shows a HUD label, bounded
output meter, and ground ring during its active window. The visuals observe `Match` and do not change
gameplay volumes or timing. Browser scenarios capture Oxygen Transfer contact, Lactate Drive startup,
the output window, and a powered light.

**Recovery.** Use the existing rig, materials, and small attached visual cues. Avoid procedural human
construction, generalized retargeting, and hypothetical character frameworks.

## W5: Acceptance (complete)

**Success condition.** All repository checks, production build, dependency audit, deterministic
combat scenarios, browser match scenarios, and endurance checks pass with Warburg selected by
default and the AI as opponent. Verified on 2026-09-23: `./check_codebase.sh` passed 19/19,
`./build_github_pages.sh` passed, `npm audit --audit-level=high` found zero vulnerabilities, and
`npx playwright test --workers=1` passed all five tests. The suite completed six matches (three
keyboard and three synthetic gamepad), both player/AI win paths, 14,760 randomized and idle ticks,
crossing/camera tests, combo parity, and no browser errors. Eight combat-state screenshots and four
research-move screenshots are in ignored `test-results/` evidence directories.

**Residual uncertainty.** Automation measures timing, combat advantage, animation selection,
visibility, and state invariants. Subjective game feel remains non-blocking feedback.

## W6: Next fighter handoff (complete)

**Success condition.** Start [`next_nobel_fighter.md`](next_nobel_fighter.md) with Marie Curie as the
next real playable, based on the official 1903/1911 Nobel records and an existing same-rig CC0 human
asset. Do not build a generic roster or ability framework; Curie's direct rules and the first
player-select control can expose whether a small selection flow is now needed. Keep Rosalind
Franklin's secret unlock as a later explicit milestone.

### Later asset packaging correction

The W1 acceptance used `male_5` as the live AI opponent. After role-specific fighter models were
integrated, it became a source-level rig compatibility fixture and was removed from production
build output. Current shipped fighter assets are listed in [`assets/README.md`](../../assets/README.md).
