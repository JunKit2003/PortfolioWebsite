# OpenObserve wiring: acceptance specification

**Product:** Portfolio website
**Parent:** none (personal project, no work item)
**Date:** 2026-11-19
**Status:** Built, awaiting OpenObserve

Design doc: [plans/2026-11-19-openobserve-wiring-design.md](plans/2026-11-19-openobserve-wiring-design.md)

Story labels (e.g. `OB-01`) are provisional, not work item IDs. The Gherkin describes expected behaviour, not passing tests.

## Stories at a glance

- **OB-01 Browser monitoring:** visitors' errors, logs and page performance arrive in OpenObserve.
- **OB-02 Off until configured:** without settings, nothing is loaded or sent and nothing breaks.
- **OB-03 Server logs:** API, database and nginx logs arrive in their own OpenObserve streams.
- **OB-04 Handoff:** the VM agent has everything it needs to connect OpenObserve.

## Shared definitions and boundaries

- **Browser settings:** `VITE_O2_SITE`, `VITE_O2_ORG`, `VITE_O2_CLIENT_TOKEN`, `VITE_APP_VERSION`, supplied at build time.
- **Collector settings:** `O2_OTLP_ENDPOINT`, `O2_AUTH` in the VM's `.env`.

### Out of scope for all stories

Hosting OpenObserve, session replay, source maps, tracing, metrics.

## OB-01: Browser monitoring

**User Story:** As the site owner, I want visitors' browser errors and performance in OpenObserve, so that I see problems I'd never notice myself.

### Acceptance criteria

**OB01-AC1: Errors become logs.** An uncaught error in a visitor's browser is sent to OpenObserve as an error log with service `portfolio-web` and the deploy's commit sha as version.
**OB01-AC2: Performance and API calls.** Page-speed metrics, resource timings, long tasks, clicks and calls to `/api/*` are reported as RUM data.
**OB01-AC3: No replay.** No session replay is recorded.
**OB01-AC4: Doesn't slow first paint.** The monitoring code loads after the page has rendered.
**OB01-AC5: Custom logs.** App code can send its own log line through one helper; before setup completes the helper does nothing and throws nothing.

### Gherkin specifications

```gherkin
@OB01
Feature: Browser monitoring

  Background:
    Given the site was built with all browser settings present
    And OpenObserve accepts data from the site's domain

  @OB01_AC1
  Scenario: Uncaught error is logged
    When a script error happens on the page
    Then OpenObserve receives an error log for service "portfolio-web"
    And the log's version is the deployed commit sha

  @OB01_AC2
  Scenario: Contact form call is tracked
    When a visitor submits the contact form
    Then OpenObserve RUM shows a request to "/api/contact" with its status and duration

  @OB01_AC3
  Scenario: No replay
    When a visitor browses the site
    Then no session replay is stored

  @OB01_AC4
  Scenario: Loaded after render
    When the page loads
    Then the page content renders before the monitoring code is requested

  @OB01_AC5
  Scenario: Helper is safe before setup
    Given monitoring has not finished loading
    When app code calls the log helper
    Then nothing is sent and no error is thrown
```

## OB-02: Off until configured

**User Story:** As the site owner, I want monitoring to stay off until OpenObserve exists, so that I can merge this before the VM side is ready.

### Acceptance criteria

**OB02-AC1: Browser off without settings.** If any of site, org or token is missing, or the build is not production, the SDK is not loaded and no requests go to OpenObserve.
**OB02-AC2: Build still passes.** CI build, lint and tests pass with and without the browser settings.
**OB02-AC3: Compose stack unaffected.** `docker compose up -d` starts db and api without the collector; the collector starts only with the `observability` profile.

### Gherkin specifications

```gherkin
@OB02
Feature: Off until configured

  @OB02_AC1
  Scenario Outline: Missing setting disables monitoring
    Given the site is built with <missing> unset
    When a visitor loads the page
    Then no OpenObserve code is loaded
    And no request is sent to OpenObserve

    Examples:
      | missing              |
      | VITE_O2_SITE         |
      | VITE_O2_ORG          |
      | VITE_O2_CLIENT_TOKEN |

  @OB02_AC1
  Scenario: Dev server never reports
    Given all browser settings are present
    When I run the dev server
    Then monitoring is not started

  @OB02_AC2
  Scenario: CI without settings
    Given the O2 repo variables and secret are not set
    When the Deploy workflow runs
    Then lint, tests and build pass

  @OB02_AC3
  Scenario: Default compose start
    When I run "docker compose up -d"
    Then db and api start
    And otel-collector does not start
```

## OB-03: Server logs

**User Story:** As the site owner, I want API, database and nginx logs in OpenObserve, so that I can search them without SSHing into the VM.

### Acceptance criteria

**OB03-AC1: API logs.** Each API log line arrives in stream `portfolio_api` with pino's fields as attributes and the correct severity.
**OB03-AC2: DB logs.** Postgres container logs arrive in stream `portfolio_db`.
**OB03-AC3: nginx logs.** Access log lines arrive in `nginx_access` with method, path, status, bytes, referrer and user agent fields; error log lines arrive in `nginx_error` with level and message.
**OB03-AC4: Only this project.** Logs from containers without the `logging.service` label are not sent.
**OB03-AC5: No resend on restart.** Restarting the collector does not resend lines already sent.
**OB03-AC6: Read-only.** The collector cannot modify any log file it reads.

### Gherkin specifications

```gherkin
@OB03
Feature: Server logs

  Background:
    Given the collector is running with the observability profile
    And O2_OTLP_ENDPOINT and O2_AUTH are set

  @OB03_AC1
  Scenario: API request log
    When the API handles a request
    Then a log appears in stream "portfolio_api"
    And its severity matches the pino level

  @OB03_AC2
  Scenario: Database log
    When Postgres writes a log line
    Then it appears in stream "portfolio_db"

  @OB03_AC3
  Scenario Outline: nginx logs
    When nginx writes a <kind> log line
    Then it appears in stream "<stream>" with parsed fields

    Examples:
      | kind   | stream       |
      | access | nginx_access |
      | error  | nginx_error  |

  @OB03_AC4
  Scenario: Unrelated container
    Given another container on the VM writes logs without the label
    Then those logs are not sent

  @OB03_AC5
  Scenario: Collector restart
    Given the collector has sent lines up to now
    When the collector restarts
    Then earlier lines are not sent again

  @OB03_AC6
  Scenario: Read-only mounts
    Then every log path is mounted read-only into the collector
```

## OB-04: Handoff

**User Story:** As the site owner, I want one doc for the VM agent, so that it can connect OpenObserve without reading the code.

### Acceptance criteria

**OB04-AC1: Everything the agent provides.** `docs/openobserve-handoff.md` lists: public HTTPS address, CORS for the site's origin, where to create the RUM client token, org name, the GitHub variables/secret to set, the `.env` values and how to build `O2_AUTH`, the Compose command to start the collector, and how to check each stream receives data.

### Gherkin specifications

```gherkin
@OB04
Feature: Handoff

  @OB04_AC1
  Scenario: Agent follows the doc
    Given OpenObserve is running on the VM
    When the agent follows docs/openobserve-handoff.md
    Then the browser and all four server streams receive data
```

## Shared technical completion checks

- `npm run lint`, `npm test`, `npm run build` pass in `frontend/` with and without settings.
- Collector config passes `otelcol-contrib validate`; a local run against sample log files produces the expected streams and fields.
- `docker compose config` passes with and without the `observability` profile.
- No secret values in the repo or in CI logs.
