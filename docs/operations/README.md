# Operations Documentation

Use these documents together when preparing, deploying, verifying, or troubleshooting a release.

- [`../program-6-operations-readiness.md`](../program-6-operations-readiness.md) — release ownership, deployment prerequisites, backup and rollback gates, production verification, operator smoke tests, incident triage, and the final open-risk register.
- [`environment-variables.md`](environment-variables.md) — required and optional environment variables, defaults, secret handling, repair controls, and rotation procedure.
- [`environment-usage.json`](environment-usage.json) — machine-readable inventory of environment-variable references and their source files.
- [`../../.env.example`](../../.env.example) — safe configuration example containing placeholders and documented defaults only.

The CI-safe `operationsDocumentation.test.ts` guard prevents the machine inventory, operator registry, and `.env.example` from silently drifting from code. Real secrets, production database URLs, customer data, database backups, and exported workbooks must never be committed to the repository.
