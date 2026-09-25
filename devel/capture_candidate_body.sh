#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s <candidate.glb> <body-owner-id> <comparison-fighter-id> <output-dir> [url]\n' "$0" >&2
  printf 'On macOS, run this command with sandbox escalation so Chromium starts outside the sandbox.\n' >&2
}

if [[ $# -lt 4 || $# -gt 5 ]]; then
  usage
  exit 2
fi

candidate_glb=$1
body_owner=$2
comparison_fighter=$3
output_dir=$4
capture_url=${5:-http://127.0.0.1:4173/}

case "$candidate_glb" in
  /*) ;;
  *) candidate_glb="$PWD/$candidate_glb" ;;
esac
case "$output_dir" in
  /*) ;;
  *) output_dir="$PWD/$output_dir" ;;
esac

if [[ ! -f "$candidate_glb" ]]; then
  printf 'Candidate GLB not found: %s\n' "$candidate_glb" >&2
  exit 2
fi

candidate_sha256=$(node -e 'const fs = require("node:fs"); const crypto = require("node:crypto"); process.stdout.write(crypto.createHash("sha256").update(fs.readFileSync(process.argv[1])).digest("hex"));' "$candidate_glb")
repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

capture() {
  local player_id=$1
  local opponent_id=$2
  local output=$3

  node --import tsx tests/playwright/capture_rig_states.mjs \
    --url "$capture_url" \
    --player "$player_id" \
    --opponent "$opponent_id" \
    --body-owner "$body_owner" \
    --candidate-glb "$candidate_glb" \
    --candidate-sha256 "$candidate_sha256" \
    --output-dir "$output"
}

capture "$body_owner" "$comparison_fighter" "$output_dir/player"
capture "$comparison_fighter" "$body_owner" "$output_dir/opponent"
