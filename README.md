# Nobel Combat

A playable 3D fighting prototype where Otto Heinrich Warburg uses research-inspired moves against Marie Curie AI.

[Play the live game](https://vosslab.github.io/nobel-combat/)

## Play locally

```sh
npm install --cache /path/to/writable/npm-cache
./build_github_pages.sh
./run_web_server.sh
```

The browser opens directly into Otto Heinrich Warburg versus Marie Curie AI. Warburg uses WASD to move, J for light, K for Oxygen Transfer, L to block, J+K for Lactate Drive, J+L for Aerobic Glycolysis, and R to restart. Q/E orbit the camera, Page Up/Down tilt it, [ and ] zoom, and mouse drag and wheel adjust the view. A gamepad uses the left stick or D-pad to move, right stick to change the view, south/east for light and Oxygen Transfer, south+east for Lactate Drive, south+right shoulder for Aerobic Glycolysis, right shoulder to block, and Start to restart. Win two rounds to win the match. There is no timer.

The build emits `dist/` for a static host. Run `./check_codebase.sh` for repository checks and `./run_playwright_tests.sh --build` for browser acceptance.

## Implementation

[Combat state](src/match.ts) advances at 60 ticks per second. [The browser entry](src/main.ts) reads controls, drives a simple AI, and renders Otto Heinrich Warburg and Marie Curie as rigged adult humans. Warburg is deliberately stronger through explicit, fixed-tick rules for Oxygen Transfer, Lactate Drive, and Aerobic Glycolysis. The visual integration uses vendored CC0 Mesh2Motion `doctor_m` and `female_31` models with direct same-rig animation clips; [the asset record](assets/README.md) pins their exact source revision and digests. Skeletal clips and move cues follow combat state while gameplay hit and movement geometry remains in `Match`. Input is limited to known controls and bounded movement values (ASVS 2.1.1 and 2.2.1). Match phases are explicit (ASVS 2.3.1). The local dependency audit reports no vulnerabilities at the time of this implementation.

See [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) for the prototype contract.

## License

Source code is released under the [MIT License](LICENSE.MIT). Vendored
Mesh2Motion models, rigs, and animations are released under
[CC0 1.0 Universal](LICENSE.CC0-1.0); their exact source revision, files, and
digests are recorded in [assets/README.md](assets/README.md).
