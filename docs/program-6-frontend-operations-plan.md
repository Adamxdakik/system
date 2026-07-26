# Program 6 — Frontend Quality and Operational Readiness

## Goal

Finish the application with predictable frontend recovery, accessible loading and navigation behavior, and documentation that lets an operator deploy, verify, troubleshoot, and roll back the system safely.

Program 6 is stacked on the reviewed Program 5 head. It must not change accounting, inventory, POS, container, payroll, motorcycle, authorization, or database behavior.

## Phase order

1. **6A — Frontend quality and resilience**
2. **6B — Documentation and operational readiness**

## Phase 6A — Frontend quality and resilience

**Status:** implementation complete; permanent CI validation in progress on the cleaned stacked branch.

### Initial audit findings

- route errors remained latched in the shared error boundary after navigation
- stale deployment chunks were displayed as generic page failures instead of recovering once
- lazy-route loading indicators did not expose a screen-reader status
- the authenticated heartbeat sent while the tab was hidden and duplicated setup logic inside the router
- icon-only application controls needed explicit accessible names
- authentication failure briefly rendered a blank screen while redirecting to sign-in

### Completed implementation

- reset page-level error boundaries whenever the authenticated route changes
- recognize stale lazy-loaded deployment chunks and permit one guarded automatic reload
- prevent stale-chunk reload loops with a 60-second session guard
- tolerate privacy-restricted browser storage without crashing recovery handling
- provide manual page retry and full-application reload actions
- replace anonymous spinners with an accessible shared page loader using `role="status"`
- move heartbeat behavior into a hook that pauses while offline or hidden
- use `keepalive` for the authenticated heartbeat during page transitions
- expose accessible labels for global sign-out and sidebar controls
- show an explicit loading state while returning an unauthenticated session to sign-in
- add regression tests for stale-chunk recognition, reload-loop prevention, guard expiry, and restricted storage

### Acceptance

- ordinary rendering failures can be retried without a full refresh
- navigation clears a previous page-level error state in both POS and desktop layouts
- stale deployment chunks reload at most once per guard window
- repeated stale-chunk failures cannot create a reload loop
- page loading is announced through `role="status"`
- hidden or offline tabs do not send routine heartbeats
- global icon-only buttons have accessible labels
- formatting, lint, TypeScript, tests, build, and permanent PostgreSQL safeguards remain green

## Phase 6B — Documentation and operational readiness

### Planned scope

- deployment prerequisites and environment-variable inventory
- release checklist and exact validation evidence
- health, bandwidth, and export verification procedures
- backup and rollback procedure
- incident triage for authentication, database, stale frontend chunks, heavy APIs, and export capacity
- operator ownership and post-deployment smoke checks
- final open-risk and production-evidence register

## Guardrails

- no merge without explicit approval
- no temporary workflow or diagnostic file may remain
- no dependency upgrade is included unless separately justified and approved
- operational documents must match the exact reviewed commit and current environment behavior
