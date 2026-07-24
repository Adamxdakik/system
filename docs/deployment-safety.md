# Deployment and release safety

## Current Render release

Render uses the committed lockfile and this build command:

```sh
npm ci && npm run build && npm run db:migrate
```

The start command remains:

```sh
npm start
```

The release order is therefore:

1. install the exact lockfile dependencies;
2. build the Vite client and bundled Express server;
3. run the idempotent migration runner once;
4. start the production application;
5. let Render probe `/api/health/db`.

The deploy does not run `db:push`, the full test suite, or a second migration
command. The existing `_idempotent_migrations` ledger and per-migration
transactions remain unchanged. No database schema was changed by Program 1C.

`npm run db:verify-moto-schema` remains available but is not automatically run
by Render. When Moto schema verification is required for a release, run it
once after migrations against the intended environment and before accepting
traffic. It is verification-only and must not replace or repeat the migration
step.

## Risks and rollback

Migrations currently run during Render's build stage. Concurrent deploy builds
could therefore race before either application instance starts. The current
migration runner has no PostgreSQL advisory lock. Adding one safely requires a
dedicated connection held for the full run, bounded lock-wait behavior, and a
concurrency test; that is broader than a safe documentation-only release
change, so Program 1C leaves the runner untouched.

A later release-safety change should move migrations to a single, explicit
release stage and add a stable application-specific advisory lock. That stage
should complete before the new application receives traffic.

Rolling back the application restarts an older bundle but does not reverse a
completed database migration. Database migrations should remain
backward-compatible across at least one application release. Before a
destructive migration, take a verified backup and prepare a separately reviewed
down migration or restore plan. Never use `db:push` as a rollback mechanism.

The health check confirms both HTTP availability and database connectivity. A
failed `/api/health/db` probe should block promotion while logs are reviewed;
it must not trigger an automatic schema mutation or a repeated migration.
