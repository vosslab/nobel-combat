# Changelog

## 2026-09-26

### Additions and New Features

- Removed the legacy `/devel/__pycache__/` ignore rule so generated Python
  bytecode remains visible for diagnosis. Python authoring continues to use
  `source_me.sh` with `PYTHONDONTWRITEBYTECODE=1`.

- Corrected vertical fighter selection to compare the visible card positions,
  so long names and portrait layouts cannot split one card row into false
  navigation rows through their inline radio controls.

- Prepared one source-only John Bardeen direction from the detailed native
  `male_32` donor. It preserves the donor unchanged for a single direct head and
  gameplay proof of the receding crown and round wire-glasses cue; no model,
  manifest, portrait, registry, or fighter change occurred.

- Added Donna Strickland as a playable Physics 2018 fighter. Her sealed
  police-female donor body (`b5cf7cea7644c1a5409d46b27dd748f110171534d796649307d180705520b02e`)
  preserves a detailed feminine face and compact dark hair with blue knitwear;
  the reviewed rectangular glasses are attached by her fighter-owned appearance
  kit. Strickland unlocks after a Goodenough win and brings `amplifies`, three
  chirped-pulse specials, and a ranged AI profile to Physics and Energy.

- Corrected the shared rectangular-glasses geometry so its two lens rims leave
  a real nose gap instead of placing both inner vertical rims at the center of
  the face. Strickland's fighter-owned depth fit is now `[0, 0, -0.065]` after
  the old deep endpoint buried the horizontal and inner rims; her sealed body
  is unchanged and the refreshed registered-route capture remains subject to
  independent visual review.

- Added Rita Levi-Montalcini as a playable Medicine 1986 fighter. Her sealed
  police-female donor body (`dae3ac6588f45352b84a4687a1120ab3c9fd5510b203d4f695093fd0a856b665`)
  keeps its detailed feminine face and compact dark gathered hair, with a dark
  formal outer layer and pale collar as supporting cues. Levi-Montalcini unlocks
  after a Buck win and brings `sprouts`, three growth-factor specials, and a
  grounded AI profile to Cell Biology and Neuroscience.

- Added Carolyn R. Bertozzi as a playable Chemistry 2022 fighter. Her sealed
  McClintock-donor body (`73326a01eb7e7782776a2efc04a1649fd34dab8d64d732e8a0b7d0306eeadf1f`)
  preserves the detailed native feminine face and compact dark hair while using only a charcoal
  blazer and pale blouse as supporting cues. Bertozzi unlocks after a Curie win and brings
  `clicks`, three chemical-biology specials, and a grounded AI profile to Chemical Biology.

- Earlier preparation preserved Rita Levi-Montalcini's CC0 police-female donor's native detailed
  head, hair, weights, and 66-joint rig through one non-head formal/lab material pass before its
  paused gameplay review. That source-only preparation led to the accepted, playable fighter
  recorded above.

- Added Roger Y. Tsien as a playable Chemistry 2008 fighter. His sealed simple-donor v3 body
  (`b2f73fc1dea6395d745427e5f202442a844810ea4e847b6c8496f9b377abb4b5`)
  preserves the detailed human donor face and hair, uses one coherent navy garment, and receives
  the reviewed wire glasses through the runtime appearance kit. Tsien unlocks after a Hodgkin win
  and brings `fluoresces`, three fluorescence specials, and his grounded AI profile to Fluorescence
  and Imaging.

- Added Jennifer Doudna as a playable Chemistry 2020 fighter. Her sealed
  rich-v5 body (`2baf62bac816b63e8180ef3119d5d9f14985455658b9c6de4b57d9e309dea39a`)
  keeps the detailed donor's native human face, pale shoulder-length hair, and
  black zip-front silhouette. Existing two-slot, eight-state evidence is
  reused for the unchanged bytes; a new served-byte runtime portrait binds the
  registered body. Doudna unlocks after a McClintock win and brings the
  `edits` verb, three CRISPR specials, and her grounded AI profile to Genetics
  and Molecular Biology.
- Added Linda B. Buck as a playable starter. Her sealed simple-donor v2 body
  (`ce50702172037389565fb226c39d565fbc3079593df474e6fc65147d8f7c4d04`) passes
  native-rig, loader, and two-slot eight-state checks, and the receipt-bound
  runtime portrait shows the same body. Buck brings her 2004 Nobel record,
  `smells` combat verb, three olfaction specials, AI profile, and starter
  unlock to the Cell Biology and Neuroscience roster category.
- Added Dorothy Crowfoot Hodgkin as a playable Chemistry 1964 starter. Her
  sealed Curie-donor v2 body (`48d12664ed7d3262477e9110b3568e9587dc7a44235dab8d9e781c0548ed349a`)
  preserves a mature human donor face and native rig while using a short gray
  hair sweep, blue-gray cardigan, ivory blouse, and dark skirt. Two-slot
  eight-state and served-byte portrait evidence bind the runtime body. Hodgkin
  brings `diffracts`, three crystallography specials, and her ranged AI profile
  to Structural Biology and Biochemistry.
- Recorded the donor-material ownership lesson: when head weights cover both
  face and hair, preserve the combined textured head unless a separately owned
  hair component exists. This avoids recoloring a face while attempting a hair
  cue and keeps the simple donor path lightweight.

### Fixes and Maintenance

- Removed four generated Python bytecode files from roster authoring paths. The character recipe
  now uses an in-memory syntax check; its historical Goodenough record identifies `py_compile` as
  the source of the bytecode and retires it from future authoring guidance.

- Retired David Baker's `male_10` source line after the actual gameplay proof
  found compact matted hair and facial hair. A direct, read-only component and
  atlas check established that its visible hair shares the same components with
  face and beard pixels, so no broad recolor or invented curl geometry was
  added. The source remains unregistered and excluded from the runtime
  manifest.

- Made vertical chooser movement preserve a visible card column before using
  the nearest-card fallback. Locked cards can leave a category row sparse; the
  old nearest-row choice could move diagonally and make a Down then Up pair
  select a different original fighter.

- Corrected Joachim Frank's bounded native-bitmap silver-hair source preview.
  The former lower-left mask mistook a rotated head island for clothing, then
  whitened jaw/chin facial-hair pixels. The corrected two-island mask recolors
  only its scalp edges and preserves face, jaw, chin, clothing, UVs, weights,
  geometry, and the 66-joint rig. The ignored preview artifacts are ready for
  one paused head-and-hair proof after the roster gate; no GLB, manifest,
  portrait, roster, or FighterDef changed.

- Kept the live progression check specific to Rosalind Franklin's durable
  unlock. A Curie win may also announce Carolyn R. Bertozzi, so the check now
  requires Franklin's announcement only when Franklin unlocks and permits
  other legitimate roster announcements.

- Prepared one bounded Thomas Steitz doctor_m texture experiment after direct
  atlas inspection found two face islands with locally maskable gray hair and
  brown beard pixels. It corrects the old false claim of a native white Steitz
  beard while preserving skin, eyes, mouth, and glasses in a source-only atlas
  preview. A first beard-mask diagnostic missed the near-black source pixels;
  its corrected source-only v5 preview visibly whitens the beard. It leaves
  Warburg, assets, the manifest, and roster unchanged pending one paused
  face-first proof.

- Vendored byte-exact CC0 `male_10` as David Baker's one bounded source-only
  replacement after the native `male_6` head proof failed its curl and
  clean-shaven cues. The donor is excluded from the generated manifest and
  awaits one paused gameplay head-and-hair proof before any body, portrait, or
  FighterDef work.

- Made selected portrait captures retain other fighter receipts. The generated
  portrait manifest now supports adding or refreshing one registered fighter
  without discarding the existing roster's byte bindings.

- Corrected the rectangular `AppearanceKit` frame so its vertical edges use
  horizontal offsets from each lens center. Each lens now renders as a closed
  rectangular rim instead of placing every edge along the vertical axis.
- Prepared K. Barry Sharpless's `male_32` donor as source-only evidence for one
  bounded material pass. It remains unexported and unregistered; no accepted
  body, portrait, or FighterDef is implied.
- Simplified Sidney Altman's `male_32` source lane to use the exact native donor. Its existing
  professional shirt and collar are sufficient; skin influence cannot establish clothing ownership
  for a blanket material assignment. It remains an unregistered CC0 source asset with no accepted
  body, portrait, or FighterDef.
- Corrected Roger Tsien's fighter-owned wire-glasses depth after the temporary Curie host did not
  predict his registered face fit. The sealed body remains unchanged; fresh real-route two-slot
  captures and the refreshed portrait receipt bind the independently accepted local appearance
  correction.
- Clarified that authored-body repair always targets the canonical
  `mesh2motion_male_5` joint order while a visual donor remains a separate
  source decision. Recorded Anfinsen's one-proof `male_32` rejection for its
  high bald crown and thin side hair; the CC0 source stays unregistered for
  other lanes.
- Retired Rita Levi-Montalcini's one-pass Curie-donor comparison after its
  exact-byte two-slot capture and independent review. The model moved
  coherently, but Curie's painted gray crown, angular pale side wedges, and
  facial profile remained dominant, so it read as a Curie costume variation at
  gameplay scale. The canonical Curie asset remains unchanged; Levi-Montalcini
  now requires a different native face-and-hair donor rather than another
  cosmetic pass.
- Extended the rigid `AppearanceKit` glasses cue with a small rectangular-frame style and a
  fighter-owned local fit offset from the canonical eye line. Existing wire frames retain their
  geometry and material; both styles use the same head attachment and owned-resource lifecycle.
- Corrected browser chooser fixtures to navigate the current eligible fighter set, confirm the
  chosen player against any distinct eligible AI opponent, and check the pause control as part of
  the keyboard help contract. Franklin-specific unlock and secrecy assertions remain explicit.
- Simplified the Franklin browser fixtures around stable behavior: denied startup storage still
  fails closed, a validated local unlock makes Franklin selectable, chooser focus includes its
  current Nobel link, and controlled debug combat verifies Franklin's win and restart pair. The
  fixtures no longer depend on a fixed roster position, an omitted tab stop, or an autonomous
  match outcome.
- Recorded two source-ownership findings from rejected roster work: material names and Principled
  factors do not replace a linked texture source, and default-scene reachability determines whether
  authored accessory nodes can appear at runtime. Bertozzi's rejected Hodgkin-donor evidence and
  Cech's legacy v1 evidence remain preserved while their simple-donor preparations stay unaccepted.
- Vendored byte-checked CC0 `police_female` and `male_32` Mesh2Motion sources for one bounded
  Strickland and Anfinsen donor experiment. Both remain unregistered source assets outside the
  generated runtime manifest; their workstreams preserve the native head, hair, and 66-joint rig
  and require a first gameplay proof before any promotion decision.
- Vendored byte-checked CC0 `male_6` as an unregistered David Baker source donor. UW's published
  2008 primary portrait supports its compact dark curly hair and clean-shaven early-career cue;
  the article date does not assert the photograph date or glasses. One bounded material-pass
  comparison with the historically prepared, unrun `male_5` donor remains required. Neither asset
  is a fighter body or generated-manifest entry, and visible native jaw stubble or a generic face
  must reject the donor.
- Fixed the source-quality gate so named capture callbacks receive browser globals, the capture
  path regex error is reported at its source, and the tracked code remains formatter-clean. G1
  passed 53/53 Node tests.
- Corrected roster status documentation for the then-registered seven-fighter roster, Doudna's
  accepted runtime promotion, and the current lightweight Hodgkin and Tsien experiments.
- Clarified the active roster status: eight fighters are integrated, while the refreshed full
  serial browser gate remains pending.
- Rotated the changelog after it exceeded 800 lines, retaining the two newest
  day blocks here and preserving the older September entries in
  `CHANGELOG-2026-09a.md`.

## 2026-09-25

### Additions and New Features

- Promoted Barbara McClintock's simplest accepted rich donor into the runtime body without adding
  new face-generation machinery. `mesh2motion_mcclintock.glb` now seals the reviewed rich-v4
  bytes (`6dbf479fa42e78d1890539a19dfd70953e545cd8894ea6efe4e8dafaad720d07`), which already had
  two-slot sixteen-state native-rig evidence. A readiness-bound gameplay comparison and refreshed
  served-byte chooser portrait confirm the feminine face, dark hair, wire glasses, light coat, and
  coherent combat silhouette at the Curie/Warburg caricature standard. The graft remains a
  preserved unregistered experiment; M14 is visually closed and the registered roster remains five fighters.
- Reframed roster appearance around gameplay-scale caricatures. Curie and Warburg are the fidelity
  anchors: a coherent human donor with readable hair, glasses, age, facial-hair, clothing, and
  silhouette cues can be sufficient. Close views now diagnose broken geometry and cue placement,
  while ordinary match-camera comparison decides whether a model is recognizable. Generated heads,
  photo-to-3D, and grafts remain bounded experiments that must visibly outperform the simplest
  cleaned-up donor before they become a lane's production route. Earlier McClintock rejections used
  a stricter portrait-oriented bar; V4's repaired atlas-UV/native-66/loader/exact-byte evidence is
  awaiting that new gameplay comparison, with no motion review or promotion claimed.
- Recorded current lightweight source evidence without starting high-load work.
  Hodgkin's original face art v2 conditionally passes for one lightweight
  geometry proof, while its fuller hair remains an open 1970-reference risk;
  the near-front Nobel portrait is undated, and 1964 is only the prize-page
  year. McClintock's 31,566-triangle preview graft V3 passed native-rig and
  loader checks with exact served-byte captures, but overlapping camera UVs
  lost the intended face paint and left a neck gap. This is an export failure,
  not a likeness rejection; it remains unregistered while one atlas-UV V4
  correction is underway.
- Corrected McClintock's lightweight painted-source provenance without rerendering. The v1 preview
  remains historical; the active v2 input is `mcclintock_generated_front_v2_preview_v2.glb`
  (`32e8cb95...e7738124d`, 13,264 vertices / 31,566 triangles), receipt-bound to the fixed original
  source. Its limited front review conditionally passes face identity only: hair is partial, the
  face is idealized/younger, profiles are unverified, and no body is accepted. The Blender blend
  uses coherent preview normals for its camera-facing source scene only; it makes no outward-winding
  or runtime guarantee.
- Hodgkin's v2 source art conditionally passes its bounded face-and-hair review. It is source art
  only; no 3D geometry, body, rig, or roster work has started.
- Produced one disposable McClintock source preview with the narrow fixed-grid reducer. It reduced
  the offline 4,312,150-vertex / 9,665,772-triangle generated head
  (`c9a69b89...e70284dafe`) to 13,264 vertices / 34,556 triangles in a 562 KiB GLB
  (`0b278a30...45c1aaed`) in about 0.50 seconds. This is bounded authoring evidence only:
  it does not accept the source, set a general triangle limit, or add a runtime asset. The recorded
  wrapper exit was nonzero because the sandbox denied its requested niceness and clock-rate query,
  even though the reducer wrote the preview and receipt; no priority adjustment or metrics rerun is
  claimed.
- Recorded the lightweight 3D authoring boundary after an accidental quadratic Blender diagnostic
  consumed sustained CPU and memory. Native high-resolution sources remain offline; reduce a
  candidate before repeated review, rigging, or browser capture, use bounded vectorized diagnostics,
  serialize heavyweight offline jobs, and do not auto-resume high-resolution generation during a
  load hold. The five runtime bodies remain modest at 922, 3,994, 1,368, 5,322, and 1,996 triangles.
- Reconciled current source evidence without starting new rendering. Anfinsen's neutral bitmap-head
  v2 and the primitive plain heads for Frank, Karikó, Baltimore, Levi-Montalcini, and Gabor fail the
  face gate. McClintock's generated-concept clay proof passes source-art review; its painted preview
  is invalid because the camera faced the back; its fixed source now has one lightweight preview
  awaiting corrected front-projection checks. Buck's original 2D source art passes, while its interrupted high-resolution geometry run
  produced no GLB and remains inconclusive pending a lightweight source strategy.
- Reframed all five registered chooser portraits from their verified runtime body bytes with the
  shared paused vertical pan and face-dominant crop; the manifest and Pages build continue to
  validate portrait and body SHA-256 receipts.
- Reconciled Anfinsen's source-only face proofs without promoting an asset. The sparse 57-vertex
  donor morph left the donor face dominant, and the 20-PCA 2D fit produced an incompatible broad
  jaw and heavy brow with unstable coefficients. Neutral bitmap-head v1 also fails as an asset for
  its hard grayscale mask, blank side face and neck, and oversized beret hair. One fixed-geometry,
  color-face and compact-hair correction remains source-only; no rig, GLB, or registry work follows
  unless close review passes.
- Reopened a distinct McClintock source experiment from the original generated front and
  three-quarter concept. Its cached Pixal geometry proof is complete and remains offline; the
  earlier 1947-photo Pixal input remains retired for duplicate facial relief and a fused hair
  shell. Neither route is an accepted asset or a basis for integration.
- Reopened shipped Goodenough V9 for the face-first identity gate. Its exact live runtime body
  remains registered while a replacement is developed: its rig and formal suit still pass, but its
  broad youthful face, forward short hair, stubble, and absent glasses do not read as Goodenough.
  The asset does not count as visually accepted, and no additional `FighterDef` integration occurred.
- Rejected McClintock's bounded manual GNM Head proof before body, rig, costume, capture, or
  registry work. The parametric head remained generic, its added hair read as a helmet, and its
  oversized wire glasses dominated the face; the source line is retired.
- Reconciled two fresh detailed-head surveys without changing roster assets. Gabor's Rak and live
  `doctor_m` sources fail his face-first target, while Levi-Montalcini's generic bald Vitruvian head
  and Curie's older white-updo source fail hers. The existing Gabor V18 and Levi-Montalcini V12
  candidates remain unmodified at their own body gates.
- Reconciled source-only candidate status before any fighter integration. Blackburn V12's paused
  face gate rejects its smooth oval, horn-like hair masses, and oval glasses before the two-slot
  matrix. Hodgkin's fresh CC0 Old Lady source rejects its faceted face and angular hair silhouette.
  Buck's fresh public CC-BY survey rejects a bald childlike head and a faceless long-hair bust;
  neither archive was inspectable without authentication. These lanes remain outside the
  `FighterDef` registry and require fresh detailed sources.
- Rejected two bounded texture-and-geometry source proofs before any new roster asset was made.
  Franklin's `female_9` short-wave attempt retained the generic donor face and formed tube-loop
  hair; McClintock's original cue bitmap and head-skinned hair cards retained the donor's generic
  facial relief and read as paper strips in three-quarter views. Both now require a compatible,
  detailed head source before another authoring pass.
- Fresh exact-byte, two-slot gates rejected Bertozzi V13 and Altman V13 despite coherent sampled
  motion: each primitive body line exhausts its focused appearance revisions on a blank oval face
  and cap-like hair. The roster tracker now requires a fresh detailed, face-approved donor before
  either fighter can enter integration.
- Retired Pixal3D's McClintock source line before adaptation. Its first texture run ended without a
  GLB; one outside-sandbox Metal geometry-only retry did complete a 114 MB, 3.3-million-vertex GLB,
  proving the local process but not the likeness. Corrected front and three-quarter renders show
  duplicate facial relief and a fused oversized hair shell, so no decimation, rigging, clothing,
  runtime capture, registry entry, or distribution followed.
- Narrowed the production TypeScript source boundary to `src/`, tracked `tests/`, `devel/`, and
  root `playwright.config.ts`, explicitly excluding ignored `tests/_temp/` authoring evidence. The
  current Pages build passes.
- Reopened Franklin's original-fighter visual gate after paused gameplay showed that the
  registered `female_9` donor and its derived chooser portrait have the wrong face and long
  straight hair for the dated 1950 reference. Recorded an exact-model rebuild handoff; the
  earlier donor-reuse decision is superseded while the two-instance loader contract remains.
- Rejected three bounded face-first source proofs before fighter integration: Hodgkin's stock
  MPFB face and bob, Buck's MPFB face with Hair 02, and Sharpless's exact-captured primitive V3.
  Their tracked handoffs now carry the reproducible evidence and the active roster tracker reflects
  the current verdicts. No weak body was promoted into the registry.
- Receipt-bound two-slot captures rejected Baker V15 and Herzberg V9 despite coherent ordinary
  motion. Their cap-like or featureless heads do not clear face-first identity, so both procedural
  body lines are retired and the tracker points to fresh detailed sources.
- A bounded CC0 MPFB source proof for Doudna failed before rigging: its generic face and dark
  center-parted hair contradict the selected period reference. The handoff records the render and
  the tracker now points to a fresh detailed source.
- Reconciled the active tracker with current candidate handoffs for Levi-Montalcini, Bertozzi,
  Frank, Blackburn, Karikó, Altman, Baltimore, and Gabor, and recorded the latest guidance to
  move face-approved sources into playable FighterDefs without expanding review machinery.
- Rechecked previously accepted Tsien, Cech, and Bardeen against the face-first standard. Tsien's
  exact-byte paused capture shows a featureless spherical face and cap; Cech's preserved capture
  shows a generic donor whose glasses and gray hair do not read; Bardeen's preserved capture shows
  a primitive mannequin. All three remain outside the FighterDef registry. Cech and Bardeen source,
  GLBs, receipts, and captures were recovered from `/private/tmp` into tracked authoring handoffs
  and ignored repo-local evidence, and the milestone tracker now reflects the revised verdicts.
- Candidate captures now retain the full paused face scene beside the three close crops, so a
  misplaced or clipped head in the fixed crop cannot be mistaken for a valid appearance review.
- Paused view now supports Shift+Page Up/Down vertical pan, letting the capture workflow center
  a fighter's face at close zoom; resume resets the pan. The focused pause browser test covers it.
- Clarified the face-first source gate: judge well-lit paused close views before clothing or rig
  conversion, retire exhausted donor lines, and keep other roster lanes moving. Normalized three
  Anfinsen authoring scripts without changing their executable AST; the focused typing check passes.
- Rejected the bounded MPFB2 stock-asset McClintock source line after two face/hair attempts.
  A source-coordinate correction seated the wire glasses at the imported eyes, but independent
  close-view review still found a generic androgynous face and pale cap-like hair. No costume,
  combat rig, or production asset was made from this source.
- Rejected a separate Steitz MPFB2 stock-asset source at the close-view gate: slick two-tone hair
  and a detached-looking white beard failed his 2006 likeness, so no costume or rig work followed.
- Added face-first chooser portraits from each fighter's actual runtime model,
  required portrait paths on `FighterDef`, and Pages-build validation/copying for portrait PNGs.
- The Pages build now verifies each portrait receipt's body and image SHA-256 values before copying
  roster-owned portraits. Animation groups loaded after a match is paused immediately honor the
  paused state, so late model loads cannot restart a frozen review pose.
- Reordered the character recipe to establish face features and hair shape before clothing; clothing
  and body shape are supporting cues when face and hair identify the laureate.
- Added receipt-bound paused front and three-quarter face crops to the candidate capture wrapper so
  each appearance lane can review face and hair before adding clothing.
- Let paused zoom frame close face-and-hair views for capture, then clamp back to the match-safe
  range on resume.
- Rejected Jennifer Doudna V5 after the final `female_9` review found that pale sheet hair still
  obscured her face; the rich donor and sampled motion passed, but the primary identity cue did not.
- Recorded the bounded McClintock donor audit: `female_31` renders as an older bearded male and
  Curie's period body preserves its own face, gray updo, and maroon dress. VitruvianGodot is not a
  drop-in donor. Its CC0 head-only V1 (`87aebb9c...4fb4e2dbc`) and V2
  (`1cad0a4a...3456c1e4cf2c`) both passed structural/Babylon/two-slot exact-served capture but
  failed paused face review for their cap, generic-face, and neck-seam defects. The line is retired
  with no V3 or production promotion; McClintock's weak V2 remains registered while MPFB2 source
  and license verification proceeds for a separate one-fighter survey.
- Retired Anfinsen's Goodenough-donor face line after V15's receipt-bound two-position capture:
  sampled motion holds, but dark cheek patches read as beard or facial damage. V14/V15 exhaust this
  donor line before clothing work.
- Reopened Donna Strickland's former primitive V2 pass under the richer face-first standard and
  rejected V3. Its long donor hair and unreadable glasses fail identity, while hand-written
  model-space joint weights make the added dark hair, glasses, and sweater meshes detach in motion.
  The next candidate needs a native skinned export or a more suitable donor.

- Reopened McClintock's appearance review after three-quarter captures showed that V2's added temple
  hair read as facial hair. The detailed female donor remains useful, but V2 does not close her
  identity gate; the V3 candidate needs front and three-quarter face review.
- Clarified the roster recipe and guidance: a rich donor is starting material, and each fighter still
  needs source-backed identity cues that read at gameplay scale. McClintock's 1947 look must remain
  clean-shaven with short swept dark hair, round glasses, and a light lab coat.
- Rejected McClintock V3 after paused close captures showed cheek-crossing dark hair, a remaining
  donor lock, and glasses below eye level; retained its detailed base and clean face texture for one
  focused repair, with no production promotion.
- Rejected McClintock V4 after receipt-bound motion and paused face reviews: the cheek is clean and
  motion is coherent, but a long native lock and broad temple masses still contradict the short 1947
  hairstyle. Retired the `female_9` appearance line after two focused revisions and updated the
  recipe/tracker to require a fresh detailed donor.
- Rejected Buck V21 and Steitz male_5 V9 for appearance despite coherent sampled motion and exact
  candidate-byte provenance. Buck's female_9 appearance line and Steitz's male_5 line are retired.
- Rejected Hodgkin V18 and Steitz doctor_m V1 after independent gameplay-scale appearance review.
  Both preserve detailed coherent bodies and exact capture provenance, but their character cues do
  not read. Hodgkin's `female_9` appearance line is retired. A topology inspection found Steitz's
  doctor_m long medical tunic is one weighted surface with no clean short-jacket layer, so retire
  that donor instead of cutting an irregular hem or adding patch geometry.
- Verified the integrated Goodenough V9 live route in both the game capture and served asset; the
  Pages server returned the same `62f9a8aa...7b55` GLB as the registered model.
- Registered John B. Goodenough as the first independent M23 fighter. His sealed V9 rich-donor
  model now ships from the generated manifest with the Chemistry 2019 prize record, Physics and
  Energy category, `charges` verb, M2 lithium-ion specials, AI profile, and starter unlock.
- Adjusted roster-fighter planning so each FighterDef integrates when its own accepted body and
  direct unlock prerequisites are ready. Wave labels now summarize completion and do not make an
  unrelated body or preceding wave delay a ready fighter; the existing unlock tree remains intact.
- Recovered Jennifer Doudna V3's exact sealed candidate and 16 gameplay frames from `/private/tmp`
  into the repo-local roster-work layout and moved its authoring source under the Graphify-indexed
  `devel/roster_candidates/` tree. Reopened the old PASS because the source removes every detailed
  donor mesh and rebuilds the fighter from primitives, which conflicts with the current roster visual
  standard. Independent review rejected V3's mannequin-like appearance and missing human detail;
  the new V4 lane retains and customizes the detailed donor mesh.
- Restored Marie Curie's established feminine face, updo, and maroon period dress through the
  reviewed canonical-rig V2 body. The original 84-joint source remains preserved as provenance;
  Curie's FighterDef and generated manifest now resolve the exact reviewed runtime asset.
- Promoted Barbara McClintock's reviewed canonical-rig body. The 1947 laboratory cues are built
  into the asset, so the registry no longer adds a duplicate wire-glasses accessory. The current
  rich donor-preserving V2 replaces the earlier primitive-looking model at the existing body path.
- Added sealed, independently reviewed Goodenough (1964) and Steitz (2006) assets. They are
  accepted for their roster waves and remain outside the generated model manifest until their
  FighterDefs register the bodies. A later in-game richness review reopened their visual gate;
  provenance is retained while higher-detail rebuilds proceed.
- Added the match Pause/Resume button with P and Space shortcuts. Match ticks and animation groups
  freeze while orbit, tilt, and zoom remain available for visual review. The focused browser test
  checks pause, resume, and view changes during pause.
- Changed the character recipe to prefer gameplay-qualified donor models and preserve their visible
  mesh and material detail through canonical-rig adaptation. Added capture-host guidance to
  distinguish the temporary body URL/height/appearance setup from the rig-repair donor.
- Reopened McClintock's M14 visual gate after a fresh live capture showed the earlier registered
  body as a primitive-looking figure, then completed the donor-preserving female_9 rebuild after
  its two-slot, eight-state gameplay capture and independent review passed.
- Captured the current original roster directly from the live Pages build. Curie previously resolved
  to the bearded `mesh2motion_female_31.glb`; Warburg and Franklin resolved to their explicit
  registry assets. No runtime fallback substituted another fighter. Curie's period-model V1 served
  the right bytes but rendered off-camera and was rejected; corrected V2 passed review and is now
  registered.
- Recorded the current roster-production direction in human guidance: preserve the visual and rig
  bar, keep accepted-model provenance, convert successful lanes to full FighterDefs as dependencies
  clear, and continue independent model work in parallel.
- Added `docs/NEW_CHARACTER_RECIPE.md` as the source, authoring, capture, visual-review, and handoff
  checklist for new fighter lanes; linked it from the canonical roster plan. The revised recipe
  requires in-game donor evaluation, preserved donor mesh detail, native-export rig repair before
  static preflight, an early deformation capture, separate capture-host and rig-donor records, the
  two-revision replacement rule, and the wave-b candidate gate. Each handoff records source evidence,
  authoring and repair, preview and final capture results, final SHA, and independent review.
- Moved active fighter authoring scripts and handoffs into tracked `devel/roster_candidates/` and
  `docs/active_plans/workstreams/` paths. Added a narrow `.graphifyignore` exception so Graphify
  indexes only that authoring subtree inside `devel/`; generated GLBs, receipts, and screenshots stay
  in ignored repo-local `tests/_temp/roster_work/`. The capture wrapper now saves and serves a
  SHA-named candidate copy inside each capture directory, preserving the exact reviewed bytes if
  authoring later regenerates the working candidate. The active roster tracker records each latest
  candidate's handoff, path, SHA, visual states, verdict, and next action.
- Added `devel/capture_candidate_body.sh` to compute a candidate body's SHA and capture all eight
  rig states in both roster positions. The wrapper runs Babylon's GLB loader before Chromium so
  malformed materials or runtime references fail early. It saves and serves a SHA-named candidate
  copy in each capture directory so later authoring cannot replace the reviewed bytes. On macOS,
  the command must be launched with escalation so Chromium runs outside the sandbox.
- Recorded the photo-reference workflow: search for laureate portraits, including `young <name>` for
  early-career views; verify identity/date against reliable sources and record supported cues in
  dossiers.
- Re-captured the current Hodgkin, Goodenough, and Buck bodies through the repository wrapper and
  had an independent visual review inspect every state in both positions. All three candidates
  still fail source-cue requirements and remain in M22; their concrete findings are in the active
  roster status.
- Started M22's Hodgkin, Goodenough, and Buck authored canonical-body lanes in parallel with
  M14's McClintock canonical-body/export-order experiment. This records the initial authoring state;
  McClintock later passed and was promoted.
- Earlier in this day's history, Curie used Mesh2Motion `female_31` and native combat clips. The
  reviewed period asset has since replaced that runtime route; `female_31` remains provenance.
- Re-read the active fighters after fixed-step simulation and before presentation. A restart or
  round reset can replace `Match.fighters` during that step; rendering now uses the replacement
  objects for rigs, hit cues, and camera framing in the same frame.
- Extended the rig-state capture runner with explicit player/opponent pairs and permanent Curie
  coverage in both ordinary slots across idle, move, light, heavy, block, hit, down, and getup.
  Independent review of the fresh captures found no spider-like deformation. Curie uses the shared
  native-rig path; no production special case was added.
- Added a quiet floor-level ring and presentation-only boundary marks to give the arena a clearer
  playable frame while leaving fighter silhouettes, HUD, captions, and combat state unchanged.

### Fixes and Maintenance

- Removed five inappropriate shebangs from non-executable authoring and check scripts. The focused
  style gate passes.
- Added a pre-capture GLB scene and rig check. It rejects candidates with no reachable mesh,
  orphaned mesh nodes, malformed nodes, a noncanonical skin joint order, mesh assignments outside
  skin 0, or the explicit known source mesh names `Character_26_Doctor`, `Character_31_Female`,
  `Character_Female_09`, `Character_05`, and retired `Character_Female_08` before Chromium
  launches. The donor-preserving design later removed the source-name ban so qualified donor meshes
  can remain visible.
- Bound the opt-in candidate-body capture override to a selected participant's canonical roster
  body URL and a comparison fighter with a distinct body URL before browser launch, then publish
  its receipt only after all browser-error assertions pass.
- Added a fail-closed authored-body repair command that restores a native donor's joint-name order
  by remapping `JOINTS_0` values and inverse-bind rows together; capture and visual review remain
  the deformation and appearance evidence.
- Added accessible, actionable recovery for fighter-pair model loading: a `Retry fighter load`
  button retries the selected pair, and retry state clears after success, selection changes, or a
  match restart.
- Made the Pages build check the generated model manifest without rewriting the tracked source
  file. Special-effect meshes now grow only as needed and reuse disabled meshes, preserving all
  overlapping projectile visuals. The capture helper now accepts every valid registry pair, and
  roster smoke checks actual projected enabled-mesh bounds rather than debug flags. Corrected the
  TypeScript Node-test command and made the super-card unit fixture generic.
- Removed the unused fighter chooser wrapper and `NobelFighterId` type.
- Corrected README prototype flow and Curie rig wording, marked stale plan baselines as historical,
  aligned Markdown link labels and Playwright selector/wait style, consolidated the locked-page
  progress-hook check into the existing secrecy test, removed stale selector and visual tuning
  assertions, escaped authored Unicode punctuation, and updated the vertical-slice report's
  current browser-suite counts.
- Removed the chooser's no-op per-fighter help callback and made model-manifest filesystem failures
  visible. Added or corrected browser selector-contract comments.
- Marked M3 kit recommendations historical. Kept the distinct projectile-pattern contract and
  moved implementation-only proofs plus the long Franklin endurance matrix to `tests/_temp/`.

### Decisions and Failures

- Settled test and asset-authoring ownership. `tests/_temp/` is disposable evidence and the
  workspace for external checkouts, not a pytest or Playwright naming source. Tracked
  `devel/roster_candidates/` stays Graphify-indexed provenance, while the existing
  `tests/conftest.py` registry excludes it from generic application-Python hygiene. This follows
  the demonstrated 39 external collection errors and 310 historical authoring-style failures;
  active proofs retain their own focused compile, render, and asset gates.
- Rejected Anfinsen's one-off gross face-morph direction. The detailed donor exposes only 57
  materially head-weighted vertices; changing 28 of them did not overcome its baked generic face
  or produce a likeness. The lane requires a fresh detailed male head source before further
  appearance or combat work.
- Preliminary M22 candidate-capture evidence keeps Goodenough on HOLD: his enlarged jacket does
  not read as a dark suit. Hodgkin's pose is stable after skirt removal but she remains
  indistinguishable from Curie. Buck remains FAIL: `female_8` conflicts with her dossier and its
  blue chest shell becomes an oval at the back or hip in twisted poses.
- Retired whole-body `clothingTint` and generic garment geometry from the appearance-kit design,
  including lab coats, jackets, shirts/ties, and skirts. Hair, clothing, and silhouette require
  authored canonical-rig bodies; Tier B is limited to supported rigid accessories.
- Retired texture-only appearance as a substitute for Kariko's missing source-backed hair, glasses,
  and blazer. Texture alone cannot supply those silhouette features; preserve donor geometry and add
  the missing supported cues.
- McClintock's unsupported generic lab coat was removed and her appearance gate reopened. The
  appearance-kit cleanup is complete: its runtime and compile-time contracts retain only glasses,
  facial hair, and the manometer, with owned-resource cleanup on failed construction.
- Reopened McClintock, Goodenough, and Steitz visual acceptance after direct match-scale evidence
  showed the current body assets fall below the detailed original-fighter models. Keep their
  provenance; do not integrate those bodies until richer candidates pass the revised gate.

### Developer Tests and Notes

- The current plain pytest suite passes 1265 tests; the Pages build passes. The suite has one
  advisory that `tests/playwright/fighter_selection.spec.ts` is 904 lines, within the existing
  source-file line-limit warning band.
- Rebuilt `dist/` and passed the focused serial Playwright capture (1/1). The browser fetched
  `mesh2motion_female_31.glb`; an independent review of all eight captured Curie states found no
  spider-like deformation or detached geometry.
- An earlier check passed with 51/51 Node tests, strict TypeScript, lint, and formatting. The live
  Franklin endurance scenario also passed with fighter and rig states synchronized through rounds.
- The earlier full serial Playwright suite passed 37/37 in 11.0 minutes after a fresh build. Fresh
  full-HUD captures in both idle slot perspectives confirmed that the floor ring frames play and
  remains subordinate to fighters and HUD.
- Earlier audit verification: `./check_codebase.sh` passed 47/47 Node tests; the Pages build passed;
  the serial browser run passed 36/36 with all 35 permanent browser cases plus the endurance matrix
  later demoted to `tests/_temp/`. `npx playwright test --list` confirms 35 permanent cases.
  Markdown links and `git diff --check` pass. All six independent audit passes completed.
- Follow-up audit verification: `./check_codebase.sh` passed 48/48 Node tests with strict
  TypeScript, lint, and format checks; the Pages build, Markdown-link check, and `git diff --check`
  passed. Focused roster-smoke and paused-chooser cases passed, and the full serial Playwright suite
  passed 35/35 in 9.6 minutes. A standalone McClintock capture was not produced because direct
  Chromium launch failed with macOS `MachPortRendezvous` permission denied; M14's visual appearance
  gate therefore remains open. The lowercase `docs/proposed-combat-roster.md` name remains
  intentional until M33 closeout.
- 2026-09-25 focused pause verification passed 1/1 with Chromium outside the sandbox. Current live
  captures verified Warburg, Franklin, Curie, and McClintock routes; Curie showed the bearded model,
  and McClintock, Goodenough, and Steitz need richer donor-preserving bodies. Curie v1 captures
  failed appearance and rendering; v2 awaits capture. The pause test now also covers P/Space and
  camera orbit while combat remains frozen.
