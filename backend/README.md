# Portfolio backend

Node 24 + TypeScript + Express 5 API with Sequelize on Postgres. It powers:

- `POST /api/contact`: saves a contact message, then emails it via SMTP (nodemailer)
- `POST /api/visits` and `GET /api/visits/count`: the unique-visitors-per-day counter
- `GET /api/health`: 200 when the database is reachable

Design: [`docs/plans/2026-11-19-backend-contact-visits-design.md`](../docs/plans/2026-11-19-backend-contact-visits-design.md).
Acceptance spec: [`docs/backend-contact-visits-spec.md`](../docs/backend-contact-visits-spec.md).

## Local development

From the repo root:

```bash
cp .env.example .env          # then edit, see below
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db mailpit
```

This starts Postgres on `localhost:54329` (with an extra `portfolio_test` database) and
[Mailpit](https://mailpit.axllent.org/), a mail catcher. Its inbox is at <http://localhost:8025>, so
test emails never reach a real inbox.

To run the API outside Docker with hot reload, create `backend/.env` with:

```
DATABASE_URL=postgres://portfolio:<POSTGRES_PASSWORD>@localhost:54329/portfolio
SMTP_HOST=localhost
SMTP_PORT=1025
MAIL_FROM=Portfolio <dev@example.test>
MAIL_TO=you@example.test
```

```bash
cd backend && npm install && npm run dev     # API on :3000
cd frontend && npm run dev                    # Vite proxies /api to :3000
```

Or run the whole API in Docker against Mailpit: set `SMTP_HOST=mailpit`, `SMTP_PORT=1025`,
`SMTP_SECURE=false` in the root `.env`, then
`docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build`.

> Behind a network that intercepts TLS (corporate proxy), the dev override passes your host's
> `NODE_EXTRA_CA_CERTS` bundle into the image build as a secret. VM builds don't use it.

### Tests

The tests run against a real Postgres (the dev `db` container must be up):

```bash
cd backend && npm test
```

Override the database with `TEST_DATABASE_URL`. Tests run in the `Asia/Kuala_Lumpur` time zone on
purpose, to catch accidental use of local dates (visit days are UTC).

## Settings

All config comes from environment variables. The API refuses to start and names the missing
setting if a required one is absent.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | In compose: `postgres://USER:PASS@db:5432/DB` |
| `SMTP_HOST`, `SMTP_PORT` | yes | e.g. Gmail: `smtp.gmail.com`, `465` |
| `SMTP_SECURE` | no (`false`) | `true` for port 465 |
| `SMTP_USER`, `SMTP_PASS` | no | Leave empty for no auth (Mailpit). Gmail needs an app password. |
| `MAIL_FROM` | yes | Sender, e.g. `Portfolio <you@gmail.com>` (Gmail requires your own address) |
| `MAIL_TO` | yes | Where contact messages go |
| `POSTGRES_USER/PASSWORD/DB` | yes (compose) | Used by the `db` container |
| `API_PORT` | no (`3000`) | Host port, bound to `127.0.0.1` only |

## Deploying on the VM

This assumes the VM nginx setup from [`docs/deploy-vm-setup.md`](../docs/deploy-vm-setup.md): nginx serves the
site from `/var/www/portfolio/current` and handles TLS.

1. Install Docker Engine with the compose plugin, clone the repo and `cd` into it.
2. `cp .env.example .env` and fill in real values (a strong `POSTGRES_PASSWORD`, used in both
   places, and real SMTP settings). Run `chmod 600 .env`.
3. `docker compose up -d --build`. Postgres publishes no port, and the API listens on
   `127.0.0.1:3000` only.
4. Check it with `curl 127.0.0.1:3000/api/health`, which should return `{"status":"ok"}`.
5. Copy `deploy/nginx/portfolio-api.conf` to `/etc/nginx/snippets/` and add
   `include /etc/nginx/snippets/portfolio-api.conf;` inside the site's `server { }` block.
6. Run `sudo nginx -t && sudo systemctl reload nginx`, then check `https://<your-domain>/api/health`.

Cloudflare: the snippet trusts Cloudflare's IP ranges and reads `CF-Connecting-IP`. It works whether
the DNS record is proxied (orange) or DNS-only (grey). Refresh the ranges from
<https://www.cloudflare.com/ips/> now and then.

### Updating the backend

Backend deploys are manual for now:

```bash
git pull && docker compose up -d --build
```

Migrations run automatically when the API starts.

### Reading messages

Every message is emailed to `MAIL_TO` and also kept in Postgres:

```bash
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "select created_at, name, email, email_error from contact_messages order by created_at desc limit 20"
```

A non-null `email_error` means the email failed. The message is still there.
