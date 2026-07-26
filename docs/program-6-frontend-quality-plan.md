# Program 6 — Frontend quality and operating readiness

Program 6 is stacked on the exact reviewed Program 5 head. Program 5 remains draft and unmerged.

## Phase 6A — Deterministic frontend build configuration

### Finding

The Vite configuration conditionally loaded Replit cartographer and development-banner plugins whenever a Replit development environment was detected. That made the frontend transform pipeline depend on deployment-specific environment variables and dynamic top-level imports. It also allowed development-only source instrumentation to modify the application outside the normal React plugin path.

### Completed change

- Removed the conditional cartographer and development-banner plugin activation from `vite.config.ts`.
- Removed the `REPL_ID` environment branch and dynamic top-level imports from the Vite configuration.
- Preserved the React transform, runtime error overlay, aliases, build output, and filesystem restrictions.
- Added a permanent regression test that rejects reintroduction of the removed source-rewriting plugins or environment-sensitive dynamic imports.
- Added the regression test to the CI-safe unit suite and the tests TypeScript project.

The two unused packages remain lock-pinned for now so this isolated stacked phase does not rewrite the large dependency lockfile. They are no longer imported or executed and can be removed during the next deliberate dependency refresh.

### Guardrails

- No application routes changed.
- No UI workflow or styling changed.
- No accounting, inventory, POS, container, payroll, motorcycle, or authorization behavior changed.
- No schema or migration changes were introduced.
- No permanent workflow changes were introduced.

## Phase 6B — Accessibility and interaction verification

The remaining Program 6 implementation phase will audit and harden:

- keyboard navigation and visible focus behavior;
- accessible names, dialog semantics, and form-error announcements;
- mobile and tablet interaction behavior;
- loading, empty, disabled, and error states;
- critical daily-work flows with focused interaction tests;
- operator documentation and release verification notes.

Phase 6B must preserve the existing business rules and route permission model while improving usability and test coverage.
