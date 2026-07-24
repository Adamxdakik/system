# TypeScript baseline

Baseline captured on 2026-07-24 with TypeScript 5.6.3:

```sh
npm run check:all
```

The root solution now references the client, server, shared code, operational
scripts, tests, and the three existing libraries. Application projects emit
declarations only into the ignored `.typescript-build/` directory; they do not
emit runnable JavaScript. Existing strictness in `tsconfig.base.json` remains
unchanged, including `noImplicitAny`, `strictNullChecks`,
`useUnknownInCatchVariables`, and `noImplicitReturns`. The pre-existing
`skipLibCheck` setting was not broadened.

## Measured baseline

The command currently exits non-zero with 367 diagnostics:

| Project area | Diagnostics |
| --- | ---: |
| Client | 12 |
| Server runtime | 326 |
| Scripts | 3 |
| Tests | 26 |
| Shared | 0 |
| Existing library projects | 0 |

The largest diagnostic categories are:

| Code | Count | Meaning |
| --- | ---: | --- |
| TS7030 | 319 | Not all code paths return a value |
| TS18046 | 23 | Value is `unknown` |
| TS7006 | 10 | Parameter implicitly has type `any` |
| TS6305 | 5 | Referenced declaration was not built because an upstream project failed |
| TS2322 | 4 | Assignment is not type-compatible |
| TS2305 | 3 | Module has no exported member |
| TS7022, TS2552, TS2577 | 1 each | Inference, missing-name, and circular-type issues |

Mapped to the requested broader categories, the baseline contains 10 implicit
`any` diagnostics, 23 unsafe-`unknown` diagnostics, four incompatible-type
diagnostics, and three missing-export diagnostics. No nullability,
missing-property, or missing-module diagnostics were reported in this run. The
five project-reference diagnostics are downstream effects of failed
upstream declaration builds, not hidden source exclusions.

The highest-concentration files are `server/routes.ts` (323),
`server/__tests__/moto-rates-authed.test.ts` (20),
`server/__tests__/moto-rates-storage.test.ts` (6),
`client/src/App.tsx` (4), and `client/src/pages/Vouchers.tsx` (4).

`npm run check` intentionally remains the passing library-package gate that
existed before this baseline. It now names those projects explicitly instead
of relying on an empty solution invocation. `npm run check:all` is the honest
whole-application command and must not be treated as passing until the measured
debt reaches zero.

The remaining application diagnostics pre-date Program 1. The Program 1 source
and CI-safe test project type-check independently and run successfully in the
focused Vitest suite. Program 1C introduced no remaining application
diagnostic after configuration mistakes and test-only request/session types
were corrected.

## Cleanup order

1. Fix the repeated route-handler return paths in `server/routes.ts`; this
   removes most diagnostics and unblocks referenced declarations.
2. Fix infrastructure-test request/session typings, then remove the remaining
   TS6305 downstream diagnostics.
3. Correct the client routing component signatures and invalid Recharts
   imports.
4. Resolve remaining `unknown`, implicit-`any`, and script diagnostics in small
   behavior-preserving batches.
5. When `npm run check:all` passes, make it the required `check` command and
   remove the temporary library-only distinction.

Do not weaken compiler options, add blanket exclusions for real source
directories, or use suppression comments to reduce this count.
