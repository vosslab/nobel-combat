# Nobel Combat

A playable 3D fighting prototype for testing movement, camera, combat, and match flow before adding Nobel science characters.

## Play locally

```sh
npm install --cache /path/to/writable/npm-cache
./build_github_pages.sh
./run_web_server.sh
```

The browser opens directly into Red Dummy versus the Blue Dummy AI. Red uses WASD to move, J for light, K for heavy, L to block, and R to restart. Q/E orbit the camera, Page Up/Down tilt it, [ and ] zoom, and mouse drag and wheel adjust the view. A gamepad uses the left stick or D-pad to move, right stick to change the view, south/east for attacks, right shoulder to block, and Start to restart. Win two rounds to win the match. There is no timer.

The build emits `dist/` for a static host. Run `./check_codebase.sh` for repository checks and `./run_playwright_tests.sh --build` for browser acceptance.

## Implementation

[Combat state](src/match.ts) advances at 60 ticks per second. [The browser entry](src/main.ts) reads controls, drives a simple AI, and renders Red and Blue from presentation geometry. The active visual milestone is evaluating an existing open-license, anatomically proportioned adult-human asset through a local Babylon load and idle/walk/punch experiment before selecting a runtime source. Skeletal clips will follow combat state; gameplay hit and movement geometry remains in `Match`. Input is limited to known controls and bounded movement values (ASVS 2.1.1 and 2.2.1). Match phases are explicit (ASVS 2.3.1). The local dependency audit reports no vulnerabilities at the time of this implementation.

See [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) for the prototype contract.

## License

Source code: [LICENSE.MIT](LICENSE.MIT).
