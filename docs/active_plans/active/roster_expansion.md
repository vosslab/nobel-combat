# Nobel Combat roster expansion status

The implementation contract is the [canonical roster-expansion plan](../indexed-tumbling-quokka.md).
This file records status and active dependencies only. Detailed deliverables, acceptance criteria,
and design decisions belong in the canonical plan and its linked reports.

## Milestone status

| Milestone | Status | Evidence or dependency |
| --- | --- | --- |
| M1 Docs baseline | Complete | Canonical plan and recorded decisions |
| M2 Special schema proof | Complete | [Special schema report](../reports/special_schema_report.md) |
| M3 Look test and Tier A survey | Complete | [Look-test report](../reports/look_test_report.md) |
| M4 Roster dossiers | Complete | Category dossier documents |
| M5 Roster registry | Complete | Shared registry |
| M6 Match on registry | Complete | Registry-driven combat |
| M7 Presentation on registry | Complete | Registry-driven UI |
| M8 Two-instance loader | Complete | Lazy two-instance loading |
| M9 Special input and meter | Complete | Shared charged release |
| M10 Special building blocks | Complete | Schema-driven building blocks |
| M11 Special effects and captions | Complete | Captions and shared effects |
| M12 Generic AI | Complete | Profile interpreter |
| M13 Unlock v2 | Complete | Versioned progress record |
| M14 McClintock end-to-end fighter | Complete | Promoted the sealed rich-v4 `female_9` donor unchanged (SHA-256 `6dbf479fa42e78d1890539a19dfd70953e545cd8894ea6efe4e8dafaad720d07`) after a readiness-bound ordinary-gameplay comparison. Existing two-slot sixteen-state evidence binds the same bytes; the refreshed runtime portrait is receipt-bound. Her feminine face, dark hair, wire glasses, and light coat meet the Curie/Warburg gameplay-caricature standard. The generated-head graft remains an unregistered experiment. |
| M15 Originals on meter | Complete | One Special control for all fighters |
| M16 Super card | Complete | Tier-three title card |
| M17 Chooser grid | Complete | Grouped chooser and navigation |
| M18 Opponent selection | Complete | Seeded unlocked-opponent selection |
| M19 Appearance kits | Complete | Rigid-accessory-only kit contract |
| M20 Native rig adaptation | Complete | Canonical-rig bodies and direct clips |
| M21 Roster smoke harness | Complete | Four-fighter smoke coverage |
| M22 Wave 1 models | In progress | Goodenough V9 and Buck's simple-donor v2 are accepted under the revised gameplay-caricature standard. Hodgkin remains in its independent identity lane. |
| M23 Wave 1 fighters | In progress | Goodenough and Buck are playable starters; each other fighter integrates when its own body and direct unlock prerequisites are ready |
| M24 Wave 2 models | In progress | Doudna's sealed rich-v5 donor is accepted under the gameplay-caricature standard and is now registered; Strickland V3, Tsien V5, Bertozzi V13, and Levi-Montalcini V12 remain in independent model lanes |
| M25 Wave 2 fighters | In progress | Doudna is playable through `winAs McClintock`; each other fighter integrates when its own accepted body and direct unlock prerequisites are ready |
| M26 Wave 3 models | In progress | Steitz's donor and stock MPFB2 lines are retired; Anfinsen's Goodenough V14/V15 donor, sparse-morph/PCA-fit, and neutral bitmap-head v2 proofs are retired; Baker's procedural V14/V15 line is retired; Frank V11's plain head is primitive, while Blackburn V12 failed its paused face gate and needs a fresh detailed source |
| M27 Wave 3 fighters | Queued | Each fighter may integrate when its own accepted body and direct unlock prerequisites are ready |
| M28 Wave 4 models | In progress | Cech V1 and Altman V13 fail the revised face/hair gate; Baltimore V5 and Karikó V18 have primitive plain heads and need fresh detailed sources, as does Altman |
| M29 Wave 4 fighters | Queued | Each fighter may integrate when its own accepted body and direct unlock prerequisites are ready |
| M30 Wave 5 models | In progress | Bardeen V2, Sharpless V3, and Herzberg V9 fail the face/rich-body gate; Gabor V18's plain head is primitive, and its bounded two-source detailed-head survey is a no-go |
| M31 Wave 5 fighters | Queued | Each fighter may integrate when its own accepted body and direct unlock prerequisites are ready |
| M32 Balance diagnostic | Queued | Depends on M31 |
| M33 Closeout | Queued | Depends on M32 |

## Current dependency

M14 is complete under the gameplay-caricature standard. The sealed rich-v4 `female_9` donor is
the runtime body, unchanged at SHA-256
`6dbf479fa42e78d1890539a19dfd70953e545cd8894ea6efe4e8dafaad720d07`.
The readiness-bound comparison in
`tests/_temp/roster_work/m14/mcclintock/simple-donor-comparison/captures-v2/`
and the refreshed portrait receipt establish the ordinary-gameplay route. Its feminine face,
dark hair, wire glasses, light coat, and compact silhouette meet the Curie/Warburg fidelity
anchor; its tied-back hair is an acceptable supporting difference at match scale. The generated
head graft remains a preserved, unregistered experiment whose assembly was unusable at the game
camera. That does not establish a general quality verdict about generated faces.

The active model lanes are Hodgkin and the remaining Wave 2 fighters. Goodenough V9, Buck's
simple-donor v2, and Doudna's rich-v5 donor have complete playable integrations.

A one-pass McClintock `female_9` UV face-decal and head-skinned hair-card proof also failed before
costume, rig repair, combat capture, or registry work. The original cue bitmap improved brow and
eye placement, but three-quarter renders retained the donor's young generic eyes, nose, jaw, and
baked face; its four flat hair cards read as paper strips. This rejects that paper-card experiment.
Bitmap face cues and mapped hair may still support a compatible head when they read cleanly at
ordinary gameplay scale.

The original 1947-photo Pixal3D input is retired. Its texture run was interrupted before producing
a GLB; one authorized outside-sandbox Metal geometry-only retry completed a 114 MB,
3.3-million-vertex GLB. Corrected front and three-quarter renders expose duplicate facial relief
and a fused oversized hair shell, so that source fails before decimation, rigging, clothing,
runtime capture, or registry work. A separate original front-and-three-quarter McClintock concept
has a clay geometry proof that passes the source-art review. Its painted preview is invalid because
the camera faced the back; the source coordinate fix is ready but has not rendered during the load
hold. Run one lightweight front preview before deciding whether the concept can advance. The production TypeScript
configuration scopes compilation to `src/`, tracked `tests/`, `devel/`, and root
`playwright.config.ts`, excluding ignored `tests/_temp/` evidence; the current Pages build passes.

The original-fighter visual recheck also [reopened Franklin](../workstreams/franklin_visual_rebuild.md):
her registered `female_9` body and derived portrait show a detailed but wrong face and long hair
against the dated 1950 reference. Its bounded short-wave revision retained a generic face and
tube-loop hair, so `female_9` is retired for Franklin. Replace the body from a face-approved
source, then regenerate the portrait from the accepted runtime asset.

The model and fighter gates remain independent by fighter. Integrate a fighter as soon as that
fighter's body has passed review, its exact accepted asset and provenance are available, and the
registry already contains every direct prerequisite named by its actual unlock rule. Do not hold it
for its whole model wave, a predecessor wave, or arbitrary wave completion; do not alter the unlock
tree to bypass an unfinished prerequisite. The tracked authoring scripts are under
`devel/roster_candidates/`; the candidate workstream files below keep the source evidence, receipts,
review verdicts, and next actions.

## Current fighter candidate gates

| Wave / fighter | Current artifact | Gate and next action |
| --- | --- | --- |
| M22 Hodgkin | original face art v2 `3a8e148f...b123e90` | V18, MPFB, and CC0 Old Lady sources failed. The new art conditionally passes for soft oval cheeks, gentle eyes, rounded nose, and closed mouth; hair is still too full for the 1970 low wave. Run one lightweight geometry proof before any rig or FighterDef work. [Handoff](../workstreams/roster_candidate_m22_hodgkin.md) |
| M22 Goodenough | live V9 `62f9a8aa...aafa77b55` | Accepted under the gameplay-caricature standard: dark short hair and the formal suit read at match scale, and glasses are not an established cue. [Handoff](../workstreams/roster_candidate_m22_goodenough.md) |
| M22 Buck | runtime simple-donor v2 `ce507021...7c4d04` | Complete playable starter. The preserved native face and hair plus charcoal cardigan and ivory blouse read coherently at gameplay scale; two-slot eight-state evidence and the runtime portrait bind the exact shipped body. [Handoff](../workstreams/roster_candidate_m22_buck.md) |
| M24 Doudna | runtime rich-v5 `2baf62ba...09dea39a` | Complete playable fighter. The detailed native face, pale shoulder-length hair, and black zip-front silhouette meet the gameplay-scale caricature standard; its sealed two-slot eight-state evidence and runtime portrait bind the shipped body. [Handoff](../workstreams/roster_candidate_m24_doudna.md) |
| M24 Tsien | v5 `2dcc9741...3b93f76f` | Rejected after new exact-byte paused face capture: featureless spherical face, ribbed cap, and detached-looking oval frames. Retire the primitive V4/V5 body line; seek a detailed face source before another combat capture. [Handoff](../workstreams/roster_candidate_m24_tsien.md) |
| M24 Strickland | v3 `9f96f4f9...f99534d8` | Rejected: rich donor long hair and unreadable glasses fail face/hair review; hand-written weighted additions detach in ordinary motion. Retire v2 under the richer standard and retire the v3 MJS addition line. [Handoff](../workstreams/roster_candidate_m24_strickland.md) |
| M24 Levi-Montalcini | fresh detailed source needed | The plain V12 head is primitive and fails face review before further capture. A bounded two-source detailed-head survey also rejected the generic bald Vitruvian head and Curie's older white-updo source. [Handoff](../workstreams/roster_candidate_m24_levi_montalcini.md) |
| M24 Bertozzi | fresh detailed source needed | Exact-byte two-slot capture keeps V13 motion coherent but rejects its smooth oval face and pill-like hair slabs. V13 exhausts the V11 body line; begin from a face-approved detailed donor. [Handoff](../workstreams/roster_candidate_m24_bertozzi.md) |
| M26 Baker | v15 `9aa5cc61...59b3f4d7431` | Exact-byte two-slot motion passes, but bald cap, side rolls, detached glasses, and shirt tabs fail the face/rich-body gate. Retire the procedural V14/V15 line. [Handoff](../workstreams/roster_candidate_m26_baker.md) |
| M26 Steitz | fresh source needed | `doctor_m` V1 passed motion but failed coat and distinction from Warburg; its one weighted tunic cannot cleanly form a jacket. A stock MPFB2 source-only head also failed for slick hair and an artificial beard. Find a face/hair source before rigging. [Handoff](../workstreams/roster_candidate_m26_steitz.md) |
| M26 Frank | fresh detailed source needed | The plain V11 head is primitive and fails face review before further capture. [Handoff](../workstreams/roster_candidate_m26_frank.md) |
| M26 Anfinsen | fresh detailed source needed | Goodenough V14/V15 are retired. A 57-vertex donor morph did not overcome the donor face, and a 20-PCA 2D fit produced a broad jaw and heavy brow with unstable coefficients, so both proofs stop before a body or rig. Neutral bitmap-head v1/v2 fail as assets: v1 had a hard grayscale mask, blank side face and neck, and oversized beret hair; v2 does not clear close review. No head graft, GLB, or FighterDef work followed. [Handoff](../workstreams/roster_candidate_m26_anfinsen.md) |
| M26 Blackburn | fresh detailed source needed | V12 `49f6bf3c...317b52a9` passed structural and loader preflight but fails the paused face gate: a smooth oval, horn-like hair masses, and oval glasses do not establish Blackburn. It is retired before the two-slot matrix; no FighterDef work followed. [Handoff](../workstreams/roster_candidate_m26_blackburn.md) |
| M28 Karikó | fresh detailed source needed | The plain V18 head is primitive and fails face review before further capture. [Handoff](../workstreams/roster_candidate_m28_kariko.md) |
| M28 Altman | fresh detailed source needed | Exact-byte two-slot capture keeps V13 motion coherent but rejects its featureless oval face and cap-like hair. V13 exhausts the V11 body line; begin from a face-approved detailed donor. [Handoff](../workstreams/roster_candidate_m28_altman.md) |
| M28 Cech | v1 `d5d055d8...a7b3364e1` | Sampled motion and receipts pass; revised face/hair review fails because the generic donor face, glasses, and gray hair do not establish Cech. [Handoff](../workstreams/roster_candidate_m28_cech.md) |
| M28 Baltimore | fresh detailed source needed | The plain V5 head is primitive and fails face review before further capture. [Handoff](../workstreams/roster_candidate_m28_baltimore.md) |
| M30 Sharpless | v3 `aee5b9fc...ae687` | Exact-byte two-slot capture rejects its featureless oval face, slab hair, detached glasses, and primitive body. Seek a licensed detailed source. [Handoff](../workstreams/roster_candidate_m30_sharpless.md) |
| M30 Bardeen | v2 `01be2351...8831d42` | Sampled motion and receipts pass; revised face/hair review rejects the primitive mannequin body. Start from a detailed face source. [Handoff](../workstreams/roster_candidate_m30_bardeen.md) |
| M30 Gabor | fresh detailed source needed | The plain V18 head is primitive and fails face review before further capture. A bounded two-source detailed-head survey rejected the angular goatee-like Rak source and the live `doctor_m` donor. [Handoff](../workstreams/roster_candidate_m30_gabor.md) |
| M30 Herzberg | v9 `6c8abb83...1a9bb` | Exact-byte two-slot motion passes, but the smooth face and cap hair fail identity; retire V7/V9. [Handoff](../workstreams/roster_candidate_m30_herzberg.md) |

## Current verification record

- M14 and M21: on 2026-09-25, G1 passed with 48/48 Node tests, strict TypeScript, lint, and format
  checks; the Pages build, Markdown-link check, and `git diff --check` passed. Focused roster-smoke
  and paused-chooser cases passed, and the serial Playwright suite passed 35/35 in 9.6 minutes. The
  audit made model-manifest freshness checking read-only, preserved overlapping projectile visuals
  with lazily grown and reused meshes, generalized registry-pair capture, and made roster smoke
  inspect projected enabled-mesh bounds. The first in-sandbox McClintock capture could not launch
  Chromium because macOS denied `MachPortRendezvous`; it was rerun outside the sandbox with the
  repository command. Details are in the [vertical-slice report](../reports/vertical_slice_report.md).
- M14 appearance history: the earlier primitive body and the rich donor-preserving V2 were both
  superseded at the existing runtime path by the sealed rich-v4 donor (SHA-256
  `6dbf479fa42e78d1890539a19dfd70953e545cd8894ea6efe4e8dafaad720d07`). Its readiness-bound
  ordinary-gameplay comparison and refreshed receipt-bound chooser portrait passed under the
  Curie/Warburg caricature standard; the existing exact-SHA two-slot sixteen-state evidence applies.
- Current chooser portraits bind all seven registered runtime bodies to their served bytes.
  Receipts, manifest checks, and Pages copying pass; each head is prominent, unclipped, and clear
  of the HUD. This improves selection evidence only and does not accept unrelated open model lanes.
- The browser game and normal authoring previews must stay lightweight. The five current runtime
  actors contain 922 (Warburg), 3,994 (Curie), 1,368 (Franklin), 5,322 (McClintock), and 1,996
  (Goodenough) triangles. A 9.6-million-face offline McClintock source was never registered.
  Reduce a rich source before repeated review, rigging, or browser capture; retain the native source
  offline. Avoid nested whole-mesh diagnostic scans, serialize heavyweight offline jobs, and do not
  auto-resume high-resolution generation during a load hold.
- 2026-09-25 M22: both-slot, eight-state reviews found Hodgkin v5, Goodenough v5, and Buck v5
  visually inadequate. Their exposed/mannequin or badge/helmet-like cues remain unreadable at match
  scale. Goodenough and Buck author-source migrations regenerated their GLBs to new SHAs after the
  old receipts were made; those generated files are unreviewed, and both v5 candidates are retired.
- 2026-09-25 M24: Tsien v5 passed the older 16-state motion check but failed the later exact-byte
  paused face review; Levi-Montalcini v4 passed down/getup in both slots and can receive appearance
  work. Bertozzi v4 failed body coherence and appearance despite passing structural and loader checks.
- 2026-09-25 M26: Anfinsen v3, Frank v2, and repaired Steitz v4 passed the early down/getup gate.
  Anfinsen's later Goodenough-donor V14/V15 face line is retired after the V15 cheek-patch failure;
  Baker v9 and Blackburn v4 remain coherent but fail their final appearance gates.
- 2026-09-25 M28: Cech's old motion pass was reopened and its generic face failed the current
  identity gate. Altman v2 and Baltimore v2 passed the early body gate; Kariko needs a fresh source.
- 2026-09-25 M30: Bardeen's old motion pass was reopened and its primitive body failed the current
  face gate. Sharpless v2 passed the early body gate. Gabor v5 retains a robot silhouette, and
  Herzberg v5 does not make the coat/vest/tie read at match scale.
- Candidate authoring source is tracked in `devel/roster_candidates/`; generated GLBs and visual
  captures remain in ignored `tests/_temp/roster_work/`. New wrapper captures seal the served bytes
  in a SHA-named GLB beside their receipts and screenshots.
- Current appearance workflow: use web image search, including `young <name>` for early-career views,
  then verify candidate identity/date against the dated archive or institutional sources selected
  and described in each roster dossier.
- M19 and M20 history: two-slot captures retired whole-body `clothingTint` and generic garments.
  Curie's earlier `female_31` route passed deformation review but failed identity because it rendered
  an older bearded man. The corrected registry now routes Curie to `mesh2motion_curie_period.glb`;
  no cross-fighter fallback is involved.
- 2026-09-25 Curie: original-roster captures showed the wrong `female_31` model in both ordinary
  positions. Period-model v1 rendered off-camera. Corrected V2 (SHA-256
  `cf3f4ccbd838e53b2995824bfa0ecc56c930916b7cd457e73a21daa5d72e1a96`) passed independent review
  of all eight states in both slots and now ships as `mesh2motion_curie_period.glb`.
- 2026-09-25 model quality: McClintock, Goodenough v7, and Steitz v6 have reopened visual gates.
  Their captured quality falls below detailed doctor_m/female_9 originals; preserve provenance and
  rebuild with richer donor meshes before roster integration.
- 2026-09-25 M23 Goodenough: rich-donor V9 (SHA-256
  `62f9a8aa574eaaadb370963aa509e5708f4aaf384800ef70e6e0958aafa77b55`) passed all sixteen
  ordinary-slot review states and is accepted under the gameplay-caricature standard: its 1964
  dark short hair and formal suit read at match scale, and glasses are not an established cue.
  Hodgkin and Buck remain the independent M22/M23 lanes.
- 2026-09-25 pause review: P and Space toggle the shared pause state. Combat and animation stay
  frozen while camera orbit, tilt, and zoom remain available; the focused browser test passes.
- M22: do not ship any model candidate until its ordinary-slot, eight-state capture passes the
  canonical plan's defining-feature and silhouette criteria.
