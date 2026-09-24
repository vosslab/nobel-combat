# Mesh2Motion character assets

This directory vendors the fixed visual assets used by the first playable. The
browser never downloads assets at runtime from an external service.

## Source and license

The adult human model and animation libraries come from
[Mesh2Motion](https://github.com/Mesh2Motion/mesh2motion-app), commit
[`3ce7f9d97d25e608b4779ce797da343775ded62b`](https://github.com/Mesh2Motion/mesh2motion-app/tree/3ce7f9d97d25e608b4779ce797da343775ded62b).
The repository's [`LICENSE-CC0.MD`](https://github.com/Mesh2Motion/mesh2motion-app/blob/3ce7f9d97d25e608b4779ce797da343775ded62b/LICENSE-CC0.MD)
places its 3D models, rigs, and animations under CC0 1.0 Universal. The model
and both libraries share the same 66-joint skeleton, so Babylon clones their
animation groups directly without retargeting.

## Files

| File                                     | Upstream path                                                       | SHA-256                                                            | Purpose                                                       |
| ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `models/mesh2motion_doctor_m.glb`        | `static/models-variation/human/doctor_m.glb`                        | `2923d429514cdbe6c996c99929b6872544ed3a39daa10086d0d490ce8d7cff3d` | Otto Warburg's adult scientist presentation model             |
| `models/mesh2motion_male_5.glb`          | `static/models-variation/human/male_5.glb`                          | `95442754e9eee97eb2e90fae9f1241bb78f1f610e6d8bffa9a3315b9e957ced3` | Adult-proportioned standard AI opponent                       |
| `animations/mesh2motion_human_base.glb`  | Blender-trimmed from `static/animations/human-base-animations.glb`  | `f8565f8e43506df0f11430ec1262c078f68e833a349cb57d5cec04f73cfc4b15` | `Walk`, `Punch_Cross`, `Hit_Knockback`, and `LayToIdle`       |
| `animations/mesh2motion_human_addon.glb` | Blender-trimmed from `static/animations/human-addon-animations.glb` | `bf087458d30e10c2cbc636e70a41a5f2dd5dbbcf6dc22c088fb893c3fcfff6b9` | `Fighting Idle`, `Fighting Left Jab`, `Defend`, and `Death_C` |

Rendering observes `Fighter` state. The deterministic combat simulation,
hit volumes, collision, and timing remain independent of model geometry and
skeletal animation.
