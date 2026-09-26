# New character recipe

Use this checklist for every new roster fighter lane. The
[indexed-tumbling-quokka.md](active_plans/indexed-tumbling-quokka.md) canonical expansion plan owns milestone scope,
dependencies, and acceptance gates; this recipe makes the appearance workflow repeatable.

One lane owns one fighter candidate and its source evidence. The integrator owns shared roster
data and the accepted asset records in `assets/README.md`. `assets/models/MANIFEST.txt` is generated
exclusively from registered `FighterDef.body` paths; never edit it manually.

Keep the active authoring script in tracked
`devel/roster_candidates/<wave>/<fighter>/` so Graphify can index the code. The repository's
`.graphifyignore` allowlists only this authoring subtree inside the otherwise ignored `devel/` tree.
Keep its current handoff in tracked
`docs/active_plans/workstreams/roster_candidate_<wave>_<fighter>.md`. Put generated GLBs,
receipts, and screenshots in ignored repo-local
`tests/_temp/roster_work/<wave>/<fighter>/<candidate>/`. The scratch directory is for generated
evidence, not the only copy of authoring source or decisions.

`docs/active_plans/active/roster_expansion.md` is the durable milestone status. Keep one concise
row for each fighter's active or latest candidate: handoff path, candidate path and short SHA prefix,
blockout and final visual state, verdict, and next action. The tracked handoff holds the full SHA,
receipts, and review detail. Do not log every failed revision in the tracker. Record the latest
failed candidate's lesson and disposition in the tracked handoff before replacing it. Handoff and
tracker Markdown are searchable project documentation; Graphify indexes the tracked authoring
code, not the ignored GLBs or screenshots.

Each lane keeps its tracked candidate handoff current. This is the evidence file passed to the
independent evaluator and integrator; they must receive it instead of relying on an author message
or inferring the fighter and reference period from scripts.

## 1. Ground the appearance

- [ ] Read the fighter entry in [proposed-combat-roster.md](proposed-combat-roster.md), its
      category source dossier, the active milestone, and prior review reports for that fighter.
- [ ] Search for the laureate's photos. Try `young <name>` when an early-career appearance may help.
- [ ] Treat search results as discovery. Verify the person's identity and any date with a reliable
      institutional, archive, or primary source before choosing the modeling period.
- [ ] Record the image query, source URLs, chosen period, and only visible, supported cues in the
      lane's tracked handoff: hair, glasses, clothing, and accessories. A cropped or monochrome image
      does not establish hidden clothing, color, footwear, build, or a full-body pose. If new evidence
      warrants correcting the shared category dossier, report it to that category's integrator; do not
      edit the shared dossier from an authoring lane.
- [ ] Use the photos as references; do not copy them into the game assets.

## 2. Choose and prove the body blockout

- [ ] Choose one documented period and keep its defining cues consistent.
- [ ] Compare compatible donor models in the actual game at match-camera scale, including idle,
      light, and heavy poses. Give the face and hair silhouette priority in paused front and
      three-quarter views; model filenames and rig metadata do not establish appearance.
- [ ] Start from a compatible, lightweight human donor. Curie and Warburg set the target fidelity:
      a few readable cues on a coherent human head are sufficient when they distinguish the fighter
      at ordinary match-camera scale. Prefer richer detail only when it improves that comparison.
- [ ] Keep a native high-resolution source offline when it is useful for authoring, but make the
      candidate used for repeated color review, rigging, and browser capture light enough for the
      normal game workflow before those steps. Reduce the mesh while preserving face and hair
      silhouette; do this before repeated renders, not after an expensive review loop has begun.
- [ ] Treat donor quality as body selection only; review the customized fighter separately for
      recognizable, source-backed identity at gameplay scale.
      Preserve its visible human meshes and materials through canonical 66-joint rig adaptation.
- [ ] Add only the source-supported hair, clothing, and silhouette pieces missing from that donor.
      Keep deforming additions on the same canonical skin and attach every mesh to the default
      glTF scene. Do not add disconnected nodes or replace a detailed donor body with primitives.
- [ ] Use a fully authored human body only when the available donor models cannot meet the visual
      standard. The early body capture still checks down and getup before appearance work continues.

Use bounded, vectorized or sampled diagnostics for large source meshes. Do not scan every vertex
inside repeated per-vertex work. Run heavyweight offline generation or inspection one job at a time
under its lane owner, and do not automatically resume a high-resolution job while a load hold is in
effect.

## 3. Repair the exported body

- [ ] Export the skinned body with the authoring tool's native armature and skin exporter. Do not
      hand-write skeletal binding arrays or coordinate-space data.
- [ ] Repair the export against the canonical joint-order reference before preflight and capture.
      The appearance donor remains a separate source choice. See
      [assets/README.md](../assets/README.md#authored-body-rig-repair).

  ```sh
  node devel/repair_skin_joint_order.mjs \
    assets/models/mesh2motion_male_5.glb <authored-export.glb> <repaired-candidate.glb>
  ```

  Use `<repaired-candidate.glb>` for every later preflight and capture. The repair remaps
  `JOINTS_0` values and inverse-bind rows to `mesh2motion_male_5`'s canonical joint-name order.
  It does not prove skin weights, bind-pose deformation, or appearance; the final 16 captures and
  independent visual review remain the evidence for sampled deformation and appearance.

## 4. Run static checks

- [ ] Check an authoring script's syntax in memory. `py_compile` and `compileall` intentionally
      write bytecode, so use this command instead:

  ```sh
  source source_me.sh && python3 -B -c 'import pathlib, sys; path = pathlib.Path(sys.argv[1]); compile(path.read_text(), str(path), "exec")' <author-script.py>
  ```

- [ ] Run the rig and scene preflight before launching Chromium:

  ```sh
  node devel/check_candidate_body.mjs <repaired-candidate.glb>
  ```

  It checks static default-scene reachability, one skin whose unique named joints match the
  canonical 66-joint order in `mesh2motion_male_5`, every mesh-bearing node on skin 0, and malformed
  node entries. It accepts retained donor meshes and does not judge appearance quality.

- [ ] Treat this check as structural evidence only. It cannot prove a renamed donor mesh, clips,
      skin weights, bind pose, deformation, or appearance. The final 16 captured gameplay stills and
      independent visual review provide the sampled deformation and appearance evidence.
- [ ] Fix a static failure before capture. Do not use a browser run to validate a structurally invalid
      candidate.
- [ ] The capture wrapper loads the exact candidate through Babylon's glTF loader under NullEngine
      after the structural check and before Chromium. Fix any loader error before capture; this
      catches malformed runtime assets but does not prove clip mapping or deformation.

- [ ] Build and serve the GitHub Pages artifact before the blockout capture. For the wrapper's
      default port, start this once and keep it running through the final detailed capture:

  ```sh
  PORT=4173 ./run_web_server.sh
  ```

- [ ] On macOS, launch Chromium outside the sandbox with escalation for both the early blockout
      capture and the final detailed capture. The capture script cannot grant itself that access;
      do not ask again when that established permission already applies.

## 5. Check blockout deformation in both positions

- [ ] Before adding appearance details, run the same two-position capture for the repaired and
      preflighted donor-preserving body blockout:

  ```sh
  devel/capture_candidate_body.sh \
    <repaired-candidate.glb> curie franklin <blockout-output-directory>
  ```

- [ ] Inspect down and getup in both positions. If parts separate, float, or deform severely, fix the
      skin and bind setup first.
- [ ] Record the blockout preview result in the tracked handoff before adding detailed appearance.

## 6. Establish face and hair before clothing

- [ ] Use source photos to define the most recognizable face features and hair shape first: face
      outline and expression, hairline/part, major hair silhouette, and any strong facial cue such as
      glasses or facial hair. Aim for a readable caricature, not portrait reconstruction. Clothing
      may proceed as a supporting cue once the simple donor comparison shows the identity direction
      is viable.
- [ ] Before clothing or accessory work, compare the candidate face with every current fighter on a
      same-scale contact sheet. Use the normal paused roster view and crop, and include a central-face
      crop beside the full-head view. Judge face shape, brows and eyes, complexion, age cues, cheeks,
      and facial hair; disregard hair, glasses, clothes, accessories, silhouette, and donor choice.
      Record the contact sheet and verdict in the candidate handoff. A different donor or supporting
      appearance cues cannot substitute for a distinct visible face.
- [ ] If the face does not read as distinct from every current fighter, make at most two focused
      face-only revisions of one approach or select a donor with a genuinely different face, then
      repeat this comparison. Retire the candidate if it still fails; do not use clothing or
      accessories to bypass the gate. Other fighter lanes continue through the pipeline.
- [ ] Capture a paused front and both three-quarter views, then confirm the face and hair remain
      recognizable in the ordinary match camera. A close crop helps find placement errors; it does
      not replace the gameplay-scale view.
- [ ] Use the repository capture wrapper for this early identity gate; it records three paused,
      zoomed face views in the candidate's opponent slot and binds them to the candidate SHA:

  ```sh
  devel/capture_candidate_body.sh \
    <face-hair-candidate.glb> <body-owner-id> <different-body-comparison-id> \
    <face-hair-review-directory>
  ```

  Review `opponent/face-scene.png` alongside `opponent/face-front.png`,
  `opponent/face-orbit-left.png`, and `opponent/face-orbit-right.png` before spending an
  appearance pass on clothing. The full paused frame shows when a crop misses or clips the head.

- [ ] Keep the donor's human facial detail. Make only source-supported changes to the face and hair,
      and remove donor features that contradict the reference instead of covering them with extra
      geometry.
- [ ] A head bone or a polygon's height cannot distinguish hair from face. Preserve the combined
      textured donor head by default; recolor hair only through separately owned hair geometry or
      material. Assign clothing only to polygons with no nonzero `head` or `head_leaf` influence.
- [ ] Before capture, inspect a donor material's linked source as well as its displayed name. A
      Principled Base Color factor does not override a connected RGBA texture; verify the repaired
      export's intended material factor or visible ownership before treating an edit as present.
- [ ] Separate broken presentation from a real gameplay-scale mismatch. Fix a UV, material, crop,
      or accidental facial-hair cue once before judging the source. Do not reject a usable donor
      solely because it cannot support portrait-level face reconstruction.
- [ ] Escalate to generated or grafted face geometry only when a cleaned-up donor still fails the
      ordinary gameplay comparison. Keep the experiment bounded and return to the donor route if it
      does not visibly improve the fighter.

## 7. Add supporting appearance details and capture the full candidate

- [ ] After the face and hair read, add source-supported clothing and silhouette cues that help
      distinguish the fighter. Appearance kits are limited to source-supported rigid accessories;
      they do not provide generic hair or garments.
- [ ] Keep the detailed donor body and materials. Clothing and body shape are supporting cues; accept
      small differences when the face and hair clearly identify the laureate and the body remains
      human, coherent, and rig-correct.
- [ ] Avoid prominent unsupported details. Keep the model readable at ordinary match-camera distance.
- [ ] Re-export the detailed candidate, repair it against the matching native donor, and rerun the
      static preflight before the final capture.

## 8. Capture and review the full candidate

- [ ] Capture the detailed candidate in both standard roster positions. Use two fighters with distinct
      body URLs; the wrapper checks this requirement. Choose a capture host whose height and appearance
      kit are representative of the intended FighterDef. Curie and Franklin are the default pair only
      when their host presentation is appropriate:

  ```sh
  devel/capture_candidate_body.sh \
    <repaired-candidate.glb> curie franklin <output-directory>
  ```

- [ ] Keep both receipts and all 16 screenshots: idle, move, light, heavy, block, hit, down, and getup
      in the player and opponent positions. Confirm the receipts contain the candidate's computed SHA
      and show that the candidate bytes were served. The wrapper stores a SHA-named copy of the exact
      candidate inside the capture directory; review and promote that captured copy, not a later
      regeneration at the working candidate path.
- [ ] In the current capture contract, `bodyOwner` means **capture host**: it chooses the registered
      body's intercepted URL and therefore applies that FighterDef's height and appearance kit. It
      does not select the candidate's skeleton, rig-repair donor, or clips. Choose the host closest
      to the intended fighter's height and kit setup; record any difference in the handoff.
- [ ] A temporary-host accessory fit is provisional. Before integration acceptance, review the
      actual registered fighter with its own body and `FighterDef.appearance`; correct only the
      fighter-owned fit if the same accessory misses that face.
- [ ] Use each receipt's `bodyOwner`, `playerId`, and `opponentId` to locate the candidate. In the
      player capture it replaces `playerId`; in the opponent capture it replaces `opponentId`. The
      rig donor remains the asset named in the authoring and repair record.

## 9. Request visual review

- [ ] Give an independent `image_evaluator` the tracked handoff, both receipts, and both screenshot
      directories. Ask it to inspect all 16 frames.
- [ ] Include the same-scale current-roster contact sheet and central-face crop from section 6.
      The face must remain visually distinct from every current fighter when supporting appearance
      cues are disregarded. This is a separate acceptance gate; close face views and full-body
      gameplay captures do not replace it.
- [ ] Include the three receipt-bound `opponent/face-*.png` crops in the identity review. They help
      expose cheek-crossing hair, false facial-hair cues, and glasses placement.
- [ ] Require a distinct face-and-hair caricature at match scale and coherent human poses in both
      positions, especially down and getup. Close views diagnose broken geometry, clipping, or cue
      placement; they are not a portrait-likeness gate. Review clothing and silhouette as supporting
      cues; they may be less exact when the primary identity reads clearly.
- [ ] Treat captures as evidence for sampled poses and appearance. They do not prove motion between
      frames or facial likeness.
- [ ] On failure, name the visible mismatch and make a focused correction. After at most two
      revisions, retire that approach and choose a better donor or author a replacement body.
- [ ] Keep a failed candidate out of the roster. Its wave-b milestone remains open until the fighter
      has a passing candidate; record the result and keep independent wave lanes moving.

## 10. Hand off and integrate

Before review and integration, complete the tracked handoff and give that file to both recipients:

- [ ] Laureate identity and selected period
- [ ] Image query and verified source URLs, including identity and date authority
- [ ] Source-supported appearance cues
- [ ] Authoring tool, matching donor rig, and export and repair workflow
- [ ] Capture-host ID, intercepted body URL, host height and appearance kit, and any difference
      from the intended fighter's presentation
- [ ] Plain-body preview capture result
- [ ] Final repaired candidate path and SHA-256
- [ ] Final capture directories and receipts
- [ ] Independent visual-review verdict and limits

Do not replace this file with a subagent message or make the evaluator or integrator guess its
identity, period, or evidence.

After the visual gate passes, the integrator copies the exact SHA-named capture asset into
`assets/models/` and records its SHA, sources, and status in `assets/README.md` as accepted but
unregistered. This preserves the model before its FighterDef wave without implying that it ships.

When the fighter milestone adds the `FighterDef.body` path, regenerate `MANIFEST.txt` from the
roster registry. The Pages build ships only manifest entries. Keep the manifest generated; do not
add a second list of runtime model paths. Fighter data, specials, captions, AI profile, and unlock
rule enter through the wave's fighter milestone after its dependencies clear. Update the fighter's
one tracker row, then follow the canonical plan for the milestone's gameplay and integration checks.
