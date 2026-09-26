# Nobel Combat

A playable 3D fighting prototype where Nobel-linked fighters use research-inspired moves in one-on-one matches.

[Play the live game](https://vosslab.github.io/nobel-combat/)

## Play locally

```sh
npm install --cache /path/to/writable/npm-cache
./build_github_pages.sh
./run_web_server.sh
```

The browser opens to a fighter chooser, where you select the player fighter and the game assigns an AI opponent. Use WASD to move, J for light, K for a heavy knockdown, L to block, I to release a charged Special, and R to restart. P or Space pauses and resumes the match; while paused, Q/E orbit the camera, Page Up/Down tilt it, [ and ] zoom, Shift+Page Up/Down pan vertically, and mouse drag and wheel adjust the view. A gamepad uses the left stick or D-pad to move, right stick to change the view, south for light, east for heavy, north (button 3) for Special, right shoulder to block, and Start to restart. Win two rounds to win the match. There is no timer.

The build emits `dist/` for a static host. Run `./check_codebase.sh` for repository checks and `./run_playwright_tests.sh --build` for browser acceptance.

## Implementation

[Combat state](src/match.ts) advances at 60 ticks per second. [The browser entry](src/main.ts) reads controls, drives a simple AI, and renders the selected fighter pair as rigged adult humans. A shared meter releases each fighter's three data-defined specials. Warburg uses the CC0 Mesh2Motion `doctor_m` model and native clips. Curie resolves to the reviewed period asset `mesh2motion_curie_period.glb`; `female_31` remains donor/provenance material rather than Curie's runtime body. Franklin uses the CC0 Mesh2Motion `female_9` model and native clips. [The asset record](assets/README.md) documents the role assets and license details. Skeletal clips and move cues follow combat state while gameplay hit and movement geometry remains in `Match`. Input is limited to known controls and bounded movement values (ASVS 2.1.1 and 2.2.1). Match phases are explicit (ASVS 2.3.1). The local dependency audit reports no vulnerabilities at the time of this implementation.

See [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) for the prototype contract.

## License

Source code is released under the [MIT License](LICENSE.MIT). Vendored
Mesh2Motion models, rigs, and animations are released under
[CC0 1.0 Universal](LICENSE.CC0-1.0); their exact source revision, files, and
digests are recorded in [assets/README.md](assets/README.md).
