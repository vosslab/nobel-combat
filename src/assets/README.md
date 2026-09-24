# Neutral humanoid asset

`neutral_humanoid.glb` is a generated, generic low-poly combat placeholder. It has a 14-joint
skin and skeletal animation clips named `idle`, `move`, `light`, `heavy`, `block`, `hit`, `down`,
and `getup`. It contains no Nobel laureate likeness or third-party material.

Regenerate it from repository root with:

```bash
source source_me.sh && python3 devel/build_neutral_humanoid.py
```

The GLB uses +Y as up, faces +Z, and rests with both feet on the ground plane. Game code owns
combat state and collision; this asset only renders the corresponding state.
