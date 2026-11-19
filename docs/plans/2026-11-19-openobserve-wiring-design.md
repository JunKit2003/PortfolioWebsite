# OpenObserve wiring design

Acceptance spec: [openobserve-wiring-spec.md](../openobserve-wiring-spec.md)

## 1. Summary & goal

- **Report** browser errors, logs, page speed (Web Vitals), resource and API-call timings and clicks from visitors' browsers to OpenObserve.
- **Collect** the API and database container logs plus the host's nginx logs with an OpenTelemetry Collector in this repo's Docker Compose, and send them to OpenObserve.
- **Hand off** a short doc telling the VM agent exactly what to provide (OpenObserve itself, its URL, credentials, CORS) so the wiring connects.

Goal: see the site's logs in one place. Running OpenObserve is out of this repo; another agent hosts it on the VM.

### Answers to open questions

- **Session replay?** Off (`sessionReplaySampleRate: 0`).
- **Browser: logs only or logs + RUM?** Both: `@openobserve/browser-logs` and `@openobserve/browser-rum` (0.4.3).
- **Server logs: who collects?** A collector service in this repo's `docker-compose.yml` (option A), not a VM-side collector.

## 2. Scope

**In scope**
- `frontend/src/lib/observability.ts` + tests; called from `main.tsx`.
- `deploy.yml` build env for the browser settings, and running frontend tests in CI.
- `otel-collector` service in `docker-compose.yml` (Compose profile `observability`) with `deploy/otel/collector.yaml`.
- `.env.example` additions, `docs/openobserve-handoff.md`.

**Out of scope**
- Hosting, upgrading or securing OpenObserve itself.
- Session replay, source-map upload, distributed tracing between browser and API.
- Metrics (host/container CPU etc.).
- Changing the API's logging code.

**Definition of Done**
- With settings present, a visitor's JS error shows up in OpenObserve logs tagged with the deploy's commit sha.
- API request logs and nginx access/error logs show up in their own streams.
- With settings absent, the site builds, runs and sends nothing; the Compose stack starts without the collector.

## 3. Architecture & data ownership

### Who owns what

| Thing | Owner | Notes |
|---|---|---|
| Browser SDK init | `frontend/src/lib/observability.ts` | Prod build + configured only; loaded after first render via dynamic `import()` |
| Browser settings | GitHub repo variables `O2_SITE`, `O2_ORG`; secret `O2_CLIENT_TOKEN` | Passed to build as `VITE_O2_SITE`, `VITE_O2_ORG`, `VITE_O2_CLIENT_TOKEN`, `VITE_APP_VERSION=${{ github.sha }}` |
| Server log collection | `otel-collector` service + `deploy/otel/collector.yaml` | Image `otel/opentelemetry-collector-contrib`, pinned version |
| Collector settings | VM `.env`: `O2_OTLP_ENDPOINT`, `O2_AUTH` | `O2_AUTH` = base64 of `user:password` for HTTP Basic |
| OpenObserve instance, TLS, CORS, tokens | VM agent | See handoff doc |

### Browser SDK settings

- RUM: `applicationId: 'portfolio'`, `service: 'portfolio-web'`, `env: 'production'`, `version: VITE_APP_VERSION`, `site: VITE_O2_SITE`, `organizationIdentifier: VITE_O2_ORG`, `clientToken: VITE_O2_CLIENT_TOKEN`, `insecureHTTP: false`, `apiVersion: 'v1'`, `trackResources: true`, `trackLongTasks: true`, `trackUserInteractions: true`, `defaultPrivacyLevel: 'mask-user-input'`, `sessionSampleRate: 100`, `sessionReplaySampleRate: 0`.
- Logs: same `clientToken`, `site`, `organizationIdentifier`, `service`, `env`, `version`, `insecureHTTP`, `apiVersion`; `forwardErrorsToLogs: true`.
- Exposes `log(level, message, context?)` that no-ops until initialised.

### Collector pipelines

| Source | Read from | Parse | OpenObserve stream |
|---|---|---|---|
| API container | Docker json-file logs, `/var/lib/docker/containers/*/*-json.log` (ro mount) | Docker JSON, then pino JSON body; pino numeric `level` → severity | `portfolio_api` |
| DB container | same | Docker JSON; body as text | `portfolio_db` |
| nginx access | host `/var/log/nginx/access.log` (ro mount) | nginx `combined` format regex | `nginx_access` |
| nginx error | host `/var/log/nginx/error.log` (ro mount) | nginx error-log regex (time, level, message) | `nginx_error` |

- Containers are told apart by a Compose label `logging.service` (`api`, `db`) surfaced into each log line via the json-file `labels` logging option. Lines without the label (other containers on the VM) are dropped.
- Export: `otlphttp` to `${O2_OTLP_ENDPOINT}` (e.g. `https://o2.junkit.my/api/default`, the collector appends `/v1/logs`), header `Authorization: Basic ${O2_AUTH}`, one exporter per stream with header `stream-name: <stream>`.
- Read positions kept in a `file_storage` extension on a named volume, so restarts don't resend old lines.

### The rules that fall out of this

- **Not configured means silent, not broken.** Missing browser vars → no SDK loaded; the collector only runs under `docker compose --profile observability up -d`.
- **Read-only access.** Log mounts are `:ro`. The collector runs as root (uid 0) only because Docker's log files are root-readable; it has no ports published.
- **No secrets in the repo.** The browser token comes from a GitHub secret; collector credentials from the VM's `.env`.
- **Tag with the deploy.** Browser data carries `version` = commit sha.

### Changes to existing files

| File | Change |
|---|---|
| `frontend/src/main.tsx` | call `initObservability()` after `render` |
| `.github/workflows/deploy.yml` | build step `env:` with the four `VITE_*` values; add `npm test` step |
| `docker-compose.yml` | `logging` options + `logging.service` label on `api` and `db`; new `otel-collector` service (profile `observability`) and volume |
| `.env.example` | `O2_OTLP_ENDPOINT`, `O2_AUTH` |

No database migration.

## 4. Product-visible behaviour

- Visitors see no change. No cookie banner change is needed beyond what the RUM SDK itself stores (session id in local storage/cookie).
- In OpenObserve: logs streams `portfolio_api`, `portfolio_db`, `nginx_access`, `nginx_error`, plus the browser SDK's own RUM and logs streams.

## 5. Known limitations

- Minified browser stack traces (no source-map upload).
- nginx logs must stay in `combined` format at the default paths; a custom `log_format` needs the regex updated.
- Changing Docker's logging options only applies to containers recreated after the change (`docker compose up -d --force-recreate api db`).
- If OpenObserve is down, the collector buffers briefly then drops; browser SDK data is lost.
