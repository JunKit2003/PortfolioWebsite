# Automatic site deploy: acceptance specification

**Product:** Portfolio website
**Parent:** none (personal project, no work item)
**Date:** 2026-11-19
**Status:** Approved design, not yet built

Design doc: [plans/2026-11-19-cicd-deploy-design.md](plans/2026-11-19-cicd-deploy-design.md)

Story labels (e.g. `DP-01`) are provisional, not work item IDs. The Gherkin describes expected behaviour, not passing tests.

## Stories at a glance

- **DP-01 Deploy on push:** pushing to `main` puts the new site live with no manual step.
- **DP-02 Safe failure:** a broken build never reaches the live site.
- **DP-03 Rollback:** the previous version can be restored in one command.

## Shared definitions and boundaries

- **Release:** a folder `/var/www/portfolio/releases/<commit-sha>/` holding one build.
- **Live site:** whatever `/var/www/portfolio/current` points at.

### Out of scope for all stories

Docker, branch/PR previews, HTTPS changes, automated rollback.

## DP-01: Deploy on push

**User Story:** As the site owner, I want a push to `main` to deploy automatically, so that I never copy files to the VM by hand.

### Acceptance criteria

**DP01-AC1: Push triggers deploy.** A push to `main` starts the Deploy workflow, which builds `frontend/` and makes it live.
**DP01-AC2: Manual trigger.** The Deploy workflow can be started by hand from GitHub.
**DP01-AC3: Atomic switch.** The live site changes from old to new in a single step; no visitor sees a mix of files.
**DP01-AC4: Release retention.** After a deploy, at most 5 releases remain and the live one is always kept.
**DP01-AC5: One at a time.** Two deploys never run at the same time.

### Gherkin specifications

```gherkin
@DP01
Feature: Deploy on push

  Background:
    Given the VM is set up with a deploy user and nginx serving /var/www/portfolio/current
    And the deploy secrets are configured in GitHub

  @DP01_AC1
  Scenario: Push to main goes live
    When I push a commit to main
    Then the Deploy workflow runs
    And /var/www/portfolio/releases/<commit-sha> exists
    And /var/www/portfolio/current points at that release
    And the site shows the new content

  @DP01_AC2
  Scenario: Manual run
    When I start the Deploy workflow by hand on main
    Then the latest main commit is deployed

  @DP01_AC3
  Scenario: No half-copied site
    Given a deploy is uploading files
    Then visitors are still served the previous release in full
    When the upload finishes
    Then current switches to the new release in one step

  @DP01_AC4
  Scenario: Old releases pruned
    Given 5 releases already exist
    When a new release is deployed
    Then 5 releases remain
    And the oldest one has been removed
    And the live release is not removed

  @DP01_AC5
  Scenario: Back-to-back pushes
    When I push twice in quick succession
    Then the second deploy waits for the first to finish
```

## DP-02: Safe failure

**User Story:** As the site owner, I want a failed build to stop the deploy, so that a mistake never breaks the live site.

### Acceptance criteria

**DP02-AC1: Lint or build failure stops deploy.** If lint or build fails, nothing is uploaded and the live site is unchanged.
**DP02-AC2: Unknown host refused.** If the VM's SSH host key does not match the pinned key, the deploy fails without uploading.

### Gherkin specifications

```gherkin
@DP02
Feature: Safe failure

  @DP02_AC1
  Scenario Outline: Failing check blocks deploy
    Given main has a commit where <step> fails
    When the Deploy workflow runs
    Then the workflow fails at <step>
    And no new release folder is created
    And current still points at the previous release

    Examples:
      | step  |
      | lint  |
      | build |

  @DP02_AC2
  Scenario: Host key mismatch
    Given DEPLOY_KNOWN_HOSTS does not match the VM's host key
    When the Deploy workflow runs
    Then the SSH step fails
    And the live site is unchanged
```

## DP-03: Rollback

**User Story:** As the site owner, I want to restore the previous version quickly, so that a bad release is short-lived.

### Acceptance criteria

**DP03-AC1: One-command rollback.** Pointing `current` at an older release folder restores that version without reloading nginx.

### Gherkin specifications

```gherkin
@DP03
Feature: Rollback

  @DP03_AC1
  Scenario: Roll back to previous release
    Given at least two releases exist
    When I run ln -sfn releases/<older-sha> current on the VM
    Then the site shows the older version
    And nginx was not reloaded
```

## Shared technical completion checks

- Workflow YAML passes `actionlint` (or GitHub's own validation on push).
- No secret values appear in workflow logs.
- SSH key used by Actions is dedicated to deploys and has no other access.
- VM setup steps are written down in the repo so they can be repeated.
