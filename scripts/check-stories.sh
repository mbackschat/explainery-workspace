#!/usr/bin/env bash
# Runs every story's checks after a framework change, because a new framework guard can fail a story that nobody is
# working on. A story is a sibling whose package.json links explainery-core as a dependency, so this script never
# names one.
# Runs only when started; never in a hook.
#   scripts/check-stories.sh   pnpm validate (when the story defines it) and pnpm test in each story
set -uo pipefail
shopt -s nullglob
cd "$(dirname "$0")/.."

problems=0
for manifest in */package.json; do
  name=${manifest%/package.json}
  grep -q '"explainery-core": *"link:' "$manifest" || continue
  failed=()
  for check in validate test; do
    grep -q "\"$check\"" "$manifest" || continue
    (cd "$name" && pnpm -s "$check") > /dev/null 2>&1 || failed+=("$check")
  done
  if [ ${#failed[@]} -eq 0 ]; then echo "$name: ok"; else echo "$name: ${failed[*]} failed"; problems=1; fi
done
exit "$problems"
