import type { AppearanceKit } from "../src/roster/fighter_def";

const supportedWireAccessories: AppearanceKit = {
  glasses: { style: "wire" },
  facialHair: "chinStrap",
  prop: "manometer",
};
void supportedWireAccessories;

const supportedRectangularAccessories: AppearanceKit = {
  glasses: { style: "rectangular", offset: [0.01, -0.005, 0.02] },
};
void supportedRectangularAccessories;

const legacyWireGlasses: AppearanceKit = {
  // @ts-expect-error Glasses styles carry their rigid-kit fit with the fighter appearance.
  glasses: "wire",
};
void legacyWireGlasses;

const unsupportedGlassesStyle: AppearanceKit = {
  glasses: {
    // @ts-expect-error The kit has only the reviewed wire and rectangular frame styles.
    style: "round",
  },
};
void unsupportedGlassesStyle;

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
