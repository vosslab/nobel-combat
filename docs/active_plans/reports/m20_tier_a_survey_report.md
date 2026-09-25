# M20 Tier A candidate check

## Candidate and source

The survey tested **Scholar Swordsman** by NguyenTruongAn from the
[Gobkit community page](https://gobkit.com/s/mhhai2gmnwin). The page labels it CC0 and permits
commercial use, modification, and redistribution; its embedded license field points to the
[Creative Commons CC0 1.0 dedication](https://creativecommons.org/publicdomain/zero/1.0/). The
downloaded GLB remains in `/private/tmp/nobel_combat_m20/scholar-swordsman.glb`; it was not added to
the repository.

The file is 432,192 bytes and contains one 39-joint humanoid skeleton, 40 nodes, and 6,598
triangles. It has named `idle`, `walk`, `run`, `attack`, and `hurt` clips. Retargeting the eight
required game states produced 69 target channels for each state. The scratch proof and eight state
captures are under `/private/tmp/nobel_combat_m20/scholar-proof/`.

## Rendered state evidence

An independent image review found attached limbs and a continuous model in all eight captures, but
the named combat states were not consistently readable:

| State | Limb integrity | State readability                                            |
| ----- | -------------- | ------------------------------------------------------------ |
| idle  | Pass           | Weak; reads as a transitional ready pose                     |
| move  | Pass           | Pass; reads as a step or run phase                           |
| light | Pass           | Weak; could be an attack windup or recovery                  |
| heavy | Pass           | Weak; the pose does not clearly read as a heavy strike       |
| block | Pass           | Weak; the extended-arm pose does not clearly read as a guard |
| hit   | Pass           | Fail; the inverted pose reads as a flip or ragdoll           |
| down  | Pass           | Weak; the folded pose does not clearly read as grounded      |
| getup | Pass           | Fail; the folded pose does not read as recovery              |

## Candidate decision

The candidate passes channel coverage and visible limb integrity but fails the plan's eight-state
readability requirement, especially for `hit`, `down`, and `getup`. It is not assigned to Tier A.
This result applies to this body; it does not rule out another model that uses the canonical
Mesh2Motion skeleton.

## Production rig contract

The subsequent review of Curie's period-dress asset found that matching names and mapped ancestry do
not prove a different rig's bind pose, bone roll, or skin weights can follow the local combat clips.
The asset's separately authored IK structure is not a supported runtime animation contract. Removing
the foot and toe mappings reduced the spider-like pose in one capture, but did not establish a safe
deformation contract for the unmatched rig.

Curie now uses the CC0 Mesh2Motion `female_31` body, which has the canonical ordered 66-joint
skeleton. The retired period-dress GLB remains documented as provenance, outside the runtime
manifest. Production tests enforce exact ordered skeleton equality for every roster body and full
joint coverage for every combat clip. Models with another skeleton remain unassigned unless they are
authored to the canonical rig and pass the same eight-state gate.
