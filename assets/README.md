# Vendored character assets

This directory vendors the runtime character assets and local compatibility or
retired candidates. The browser never downloads character assets at runtime.

## Source and license

The Warburg, Curie, and Franklin models and the animation libraries come from
[Mesh2Motion](https://github.com/Mesh2Motion/mesh2motion-app), commit
[`3ce7f9d97d25e608b4779ce797da343775ded62b`](https://github.com/Mesh2Motion/mesh2motion-app/tree/3ce7f9d97d25e608b4779ce797da343775ded62b).
The repository's [`LICENSE-CC0.MD`](https://github.com/Mesh2Motion/mesh2motion-app/blob/3ce7f9d97d25e608b4779ce797da343775ded62b/LICENSE-CC0.MD)
places its 3D models, rigs, and animations under CC0 1.0 Universal. The models
and libraries share the same 66-joint skeleton, so Babylon clones their
animation groups directly without retargeting.

Marie Curie's established period-dress candidate is the [Old Lady asset by CDmir on
OpenGameArt](https://opengameart.org/content/old-lady), uploaded February 19,
2016. The source file, retrieved 2026-09-24, is
[`oldlady-v2.blend`](https://opengameart.org/sites/default/files/oldlady-v2.blend);
its SHA-256 is `02e6acd66a07cdc1fb452516c87e8399b6a4b393b0501050b1b120fcb19e9b27`
(14,609,456 bytes; the file header identifies Blender 2.76 as the source save
version). The OpenGameArt page identifies the model as rigged, notes that the
source includes only a sitting animation, and marks it CC0. The vendored
`models/curie_period.glb` keeps the authored model, hair, dress, and rig with a
packed texture. Its 84-joint IK hierarchy is preserved as provenance. The
reviewed `models/mesh2motion_curie_period.glb` maps those visible meshes to the
local canonical combat rig and is Curie's runtime body. The original source
digest is recorded, but the GLB export tool version and settings were not
preserved, so the original conversion process is not fully reproducible.

## Files

| File                                     | Upstream path                                                       | SHA-256                                                            | Purpose                                                       |
| ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `models/mesh2motion_doctor_m.glb`        | `static/models-variation/human/doctor_m.glb`                        | `2923d429514cdbe6c996c99929b6872544ed3a39daa10086d0d490ce8d7cff3d` | Otto Heinrich Warburg's adult scientist presentation model    |
| `models/curie_period.glb`                | OpenGameArt `oldlady-v2.blend`, converted to GLB                    | `2a76aa3fa75990e83dbb7d68f64e2d67dec4eda394a9bc925f20f2f1d74e1ed4` | Established face, updo, and maroon-dress Curie source preserved as provenance |
| `models/mesh2motion_curie_period.glb`    | Canonical-rig adaptation of `curie_period.glb`, sealed review copy  | `cf3f4ccbd838e53b2995824bfa0ecc56c930916b7cd457e73a21daa5d72e1a96` | Curie's runtime period body; passed two-slot, eight-state review |
| `models/mesh2motion_female_9.glb`        | `static/models-variation/human/female_9.glb`                        | `9a60dd24d126f0118f4dd84a830495c094dc72b9ae89de122ca685f5a78950f8` | Rosalind Franklin's adult presentation model                  |
| `models/mesh2motion_male_5.glb`          | `static/models-variation/human/male_5.glb`                          | `95442754e9eee97eb2e90fae9f1241bb78f1f610e6d8bffa9a3315b9e957ced3` | Source-level rig compatibility fixture; not shipped           |
| `models/mesh2motion_female_31.glb`       | `static/models-variation/human/female_31.glb`                       | `72c50339c0caa248b19ec11a5c188d52f6e2bf8e16bd0dd64e98ae756680ceb3` | Curie rig-repair donor; its bearded appearance is not used at runtime |
| `models/mesh2motion_mcclintock.glb`      | Sealed rich-v4 `female_9` donor, retained without further geometry edits | `6dbf479fa42e78d1890539a19dfd70953e545cd8894ea6efe4e8dafaad720d07` | McClintock's runtime caricature: feminine face, dark hair, wire glasses, light coat, and stable native-rig combat presentation |
| `models/mesh2motion_goodenough_1964.glb` | Sealed M22 Goodenough v9 rich-donor capture, independently reviewed | `62f9a8aa574eaaadb370963aa509e5708f4aaf384800ef70e6e0958aafa77b55` | Runtime 1964 body; V9 preserves the detailed male_5 donor and passes the two-slot, eight-state review |
| `models/mesh2motion_buck_2002.glb`       | Sealed M22 Buck simple-donor v2 capture, independently reviewed     | `ce50702172037389565fb226c39d565fbc3079593df474e6fc65147d8f7c4d04` | Runtime 2002 caricature; preserves the native textured face and hair with charcoal cardigan and ivory blouse through the two-slot, eight-state review |
| `models/mesh2motion_doudna_2018.glb`     | Sealed M24 Doudna rich-v5 capture, accepted under the caricature standard | `2baf62bac816b63e8180ef3119d5d9f14985455658b9c6de4b57d9e309dea39a` | Runtime 2018 caricature; native human face, pale shoulder-length hair, black zip-front silhouette, and two-slot eight-state evidence |
| `models/mesh2motion_steitz_2006.glb`     | Sealed M26 Steitz v6 capture, independently reviewed               | `2983f4fd53591da7c285c5f6fadbfc4d70fe89c72d15e73c827832f1d94d5974` | Retained Yale-period model; richness review reopened; unregistered |
| `animations/mesh2motion_human_base.glb`  | Blender-trimmed from `static/animations/human-base-animations.glb`  | `f8565f8e43506df0f11430ec1262c078f68e833a349cb57d5cec04f73cfc4b15` | `Walk`, `Punch_Cross`, `Hit_Knockback`, and `LayToIdle`       |
| `animations/mesh2motion_human_addon.glb` | Blender-trimmed from `static/animations/human-addon-animations.glb` | `bf087458d30e10c2cbc636e70a41a5f2dd5dbbcf6dc22c088fb893c3fcfff6b9` | `Fighting Idle`, `Fighting Left Jab`, `Defend`, and `Death_C` |

Rendering observes `Fighter` state. The deterministic combat simulation,
hit volumes, collision, and timing remain independent of model geometry and
skeletal animation.

## Face portraits

`portraits/*.png` are paused-game crops of the corresponding runtime
`FighterDef.body`, captured by
[`devel/capture_fighter_portraits.mjs`](../devel/capture_fighter_portraits.mjs).
The chooser shows the face and hair as the primary identification cues. The
adjacent `portraits/capture_receipt.json` seals each image to the local and
served body SHA-256 values. The Pages build verifies the recorded body and
image SHA-256 values, then copies roster-owned portraits into `dist/`.
Regenerate a portrait after its runtime body changes; do not use a donor photo
as a substitute for the fighter shown in the game. With the Pages build served,
use the same outside-sandbox Chromium workflow as the roster capture and write
the refreshed PNGs and receipt here:

```sh
node --import tsx devel/capture_fighter_portraits.mjs <fighter-id>... \
  --url http://127.0.0.1:4173/ --output-dir assets/portraits
```

## Authored-body rig repair

Blender may reorder a body skin's joint array while preserving joint names.
Before adding an authored body, repair its exported GLB against the matching
native Mesh2Motion body, then run the rig-boundary tests:

```bash
node devel/repair_skin_joint_order.mjs SOURCE.glb AUTHORED.glb REPAIRED.glb
node --import tsx --test tests/test_rig_asset_repair.mjs tests/test_rig_boundary.mjs
```

The repair command remaps skin indices and inverse-bind rows together. It
rejects unsupported GLB layouts or opaque chunks so a repair never discards
asset data it cannot preserve.
