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
| M14 McClintock end-to-end fighter | Complete | Authored canonical-rig body and two-slot appearance review passed |
| M15 Originals on meter | Complete | One Special control for all fighters |
| M16 Super card | Complete | Tier-three title card |
| M17 Chooser grid | Complete | Grouped chooser and navigation |
| M18 Opponent selection | Complete | Seeded unlocked-opponent selection |
| M19 Appearance kits | Complete | Rigid-accessory-only kit contract |
| M20 Native rig adaptation | Complete | Canonical-rig bodies and direct clips |
| M21 Roster smoke harness | Complete | Four-fighter smoke coverage |
| M22 Wave 1 models | In progress | Authored canonical-body lanes for Hodgkin, Goodenough, and Buck; independent of M14 |
| M23 Wave 1 fighters | Queued | Depends on M22 and starts the wave-c chain |
| M24 Wave 2 models | In progress | Body candidates authored; capture/review and replacements remain |
| M25 Wave 2 fighters | Queued | Depends on M24 and M23 |
| M26 Wave 3 models | In progress | Baker and Blackburn candidates need capture; other lanes need replacement or resolution |
| M27 Wave 3 fighters | Queued | Depends on M26 and M25 |
| M28 Wave 4 models | In progress | Cech passed; Altman needs replacement; Karikó and Baltimore need appearance review |
| M29 Wave 4 fighters | Queued | Depends on M28 and M27 |
| M30 Wave 5 models | In progress | Bardeen and Sharpless candidates authored; Gabor and Herzberg remain to start |
| M31 Wave 5 fighters | Queued | Depends on M30 and M29 |
| M32 Balance diagnostic | Queued | Depends on M31 |
| M33 Closeout | Queued | Depends on M32 |

## Current blocker and next dependency

M14 is complete. McClintock's authored canonical-rig body carries the readable 1947 laboratory
cues directly: a light buttoned smock, wide pointed collar, throat clasp, dark swept hair, and
round wire glasses. Its exact-SHA two-slot, eight-state capture passed independent review.
Generic garment geometry remains retired; see the [vertical-slice report](../reports/vertical_slice_report.md).

M22 body authoring proceeds independently in three lanes. All three current candidates now have
exact-SHA captures in both roster positions. Fresh visual reviews found source-cue failures in
Hodgkin (wrapped high hair and unsupported torso panel), Goodenough revision 1 (tie reads as a badge;
part is unclear), and Buck (broad oval torso and oversized earrings). No M22 body is accepted yet;
continue within the two-revision limit, replacing failed candidates where the design needs a new
body. M24, M26, M28, and M30 are also in progress; each wave-c milestone remains queued until its
own model milestone and the preceding wave-c milestone complete.

## Current verification record

- M14 and M21: on 2026-09-25, G1 passed with 48/48 Node tests, strict TypeScript, lint, and format
  checks; the Pages build, Markdown-link check, and `git diff --check` passed. Focused roster-smoke
  and paused-chooser cases passed, and the serial Playwright suite passed 35/35 in 9.6 minutes. The
  audit made model-manifest freshness checking read-only, preserved overlapping projectile visuals
  with lazily grown and reused meshes, generalized registry-pair capture, and made roster smoke
  inspect projected enabled-mesh bounds. The first in-sandbox McClintock capture could not launch
  Chromium because macOS denied `MachPortRendezvous`; it was rerun outside the sandbox with the
  repository command. Details are in the [vertical-slice report](../reports/vertical_slice_report.md).
- M14 appearance: the repository-supported outside-sandbox capture command served
  `mesh2motion_mcclintock.glb` with SHA-256
  `062727db91a200c996bf5f5bcba8384dad67944bbdd1037c8f68e5b957683c67`. Independent review passed
  every ordinary-slot state for the 1947 smock, collar, clasp, swept hair, and built-in round
  wire glasses. The registry no longer adds a second glasses kit.
- Current M22 captures: the wrapper served exact candidate SHAs for all eight states in both
  positions. Independent review rejected the present Hodgkin, Goodenough revision 1, and Buck
  bodies for the source-cue failures recorded above; M22 remains open.
- Current appearance workflow: use web image search, including `young <name>` for early-career views,
  then verify candidate identity/date against the dated archive or institutional sources selected
  and described in each roster dossier.
- M19 and M20: two-slot captures retired whole-body `clothingTint` and generic garments. Curie's
  native `female_31` capture passed the eight-state deformation review.
- M22: do not ship any model candidate until its ordinary-slot, eight-state capture passes the
  canonical plan's defining-feature and silhouette criteria.
