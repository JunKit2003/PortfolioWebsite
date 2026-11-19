# CI/CD deploy to VM design

Acceptance spec: [cicd-deploy-spec.md](../cicd-deploy-spec.md)

## 1. Summary & goal

- **Build** the Vite/React site in `frontend/` on GitHub Actions on every push to `main` (and on manual run).
- **Upload** the built `dist/` to the VM as a new, uniquely named release folder.
- **Switch** the live site to the new release instantly by repointing a symlink nginx serves from.
- **Keep** the last 5 releases so a rollback is one command.

Goal: stop deploying by hand. Pushing to `main` should be the whole deploy.

### Answers to open questions

- **Docker?** No. The site is static files; nginx already serves static content.
- **Can GitHub reach the VM?** Yes, over SSH from the internet, so the build runs on GitHub-hosted runners and pushes to the VM. No self-hosted runner.

## 2. Scope

**In scope**
- `.github/workflows/deploy.yml`: build, lint, rsync, atomic symlink swap, release pruning.
- Documented one-time VM setup: deploy user, directory layout, nginx `root` change, GitHub secrets.

**Out of scope**
- Docker or containers.
- Preview deploys for branches or PRs.
- HTTPS / certificate changes (existing nginx TLS setup stays as is).
- Automated rollback.

**Definition of Done**
- A push to `main` results in the new build being live with no manual step.
- A failing lint or build leaves the live site untouched.
- Rollback documented and tested once by hand.

## 3. Architecture & data ownership

### Who owns what

| Thing | Owner | Notes |
|---|---|---|
| Source, workflow | GitHub repo | `main` is the deploy branch |
| Build | GitHub Actions runner (ubuntu-latest, Node 24) | `npm ci && npm run lint && npm run build` in `frontend/` |
| Releases | VM, `/var/www/portfolio/releases/<sha>/` | Written by `deploy` user only |
| Live pointer | VM, `/var/www/portfolio/current` symlink | nginx `root` points here |
| Secrets | GitHub repo secrets | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, optional `DEPLOY_PORT` |

### The rules that fall out of this

- **Nothing ships unless lint and build pass.** Deploy steps run only after a successful build.
- **The swap is atomic.** `ln -sfn` into a temp name then `mv -T` over `current`, so visitors never see a half-copied site.
- **Host key is pinned.** SSH uses `DEPLOY_KNOWN_HOSTS`; no `StrictHostKeyChecking=no`.
- **One deploy at a time.** Workflow `concurrency` group `deploy-production`, newer run waits rather than racing.
- **Least privilege.** `deploy` user has key-only login and write access only to `/var/www/portfolio`. nginx needs no reload per deploy.
- **Prune after swap.** Keep newest 5 release folders; never delete the one `current` points at.

### Steps

| Step | Where | Command (shape) |
|---|---|---|
| Install | runner | `npm ci` (npm cache via `actions/setup-node`) |
| Lint | runner | `npm run lint` |
| Build | runner | `npm run build` → `frontend/dist/` |
| Upload | runner → VM | `rsync -az --delete dist/ deploy@host:/var/www/portfolio/releases/<sha>/` |
| Swap | VM via SSH | `ln -sfn releases/<sha> current.tmp && mv -T current.tmp current` |
| Prune | VM via SSH | keep newest 5 in `releases/` |

### Changes to existing setup

| Thing | Before | After |
|---|---|---|
| nginx `root` | old static files path | `/var/www/portfolio/current` |
| nginx `location /` | default | `try_files $uri $uri/ /index.html;` |

No migration.

## 4. Product-visible behaviour

- Visitors see the old site until the swap, then the new one. No broken in-between state.
- GitHub Actions run named **Deploy** shows a red X on failure; the live site is unchanged.

## 5. Known limitations

- First deploy needs the one-time VM setup done by hand.
- Rollback is manual (`ln -sfn releases/<older-sha> current`).
- Browser caches may hold old `index.html` briefly; hashed asset names from Vite avoid stale JS/CSS.
