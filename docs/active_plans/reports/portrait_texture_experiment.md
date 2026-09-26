# Lightweight face-texture experiments and roster face-identity check

Date: 2026-09-26

## Finding

I found no earlier end-to-end proof that put a real laureate portrait into an existing donor's
face texture and rendered the unchanged donor head in the game. The earlier McClintock bitmap proof
painted generic brow and eye cues; Steitz's earlier atlas edits recolored a small beard region and
did not include a portrait projection or in-game face render.

The bounded Thomas Steitz experiment projected a real portrait into the existing `doctor_m` face
texture. A second bounded experiment put a real portrait into the existing face area on Bertozzi's
unchanged donor. A third painted only brows, eyelids, cheek color, and age creases onto Bertozzi's
existing atlas. All three altered pixels reach the unchanged head in the production game runtime.
The photo transfers look stretched and mask-like; the painted edit is cleaner but still reads as the
same donor face. None passes the roster face-identity gate. The flat atlases and matching in-game
renders are preserved in ignored scratch.

## Method and preservation

- Source: [Thomas Steitz's Nobel Prize portrait](https://www.nobelprize.org/images/steitz-15151-portrait-medium.jpg),
  496 x 744 pixels, from the [2009 Chemistry prize page](https://www.nobelprize.org/prizes/chemistry/2009/summary/).
- Donor: `assets/models/mesh2motion_doctor_m.glb`, SHA-256
  `2923d429514cdbe6c996c99929b6872544ed3a39daa10086d0d490ce8d7cff3d`.
- The donor's 512 x 512 face atlas was changed by projecting the portrait across existing
  head-weighted front-face triangles. The proof changed 6,786 face texels across a 6,761-texel
  projection mask.
- Geometry, UV coordinates, weights, skeleton, and animations are unchanged. The generated GLB
  changes only the embedded face atlas; its SHA-256 is
  `6fe3a10e119e05e7fe608a19d8d14a94f8475bed0027b507f5d5e6b8a8516e4f`.
- The game capture intercepted the normal `doctor_m` body request to serve either the original or
  candidate GLB. The receipt records matching served-byte hashes and no browser errors for both.

The proof scripts, source portrait, generated atlas, candidate GLB, and captures are preserved in
ignored scratch at:

`tests/_temp/roster_work/m26/steitz/portrait-atlas-experiment/v2/`

Inspect these files:

- `steitz_face_projected_doctor_m_atlas.png` — the generated face texture on the donor's flat atlas.
- `atlas_before_after.png` — original atlas beside the modified atlas.
- `steitz_face_projection_mask.png` — the atlas region touched by the projection.
- `in_game/before-face.png` and `in_game/steitz-photo-atlas-face.png` — matching in-game face captures.
- `in_game/steitz-photo-atlas-full.png` — the candidate in the game scene.
- `receipt.json` and `in_game/capture_receipt.json` — source, donor, candidate, and served-byte hashes.

## Second bounded portrait-face experiment

To test whether a directly mapped portrait face island works better on the current female donor,
I used Carolyn Bertozzi's 2022 portrait on her unchanged registered body,
`assets/models/mesh2motion_bertozzi_2022.glb` (SHA-256
`73326a01eb7e7782776a2efc04a1649fd34dab8d64d732e8a0b7d0306eeadf1f`). The experimental source
image is a Christopher Michel photograph under CC BY-SA 4.0. Its provenance and hash are in
`receipt_v2.json`; the derivative remains scratch-only and is not approved for production use.

The v2 authoring pass maps six eye, nose, mouth, and chin point pairs into the donor's existing
512 x 512 face atlas, color-adjusts the portrait, and feathers a skin-shaped patch. It changes only
embedded image bufferView 6 in the candidate GLB. All geometry, UV coordinates, weights, skeleton,
and animation bufferViews remain byte-identical. The candidate SHA-256 is
`e90e22017c3dbce04dc4bada45f36aadb021a8da39764faa0425e49fe0083908`.

The ordinary paused-game capture served the original Bertozzi model and candidate v2 by their
exact recorded hashes, with no page or console errors. The transferred eyes and mouth are visible,
and the candidate stands out from the repeated stock-face cluster. The face still reads as an
elongated, softly smeared photo patch instead of a coherent face integrated with the donor. A
second roster contact sheet confirms that it is distinct but visually unsuccessful. Further
landmark tuning of this direct photo mapping is not justified by this result; do not promote it or
turn it into a generalized authoring system.

The source image, generated v2 atlas, before/after face crop, candidate GLB, and game captures are
preserved at:

`tests/_temp/roster_work/face_identity_audit/bertozzi_face_texture_v1/`

- `bertozzi_atlas_photo_face_v2.png` — the generated flat face atlas.
- `face_before_after_v2.png` — donor and modified flat face regions.
- `in_game_v2/bertozzi-photo-face-v2-face.png` — the matching rendered face.
- `in_game_v2/bertozzi-photo-face-v2-full.png` — the full paused game capture.
- `receipt_v2.json` and `in_game_v2/capture_receipt.json` — source, donor, candidate, and served-byte hashes.

## Third bounded face-texture experiment

I also tested a face-only edit that avoids transferring the portrait itself: slightly strengthen the
existing donor's brow and upper eyelid, add subtle under-eye and smile creases, and warm the cheeks.
The change stays inside the same 512 x 512 atlas on the unchanged Bertozzi body. The candidate
`bertozzi_painted_face_cues_v1.glb` changes only embedded image bufferView 6; all other bufferViews
are byte-identical. Its SHA-256 is
`5dd86b685ecc1dc2857591b1f962bd2900a47d766a28534e8c4e1db4154bc55f`.

The paused-game capture served the original and candidate by their exact recorded hashes and
reported no browser errors. The heavier eye and brow marks remain visible at game scale, but the
same-scale contact sheet still reads the candidate as the same face as the original donor. This is a
cleaner atlas edit than the photo warp, but its identity gain is too small to pass acceptance. Stop
this one-pass treatment here; the result does not justify iterating on pixel placement.

The authoring script, atlas, before/after crop, candidate model, and runtime captures are in:

`tests/_temp/roster_work/face_identity_audit/bertozzi_face_texture_v1/`

- `bertozzi_atlas_painted_cues_v1.png` — the edited flat atlas.
- `face_before_after_painted_cues_v1.png` — unmodified and edited face islands.
- `in_game_painted_cues_v1/bertozzi-painted-face-cues-v1-face.png` — the matching in-game face.
- `receipt_painted_cues_v1.json` and `in_game_painted_cues_v1/capture_receipt.json` — model and served-byte hashes.

## Roster-level review

I captured every currently playable fighter through `devel/capture_fighter_portraits.mjs` with the
same paused camera and crop. The receipt binds all twelve images to their registered model bytes;
all twelve captures completed without browser errors. The contact sheets and capture receipt are
preserved at:

`tests/_temp/roster_work/face_identity_audit/`

The central-face sheet includes the experimental Steitz render as a thirteenth comparison tile. In
the current roster, Franklin, Buck, and Bertozzi read as the same face after I discount hair,
glasses, clothing, and silhouette. The contact sheet therefore exposes a real acceptance failure:
different stock donors and appearance cues have not produced enough visible facial identity.

I also extracted the embedded image bytes from all twelve registered fighter models and compared
their SHA-256 hashes. Five models share one exact face atlas: Franklin, Buck, McClintock, Doudna,
and Bertozzi (`f353417e8aab75546733320173528957b5faec8cfd7fde2b1b8ad62526808d03`). The other exact
groups are Curie/Hodgkin (`675be6a4233c87b8ac9bf8595553da7fbad7ddb1a9de530e1f5a22519ea36c5d`),
Levi-Montalcini/Strickland (`82b296b118fd92e3f12f02b31751e53e76a173f92f724514ca21593a5c2d9aa4`),
and Tsien/Goodenough (`38c3a42c55feb244e8aa746b27eac088b789d562909e952140bc65882f7d642e`). Warburg's
atlas is unique. This confirms that changing body filenames, clothes, or accessories can leave the
entire face image identical across fighters.

The second contact sheet adds the v2 Bertozzi photo-face capture to the same roster comparison:

`tests/_temp/roster_work/face_identity_audit/roster-plus-bertozzi-photo-v2-faces-contact-sheet.png`

The third contact sheet compares the same lineup with the hand-painted face-cue candidate:

`tests/_temp/roster_work/face_identity_audit/roster-plus-bertozzi-painted-face-cues-v1-contact-sheet.png`

## Acceptance update

For each remaining body candidate, generate the standard paused roster portrait and compare it on a
same-scale contact sheet with the current playable faces. Inspect a central-face crop as well as the
full head. Hair, glasses, clothes, accessories, silhouette, and donor choice may reinforce a fighter,
but the visible face itself must remain distinguishable when those cues are disregarded. Continue
fighter integration through the existing pipeline when this and the current gameplay gates pass.

The experiments prove that a donor face atlas can be edited cheaply and the pixels reach the game,
but neither direct photo transfer nor this small hand-painted pass produces enough identity at roster
scale. Face-atlas authorship therefore needs its own visual gate; the runtime's per-fighter model
already carries its atlas, so no new face-texture service is justified. Do not generalize these
failed methods. Any future texture approach should remain one fighter at a time, preserve donor
geometry, and pass the same roster contact-sheet review before integration.

## M26 Anfinsen donor comparison

One already-planned `male_32` scalp-cue candidate was also captured as a
same-scale roster tile to exercise the revised review gate. It preserved the
stock face and atlas exactly and added only gray scalp polygons. Its repaired
candidate SHA-256 is
`00c9ae2647e2b306a48b3cd593bf9d7c46ba52e9573734c53b1011424334b83c`. The
exact-byte game captures covered both roster positions and all eight states
without browser errors.

The [1969 NIH portrait](https://commons.wikimedia.org/wiki/File:Christian_B._Anfinsen,_NIH_portrait,_1969.jpg)
shows Anfinsen with short swept dark hair and a comparatively young, clean
face. Because the image is monochrome, it does not establish gray hair color.
On the [13-face contact sheet](../../../tests/_temp/roster_work/face_identity_audit/roster-plus-anfinsen-male32-v2-contact-sheet.png),
the donor face reads as substantially older and more severe, and the scalp
polygons look like angular patches. The face itself was never altered, so the
candidate fails the updated face-identity gate even though it differs from
some current fighters as a stock donor. It is retired; there is no further
`male_32` pass or roster promotion. The candidate tile and receipt are at
`tests/_temp/roster_work/m26/anfinsen/scalp-hair-cue/roster-portrait-capture/`;
front and three-quarter game views are at
`tests/_temp/roster_work/m26/anfinsen/scalp-hair-cue/final-capture-matchscale/`.

## M30 Gabor stock-face check

The bounded `male_32` Gabor candidate added one gray upper-lip cue to the
unchanged donor face. It passed body and Babylon loader preflight and was
captured through the game route at exact candidate SHA-256
`6115b879c83aa883658ecc9836631b88d72fe798c8002798f0fcef5a2edd383b`.
Receipts cover both roster positions and all eight states without browser
errors.

The [same-scale roster sheet](../../../tests/_temp/roster_work/face_identity_audit/roster-plus-gabor-male32-v1-contact-sheet.png)
shows the gray shape floating off the mouth. Without it, Gabor would retain
the same stock `male_32` face as the retired Anfinsen candidate, so the visual
difference depends on a failed facial-hair cue and donor reuse. Retire this
candidate before appearance or FighterDef integration. Its face tile and full
game captures remain in
`tests/_temp/roster_work/m30/gabor/male32-native/v1/`.

## McClintock painted-face check

To check whether very cheap facial marks could separate a registered duplicate-face fighter, I
edited only the face region in McClintock's existing atlas: brow, eyelid, nose, lip, and cheek cues
guided by the 1947 Smithsonian laboratory portrait. No portrait pixels were copied. The candidate
preserves McClintock's registered body and rig; only embedded image bufferView 13 changed. The
candidate SHA-256 is
`7b6b5707c43b21404e4ddc538a9ad3173ff0b4b624f4b0c9d80d36ed17d083bc`.

The standard game route served the exact candidate in both roster positions for all eight states,
with no browser errors. The [13-face same-scale contact sheet](../../../tests/_temp/roster_work/face_identity_audit/roster-plus-mcclintock-face-cues-v1-contact-sheet.png)
shows the edited face still reading like the unchanged stock face. The atlas marks are inspectable,
but do not produce visible identity at the comparison size. Retire this one-pass treatment; do not
integrate the candidate or tune pixel placement further.

The preserved scratch artifacts are under
`tests/_temp/roster_work/face_identity_audit/mcclintock_face_texture_v1/`:

- [`mcclintock_atlas_face_cues_v1.png`](../../../tests/_temp/roster_work/face_identity_audit/mcclintock_face_texture_v1/mcclintock_atlas_face_cues_v1.png)
  — edited flat face atlas.
- [`mcclintock_face_before_after_v1.png`](../../../tests/_temp/roster_work/face_identity_audit/mcclintock_face_texture_v1/mcclintock_face_before_after_v1.png)
  — original and edited face regions.
- [`game-capture/opponent/face-front.png`](../../../tests/_temp/roster_work/face_identity_audit/mcclintock_face_texture_v1/game-capture/opponent/face-front.png)
  — exact-candidate in-game face view.
- [`roster-portrait-capture/mcclintock-face-cues-v1-face.png`](../../../tests/_temp/roster_work/face_identity_audit/mcclintock_face_texture_v1/roster-portrait-capture/mcclintock-face-cues-v1-face.png)
  — candidate tile used in the sheet.
- `receipt_v1.json`, `game-capture/`, and `roster-portrait-capture/capture_receipt.json` — atlas,
  candidate, served-byte, capture, and source bindings.

The experiment confirms that pixels from a simple face edit reach the existing runtime, but this
mark-only treatment is too weak at roster scale. Together with the patch-like photo transfers and
the failed gray mustache cue, it provides no passing cheap face treatment yet. Keep the new face gate
and continue other fighter lanes through the existing pipeline. The twelve registered faces remain
under re-review; no previous donor/accessory acceptance is grandfathered.
