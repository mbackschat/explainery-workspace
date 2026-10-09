#!/usr/bin/env bash
# Keeps this workspace's sub-projects in step across computers. A repo belongs here when it carries the GitHub topic
# below, so neither this script nor .gitignore ever names a sub-project. Runs only when started; never in a hook.
#   scripts/sync.sh         clone the members missing on this computer and install their dependencies, then check
#   scripts/sync.sh check   list uncommitted or unpushed work, and repos that lack the topic
set -euo pipefail
shopt -s nullglob
cd "$(dirname "$0")/.."
topic=explainery
members=$'\n'$(gh repo list --topic "$topic" --no-archived --limit 100 --json nameWithOwner --jq '.[].nameWithOwner')$'\n'

if [ "${1:-}" != check ]; then
  cloned=()
  for repo in $members; do
    [ -e "${repo#*/}" ] || { gh repo clone "$repo" "${repo#*/}" && cloned+=("${repo#*/}"); }
  done
  # Installs wait for every clone, because the stories link the sibling explainery-core checkout.
  for name in ${cloned[@]+"${cloned[@]}"}; do
    [ ! -f "$name/package.json" ] || (cd "$name" && pnpm install)
  done
fi

problems=0
for dir in */.git; do
  name=${dir%/.git}
  [[ $members == *"/$name"$'\n'* ]] || { echo "$name: lacks the GitHub topic $topic; run (cd $name && gh repo edit --add-topic $topic)"; problems=1; }
  status=$(git -C "$name" status --porcelain --branch)
  [[ $status != *$'\n'* ]] || { echo "$name: uncommitted changes"; problems=1; }
  case "${status%%$'\n'*}" in
    *'[ahead'*) echo "$name: unpushed commits"; problems=1 ;;
    *...*) ;;
    *) echo "$name: branch has no upstream"; problems=1 ;;
  esac
done
exit "$problems"
