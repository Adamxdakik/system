# Program 6B — Accessibility, mobile, and interaction verification

## Scope

This phase audits the shared authenticated shell and shared UI primitives. It deliberately avoids changing accounting, inventory, POS calculations, container workflows, payroll, motorcycle records, permissions, routes, schemas, or migrations.

## Findings

- Page and authentication loading states were visually clear but silent to assistive technology.
- The authenticated shell had no keyboard skip link to bypass repeated navigation.
- Icon-only logout controls had no accessible name.
- POS section navigation did not expose the active page to assistive technology and could overflow on narrow screens.
- Form context misuse could fail indirectly because both form contexts used truthy empty-object defaults.
- Form errors were visually rendered but were not explicitly announced.
- Shared inputs and textareas did not provide a consistent visual invalid state from `aria-invalid`.
- Recoverable page failures and connectivity changes were not consistently announced.
- Connectivity reconnection timers were not explicitly cleared during effect cleanup.

## Completed changes

### Application shell

- Added keyboard-visible skip links targeting the main content region.
- Made main content programmatically focusable after skip-link navigation.
- Added live loading status semantics and screen-reader loading text.
- Added accessible names to icon-only logout controls.
- Added keyboard-shortcut metadata to the command-palette trigger.
- Made desktop shell spacing responsive and allowed the content column to shrink safely.

### POS mobile navigation

- Added a named POS navigation region.
- Added `aria-current="page"` to the active POS section.
- Added horizontal overflow handling and non-shrinking section buttons for phone and tablet widths.
- Hid decorative navigation icons from assistive technology.

### Shared controls and forms

- Strengthened visible keyboard focus and disabled cursor behavior for shared buttons.
- Added reduced-motion-safe interaction styling.
- Added consistent `aria-invalid` visual states to shared inputs and textareas.
- Replaced truthy empty form-context defaults with explicit `undefined` guards.
- Added `aria-errormessage` and alert semantics for form validation messages.

### Status and recovery

- Added assertive announcement semantics to recoverable page failures.
- Added polite and assertive announcements for restored and lost connectivity.
- Marked decorative status icons as hidden from assistive technology.
- Cleared the reconnect timer during cleanup.

## Permanent regression coverage

`frontendInteractionSafety.test.ts` verifies the shared contracts for:

- skip-link and main-content structure;
- loading and logout accessibility;
- POS responsive navigation and active-page state;
- form context and validation semantics;
- shared focus and invalid-field styling;
- connectivity and recoverable-error announcements.

The test is included in both the CI-safe unit suite and the tests TypeScript project.

## Manual release verification

Before approval, verify with representative Admin and POS accounts:

1. Use only the keyboard to reach the skip link, open the sidebar, open search, move through POS sections, and log out.
2. Confirm focus remains visible in light and dark themes.
3. Confirm POS section buttons scroll horizontally on narrow phone widths without clipping page content.
4. Trigger a required-field validation error and confirm the message is announced by a screen reader.
5. Toggle offline/online state and confirm the status banners are announced once.
6. Trigger a recoverable page error and confirm focus lands on **Try Again**.

## Remaining operational note

The cartographer and development-banner packages remain lock-pinned but inactive. They should be removed during the next deliberate dependency refresh, when `package.json` and `package-lock.json` can be regenerated together without unrelated stacked-branch lockfile churn.
