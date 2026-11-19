#!/usr/bin/env bash
# Tests for activate-release.sh. Plain bash, no dependencies.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HERE/activate-release.sh"
TMPS=()
N=0
trap 'rm -rf "${TMPS[@]}"' EXIT

fail() { echo "FAIL $1: $2" >&2; exit 1; }
pass() { echo "PASS $1"; }

newbase() {
  BASE="$(mktemp -d)"
  TMPS+=("$BASE")
  mkdir -p "$BASE/releases"
}

# mkrel <base> <sha>: create a release with an increasing mtime.
mkrel() {
  N=$((N + 1))
  mkdir -p "$1/releases/$2"
  echo ok > "$1/releases/$2/index.html"
  touch -d "@$((1000000 + N * 100))" "$1/releases/$2"
}

# listrel <base>: sorted release names, space separated.
listrel() { (cd "$1/releases" && ls -1 | sort | tr '\n' ' ' | sed 's/ $//'); }

activate() { bash "$SCRIPT" "$@" >/dev/null 2>&1; }

assert_eq() { [ "$2" = "$3" ] || fail "$1" "expected '$3' got '$2'"; }

t_first_deploy() {
  newbase; mkrel "$BASE" a
  activate "$BASE" a
  assert_eq first_deploy "$(readlink "$BASE/current")" "releases/a"
  [ ! -e "$BASE/current.tmp" ] && [ ! -L "$BASE/current.tmp" ] || fail first_deploy "current.tmp left behind"
  pass first_deploy
}

t_switches_current() {
  newbase; mkrel "$BASE" a; mkrel "$BASE" b
  ln -s releases/a "$BASE/current"
  activate "$BASE" b
  assert_eq switches_current "$(readlink "$BASE/current")" "releases/b"
  pass switches_current
}

t_prunes_to_keep() {
  newbase; for i in 1 2 3 4 5 6 7; do mkrel "$BASE" "r$i"; done
  activate "$BASE" r7 5
  assert_eq prunes_to_keep "$(listrel "$BASE")" "r3 r4 r5 r6 r7"
  pass prunes_to_keep
}

t_fewer_than_keep() {
  newbase; for i in 1 2 3; do mkrel "$BASE" "r$i"; done
  activate "$BASE" r3 5
  assert_eq fewer_than_keep "$(listrel "$BASE")" "r1 r2 r3"
  pass fewer_than_keep
}

t_keeps_rolled_back_current() {
  newbase; for i in 1 2 3 4 5 6 7; do mkrel "$BASE" "r$i"; done
  ln -s releases/r1 "$BASE/current"
  activate "$BASE" r1 5
  # Activating r1 touches it, so it becomes the newest of the keep=5 set
  # (r1 r7 r6 r5 r4); r2 and r3 are pruned.
  assert_eq keeps_rolled_back_current "$(listrel "$BASE")" "r1 r4 r5 r6 r7"
  assert_eq keeps_rolled_back_current "$(readlink "$BASE/current")" "releases/r1"
  pass keeps_rolled_back_current
}

t_protects_current_outside_keep() {
  # Current points at an old release that is not being activated: it must survive pruning.
  newbase; for i in 1 2 3 4 5 6 7; do mkrel "$BASE" "r$i"; done
  ln -s releases/r1 "$BASE/current"
  if activate "$BASE" nope 5; then fail protects_current_outside_keep "expected failure"; fi
  assert_eq protects_current_outside_keep "$(listrel "$BASE")" "r1 r2 r3 r4 r5 r6 r7"
  pass protects_current_outside_keep
}

t_missing_release_fails() {
  newbase; mkrel "$BASE" a
  ln -s releases/a "$BASE/current"
  if activate "$BASE" nope; then fail missing_release_fails "expected non-zero exit"; fi
  assert_eq missing_release_fails "$(readlink "$BASE/current")" "releases/a"
  pass missing_release_fails
}

t_rerun_same_sha() {
  newbase; mkrel "$BASE" a
  ln -s releases/a "$BASE/current"
  activate "$BASE" a || fail rerun_same_sha "non-zero exit"
  assert_eq rerun_same_sha "$(readlink "$BASE/current")" "releases/a"
  pass rerun_same_sha
}

t_relative_symlink() {
  newbase; mkrel "$BASE" abc123
  activate "$BASE" abc123
  assert_eq relative_symlink "$(readlink "$BASE/current")" "releases/abc123"
  pass relative_symlink
}

t_first_deploy
t_switches_current
t_prunes_to_keep
t_fewer_than_keep
t_keeps_rolled_back_current
t_protects_current_outside_keep
t_missing_release_fails
t_rerun_same_sha
t_relative_symlink
