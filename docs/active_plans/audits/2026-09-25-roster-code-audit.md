# Roster code audit

## Scope and result

This report combines six independent review passes of the roster-production changes:
Plan, Test, Style, Docs, Legacy, and Comment. All six passes completed. The reviewers found
several high-impact contract gaps. The current source contains the small, direct fixes listed
below. The active roster plan remains in progress; this audit does not establish a complete
25-fighter roster or full-suite acceptance.

## Resolved findings

| Severity | Finding | Current evidence | Smallest durable fix |
| --- | --- | --- | --- |
| High | The chooser test required exactly four portrait cards. | [`chooser_grid.spec.ts`](../../../tests/playwright/chooser_grid.spec.ts) decodes every rendered portrait and asserts a nonempty set with nonzero dimensions. | Test the roster-derived set so new fighters are covered without changing a hardcoded count. |
| High | Curie's displayed body could diverge from the reviewed Curie asset. | [`roster_expansion.md`](../active/roster_expansion.md) records `mesh2motion_curie_period.glb` as Curie's current reviewed route; [`DESIGN_DECISIONS.md`](../../DESIGN_DECISIONS.md) names the same owner. | Keep the FighterDef body as the single runtime authority and record a replacement only after review. |
| High | Portrait receipts did not prove that the current body produced the copied PNG. | [`write_model_manifest.mjs`](../../../devel/write_model_manifest.mjs) verifies the current source PNG SHA-256, current body SHA-256, and receipt-served body SHA-256 before Pages publication. | Seal the model and source portrait together in the receipt and reject stale pairs in the build. |
| High | A GLB that completed loading after pause could restart a frozen animation. | [`main.ts`](../../../src/main.ts) pauses every newly created animation group when `matchPaused` is true. | Apply the one shared pause state as each group is loaded. |
| Medium | The Pages build copied arbitrary portrait PNGs and startup retained an obsolete entry-point fallback. | [`build_github_pages.sh`](../../../build_github_pages.sh) copies only registry-owned, receipt-validated portraits; the `src/init.ts` entry fallback is removed. | Publish only the declared roster assets and load the one declared entry point. |
| Medium | README and active roster status were stale after pause and candidate decisions changed. | [`README.md`](../../../README.md) describes P/Space pause; [`roster_expansion.md`](../active/roster_expansion.md) records the current M14, M24, and M26 candidate dispositions. | Update the durable user surface and active dependency record with each decision. |
| Medium | Strickland v3's hand-written weighted additions separated in motion and her face/hair still read as the donor. | [`roster_candidate_m24_strickland.md`](../workstreams/roster_candidate_m24_strickland.md) marks v3 rejected with capture evidence. | Retire that authoring line; use a native skinned export or another detailed donor. |

## Test decision

The Test pass proposed removing two new browser checks. The manager retained three focused
contracts because they cover demonstrated user-facing failures: a broken chooser portrait,
pause loss during late model loading, and a malformed candidate body. The contracts are in
[`chooser_grid.spec.ts`](../../../tests/playwright/chooser_grid.spec.ts),
[`pause_match.spec.ts`](../../../tests/playwright/pause_match.spec.ts), and
[`test_candidate_body_contract.mjs`](../../../tests/test_candidate_body_contract.mjs). The
candidate contract no longer compares fragile exact stdout.

This is the meaningful review disagreement. Future tests still need a stable behavior and a
plausible regression before they become permanent; one-off visual investigation belongs under
`tests/_temp/`.

## Remaining finding

### Medium: Candidate authoring fails the Python typing gate

`source source_me.sh && python3 -m pytest -q --tb=line tests/test_function_typing.py` completes
in under two seconds, with 148 failures and 54 passes after normalizing the three Anfinsen
face/hair authoring scripts. The failures are concentrated in tracked
`devel/roster_candidates/` authoring scripts. This is a quality gap, not a stuck background test.

The original audit found 134 of 158 tracked candidate Python scripts using space indentation.
The three Anfinsen scripts were normalized with an unchanged executable AST and passed their
focused typing checks. Normalizing the remaining historical scripts is a separate, mechanical
maintenance task. It should be done in a bounded sweep after the active character lanes settle,
rather than interrupting visual review or adding a compatibility layer.

## No-finding passes and limits

The Style and Comment passes also found the unresolved Python annotation and space-indentation
debt. They found no additional actionable issue in the reviewed TypeScript or MJS comments.
The Plan, Docs, Legacy, and Test passes found the resolved issues above and the same remaining
candidate-authoring debt. The audit did not rerun a broad browser or repository suite. It
records the following focused evidence only:

- Pages build, strict TypeScript, manifest check, Markdown links, and `git diff --check` passed.
- Candidate Node preflight passed 4/4.
- Chooser portrait browser coverage passed 1/1.
- Pause browser coverage passed 2/2.

The candidate visual gates remain independent. A passing build or preflight does not promote a
model that fails face, hair, or ordinary-motion review.
