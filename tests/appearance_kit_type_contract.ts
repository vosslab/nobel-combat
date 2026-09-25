import type { AppearanceKit } from "../src/roster/fighter_def";

const supportedAccessories: AppearanceKit = {
  glasses: "wire",
  facialHair: "chinStrap",
  prop: "manometer",
};
void supportedAccessories;

const unsupportedChest: AppearanceKit = {
  // @ts-expect-error Garment overlays are not stable across combat poses.
  chest: "jacket",
};
void unsupportedChest;

const unsupportedTie: AppearanceKit = {
  // @ts-expect-error Garment overlays are not stable across combat poses.
  tieColor: [0.12, 0.04, 0.04],
};
void unsupportedTie;

const unsupportedSkirt: AppearanceKit = {
  // @ts-expect-error Garment overlays are not stable across combat poses.
  skirt: [0.12, 0.04, 0.04],
};
void unsupportedSkirt;

const unsupportedClothingTint: AppearanceKit = {
  // @ts-expect-error Body meshes can share skin and clothing materials.
  clothingTint: [0.5, 0.4, 0.3],
};
void unsupportedClothingTint;
