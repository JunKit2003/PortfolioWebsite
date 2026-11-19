# CI/CD Deploy to VM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Push to `main` builds `frontend/` on GitHub Actions and atomically swaps it live on the nginx VM.

**Architecture:** A small bash script (`activate-release.sh`) owns the VM-side swap and pruning and is unit-tested locally against temp dirs. The workflow builds, rsyncs `dist/` into `releases/<sha>/`, then pipes that script over SSH. A setup doc covers the one-time VM and secrets work.

**Tech Stack:** GitHub Actions, Node 24, npm, rsync, OpenSSH, bash, nginx.

**Spec:** `docs/plans/2026-11-19-cicd-deploy-design.md` and `docs/cicd-deploy-spec.md`

## Global Constraints

- Deploy base dir: `/var/www/portfolio`; releases at `/var/www/portfolio/releases/<sha>/`; live symlink `/var/www/portfolio/current`.
- Keep newest 5 releases; never delete the release `current` points at.
- Triggers: `push` to `main` and `workflow_dispatch`. Workflow name: `Deploy`.
- Concurrency group `deploy-production`, `cancel-in-progress: false`.
- Node 24, `npm ci`, `npm run lint`, `npm run build`, working dir `frontend/`.
- Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, optional `DEPLOY_PORT` (default 22).
- Host key pinned via `DEPLOY_KNOWN_HOSTS`; never `StrictHostKeyChecking=no`.
- Swap = `ln -sfn` to `current.tmp` then `mv -T current.tmp current`. No nginx reload.

## Review Focus

- **Rollback then deploy:** after a manual rollback `current` points at an older release; pruning must still keep it even if it falls outside the newest 5. (Test in Task 1.)
- **First deploy:** no `current` and an empty `releases/` must succeed. (Task 1.)
- **Fewer than 5 releases:** prune deletes nothing. (Task 1.)
- **Missing release dir:** activating a sha that wasn't uploaded must fail without touching `current`. (Task 1.)
- **Re-run of same commit:** activating a sha that is already live succeeds and leaves it live. (Task 1.)

---

### Task 1: VM-side activate script

**Files:**
- Create: `.github/scripts/activate-release.sh`
- Test: `.github/scripts/test-activate-release.sh`

**Interfaces:**
- Produces: `activate-release.sh <base_dir> <sha> [keep=5]`. Exit 0 on success, non-zero with message on stderr on failure. Ordering of releases for pruning = directory mtime, newest first (`ls -1t`). Run on VM as `bash -s -- <base> <sha> 5 < activate-release.sh`.

- [ ] **Step 1: Write the failing tests** in `test-activate-release.sh` (plain bash, `set -euo pipefail`, each case in a fresh `mktemp -d`, prints `PASS <name>` / exits 1 on first `FAIL`). Helper `mkrel <base> <sha>` creates `releases/<sha>/index.html` and `touch -d "@<n>"` to set increasing mtimes. Cases:
  - `first_deploy`: one release `a`, no `current` → after run `readlink current == releases/a`, no `current.tmp` left.
  - `switches_current`: releases `a`,`b`, current→a, activate `b` → `readlink current == releases/b`.
  - `prunes_to_keep`: 7 releases r1..r7 (r7 newest), activate r7 → `releases/` has exactly r3..r7.
  - `fewer_than_keep`: 3 releases, activate newest → all 3 remain.
  - `keeps_rolled_back_current`: 7 releases, current→r1 (rollback), activate r1 → r1 still exists and is current; releases left are exactly r1 and r3..r7 (6 total).
  - `missing_release_fails`: current→a, activate `nope` → non-zero exit, `readlink current == releases/a`.
  - `rerun_same_sha`: current→a, activate `a` → exit 0, current still `releases/a`.
  - `relative_symlink`: after activate, `readlink current` is the relative `releases/<sha>` (not absolute), so the tree can move.

- [ ] **Step 2: Run to verify failure**

Run: `bash .github/scripts/test-activate-release.sh`
Expected: FAIL (script not found).

- [ ] **Step 3: Implement `activate-release.sh`**

`set -euo pipefail`; validate args (sha must match `^[A-Za-z0-9._-]+$` and not be `.` or `..`; keep must be a positive integer); `cd "$base"`; fail if `releases/$sha` is not a dir; `touch "releases/$sha"` (so mtime = deploy order, not build time); `ln -sfn "releases/$sha" current.tmp && mv -T current.tmp current`; prune: list `releases/` by mtime newest first, skip first `keep`, skip the basename of `readlink current`, `rm -rf` the rest. Echo `Activated <sha>`.

- [ ] **Step 4: Run tests to verify pass**

Run: `bash .github/scripts/test-activate-release.sh`
Expected: 8 × `PASS`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add .github/scripts
git commit -m "feat(deploy): add release activate script with tests"
```

### Task 2: Deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `.github/scripts/activate-release.sh <base_dir> <sha> [keep]` from Task 1.

- [ ] **Step 1: Write workflow** with:
  - `name: Deploy`; `on: push: branches: [main]` and `workflow_dispatch`.
  - `concurrency: { group: deploy-production, cancel-in-progress: false }`; `permissions: contents: read`.
  - One job `deploy` on `ubuntu-latest`, `defaults.run.working-directory: frontend`.
  - Steps: `actions/checkout@v5`; `actions/setup-node@v5` (`node-version: 24`, `cache: npm`, `cache-dependency-path: frontend/package-lock.json`); `npm ci`; `npm run lint`; `npm run build`; run `bash ../.github/scripts/test-activate-release.sh` (guards the script before it runs on the VM).
  - SSH setup step: write `DEPLOY_SSH_KEY` to `~/.ssh/deploy_key` (chmod 600), `DEPLOY_KNOWN_HOSTS` to `~/.ssh/known_hosts`; export `SSH_CMD="ssh -i ~/.ssh/deploy_key -p ${PORT} -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes"` with `PORT=${{ secrets.DEPLOY_PORT || '22' }}` via `$GITHUB_ENV`.
  - Upload: `rsync -az --delete -e "$SSH_CMD" dist/ "$USER@$HOST:/var/www/portfolio/releases/${GITHUB_SHA}/"` (secrets passed via `env:`, never inlined in `run:`).
  - Activate: `$SSH_CMD "$USER@$HOST" "bash -s -- /var/www/portfolio ${GITHUB_SHA} 5" < ../.github/scripts/activate-release.sh`.
  - Final step `if: always()`: `rm -f ~/.ssh/deploy_key`.

- [ ] **Step 2: Lint the workflow**

Run: `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest -color` (if Docker unavailable, skip and rely on GitHub's validation; note it in the PR).
Expected: no output, exit 0.

- [ ] **Step 3: Verify build steps locally**

Run: `cd frontend && npm ci && npm run lint && npm run build && ls dist/index.html`
Expected: all succeed, `dist/index.html` listed.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat(deploy): add GitHub Actions deploy workflow"
```

### Task 3: VM setup and rollback doc

**Files:**
- Create: `docs/deploy-vm-setup.md`

- [ ] **Step 1: Write the doc** covering, as copy-paste commands for the user to run (no sudo run by the agent):
  1. Create `deploy` user, no password login: `sudo adduser --disabled-password --gecos "" deploy`.
  2. Generate a dedicated key locally: `ssh-keygen -t ed25519 -f portfolio_deploy -N "" -C "github-actions-deploy"`; add `.pub` to `/home/deploy/.ssh/authorized_keys` (700/600, owned by deploy).
  3. Dirs: `sudo mkdir -p /var/www/portfolio/releases && sudo chown -R deploy:deploy /var/www/portfolio`.
  4. Seed first release from current site so the switch is seamless: copy existing files into `releases/initial` and `ln -sfn releases/initial current`.
  5. nginx server block change: `root /var/www/portfolio/current;` and `location / { try_files $uri $uri/ /index.html; }`; `sudo nginx -t && sudo systemctl reload nginx`. Note `disable_symlinks` must be off (default).
  6. Secrets: get host key with `ssh-keyscan -p <port> <host>` (verify fingerprint against `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the VM); add the 5 secrets via GitHub UI or `gh secret set NAME < file`.
  7. Rollback: `ls -1t /var/www/portfolio/releases` then `ln -sfn releases/<sha> /var/www/portfolio/current.tmp && mv -T ... current`.
  8. Troubleshooting: host key mismatch, permission denied, 403 from nginx (dir perms readable by nginx user).

- [ ] **Step 2: Check doc against spec** — every secret name and path matches Global Constraints (`grep -c DEPLOY_ docs/deploy-vm-setup.md` ≥ 5).

- [ ] **Step 3: Commit**

```bash
git add docs/deploy-vm-setup.md
git commit -m "docs(deploy): add VM setup and rollback guide"
```
