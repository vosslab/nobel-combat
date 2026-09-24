# Mesh2Motion character assets

This directory vendors the fixed visual assets used by the first playable. The
browser never downloads assets at runtime from an external service.

## Source and license

The adult human model and animation libraries come from
[Mesh2Motion](https://github.com/Mesh2Motion/mesh2motion-app), commit
[`3ce7f9d97d25e608b4779ce797da343775ded62b`](https://github.com/Mesh2Motion/mesh2motion-app/tree/3ce7f9d97d25e608b4779ce797da343775ded62b).
The repository's [`LICENSE-CC0.MD`](https://github.com/Mesh2Motion/mesh2motion-app/blob/3ce7f9d97d25e608b4779ce797da343775ded62b/LICENSE-CC0.MD)
places its 3D models, rigs, and animations under CC0 1.0 Universal. The model
and both libraries share the same 65-joint skeleton, so Babylon clones their
animation groups directly without retargeting.

## Files

| File | Upstream path | SHA-256 | Purpose |
| --- | --- | --- | --- |
| `models/mesh2motion_male_5.glb` | `static/models-variation/human/male_5.glb` | `95442754e9eee97eb2e90fae9f1241bb78f1f610e6d8bffa9a3315b9e957ced3` | Adult-proportioned human model, used independently for Red and Blue |
| `animations/mesh2motion_human_base.glb` | `static/animations/human-base-animations.glb` | `406eb0a8dc4ab366e623b79b6e3005a4951392e1bda78ae39c1099d31147733c` | Walk, cross punch, hit, knockdown, and recovery clips |
| `animations/mesh2motion_human_addon.glb` | `static/animations/human-addon-animations.glb` | `a0d64d555e0d492026b72d58bf8e16c5e86779295f9093e376dcc001915c2c95` | Fighting idle, jab, and held defensive pose clips |

Rendering observes `Fighter` state. The deterministic combat simulation,
hit volumes, collision, and timing remain independent of model geometry and
skeletal animation.
