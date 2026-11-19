#!/usr/bin/env bash
# Activate a release: atomically point <base>/current at releases/<sha>, then
# prune old releases. Runs on the VM, e.g.:
#   ssh vm bash -s -- <base> <sha> 5 < activate-release.sh
set -euo pipefail

die() { echo "activate-release: $*" >&2; exit 1; }

[ $# -ge 2 ] && [ $# -le 3 ] || die "usage: $0 <base_dir> <sha> [keep=5]"
base="$1"
sha="$2"
keep="${3:-5}"

[[ "$sha" =~ ^[A-Za-z0-9._-]+$ ]] || die "invalid sha: $sha"
[ "$sha" != "." ] && [ "$sha" != ".." ] || die "invalid sha: $sha"
[[ "$keep" =~ ^[1-9][0-9]*$ ]] || die "keep must be a positive integer: $keep"

cd "$base" || die "cannot cd to $base"
# Uploads land in releases/.<sha>.partial and are promoted here. A live release
# is never rewritten in place: if it already exists, the new upload is dropped.
if [ -d "releases/.$sha.partial" ]; then
  if [ -e "releases/$sha" ]; then
    rm -rf "releases/.$sha.partial"
  else
    mv "releases/.$sha.partial" "releases/$sha"
  fi
fi
[ -d "releases/$sha" ] || die "release not found: releases/$sha"

# Mtime is the deploy order used for pruning, not the build time.
touch "releases/$sha"

# Atomic swap: build the new symlink beside the old one, then rename over it.
ln -sfn "releases/$sha" current.tmp
mv -T current.tmp current

active="$(basename "$(readlink current)")"
count=0
while IFS= read -r rel; do
  count=$((count + 1))
  [ "$count" -le "$keep" ] && continue
  [ "$rel" = "$active" ] && continue
  rm -rf "releases/$rel"
done < <(ls -1t releases)

# Stale uploads from failed deploys (the one for $sha was consumed above).
find releases -mindepth 1 -maxdepth 1 -type d -name '.*.partial' -exec rm -rf {} +

echo "Activated $sha"
