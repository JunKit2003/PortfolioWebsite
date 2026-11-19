# Backend, Contact Form and Visit Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dockerised Node/TypeScript API with Postgres. It receives contact form messages (saved, then emailed via nodemailer) and counts unique daily visitors. The React site gets a contact form and a footer visit counter.

**Architecture:** An Express 5 app factory takes its dependencies (Sequelize instance, mailer, clock) so tests can swap them. Sequelize models and umzug migrations run on startup. Docker Compose runs `api` + `db` only. The VM's nginx proxies `/api/` with Cloudflare real-IP handling. The frontend calls same-origin `/api`, and Vite proxies it in dev.

**Tech Stack:** Node 24, TypeScript 7, Express 5.3, Sequelize 6.37 + pg 8, umzug 3, zod 4, nodemailer 10, express-rate-limit 8, helmet 8, pino-http, vitest 5 + supertest 7, tsx. Frontend: React 19 + Vite 8 (existing).

**Spec:** `docs/plans/2026-11-19-backend-contact-visits-design.md`, `docs/backend-contact-visits-spec.md`

## Global Constraints

- Backend lives in `backend/`. Compose files sit at the repo root. No n8n anywhere.
- Validation: name 1–100, email valid and ≤254, message 10–5000, all trimmed. Honeypot field `website`.
- Rate limits: contact 5 per hour per IP, visits 30 per minute per IP. `trust proxy` = `loopback`.
- Visit day = UTC date. Counter text `{n} visits` (en-US format), singular `1 visit`.
- Email subject `Portfolio contact from <name>`, plain text, `Reply-To` the sender's address.
- Required env: `DATABASE_URL`, `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`, `MAIL_TO`. Optional: `SMTP_SECURE` (default false), `SMTP_USER`, `SMTP_PASS`, `PORT` (default 3000). If a required setting is missing, startup exits non-zero with its name.
- Compose: `db` publishes no port. `api` is published on `127.0.0.1:${API_PORT:-3000}` only.
- UI copy is exactly as in design §5.

## Review Focus

1. **Body isn't JSON, or is huge** → 400 with no crash. `express.json({ limit: "16kb" })`, and a JSON parse error maps to 400 (test in Task 3).
2. **Bad `visitorId`** (missing, not a uuid, or a number) → 400 and nothing inserted (test in Task 4).
3. **Same visitor pings twice at once** → the count goes up by one only, with no 500 from a unique violation (test in Task 4, via `Promise.all`).
4. **SMTP hangs** → the request still answers quickly. The mail send isn't awaited for the response, and the result is written to the row afterwards (test in Task 3 with a never-resolving mailer).
5. **Whitespace-only name or message** → rejected after trimming (test in Task 3).

---

### Task 1: Backend scaffold, config, app factory, health

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/vitest.config.ts`, `backend/.gitignore`
- Create: `backend/src/config.ts`, `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/db.ts`
- Test: `backend/test/config.test.ts`, `backend/test/health.test.ts`, `backend/test/helpers.ts`

**Interfaces:**
- Produces: `loadConfig(env: NodeJS.ProcessEnv): Config` (throws `Error` whose message names the missing keys); `type Config = { port, databaseUrl, smtp: {host, port, secure, user?, pass?}, mailFrom, mailTo }`
- Produces: `createSequelize(url: string): Sequelize`
- Produces: `type Deps = { sequelize: Sequelize; mailer: Mailer; now: () => Date }`, `createApp(deps: Deps): Express`
- Produces: `type Mailer = { send(msg: {to, from, replyTo, subject, text}): Promise<void> }`
- Produces (test helpers): `testDeps(overrides?)`, which builds a Sequelize instance on `TEST_DATABASE_URL` (default `postgres://portfolio:portfolio@localhost:54329/portfolio_test`), runs migrations and truncates tables.

- [ ] Write `config.test.ts`: a full env returns a typed config with `port` 3000 and `smtp.secure` false. With `SMTP_HOST` deleted it throws matching `/SMTP_HOST/`.
- [ ] Write `health.test.ts`: `GET /api/health` → 200 `{status:"ok"}`. When `sequelize.authenticate` rejects → 503 `{status:"error"}`.
- [ ] Run `npm test` and confirm both fail.
- [ ] Implement config with zod, the app with helmet, `express.json({limit:"16kb"})`, pino-http, `trust proxy` loopback and a 404 JSON fallback. `server.ts` loads config, runs migrations, builds the nodemailer transport and listens. If config fails it logs the message and exits 1.
- [ ] Run `npm test` → pass. Run `npm run build` → no TS errors.
- [ ] Commit `feat(backend): scaffold Express API with config and health check`.

### Task 2: Models and migrations

**Files:**
- Create: `backend/src/models.ts`, `backend/src/migrate.ts`, `backend/src/migrations/0001-create-contact-messages.ts`, `backend/src/migrations/0002-create-visits.ts`
- Test: `backend/test/migrate.test.ts`

**Interfaces:**
- Produces: `initModels(sequelize): { ContactMessage, Visit }`. ContactMessage fields: `id` (uuid, default UUIDV4), `name`, `email`, `message`, `createdAt`, `emailSentAt` (nullable), `emailError` (nullable). Table `contact_messages`, underscored, no `updatedAt`. Visit fields: `visitorId` + `visitDate` (DATEONLY) composite PK, `createdAt`. Table `visits`, underscored, no `updatedAt`.
- Produces: `runMigrations(sequelize): Promise<void>`. Umzug uses `SequelizeStorage`, and migrations are imported statically (no glob) so they work in compiled `dist/`.

- [ ] Write a test: after `runMigrations`, `queryInterface.showAllTables()` includes `contact_messages`, `visits` and `SequelizeMeta`. Running it a second time is a no-op.
- [ ] Start the test DB: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db` (create the minimal compose files now if Task 5 isn't done; finish them in Task 5). Run the test → FAIL.
- [ ] Implement, then run → PASS.
- [ ] Commit `feat(backend): add contact message and visit models with migrations`.

### Task 3: Contact endpoint

**Files:**
- Create: `backend/src/routes/contact.ts`, `backend/src/mailer.ts`
- Modify: `backend/src/app.ts` (mount the router)
- Test: `backend/test/contact.test.ts`

**Interfaces:**
- Consumes: `Deps`, `initModels`
- Produces: `createSmtpMailer(smtp: Config["smtp"]): Mailer`; `contactRouter(deps): Router` mounted at `/api/contact`

Tests (fake mailer records calls; the DB is real):
- [ ] `accepts valid message`: 202 `{ok:true}`. The row exists with trimmed values. The mailer is called with subject `Portfolio contact from Ada`, `replyTo` `ada@example.com`, `to` config.mailTo, and text containing the message. After it settles, the row's `emailSentAt` is set.
- [ ] `rejects invalid` (table: empty name, `not-an-email`, `Hi`, whitespace-only name `"   "`): 400 `{error:"validation", fields:{<field>: string}}`, no row, no mail.
- [ ] `honeypot`: `website:"x"` → 202, no row, no mail.
- [ ] `mail failure recorded`: mailer rejects `new Error("smtp down")` → 202, and the row's `emailError` contains `smtp down` and `emailSentAt` is null.
- [ ] `hanging mailer`: mailer never resolves → the response arrives in under 1s with 202.
- [ ] `bad json`: raw body `{oops` with JSON content type → 400 `{error:"invalid_json"}`.
- [ ] `rate limit`: the 6th valid POST within the window → 429 `{error:"rate_limited"}`.
- [ ] Run → FAIL. Implement: zod schema → save → respond 202 → `void mailer.send(...).then(update emailSentAt, catch → update emailError + log)`. Run → PASS.
- [ ] Commit `feat(backend): add contact endpoint with storage, email and spam guards`.

### Task 4: Visits endpoints

**Files:**
- Create: `backend/src/routes/visits.ts`
- Modify: `backend/src/app.ts`
- Test: `backend/test/visits.test.ts`

**Interfaces:**
- Produces: `visitsRouter(deps): Router` mounted at `/api/visits`. `POST /` with `{visitorId: uuid}` → `{count}`, and `GET /count` → `{count}`.

Tests (`now` injectable):
- [ ] `first visit counts`: an empty DB, POSTed id A → `{count:1}`.
- [ ] `same day dedupes`: POST A twice → `{count:1}`.
- [ ] `concurrent same visitor`: `Promise.all` of 5 POSTs for A → all 200, final count 1.
- [ ] `next UTC day counts`: `now` = `2026-11-19T23:59:00Z` then `2026-11-20T00:01:00Z` → count 2.
- [ ] `invalid visitorId`: missing, `"abc"` and `123` → 400 and the count stays the same.
- [ ] `GET /count` returns the total without inserting.
- [ ] `rate limit`: the 31st POST in a minute → 429.
- [ ] Implement with `INSERT ... ON CONFLICT DO NOTHING` (`Visit.bulkCreate([...], { ignoreDuplicates: true })`) and then `Visit.count()`. Run → PASS.
- [ ] Commit `feat(backend): add unique daily visit counter endpoints`.

### Task 5: Docker, nginx snippet, docs

**Files:**
- Create: `backend/Dockerfile` (multi-stage node:24-alpine, `npm ci`, build, runtime with `npm ci --omit=dev`, non-root `node` user, `CMD ["node","dist/server.js"]`), `backend/.dockerignore`
- Create: `docker-compose.yml` (`db` postgres:17-alpine with volume `pgdata`, healthcheck `pg_isready`, no ports; `api` builds `./backend`, `env_file: .env`, `depends_on db healthy`, `ports: ["127.0.0.1:${API_PORT:-3000}:3000"]`, `restart: unless-stopped`)
- Create: `docker-compose.dev.yml` (db publishes `127.0.0.1:54329:5432` and creates `portfolio_test` via an init script; `mailpit` axllent/mailpit on `127.0.0.1:8025` and `127.0.0.1:1025`)
- Create: `.env.example`, `.gitignore` (root, ignore `.env`), `deploy/nginx/portfolio-api.conf`, `backend/README.md`

- [ ] Write the nginx snippet: `set_real_ip_from` for every current Cloudflare range (from cloudflare.com/ips-v4 and ips-v6), `real_ip_header CF-Connecting-IP;`, and `location /api/ { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $remote_addr; proxy_set_header X-Forwarded-Proto $scheme; client_max_body_size 32k; }`. The real_ip lines go in the `http`/`server` context, so the README says where each one goes.
- [ ] README: local dev, tests, VM deploy steps (`cp .env.example .env`, `docker compose up -d --build`, install the snippet, `nginx -t && systemctl reload nginx`), and the manual backend deploy.
- [ ] Verify: `docker compose config` is valid. `docker compose up -d --build` with a test `.env` pointing SMTP at Mailpit → `curl 127.0.0.1:3000/api/health` returns ok. `docker compose ps` shows no db port.
- [ ] Verify OP01-AC4: run the api container with `SMTP_HOST` unset → it exits non-zero and the logs mention `SMTP_HOST`.
- [ ] Commit `feat: add Docker Compose stack and nginx API proxy snippet`.

### Task 6: Frontend contact form and visit counter

**Files:**
- Create: `frontend/src/lib/api.ts`, `frontend/src/components/sections/ContactForm.tsx`, `frontend/src/components/VisitCounter.tsx`
- Modify: `frontend/src/components/sections/Connect.tsx` (intro copy, form above the social list, counter in the footer row), `frontend/vite.config.ts` (`server.proxy['/api'] = 'http://localhost:3000'`)

**Interfaces:**
- Produces: `sendContact(input: {name,email,message,website}): Promise<"ok"|"rate_limited"|"error"|{fields: Record<string,string>}>`; `recordVisit(): Promise<number|null>` (gets or creates `localStorage["visitor-id"]` with `crypto.randomUUID()`, POSTs, returns the count or null on any failure, including localStorage throwing); `formatVisits(n: number): string`

- [ ] The form uses copy exactly as in design §5. Client-side validation mirrors the API limits. The button reads `Sending…` and is disabled while sending. On success the form is replaced by the thank-you text. The honeypot input is visually hidden, `tabIndex={-1}`, `autoComplete="off"`, `aria-hidden`. The error text sits in an `aria-live="polite"` region. Fields use the existing tokens (`border-line`, `bg-transparent`, `ghost-btn`).
- [ ] The counter calls `recordVisit()` once on mount (guard against StrictMode double-call with a module-level promise) and renders `formatVisits(n)`, or nothing when null.
- [ ] Verify: `npm run lint` and `npm run build` in `frontend/` are clean.
- [ ] Verify in the browser (Playwright) against `npm run dev` + the backend + Mailpit:
  - a valid send shows the thank-you text and the email appears in Mailpit with the right subject and Reply-To;
  - invalid input shows the field errors;
  - the footer shows `1 visit`, and a reload still shows `1 visit`;
  - with the backend stopped, the counter is hidden and a send shows the general error.
- [ ] Commit `feat(frontend): add contact form and footer visit counter`.

### Task 7: Final review and PR

- [ ] Run the full backend tests, the frontend lint and build, and `docker compose config`.
- [ ] Do a whole-branch review and fix any findings.
- [ ] Push and open a PR to `main` that links the design, spec and plan, notes that it depends on the `chore/cicd-deploy` nginx setup, and lists the manual VM steps.
