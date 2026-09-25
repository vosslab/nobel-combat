# McClintock vertical slice

## Status

M14 is complete in [roster_expansion.md](../active/roster_expansion.md). McClintock's registry entry,
three special effects, and authored canonical-rig body are integrated. The body carries readable
1947 laboratory cues: a light buttoned smock, wide pointed collar, throat clasp, dark swept hair,
and round wire glasses. Independent review of exact-SHA captures passed all eight states in both
ordinary roster positions, including down and getup. The comparison fighters retained Curie and
Franklin HUD labels; the receipts prove the candidate GLB bytes were served, while the separate
visual review assessed the candidate body itself.

## Files

The fighter's identity and authored moves remain registry data. The shared renderers consume effect
records and motifs; they do not branch on McClintock's fighter id.

| Area | Files | Change |
| --- | --- | --- |
| Fighter data | `src/roster/fighters_genetics_molecular_biology.ts` | Registry entry, stats, body path, and starter status; glasses are part of the authored body |
| Body asset | `assets/models/mesh2motion_mcclintock.glb` | Authored weighted body with native canonical-rig clips |
| Asset provenance | `assets/models/MANIFEST.txt`, `assets/README.md` | Runtime model listing and source/cue provenance |
| Special data | `src/roster/special_drafts.ts` | Three M2-schema specials, including authored genetic motifs |
| Shared visuals | `src/vfx.ts` | Effect-driven paired helices, maize chromosome and cob, motif-tagged gap |
| Focused checks | `tests/test_roster_registry.mjs`, `tests/test_vfx.mjs` | Registry and distinct projectile-pattern projection contracts |
| Human-readable docs | [CHANGELOG.md](../../CHANGELOG.md), [DESIGN_DECISIONS.md](../../DESIGN_DECISIONS.md), [roster_expansion.md](../active/roster_expansion.md) | Change record, native rig and VFX decisions, current gate status |

Temporary appearance evidence is in `/private/tmp/nobel-combat-m14-joint-order/verified-wrapper/`;
each position has a receipt with the candidate and served SHA. The image review used the 1947
Smithsonian laboratory photograph linked from the source dossier. That seated reference supports
the visible upper-body cues but does not establish shoes, a full standing silhouette, or combat poses.

## Validation

- `./check_codebase.sh`: 47/47 Node tests; typecheck, lint, and formatting pass.
- `./build_github_pages.sh`: passes after the VFX changes.
- The latest independent image review passes Ac/Ds, Maize Chromosome, and TRANSPOSON, including the
  chromosomal gap and unobstructed match cards.
- The seeded production `Match` run completes all 20 McClintock-versus-Warburg matches. It releases
  each tier across the run and records a 2-0 McClintock win in every match.
- Curie's native-rig capture review passes all eight combat states with connected limbs.
- The first full serial Playwright run reached 36/37. Franklin's endurance traversal recorded
  `maxZ = 1.4557` against a fixed-hold threshold of 2. The fixture now holds real keyboard input
  until Franklin reaches both arena corners, retaining the original movement and bounds thresholds.
- The focused rerun then exposed a one-frame stale-fighter render after restart or round reset. The
  render loop now reads `Match.fighters` again before presentation, so rigs, hit cues, and camera
  framing use the current fighter objects.
- The earlier final serial Playwright run passed 37/37 in 11.4 minutes. On 2026-09-25, the
  post-audit serial run passed 36/36 in 11.2 minutes. The extra Franklin endurance matrix from
  that run now lives under ignored `tests/_temp/`; the permanent browser suite has 35 cases.
- The McClintock body passed the rig-boundary, repair, and roster checks (8/8), the Pages build, and
  an identity no-op repair check against the source rig. The repository capture command served the
  candidate SHA in both ordinary positions across idle, move, light, heavy, block, hit, down, and
  getup, with no browser errors. Independent visual review found the smock, hair, and glasses
  readable at match scale and no visible deformation.

## Curie review receipt

On 2026-09-25, independent visual evaluation of ignored fresh browser captures at
`test-results/rig-states-curie-c9/` and `test-results/rig-states-curie-player-c9/` passed for
deformation coherence. Curie was reviewed in both ordinary match slots across idle, move, light,
heavy, block, hit, down, and getup: all 16 stills show a connected, human-proportioned body, with
no spider-like silhouette, detached limbs, torso/head separation, floor clipping, or pose collapse.

This receipt covers static 1280x800 samples only. It does not establish continuity between poses,
brief one-frame rig failures, or all camera and collision conditions.

## Friction

The early appearance-kit experiment could not make the glasses or smock read at match distance;
enlarging attached pieces made them detach. The accepted fix is a complete authored canonical-rig
body, not generalized garment geometry. McClintock's glasses are integrated into that body, so her
registry does not add a second pair through an appearance kit.
