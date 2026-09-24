# Quaternius character assets

This directory vendors the fixed visual assets used by the first playable. The
browser never downloads assets at runtime from an external service.

## Source and license

The model comes from Quaternius **Universal Base Characters**, specifically the
`Superhero_Male_FullBody` character. The combat motion source is Quaternius
**Universal Animation Library**. Quaternius releases both packs under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/); they may be used
and modified without attribution. The project records attribution anyway so
the source remains auditable.

- Official model pack: <https://quaternius.com/packs/universalbasecharacters.html>
- Official animation pack: <https://quaternius.itch.io/universal-animation-library>
- Mirror used for this vendored copy: <https://github.com/Seyamalam/blood-league-kickoff/tree/main/public/assets/vendor/quaternius>

The official itch.io archive endpoints returned HTTP 403 to unattended
downloads on 2026-09-23. The mirror identifies these files as Quaternius CC0
assets. Both input files were inspected before use: each has a 65-joint
`Armature` with identical bone names, so no animation retargeting is required.
The mirror's source ledger records the original official archive SHA-256 values
as `fdbf1804c90dfc1ea03e992bff7da2dfd1a79318e13270a660180f9308455f40`
(base characters) and
`cc73fc4e495b82958207316596317a3f40b9fa38065bde1027937452da537724`
(animation library).

## Files

| File | Origin | SHA-256 | Purpose |
| --- | --- | --- | --- |
| `models/quaternius_superhero_male_fullbody.glb` | mirror `night-striker.glb`, derived from Universal Base Characters `Superhero_Male_FullBody` | `a466828c67a4acc9b2413212ce6d9cde235e3aed9b675680c14fd9673858f118` | 65-joint humanoid model, no embedded clips |
| `animations/quaternius_combat.glb` | trimmed from mirror `universal-animation-library.glb` | `71d558aebaef409dcebffdfe214726ed28cc0040edb59892ea32f12756d03f33` | seven combat clips on the matching skeleton |

The unmodified mirrored animation source SHA-256 is
`4c748767741a3e495d89667b9a218b690ba9810b9517a12e960780e3ca72c4e9`.
`quaternius_combat.glb` retains only these clips:

| Fighter state | Quaternius clip | Notes |
| --- | --- | --- |
| idle | `Idle_Loop` | loop |
| move | `Walk_Loop` | loop |
| light | `Punch_Jab` | one shot |
| heavy | `Punch_Cross` | one shot |
| block | `Sword_Idle` | closest available held guard |
| hit | `Hit_Chest` | one shot |
| down | `Death01` | one shot and held at its last frame |
| getup | `Death01` reversed | closest available recovery motion |

The 2026-09-23 trim copied only the accessors used by those seven source clips
and the inverse-bind matrix. It reduced the animation artifact from 2,714,756
bytes to 1,046,428 bytes. Rendering observes `Fighter` state; gameplay volumes,
fixed-tick combat, and collision remain independent of this asset.
