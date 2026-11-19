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

t_promotes_partial() {
  newbase
  mkdir -p "$BASE/releases/.abc.partial"; echo new > "$BASE/releases/.abc.partial/index.html"
  activate "$BASE" abc || fail promotes_partial "non-zero exit"
  assert_eq promotes_partial "$(readlink "$BASE/current")" "releases/abc"
  assert_eq promotes_partial "$(cat "$BASE/releases/abc/index.html")" "new"
  [ ! -e "$BASE/releases/.abc.partial" ] || fail promotes_partial "partial left behind"
  pass promotes_partial
}

t_rerun_live_sha_discards_partial() {
  newbase; mkrel "$BASE" a
  echo live > "$BASE/releases/a/marker"
  ln -s releases/a "$BASE/current"
  mkdir -p "$BASE/releases/.a.partial"; echo different > "$BASE/releases/.a.partial/marker"
  activate "$BASE" a || fail rerun_live_sha_discards_partial "non-zero exit"
  assert_eq rerun_live_sha_discards_partial "$(cat "$BASE/releases/a/marker")" "live"
  assert_eq rerun_live_sha_discards_partial "$(readlink "$BASE/current")" "releases/a"
  [ ! -e "$BASE/releases/.a.partial" ] || fail rerun_live_sha_discards_partial "partial left behind"
  pass rerun_live_sha_discards_partial
}

t_stale_partials_pruned() {
  newbase; mkrel "$BASE" a
  mkdir -p "$BASE/releases/.old.partial"; echo x > "$BASE/releases/.old.partial/index.html"
  activate "$BASE" a || fail stale_partials_pruned "non-zero exit"
  [ ! -e "$BASE/releases/.old.partial" ] || fail stale_partials_pruned "stale partial remains"
  pass stale_partials_pruned
}

t_partial_not_counted() {
  newbase; for i in 1 2 3 4 5; do mkrel "$BASE" "r$i"; done
  mkdir -p "$BASE/releases/.stale.partial"
  activate "$BASE" r5 5 || fail partial_not_counted "non-zero exit"
  assert_eq partial_not_counted "$(listrel "$BASE")" "r1 r2 r3 r4 r5"
  pass partial_not_counted
}

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

t_missing_sha_leaves_releases_untouched() {
  # Activating a sha that does not exist must fail before any pruning happens.
  newbase; for i in 1 2 3 4 5 6 7; do mkrel "$BASE" "r$i"; done
  ln -s releases/r1 "$BASE/current"
  if activate "$BASE" nope 5; then fail missing_sha_leaves_releases_untouched "expected failure"; fi
  assert_eq missing_sha_leaves_releases_untouched "$(listrel "$BASE")" "r1 r2 r3 r4 r5 r6 r7"
  pass missing_sha_leaves_releases_untouched
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
t_missing_sha_leaves_releases_untouched
t_missing_release_fails
t_rerun_same_sha
t_relative_symlink
t_promotes_partial
t_rerun_live_sha_discards_partial
t_stale_partials_pruned
t_partial_not_counted
