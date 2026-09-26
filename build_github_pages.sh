#!/usr/bin/env bash
# Canonical GitHub Pages build. Run ./build_github_pages.sh directly.
# It checks the shipped model and portrait manifests, validates required source
# assets, type-checks, then creates a clean ESM dist/ bundle with assets.
# The npm build alias mirrors this command; output is never single-file.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# Confirm the tracked shipped-model list matches the roster before the build
# checks any source files or removes the previous dist/ output.
PORTRAITS="$(node --import tsx devel/write_model_manifest.mjs --check --print-portraits)"

while IFS= read -r model || [ -n "$model" ]; do
	if [[ ! "$model" =~ ^assets/models/[a-z0-9_]+\.glb$ ]]; then
		echo "ERROR: invalid model path in assets/models/MANIFEST.txt: $model" >&2
		exit 1
	fi
	if [ ! -s "$model" ]; then
		echo "ERROR: manifest model is missing or empty: $model" >&2
		exit 1
	fi
done < assets/models/MANIFEST.txt

if [ ! -f "src/main.ts" ]; then
	echo "ERROR: required application entry is missing: src/main.ts" >&2
	exit 1
fi
ENTRY="src/main.ts"

# Verify required static assets before any destructive step.
for required in \
	src/index.html \
	src/style.css \
	assets/animations/mesh2motion_human_base.glb \
	assets/animations/mesh2motion_human_addon.glb; do
	if [ ! -f "$required" ]; then
		echo "ERROR: required source file missing: $required" >&2
		case "$required" in
			src/index.html)
				printf '%s\n' \
					'  Create src/index.html with a <script type="module" src="main.js"></script> tag.' >&2
				;;
			src/style.css)
				echo "  Create src/style.css (empty file is fine)." >&2 ;;
		esac
		exit 1
	fi
done

# Soft-warn if index.html does not reference main.js as an ES module.
if ! grep -Eq '<script[^>]+type="module"[^>]+src="(\./)?main\.js"' src/index.html; then
	echo "WARNING: src/index.html does not appear to load main.js as an ES module." >&2
	echo "  Expected tag: <script type=\"module\" src=\"main.js\"></script>" >&2
	echo "  Build will proceed; the page may render but main.js will not run." >&2
fi

rm -rf dist
mkdir -p dist

npx tsc --noEmit -p tsconfig.json

npx esbuild "$ENTRY" \
	--bundle \
	--format=esm \
	--target=es2020 \
	--platform=browser \
	--minify \
	--sourcemap \
	--outfile=dist/main.js

cp src/index.html dist/index.html
cp src/style.css dist/style.css
mkdir -p dist/assets/models dist/assets/animations dist/assets/portraits
while IFS= read -r model || [ -n "$model" ]; do
	cp "$model" dist/assets/models/
done < assets/models/MANIFEST.txt
cp assets/models/MANIFEST.txt dist/assets/models/
cp assets/animations/mesh2motion_human_base.glb dist/assets/animations/
cp assets/animations/mesh2motion_human_addon.glb dist/assets/animations/
while IFS= read -r portrait || [ -n "$portrait" ]; do
	cp "$portrait" dist/assets/portraits/
done <<< "$PORTRAITS"
touch dist/.nojekyll

test -f dist/index.html
test -f dist/main.js
cmp assets/models/MANIFEST.txt dist/assets/models/MANIFEST.txt
while IFS= read -r model || [ -n "$model" ]; do
	test -s "dist/$model"
done < assets/models/MANIFEST.txt
test -s dist/assets/animations/mesh2motion_human_base.glb
test -s dist/assets/animations/mesh2motion_human_addon.glb
while IFS= read -r portrait || [ -n "$portrait" ]; do
	test -s "dist/$portrait"
done <<< "$PORTRAITS"

echo "Built dist/ (GitHub Pages-ready)."
