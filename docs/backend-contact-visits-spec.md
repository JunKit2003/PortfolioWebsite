# Contact form and visit counter: acceptance specification

**Product:** Chee Jun Kit portfolio website
**Parent:** none (personal project, no work item)
**Date:** 2026-11-19
**Status:** Draft, awaiting approval (updated 2026-11-19: hosting changed to the VM's nginx in front, to fit the CI/CD design)

Design doc: [2026-11-19-backend-contact-visits-design.md](plans/2026-11-19-backend-contact-visits-design.md)

Story labels (e.g. `CF-01`) are provisional and are not ADO IDs. The Gherkin describes expected behaviour, not passing tests.

## Stories at a glance

- **CF-01 Send a message:** a visitor can message Jun Kit from the site, and he gets it by email.
- **CF-02 Messages are never lost:** every real message is kept even if email fails, and spam bots get nothing through.
- **VC-01 See the visit count:** visitors see how many unique daily visits the site has had.
- **OP-01 Run it on the VM:** Jun Kit starts the whole site with one Docker command.

## Shared definitions and boundaries

- **Visitor ID:** a random ID the browser keeps for this site. It doesn't identify a person.
- **Visit:** one visitor ID on one calendar day (UTC).
- **Visit count:** the total number of visits ever recorded.

### Out of scope for all stories

n8n in any form, an admin screen for messages, private analytics, automatic backend deploys, TLS changes and DB backups.

## CF-01: Send a message

**User Story**
As a visitor, I want to send Jun Kit a message from his portfolio, so that I can contact him without leaving the site.

### Acceptance criteria

**CF01-AC1: Successful send.** A valid name, email and message are accepted, the form shows the thank-you message, and Jun Kit receives an email whose reply goes to the visitor.
**CF01-AC2: Invalid input.** Missing or invalid fields show the matching field error and nothing is sent.
**CF01-AC3: Too many messages.** More than 5 messages from the same network in an hour are refused with the "Too many messages" notice.
**CF01-AC4: Server problem.** If the site can't reach the server, the visitor sees the general error and can try again.

### Gherkin specifications

```gherkin
@CF01
Feature: Send a message from the portfolio

  Background:
    Given I am on the portfolio's Connect section

  @CF01_AC1
  Scenario: Valid message is sent
    When I enter name "Ada", email "ada@example.com" and message "Hello, I'd like to chat about a role."
    And I press "Send message"
    Then I see "Thanks, your message is on its way. I'll get back to you soon."
    And Jun Kit receives an email with subject "Portfolio contact from Ada"
    And replying to that email addresses "ada@example.com"

  @CF01_AC2
  Scenario Outline: Invalid input is rejected
    When I enter name "<name>", email "<email>" and message "<message>"
    And I press "Send message"
    Then I see "<error>"
    And no email is sent

    Examples:
      | name | email           | message                     | error                                   |
      |      | ada@example.com | Hello, a long enough note.  | Please enter your name.                 |
      | Ada  | not-an-email    | Hello, a long enough note.  | Please enter a valid email.             |
      | Ada  | ada@example.com | Hi                          | Message must be at least 10 characters. |

  @CF01_AC3
  Scenario: Sixth message in an hour is refused
    Given 5 messages were sent from my network in the last hour
    When I send another valid message
    Then I see "Too many messages. Please try again later."

  @CF01_AC4
  Scenario: Server cannot be reached
    Given the server is unavailable
    When I send a valid message
    Then I see "Something went wrong. Please try again, or reach me on LinkedIn."
    And the "Send message" button is available again
```

## CF-02: Messages are never lost

**User Story**
As Jun Kit, I want every genuine message stored and bot submissions dropped, so that I don't miss real contacts or get spam.

### Acceptance criteria

**CF02-AC1: Stored before sending.** Every accepted message is saved in the database.
**CF02-AC2: Email failure.** If email sending fails, the message stays saved with the failure noted, and the visitor still sees the thank-you message.
**CF02-AC3: Bot trap.** A submission with the hidden field filled in looks successful but is neither saved nor emailed.

### Gherkin specifications

```gherkin
@CF02
Feature: Contact messages are kept and spam is dropped

  @CF02_AC1
  Scenario: Accepted message is stored
    When a visitor sends a valid message
    Then the message is saved in the database

  @CF02_AC2
  Scenario: Email service is down
    Given the email service is failing
    When a visitor sends a valid message
    Then the visitor sees "Thanks, your message is on its way. I'll get back to you soon."
    And the message is saved with the email failure recorded

  @CF02_AC3
  Scenario: Bot fills the hidden field
    When a submission arrives with the hidden "website" field filled in
    Then it receives a success response
    And nothing is saved
    And no email is sent
```

## VC-01: See the visit count

**User Story**
As a visitor, I want to see how many visits the site has had, so that I get a sense of its reach.

### Acceptance criteria

**VC01-AC1: First visit of the day counts.** A visitor's first page load on a day adds one to the count shown in the footer.
**VC01-AC2: Repeat visit the same day.** Reloading on the same day doesn't change the count.
**VC01-AC3: Next day counts again.** The same visitor on a later day (UTC) adds one.
**VC01-AC4: Counter unavailable.** If the count can't be loaded, the footer shows no counter and no error.

### Gherkin specifications

```gherkin
@VC01
Feature: Footer visit counter

  @VC01_AC1
  Scenario: First visit today is counted
    Given the visit count is 41
    And I have not visited today
    When I open the portfolio
    Then the footer shows "42 visits"

  @VC01_AC2
  Scenario: Reload on the same day
    Given I already visited today and the count is 42
    When I reload the portfolio
    Then the footer shows "42 visits"

  @VC01_AC3
  Scenario: Return on a later day
    Given I visited yesterday and the count is 42
    When I open the portfolio today
    Then the footer shows "43 visits"

  @VC01_AC4
  Scenario: Counter cannot load
    Given the server is unavailable
    When I open the portfolio
    Then the footer shows no visit counter
    And no error is shown
```

## OP-01: Run it on the VM

**User Story**
As Jun Kit, I want the server and database to start with one command behind my existing nginx, so that hosting on my VM is simple and my site deploys stay as they are.

### Acceptance criteria

**OP01-AC1: One command.** With a filled-in `.env` and the nginx `/api/` rule installed, `docker compose up -d --build` starts the server and database, and both features work on the live site.
**OP01-AC2: Data survives restarts.** Messages and visits are still there after the stack is stopped and started again.
**OP01-AC3: Only nginx is exposed.** The database and server can't be reached from outside the VM, only through nginx.
**OP01-AC5: Real visitor address.** Behind Cloudflare, each visitor gets their own rate limit and doesn't share one with everyone else.
**OP01-AC4: Missing settings.** If a required setting is missing, the server refuses to start and says which one.

### Gherkin specifications

```gherkin
@OP01
Feature: Run the stack on the VM

  @OP01_AC1
  Scenario: Start everything
    Given a filled-in .env file
    When I run "docker compose up -d --build"
    And the nginx "/api/" rule is installed
    Then "https://<site>/api/health" returns ok
    And sending a message and the visit counter both work

  @OP01_AC2
  Scenario: Restart keeps data
    Given messages and visits have been recorded
    When I run "docker compose down" and then "docker compose up -d"
    Then the same messages and visit count are present

  @OP01_AC3
  Scenario: Server and database are not public
    When the stack is running
    Then the database publishes no port
    And the api port is bound to 127.0.0.1 only

  @OP01_AC4
  Scenario: Missing required setting
    Given SMTP_HOST is not set
    When the api container starts
    Then it exits with an error naming "SMTP_HOST"

  @OP01_AC5
  Scenario: Two visitors behind Cloudflare
    Given visitor X has sent 5 messages in the last hour
    When visitor Y on a different network sends a valid message
    Then visitor Y's message is accepted
```

## Shared technical completion checks

These are required, not something to add later.

- Backend unit tests cover validation, the honeypot and dedupe. Integration tests run against a real Postgres.
- `frontend` builds (`npm run build`) and lints (`npm run lint`) clean.
- No secrets are committed. Only `.env.example` is in git.
- `docker-compose.yml` publishes no DB port and binds the API to `127.0.0.1` only.

## Project note: safe test environments

Use the dev compose override with Mailpit for any email testing, so test messages never reach a real inbox.
