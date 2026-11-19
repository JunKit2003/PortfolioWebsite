# OpenObserve Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send browser RUM + logs and API/DB/nginx logs to an externally hosted OpenObserve, off by default until configured.

**Architecture:** A frontend module lazily loads the OpenObserve browser SDKs only in configured production builds; CI passes the settings at build time. An OpenTelemetry Collector service (Compose profile `observability`) tails Docker json-file logs and host nginx logs and exports OTLP/HTTP to OpenObserve, one stream per source. A handoff doc tells the VM agent what to supply.

**Tech Stack:** React 19 + Vite + vitest (frontend), `@openobserve/browser-rum` / `@openobserve/browser-logs` 0.4.3, GitHub Actions, Docker Compose, `otel/opentelemetry-collector-contrib`.

**Spec:** `docs/plans/2026-11-19-openobserve-wiring-design.md` and `docs/openobserve-wiring-spec.md`

## Global Constraints

- Browser env vars: `VITE_O2_SITE`, `VITE_O2_ORG`, `VITE_O2_CLIENT_TOKEN`, `VITE_APP_VERSION`. GitHub: variables `O2_SITE`, `O2_ORG`; secret `O2_CLIENT_TOKEN`; version = `${{ github.sha }}`.
- RUM options (exact): `applicationId: 'portfolio'`, `service: 'portfolio-web'`, `env: 'production'`, `version`, `site`, `organizationIdentifier`, `clientToken`, `insecureHTTP: false`, `apiVersion: 'v1'`, `trackResources: true`, `trackLongTasks: true`, `trackUserInteractions: true`, `defaultPrivacyLevel: 'mask-user-input'`, `sessionSampleRate: 100`, `sessionReplaySampleRate: 0`.
- Logs options (exact): same `clientToken`, `site`, `organizationIdentifier`, `service`, `env`, `version`, `insecureHTTP`, `apiVersion`; `forwardErrorsToLogs: true`.
- Monitoring starts only when `import.meta.env.PROD` and site, org and token are all non-blank. SDKs loaded via dynamic `import()` after first render.
- Collector: Compose service `otel-collector`, profile `observability`, config `deploy/otel/collector.yaml`, image `otel/opentelemetry-collector-contrib:<pinned version>`, `user: "0"`, no published ports, all log mounts `:ro`.
- Streams: `portfolio_api` (api container, pino JSON), `portfolio_db` (db container), `nginx_access` (`/var/log/nginx/access.log`, `combined`), `nginx_error` (`/var/log/nginx/error.log`).
- Container tagging: Compose label `logging.service` = `api` / `db`; json-file logging option `labels: logging.service`. Unlabelled lines dropped.
- Export: `otlphttp`, endpoint `${env:O2_OTLP_ENDPOINT}`, header `Authorization: Basic ${env:O2_AUTH}`, header `stream-name: <stream>` per exporter. `.env` keys `O2_OTLP_ENDPOINT`, `O2_AUTH`.
- Positions persisted with `file_storage` extension on a named volume.
- `docker compose config` must pass with no `O2_*` vars set and no profile.
- Pino level → severity: 10 TRACE, 20 DEBUG, 30 INFO, 40 WARN, 50 ERROR, 60 FATAL.

## Review Focus

- **Blank-but-set env vars** (e.g. `O2_SITE` repo variable missing renders as empty string in CI): treated as unset, monitoring off. (Task 1 test.)
- **SDK fails to load** (blocked by an ad blocker, network error): `initObservability` resolves `false`, never throws, page unaffected. (Task 1 test.)
- **API log line that isn't JSON** (e.g. a crash stack printed by Node): still delivered to `portfolio_api` as plain body, not dropped. (Task 3 fixture.)
- **nginx access line with `-` for bytes or referrer**, or a request line with odd characters: parsed without dropping the line. (Task 3 fixture.)
- **Compose without O2 vars / without profile:** `docker compose config` passes and `docker compose up` would not start the collector. (Task 3 check.)

---

### Task 1: Browser observability module

**Files:**
- Create: `frontend/src/lib/observability.ts`
- Create: `frontend/src/lib/observability.test.ts`
- Create: `frontend/src/env.d.ts` (typed `ImportMetaEnv` for the four `VITE_*` vars)
- Modify: `frontend/src/main.tsx` (call `void initObservability()` after `render`)
- Modify: `frontend/package.json` / lock (add `@openobserve/browser-rum@0.4.3`, `@openobserve/browser-logs@0.4.3` as dependencies, exact versions)

**Interfaces:**
- Produces:
  - `type ObservabilityEnv = { PROD: boolean; VITE_O2_SITE?: string; VITE_O2_ORG?: string; VITE_O2_CLIENT_TOKEN?: string; VITE_APP_VERSION?: string }`
  - `type ObservabilityConfig = { site: string; org: string; clientToken: string; version: string }` (`version` defaults to `'dev'` when blank)
  - `readObservabilityConfig(env: ObservabilityEnv): ObservabilityConfig | null` — trims values; null if not PROD or any of site/org/token blank.
  - `type Sdks = { rum: { init(opts: object): void }; logs: { init(opts: object): void; logger: Record<'debug'|'info'|'warn'|'error', (msg: string, ctx?: object) => void> } }`
  - `initObservability(env: ObservabilityEnv = import.meta.env, load: () => Promise<Sdks> = loadSdks): Promise<boolean>` — idempotent (second call returns the first result without re-init).
  - `log(level: 'debug'|'info'|'warn'|'error', message: string, context?: Record<string, unknown>): void`
  - Test-only reset: `__resetObservabilityForTests(): void`.

- [ ] **Step 1: Write failing tests** in `observability.test.ts` (vitest, fake `load` returning `vi.fn()` spies):
  - `readObservabilityConfig`: returns null when `PROD: false`; null for each of site/org/token missing; null when one is `"   "`; returns trimmed values; `version` `'dev'` when blank, else the sha.
  - `initObservability` with config: resolves `true`; `rum.init` called once with exactly the RUM options from Global Constraints; `logs.init` called once with exactly the Logs options.
  - Not configured: resolves `false`; `load` never called.
  - `load` rejects: resolves `false`, no throw.
  - Idempotent: two calls → `load` called once.
  - `log` before init: no throw, nothing called. After init: `log('error','boom',{a:1})` calls `logs.logger.error('boom',{a:1})`.
- [ ] **Step 2: Run** `cd frontend && npx vitest run src/lib/observability.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement** `observability.ts`. `loadSdks` = `Promise.all([import('@openobserve/browser-rum'), import('@openobserve/browser-logs')])` mapped to `{ rum: m1.openobserveRum, logs: m2.openobserveLogs }` (check the packages' actual export names in `node_modules` and adapt). Install deps. Add `env.d.ts`. Wire `main.tsx`.
- [ ] **Step 4: Run** `npx vitest run` (all frontend tests) → PASS; `npm run lint` → clean; `npm run build` (no vars) → passes; `grep -l openobserve dist/assets/index-*.js` → no match (SDK only in a lazy chunk); `VITE_O2_SITE=o2.example.com VITE_O2_ORG=default VITE_O2_CLIENT_TOKEN=x npm run build` → passes.
- [ ] **Step 5: Commit** `feat(frontend): add OpenObserve browser RUM and logs, off until configured`

### Task 2: CI build wiring

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the four `VITE_*` names from Task 1.

- [ ] **Step 1:** Add a `Test` step (`npm test`) after Lint. On the Build step add `env:` `VITE_O2_SITE: ${{ vars.O2_SITE }}`, `VITE_O2_ORG: ${{ vars.O2_ORG }}`, `VITE_O2_CLIENT_TOKEN: ${{ secrets.O2_CLIENT_TOKEN }}`, `VITE_APP_VERSION: ${{ github.sha }}`. Nothing else changes.
- [ ] **Step 2:** `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest -color` → no output, exit 0.
- [ ] **Step 3:** `cd frontend && npm test` → PASS.
- [ ] **Step 4: Commit** `ci: run frontend tests and pass OpenObserve settings to the build`

### Task 3: Log collector in Compose

**Files:**
- Create: `deploy/otel/collector.yaml`
- Create: `deploy/otel/test/run.sh` (local smoke test; Docker required)
- Create: `deploy/otel/test/fixtures/...` (sample Docker json-file logs and nginx logs)
- Create: `deploy/otel/test/overlay.yaml` (replaces the otlphttp exporters with `file` exporters per stream for the test)
- Modify: `docker-compose.yml`, `.env.example`

**Interfaces:**
- Produces: stream names and `.env` keys from Global Constraints (Task 4 documents them).

- [ ] **Step 1: Write the smoke test** `run.sh` (bash, `set -euo pipefail`): runs the pinned collector image with `--config /etc/otel/collector.yaml --config /etc/otel/overlay.yaml`, fixtures mounted read-only at `/var/lib/docker/containers` and `/var/log/nginx`, dummy `O2_OTLP_ENDPOINT`/`O2_AUTH`, output dir mounted for the file exporters, stops after ~10s, then asserts with `jq` (or `grep` if jq absent):
  - `portfolio_api` output has the pino `msg` as body, severity `INFO` for level 30 and `ERROR` for level 50, and pino fields (e.g. `req.method`) as attributes; a non-JSON api line is present as plain body.
  - `portfolio_db` has the db fixture line.
  - `nginx_access` has attributes for method, path, status `200`, bytes, referrer, user agent; a line with `-` bytes/referrer is present.
  - `nginx_error` has level `error` and message.
  - A fixture line from a container with no `logging.service` attr appears in no output.
  Also first runs `otelcol-contrib validate` on `collector.yaml` alone (with dummy env).
- [ ] **Step 2: Run** `bash deploy/otel/test/run.sh` → FAIL (config missing).
- [ ] **Step 3: Implement** `collector.yaml`: `filelog` receivers (docker: include `/var/lib/docker/containers/*/*-json.log`, `start_at: beginning`, `storage: file_storage`, operators: json parse of the Docker line, move `log` to body and `attrs["logging.service"]` to an attribute, drop if missing, trim trailing newline; nginx access/error with regex parsers); `routing` (connector or processor) or per-service filter so `api` → `portfolio_api`, `db` → `portfolio_db`; for api, json-parse body when it is JSON and map pino `level`/`msg`/`time`; `batch` processor; four `otlphttp` exporters with headers per Global Constraints; `file_storage` extension at `/var/lib/otelcol/storage`. Pin the image to the current contrib release (check with `docker pull`). Add to `docker-compose.yml`: on `api` and `db` a `labels: { logging.service: <name> }` and `logging: { driver: json-file, options: { labels: logging.service, max-size: "10m", max-file: "3" } }`; the `otel-collector` service (profile, user 0, `restart: unless-stopped`, ro mounts of `./deploy/otel/collector.yaml`, `/var/lib/docker/containers`, `/var/log/nginx`, named volume `otelstorage` for storage, `environment` passing `O2_OTLP_ENDPOINT` and `O2_AUTH` without `:?`). Add the two keys to `.env.example` with a comment on building `O2_AUTH` (`printf '%s' 'user:pass' | base64`).
- [ ] **Step 4: Run** `bash deploy/otel/test/run.sh` → all assertions PASS. Compose check (the `api` service reads `env_file: .env`, so create a throwaway one): `cp .env.example .env`, then `docker compose config >/dev/null` and `docker compose --profile observability config >/dev/null` both exit 0, and `docker compose config --services` does not list `otel-collector`; then `rm .env` (gitignored, never commit it).
- [ ] **Step 5: Commit** `feat(deploy): add OpenTelemetry collector for API, DB and nginx logs`

### Task 4: Handoff doc

**Files:**
- Create: `docs/openobserve-handoff.md`
- Modify: `backend/README.md` (one line linking the handoff doc), `docs/openobserve-wiring-spec.md` (Status → "Built, awaiting OpenObserve")

**Interfaces:**
- Consumes: every name from Global Constraints; the collector image tag and test script from Task 3.

- [ ] **Step 1: Write the doc** for an agent that has not read the code: what this repo sends and where; what the VM agent must provide (OpenObserve reachable over HTTPS at a public host for the browser, e.g. `o2.junkit.my`, Cloudflare note: proxied record is fine; CORS allowing `https://junkit.my`; org name; RUM client token from Data → Data sources → Real User Monitoring; an ingestion user/password for the collector); GitHub settings (`gh variable set O2_SITE`, `gh variable set O2_ORG`, `gh secret set O2_CLIENT_TOKEN`) then redeploy; VM `.env` keys and how to build `O2_AUTH`; `O2_OTLP_ENDPOINT` form (`https://<host>/api/<org>` or an internal URL if OpenObserve runs on the same Docker host — note the collector container must be able to reach it); start command `docker compose --profile observability up -d` plus one-time `docker compose up -d --force-recreate api db` so the logging label applies; checks per stream (a curl to `/api/health` → `portfolio_api` + `nginx_access`; a 404 → `nginx_access`; browser: open the site, run `throw new Error('o2 test')` in devtools console → browser logs); troubleshooting (401 from OpenObserve, CORS errors in the console, no nginx lines → log paths/format, nothing at all → profile not used).
- [ ] **Step 2: Check** `grep -cE 'O2_SITE|O2_ORG|O2_CLIENT_TOKEN|O2_OTLP_ENDPOINT|O2_AUTH|portfolio_api|portfolio_db|nginx_access|nginx_error' docs/openobserve-handoff.md` ≥ 9 and every name matches Global Constraints.
- [ ] **Step 3: Commit** `docs: add OpenObserve handoff for the VM agent`
