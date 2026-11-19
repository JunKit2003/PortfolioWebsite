# Backend, contact form and visit counter design

Acceptance spec: [backend-contact-visits-spec.md](../backend-contact-visits-spec.md)

## 1. Summary & goal

Give the portfolio its own backend so it can grow later, starting with two features. Jun Kit decided that his own Node backend replaces the old n8n contact flow, and that everything runs in Docker on his own VM.

- **Add** a Node + TypeScript backend in `backend/` (Express, Sequelize, Postgres) with Sequelize migrations.
- **Restore** a contact form on the site that saves each message to Postgres and emails it to Jun Kit through nodemailer (SMTP).
- **Add** a public visit counter: unique visitors per day, totalled, shown in the footer.
- **Ship** the API and DB as a Docker Compose stack on Jun Kit's VM. The site stays as static files that the VM's existing nginx serves and the CI/CD pipeline deploys ([cicd-deploy design](2026-11-19-cicd-deploy-design.md), merged in #2). nginx gains one `/api/` rule that forwards to the API.

### Answers to the open questions

- **What counts as a visit?** One anonymous visitor ID, counted at most once per calendar day (UTC). The number shown is the total of those visitor-days. (Option B, chosen by Jun Kit.)
- **What happens to n8n?** It's gone completely. Nothing in this delivery references it.
- **Where does it run?** On Jun Kit's own VM (chosen). Docker runs the API and Postgres. The VM's nginx keeps serving the site, handling TLS and proxying `/api/`, so the site and API share one origin (approach A, chosen after the CI/CD design came to light).
- **Is anything in front of the VM?** Cloudflare manages the domain's DNS (chosen). The setup must give correct client IPs whether the record is proxied or DNS-only.

## 2. Scope

**In scope**
- `backend/` service: health, contact and visit endpoints, Postgres models and migrations, SMTP mail.
- Contact form in the `Connect` section of `frontend/`.
- Visit counter in the footer of `frontend/`.
- `docker-compose.yml` (api + db) plus a dev override with a mail catcher.
- `deploy/nginx/portfolio-api.conf`: the `/api/` location and Cloudflare real-IP snippet for the VM's nginx, with setup steps in `backend/README.md`.
- `.env.example` documenting every setting.

**Out of scope**
- n8n, in any form.
- An admin screen for reading messages (they arrive by email and are kept in Postgres).
- Private analytics (pages viewed, referrers, charts).
- Automatic backend deploys (manual `git pull && docker compose up -d --build` for now). Frontend CI/CD shipped separately in #2.
- TLS changes (the existing nginx setup stays) and DB backups.

**Definition of Done**
- On the VM, `docker compose up -d --build` with a filled `.env` starts the API and DB. With the nginx snippet installed and the frontend deployed, both features work end to end over the real domain.
- Backend unit and integration tests pass, and the frontend builds and lints clean.
- The acceptance spec scenarios hold when checked by hand against the compose stack.

## 3. Approaches considered

| Approach | Trade-off | Picked? |
|---|---|---|
| **A. VM nginx in front**: the existing nginx serves the static site (CI/CD design) and proxies `/api/` to a dockerised API + Postgres | Keeps the approved CI/CD design and the current TLS untouched, with one origin and no CORS. Backend deploys are manual for now. | **Yes** (Jun Kit) |
| B. Everything in Docker, including a containerised nginx serving the site | One `compose up` for everything, but it clashes with the CI/CD design (port 80, static deploys), which would need rework. | No |
| API on its own subdomain, site elsewhere | Needs CORS and a second hostname and cert. | No |
| Managed hosting (Render/Railway + Neon/Supabase) | Less upkeep, but free tiers sleep or have limits. Jun Kit wants his own VM. | No |

## 4. Architecture & data ownership

### Who owns what

| Piece | Owner | Notes |
|---|---|---|
| VM nginx (not containerised) | VM, set up by the CI/CD work | Serves `/var/www/portfolio/current` and handles TLS. This work adds `location /api/ { proxy_pass http://127.0.0.1:3000; }` plus real-IP config. |
| `api` container | Node 24 + Express 5 + TypeScript | Runs pending migrations on start, then listens on 3000, published only on `127.0.0.1:${API_PORT:-3000}`. |
| `db` container | Postgres 17 | Named volume `pgdata`. Not published. |
| `contact_messages` table | api | `id` uuid PK, `name`, `email`, `message`, `created_at`, `email_sent_at` (nullable), `email_error` (nullable text). |
| `visits` table | api | `visitor_id` uuid + `visit_date` date as composite PK, `created_at`. |
| Visitor ID | browser | `crypto.randomUUID()` stored in `localStorage` under `visitor-id`. No cookies and no IP address stored. |

### The rules that fall out of this

- **Save first, then mail.** A contact message is written to Postgres before sending. If SMTP fails, the row keeps `email_error`, the failure is logged, and the visitor still sees success because the message is safe.
- **Honeypot.** The form has a hidden `website` field. If it's filled in, the API answers 202 as normal but saves and sends nothing.
- **Dedupe in the DB.** `POST /api/visits` does an insert that ignores a duplicate (visitor_id, today UTC) and then returns the total row count.
- **Real client IP.** nginx uses `set_real_ip_from` for each Cloudflare IPv4/IPv6 range with `real_ip_header CF-Connecting-IP`, so a proxied request gets the visitor's IP and a DNS-only request keeps its own address. It then sends `proxy_set_header X-Forwarded-For $remote_addr` (overwrite, not append, so the client can't spoof it). Express sets `trust proxy` to `loopback, uniquelocal`, because host nginx reaches the container through Docker's published port and arrives from the bridge gateway (a private address). Only nginx can reach that port.
- **Rate limits** use that client IP, stored in memory (one API instance). Contact: 5 per hour per IP. Visits: 30 per minute per IP.
- **Validation** uses zod on the API, with the same limits checked in the browser: name 1–100 chars, email valid and ≤254, message 10–5000, all trimmed.
- **Email** is plain text to `MAIL_TO` from `MAIL_FROM`, with `Reply-To` set to the sender's address and subject `Portfolio contact from <name>`.
- **Config** comes only from environment variables (`.env`): `POSTGRES_USER/PASSWORD/DB`, `DATABASE_URL`, `SMTP_HOST/PORT/SECURE/USER/PASS`, `MAIL_FROM`, `MAIL_TO`, `API_PORT`. The API refuses to start if a required setting is missing.

### Endpoints

| Method & path | Body | Responses |
|---|---|---|
| `GET /api/health` | none | 200 `{ "status": "ok" }` once the DB is reachable, otherwise 503 |
| `POST /api/contact` | `{ name, email, message, website? }` | 202 `{ "ok": true }`, 400 `{ "error": "validation", "fields": {...} }`, 429 |
| `POST /api/visits` | `{ visitorId }` (uuid) | 200 `{ "count": n }`, 400, 429 |
| `GET /api/visits/count` | none | 200 `{ "count": n }` |

### Changes to existing endpoints

None. There is no existing backend.

Migration names: `0001-create-contact-messages`, `0002-create-visits` (run by umzug at API start).

### Local development

`docker compose -f docker-compose.yml -f docker-compose.dev.yml up db mailpit` starts Postgres and Mailpit (a mail catcher that shows outgoing emails at `localhost:8025`). `npm run dev` runs in `backend/` and `frontend/`, and Vite proxies `/api` to `localhost:3000`.

## 5. Product-visible behaviour & copy

```
Connect section
  Let's build something.
  Send me a message, or find my code on GitHub and my experience on LinkedIn.
  [Name        ] [Email        ]
  [Message                      ]
  [ Send message ]
  GitHub ...   LinkedIn ...
Footer:  © 2026 Chee Jun Kit · 4,210 visits · Built with ... · Back to top
```

- Labels: `Name`, `Email`, `Message`. Button: `Send message`, and `Sending…` while sending (disabled).
- Field errors: `Please enter your name.`, `Please enter a valid email.`, `Message must be at least 10 characters.`
- Success (the form is replaced): `Thanks, your message is on its way. I'll get back to you soon.`
- 429: `Too many messages. Please try again later.`
- Other failures: `Something went wrong. Please try again, or reach me on LinkedIn.`
- Counter: `{n} visits`, number formatted `en-US`, singular `1 visit`. If the API fails, the counter is hidden and no error shows.
- The form and counter follow the existing look (tokens, `ghost-btn`, `Reveal`) and respect reduced motion.

## 6. Known limitations

- Clearing site data or using a private window counts as a new visitor, so the counter can be inflated on purpose.
- The day boundary is UTC (08:00 in Malaysia).
- A failed email is only logged and recorded on the row. It isn't retried.
- Backend deploys are manual until the CI/CD pipeline is extended.
- Cloudflare's IP ranges change occasionally, so the snippet's list needs a refresh now and then (source: cloudflare.com/ips). A stale list means some visitors share a rate-limit bucket.
- The `/api/` rule depends on the VM nginx setup from the CI/CD work, so that ships first or alongside.

## 7. Left to the builder

File layout inside `backend/`, logger choice, test tooling (a real Postgres container is expected for integration tests), Dockerfile details, and exact styling of the form within the existing design tokens.
