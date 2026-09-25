# M3 look test report

This report records the M3 look-test and Tier A survey evidence required by
[indexed-tumbling-quokka.md](../indexed-tumbling-quokka.md). It is a planning report: it assigns no
production body, changes no roster data, and leaves the temporary roster filename unchanged.

**Historical scope.** M19 and M20 supersede the kit and rig recommendations below. This report
preserves M3 experiment evidence; its candidate pieces and old Tier B assignment are not the current
production contract. See the [current appearance milestones](../indexed-tumbling-quokka.md#milestone-m19-appearance-kits).

**Motion-contract update (M20).** The temporary cross-rig mapping described below was an exploratory
proof only. The production contract now requires the canonical ordered 66-joint Mesh2Motion
skeleton and direct native clip cloning. The separately rigged candidates tested here remain
rejected; Curie uses the compatible Mesh2Motion `female_31` variant. See
[`m20_tier_a_survey_report.md`](m20_tier_a_survey_report.md) for the corrective evidence.

## Lineup result

`tests/_temp/look_test.mjs` produced 1600 x 900 idle and heavy lineup captures beside the three
existing fighters. It built the three trial looks with Babylon `MeshBuilder` pieces parented to the
current bodies' head, chest, and pelvis bones. The harness reported 22 kit meshes and three active
heavy-pose caricatures, with no browser errors.

An independent `image_evaluator` reviewed both captures at gameplay scale.

| Fighter                  | Idle and heavy result | Evidence and limit                                                                                                                                               |
| ------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thomas Steitz            | PASS                  | White temple-side hair sits against the head; dark wire glasses remain perceptible against the pale face; and the dark jaw geometry reads as a chin-strap beard. |
| Dorothy Crowfoot Hodgkin | PASS                  | Gray wavy hair, burgundy cardigan, and dark skirt remain separately readable.                                                                                    |
| Roger Tsien control      | PASS                  | The restrained brown hair cap follows the head and does not dominate the silhouette.                                                                             |
| All three kits           | PASS                  | The evaluator found no detached head kit, clothing intersection, or pose-specific floating or clipping.                                                          |

The heavy capture crops lower legs at the image edge. It therefore does not establish foot placement
in that pose, but it does cover the requested kit readability and attachment review.

## Historical kit experiment

These are the pieces tested in the original trial, not the supported production kit:

| Piece type                        | Demonstrated use                                             |
| --------------------------------- | ------------------------------------------------------------ |
| Head-attached hair tufts and caps | Steitz temple hair, Hodgkin waves, and the Tsien control cap |
| Head-attached beard tube          | Steitz chin strap                                            |
| Wire glasses                      | Steitz's paired torus frames and bridge                      |
| Chest overlay                     | Hodgkin cardigan and the Tsien jacket and shirt              |
| Pelvis-attached skirt             | Hodgkin's skirt silhouette                                   |
| Material tint                     | Hodgkin's muted base-body tint                               |

Some pieces read in these captures, but later pose-state reviews found that generic hair, clothing,
and tint treatments could detach, clip, or blur fighter identity. Current appearance kits are limited
to glasses, facial hair, and one prop. Hair, clothing, and silhouette cues belong in authored
canonical-rig bodies.

## Tier A survey method

In the M3 trial, Tier A meant a uniquely selected generic CC0 human body with a useful garment or
build, adapted by an explicit bone map and kit. The current M20 contract instead requires a
canonical ordered skeleton and direct native clips. The search covered
Quaternius, Kenney, OpenGameArt's CC0 material, and Poly Pizza's CC0 material. The plan permits at
most three motion proofs after intake; all three qualifying ready bodies were tested.

Each qualifying body was downloaded only to scratch space, mapped through the current
`AnimatorAvatar` approach, and sampled in idle, move, light, heavy, block, hit, down, and getup.
The temporary map covered 23 principal source joints and created 69 target channels for every clip.
Channel creation alone did not count as a passing motion proof.

## Ready CC0 body candidates

| Candidate                   | Direct source                                                  | Explicit license evidence               | Garment or build                                          | Skin joints | Eight-state motion result                                                                                                                                                |
| --------------------------- | -------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------- | ----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Quaternius Worker           | [Poly Pizza Worker](https://poly.pizza/m/Yg2bQZO6Hj)           | `FBX/GLTF format - Public Domain (CC0)` | Hardhat, orange safety vest, work boots; adult male build |          62 | REJECTED. All clips created 69 target channels, but the captured poses were malformed and did not meet readable-pose or limb-integrity evidence.                         |
| Quaternius Business Man     | [Poly Pizza Business Man](https://poly.pizza/m/JFrLIKqvCH)     | `FBX/GLTF format - Public Domain (CC0)` | Formal suit; adult academic-like build                    |          62 | REJECTED. Mesh continuity passed, but idle was twisted; move appeared airborne or tumbling; guard and strikes were unclear; hit and getup were near vertically inverted. |
| Quaternius Casual Character | [Poly Pizza Casual Character](https://poly.pizza/m/kZ3DmIoGip) | `FBX/GLTF format - Public Domain (CC0)` | Long-sleeve shirt, pants, trainers; slim adult build      |          62 | REJECTED. Mesh continuity passed, but move, attacks, guard, and hit were unclear; down and getup were inverted and did not read as grounded recovery.                    |

The Worker, Business Man, and Casual Character each come from Quaternius' CC0 animated-character
material. Their direct Poly Pizza listings supply the quoted ready-format and CC0 evidence above.
The repeated root-space and orientation failure across three different bodies is evidence that these
retarget proofs failed. It does not establish that every untested shared-rig body fails.

## Nearby nonqualifiers

| Candidate                                           | Direct source                                                                                        | License evidence                                    | Garment or build                                             | Joint result                                                     | Intake decision                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Kenney Blocky Characters, character-a               | [Kenney asset page](https://www.kenney.nl/assets/blocky-characters)                                  | `License: Creative Commons CC0`                     | Geometric clothing variants                                  | 0 skin joints; 27 node animations and no `skins` object          | REJECTED. Node animation cannot use the skeletal `AnimatorAvatar` route.               |
| Girush Base Rigged Stylized Humanoid Character (YW) | [OpenGameArt asset page](https://opengameart.org/content/base-rigged-stylized-humanoid-character-yw) | `This asset is released under CC0 / Public Domain.` | Slim anime-proportioned base body without a distinct garment | No ready GLB/glTF proof; download contains `.blend` and textures | REJECTED. It requires conversion and does not supply the required garment distinction. |

The Poly Pizza results in the ready-candidate table are the qualifying Poly Pizza results found and
tested. No candidate from the nearby nonqualifying set consumed a motion-proof slot.

## Independent eight-state evaluations

Still images cannot establish animation timing, transition continuity, looping, or foot contact. They
can establish whether the sampled endpoint reads as its named combat state and whether the mesh has
obvious limb collapse. The independent evaluator findings were:

| Candidate        | Idle                            | Move, attacks, and guard                                                             | Hit, down, and getup                                                              | Verdict |
| ---------------- | ------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------- |
| Worker           | Rigid arms and wrists           | Move was unreadable; light and heavy did not read as strikes; block was incoherent   | Hit was inverted; down was an unclear compact cluster; getup remained upside down | FAIL    |
| Business Man     | Twisted, staggered neutral pose | Tilted or airborne move; light, heavy, and block did not read as named combat states | Hit and getup were near vertically inverted; down was not grounded                | FAIL    |
| Casual Character | Somewhat readable               | Move, light, heavy, block, and hit did not consistently read                         | Down and getup were inverted and airborne rather than grounded                    | FAIL    |

All three failed the then-current complete all-eight-state requirement. These results remain
historical evidence; they do not select bodies for the current canonical-rig tiers.

## Slot assignment

The original M3 plan provisionally assigned all 22 new fighters to Tier B. M19 and M20 supersede
that assignment. Current body and accessory acceptance lives in the canonical roster plan.
