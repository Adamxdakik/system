import { useEffect, useCallback } from "react";

export function hasAnyOpenDialog(): boolean {
  return !!(
    document.querySelector('[data-state="open"][role="dialog"]') ||
    document.querySelector('[data-state="open"][role="alertdialog"]') ||
    document.querySelector('[data-radix-popper-content-wrapper]') ||
    document.querySelector('[role="listbox"]') ||
    document.querySelector('[data-state="open"].fixed') ||
    document.querySelector('[data-state="open"][role="menu"]') ||
    document.querySelector('[data-state="open"][role="combobox"]') ||
    document.querySelector('[data-radix-select-viewport]') ||
    document.querySelector('[cmdk-dialog]')
  );
}

function isInputFocused(): boolean {
  const activeEl = document.activeElement;
  return !!(
    activeEl &&
    (activeEl.tagName === "INPUT" ||
      activeEl.tagName === "TEXTAREA" ||
      activeEl.tagName === "SELECT" ||
      (activeEl as HTMLElement).isContentEditable)
  );
}

// ---------------------------------------------------------------------------
// Route → Parent mapping
// Each entry: [pattern, parent]
// parent can be a string literal or a function receiving the regex match array
// ---------------------------------------------------------------------------
type ParentFn = (m: RegExpMatchArray) => string;
const ROUTE_MAP: Array<[RegExp, string | ParentFn]> = [
  // ── POS ──────────────────────────────────────────────────────────────────
  [/^\/pos\/edit\/[^/]+$/, "/pos"],
  [/^\/pos-import$/, "/pos"],
  [/^\/pos-daybook$/, "/"],

  // ── Containers ───────────────────────────────────────────────────────────
  [/^\/containers\/new$/, "/containers"],
  [/^\/containers\/[^/]+$/, "/containers"],
  [/^\/containers$/, "/"],
  [/^\/sold-containers$/, "/containers"],
  [/^\/po-import$/, "/containers"],

  // ── Suppliers ────────────────────────────────────────────────────────────
  [/^\/suppliers\/[^/]+\/edit$/, "/suppliers"],
  [/^\/suppliers$/, "/"],

  // ── Vouchers / Purchase orders ───────────────────────────────────────────
  [/^\/vouchers\/[^/]+\/edit$/, "/vouchers"],
  [/^\/vouchers$/, "/"],
  [/^\/purchase-orders\/[^/]+\/edit$/, "/daybook"],
  [/^\/voucher-detail\/[^/]+$/, "/daybook"],

  // ── Accounts / Ledger ────────────────────────────────────────────────────
  [/^\/ledger-vouchers\/([^/]+)\/[^/]+\/[^/]+$/, (m) => `/ledger-monthly/${m[1]}`],
  [/^\/ledger-monthly\/[^/]+$/, "/accounts"],
  [/^\/accounts$/, "/"],

  // ── Stock items ──────────────────────────────────────────────────────────
  [/^\/stock-items\/([^/]+)\/history\/[^/]+\/[^/]+$/, (m) => `/stock-items/${m[1]}/history`],
  [/^\/stock-items\/[^/]+\/history$/, "/stock-items"],
  [/^\/stock-items\/[^/]+\/monthly-summary$/, "/stock-items"],
  [/^\/stock-items$/, "/"],
  [/^\/import-stock-items$/, "/stock-items"],

  // ── Stock query ──────────────────────────────────────────────────────────
  [/^\/stock-query\/[^/]+$/, "/stock-query"],
  [/^\/stock-query$/, "/"],

  // ── Locations / Inventory ─────────────────────────────────────────────────
  [/^\/locations\/([^/]+)\/stock-items\/([^/]+)\/vouchers\/[^/]+\/[^/]+$/, (m) =>
    `/locations/${m[1]}/stock-items/${m[2]}/history`],
  [/^\/locations\/([^/]+)\/stock-items\/([^/]+)\/history$/, "/location-inventory"],
  [/^\/location-inventory$/, "/"],
  [/^\/location-summary$/, "/"],
  [/^\/location-insights$/, "/"],

  // ── Opening / Closing stock ───────────────────────────────────────────────
  [/^\/opening-stock\/[^/]+$/, "/opening-stock"],
  [/^\/opening-stock$/, "/"],
  [/^\/closing-stock\/[^/]+$/, "/closing-stock-summary"],
  [/^\/closing-stock-summary$/, "/"],

  // ── Assembly ──────────────────────────────────────────────────────────────
  [/^\/assembly-history$/, "/moto-assembly"],
  [/^\/moto-assembly$/, "/"],

  // ── Service ───────────────────────────────────────────────────────────────
  [/^\/service-history$/, "/service"],
  [/^\/service$/, "/"],
  [/^\/warranty$/, "/"],
  [/^\/communication-log$/, "/"],

  // ── Daybook / Finance ─────────────────────────────────────────────────────
  [/^\/offloads\/[^/]+$/, "/daybook"],
  [/^\/daybook$/, "/"],
  [/^\/create$/, "/"],
  [/^\/payroll$/, "/"],
  [/^\/income-statement$/, "/"],

  // ── Sales / Customers ─────────────────────────────────────────────────────
  [/^\/sales-report$/, "/"],
  [/^\/purchase-history$/, "/"],
  [/^\/customers$/, "/"],

  // ── Misc ──────────────────────────────────────────────────────────────────
  [/^\/stock-transfer-order$/, "/"],
  [/^\/settings$/, "/"],
];

function getParentRoute(pathname: string): string | null {
  for (const [pattern, parent] of ROUTE_MAP) {
    const m = pathname.match(pattern);
    if (m) {
      return typeof parent === "function" ? parent(m) : parent;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Page-level Escape handler
// ---------------------------------------------------------------------------
/**
 * When `onBack` is set, fires the callback and blocks all other Escape handlers
 * (including the global one) via stopImmediatePropagation.
 * When `onBack` is null, does nothing — the global handler takes over.
 */
export function useEscapeBack(onBack: (() => void) | null) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!onBack) return;
      if (hasAnyOpenDialog()) return;

      if (isInputFocused()) {
        (document.activeElement as HTMLElement).blur();
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();
      onBack();
    },
    [onBack],
  );

  useEffect(() => {
    if (!onBack) return;
    document.addEventListener("keydown", handler, { capture: true });
    return () => document.removeEventListener("keydown", handler, { capture: true });
  }, [handler, onBack]);
}

// ---------------------------------------------------------------------------
// Global Escape → parent-route navigation
// ---------------------------------------------------------------------------
/**
 * Registers a document-level bubble-phase Escape handler.
 * Resolves the current path against ROUTE_MAP and navigates to the designated
 * parent. Falls back to window.history.back() if no mapping is found.
 * Page-level useEscapeBack handlers run in capture phase and call
 * stopImmediatePropagation(), so they always win over this global handler.
 */
export function useGlobalEscapeBack(navigate: (to: string) => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (hasAnyOpenDialog()) return;

      if (isInputFocused()) {
        (document.activeElement as HTMLElement).blur();
        return;
      }

      e.preventDefault();

      const parent = getParentRoute(window.location.pathname);
      if (parent) {
        navigate(parent);
      } else {
        window.history.back();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate]);
}
