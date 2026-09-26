// eslint.config.local.js - consumer-owned ESLint overrides.
//
// Add repo-specific ESLint config objects here: extra browser-context globs,
// per-tool globals, or local rule tweaks. This file ships once via the noexist
// bucket and is never overwritten by propagation, so your edits survive. The
// canonical eslint.config.js imports and spreads this array AFTER its own config,
// so entries here refine or override the canonical rules.
//
// Example: give two named node tools browser globals for page.evaluate() use,
// without loosening no-undef across all tools.
//
//   import globals from "globals";
//   export default [
//     {
//       files: ["tools/scene_to_png.mjs", "tools/svg_picker/**"],
//       languageOptions: { globals: { ...globals.browser } },
//     },
//   ];
//
import globals from "globals";

// Capture helpers pass callbacks to Playwright for execution in the game page.
// Those callbacks intentionally use browser globals while the surrounding
// scripts remain Node-based.
export default [
  {
    files: [
      "devel/capture_fighter_portraits.mjs",
      "devel/roster_candidates/m14/mcclintock/generated_head_graft/capture_mcclintock_generated_head_graft_v1.mjs",
      "devel/roster_candidates/m14/mcclintock/simple_donor_comparison/capture_simple_donor_comparison.mjs",
      "devel/roster_candidates/m22/buck/simple_donor/capture_buck_simple_donor_v1.mjs",
      "devel/roster_candidates/m22/buck/simple_donor/capture_buck_simple_donor_v2.mjs",
      "devel/roster_candidates/m22/hodgkin/curie_donor/capture_hodgkin_curie_donor_v1.mjs",
      "devel/roster_candidates/m22/hodgkin/curie_donor/capture_hodgkin_curie_donor_v2.mjs",
      "devel/roster_candidates/m22/hodgkin/simple_donor/capture_hodgkin_simple_donor_v1.mjs",
      "devel/roster_candidates/m24/tsien/simple_donor/capture_tsien_simple_donor_v2.mjs",
      "devel/roster_candidates/m24/tsien/simple_donor/capture_tsien_simple_donor_v3.mjs",
    ],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
];
