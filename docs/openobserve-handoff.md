# OpenObserve handoff for the VM agent

You host OpenObserve on the VM. This repo (the portfolio site, `https://junkit.my`, Cloudflare in front) already sends logs to it once you provide the pieces below. You do not need to read the code. VM, nginx and deploy-user setup is in [deploy-vm-setup.md](deploy-vm-setup.md), not repeated here.

## 1. What this repo sends

| Source | Stream / service | How |
| --- | --- | --- |
| API container logs | stream `portfolio_api` | OpenTelemetry Collector (`otel-collector`, Compose profile `observability`) |
| Postgres container logs | stream `portfolio_db` | same collector |
| nginx `/var/log/nginx/access.log` | stream `nginx_access` | same collector |
| nginx `/var/log/nginx/error.log` | stream `nginx_error` | same collector |
| Browser errors, logs, Web Vitals, resource/API timings, clicks | RUM and logs, service `portfolio-web`, env `production` | OpenObserve browser SDK in the JS bundle, direct to OpenObserve over HTTPS |

Collector image: `otel/opentelemetry-collector-contrib:0.165.0`. Config: `deploy/otel/collector.yaml`. Session replay is off.

## 2. What you must provide

1. **OpenObserve reachable over HTTPS at a public host** for the browser, e.g. `o2.junkit.my`. A Cloudflare proxied (orange cloud) record is fine.
2. **CORS** on that host allowing the origin `https://junkit.my` (browser requests are cross-origin).
3. **An organization name** (e.g. `default`). Call it `<org>` below.
4. **A RUM client token**: OpenObserve UI, Data, Data sources, Real User Monitoring. This is a public token (it ships in the JS bundle); never use an admin credential here.
5. **An ingestion-only user and password** for the collector (`<user>` / `<password>`). It is also copied into the API container's environment (see section 4), so keep its rights minimal.

## 3. GitHub settings (browser side)

`O2_SITE` is host[:port] only: no scheme, no path (e.g. `o2.junkit.my`). The SDK always uses HTTPS.

```bash
gh variable set O2_SITE --body '<host>[:port]'
gh variable set O2_ORG --body '<org>'
gh secret set O2_CLIENT_TOKEN --body '<rum-client-token>'
```

These feed the build as `VITE_O2_SITE`, `VITE_O2_ORG`, `VITE_O2_CLIENT_TOKEN` (and `VITE_APP_VERSION` = commit SHA). If any of the three is missing the browser reporting stays off.

Then rebuild the bundle: run the Deploy workflow manually on `main` (`gh workflow run deploy.yml --ref main`, or Actions, Deploy, Run workflow). Setting the values alone does nothing until a new build.

## 4. VM `.env` (collector side)

In the repo checkout on the VM, edit `.env` (template: `.env.example`). Set these **before** starting the profile:

```bash
# Build the auth value
printf '%s' '<user>:<password>' | base64

# .env
O2_OTLP_ENDPOINT=https://<host>/api/<org>
O2_AUTH=<base64 output from above>
```

- `O2_OTLP_ENDPOINT` is the org's OTLP base URL and must stop at `/api/<org>`: the exporter appends `/v1/logs` itself.
- Prefer an internal endpoint (for example `http://<container-or-host-ip>:5080/api/<org>`) over the public host. It keeps collector traffic out of nginx (see section 5a). The collector container must be able to reach it: `localhost` does not work from inside the container.
- If OpenObserve runs in a different Compose project, either attach the collector to OpenObserve's network (an `external` network in a compose override on the VM, not committed) and use `http://<service>:5080/api/<org>`, or use the host's published port.
- Don't reuse the ingestion user behind `O2_AUTH` as a UI login.
- Starting the profile with an empty `O2_OTLP_ENDPOINT` makes the collector crash-loop (`restart: unless-stopped`). Set `.env` first.
- The `api` container also receives `O2_AUTH` because it loads the whole `.env` (`env_file: .env`). That is why the user must be ingestion-only.

## 5. Start

Before starting, verify the credentials (a wrong `O2_AUTH` makes OpenObserve answer 401/403, which the exporter treats as permanent, so those batches are dropped and the file positions still advance: lines are lost, not delayed):

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H "Authorization: Basic $O2_AUTH" -H 'Content-Type: application/json' -d '{"resourceLogs":[]}' "$O2_OTLP_ENDPOINT/v1/logs"
```

Expect `200`. Then:

```bash
cd <repo-dir-on-vm>
docker compose --profile observability up -d
# safety net so the logging label (logging.service) applies to the running containers:
docker compose up -d --force-recreate api db
```

The separate `--force-recreate api db` is only a safety net. The first `docker compose up -d` after pulling already recreates `api` and `db` because their labels/logging changed, so it is fine if the second command does nothing.

## 5a. Avoid a log feedback loop

If OpenObserve's public host is a server block on the same nginx with the default access log, every collector push and browser beacon becomes an `nginx_access` line that is shipped again, forever. Give the OpenObserve server block its own log so it never writes to `/var/log/nginx/access.log`:

```nginx
access_log /var/log/nginx/openobserve.access.log;   # or: access_log off;
```

Reload nginx afterwards (`sudo nginx -t && sudo systemctl reload nginx`). Using an internal `O2_OTLP_ENDPOINT` (section 4) also keeps collector pushes out of nginx.

Local smoke test of the collector config (needs Docker, run in the repo): `bash deploy/otel/test/run.sh`.

## 6. Behaviour to expect

- **First start reads old logs.** The collector uses `start_at: beginning`, so existing logs are sent once; positions then persist in the `otelstorage` volume. OpenObserve rejects records older than `ZO_INGEST_ALLOWED_UPTO` (default 5 hours), so a large existing `access.log` gives some "rejected old record" errors on first start. They are harmless. Optionally truncate or rotate the old log first.
- **nginx error log timezone.** Error log lines carry no timezone and are read as UTC. If the VM is not on UTC, `nginx_error` timestamps shift. Accept it or set the host to UTC.
- **Outages.** The retry queue persists in the volume, so a restart or short OpenObserve outage loses nothing. A long outage fills the queue (default 1000 batches) and further batches are dropped.

## 7. Verify per stream

```bash
# portfolio_api + nginx_access
curl -s https://junkit.my/api/health
# nginx_access (a 404 line)
curl -s -o /dev/null https://junkit.my/o2-test-404
```

In OpenObserve, Logs, pick the stream and look for the new lines within about 10 seconds (batch timeout is 5 s). `portfolio_db` shows Postgres lines (restart `db` to force some). `nginx_error` fills when nginx logs an error.

Browser: open `https://junkit.my` (after the redeploy in section 3), open the devtools console and run:

```js
throw new Error('o2 test')
```

It should appear in the browser logs / RUM Errors for service `portfolio-web`.

## 8. Troubleshooting

- **401/403 from OpenObserve** (collector logs: `docker compose logs otel-collector`): `O2_AUTH` wrong. The exporter treats 401/403 as permanent, so those batches are dropped and lines are lost, not just delayed. Rebuild with `printf '%s'` (no trailing newline), check the user exists in `<org>`, and re-run the curl check in section 5.
- **`nginx_access` full of `POST /api/<org>/v1/logs` or `/rum/` lines**: feedback loop, see section 5a.
- **CORS errors in the browser console**: OpenObserve host does not allow origin `https://junkit.my`.
- **Browser sends nothing**: `O2_SITE`, `O2_ORG` or `O2_CLIENT_TOKEN` unset or the site was not rebuilt; or `O2_SITE` includes `https://` or a path.
- **No nginx lines**: check `/var/log/nginx/access.log` and `error.log` exist at those paths and use the default `combined` format; unmatched lines still arrive as plain text.
- **Nothing at all**: the profile was not started (`docker compose ps` should list `otel-collector`), or it is crash-looping on an empty `O2_OTLP_ENDPOINT`.
- **No `portfolio_api` / `portfolio_db`**: run the `--force-recreate api db` step; only containers with the `logging.service` label are collected.
