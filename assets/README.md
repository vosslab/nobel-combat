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

Marie Curie's retired period-dress candidate is the [Old Lady asset by CDmir on
OpenGameArt](https://opengameart.org/content/old-lady), uploaded February 19,
2016. The source file, retrieved 2026-09-24, is
[`oldlady-v2.blend`](https://opengameart.org/sites/default/files/oldlady-v2.blend);
its SHA-256 is `02e6acd66a07cdc1fb452516c87e8399b6a4b393b0501050b1b120fcb19e9b27`
(14,609,456 bytes; the file header identifies Blender 2.76 as the source save
version). The OpenGameArt page identifies the model as rigged, notes that the
source includes only a sitting animation, and marks it CC0. The vendored
`models/curie_period.glb` keeps the authored model, hair, dress, and rig with a
packed texture as provenance for the rejected candidate. Its IK hierarchy is
not compatible with the local combat clips. The original source digest is
recorded, but the GLB export tool version and settings were not preserved, so
the conversion process is not fully reproducible.

## Files

| File                                     | Upstream path                                                       | SHA-256                                                            | Purpose                                                       |
| ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `models/mesh2motion_doctor_m.glb`        | `static/models-variation/human/doctor_m.glb`                        | `2923d429514cdbe6c996c99929b6872544ed3a39daa10086d0d490ce8d7cff3d` | Otto Heinrich Warburg's adult scientist presentation model    |
| `models/curie_period.glb`                | OpenGameArt `oldlady-v2.blend`, converted to GLB                    | `2a76aa3fa75990e83dbb7d68f64e2d67dec4eda394a9bc925f20f2f1d74e1ed4` | Retired Curie candidate; retained as CC0 provenance           |
| `models/mesh2motion_female_9.glb`        | `static/models-variation/human/female_9.glb`                        | `9a60dd24d126f0118f4dd84a830495c094dc72b9ae89de122ca685f5a78950f8` | Rosalind Franklin's adult presentation model                  |
| `models/mesh2motion_male_5.glb`          | `static/models-variation/human/male_5.glb`                          | `95442754e9eee97eb2e90fae9f1241bb78f1f610e6d8bffa9a3315b9e957ced3` | Source-level rig compatibility fixture; not shipped           |
| `models/mesh2motion_female_31.glb`       | `static/models-variation/human/female_31.glb`                       | `72c50339c0caa248b19ec11a5c188d52f6e2bf8e16bd0dd64e98ae756680ceb3` | Marie Curie's gray-updo presentation model                     |
| `models/mesh2motion_mcclintock.glb`      | Authored canonical-rig body based on `female_9.glb`                 | `062727db91a200c996bf5f5bcba8384dad67944bbdd1037c8f68e5b957683c67` | Barbara McClintock's 1947 laboratory presentation model        |
| `animations/mesh2motion_human_base.glb`  | Blender-trimmed from `static/animations/human-base-animations.glb`  | `f8565f8e43506df0f11430ec1262c078f68e833a349cb57d5cec04f73cfc4b15` | `Walk`, `Punch_Cross`, `Hit_Knockback`, and `LayToIdle`       |
| `animations/mesh2motion_human_addon.glb` | Blender-trimmed from `static/animations/human-addon-animations.glb` | `bf087458d30e10c2cbc636e70a41a5f2dd5dbbcf6dc22c088fb893c3fcfff6b9` | `Fighting Idle`, `Fighting Left Jab`, `Defend`, and `Death_C` |

Rendering observes `Fighter` state. The deterministic combat simulation,
hit volumes, collision, and timing remain independent of model geometry and
skeletal animation.

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
