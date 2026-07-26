import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");

function readRepositoryFile(relativePath: string) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

describe("frontend interaction safety", () => {
  it("keeps the authenticated shell keyboard and screen-reader accessible", () => {
    const app = readRepositoryFile("client/src/App.tsx");
    const pageLoader = readRepositoryFile("client/src/components/PageLoader.tsx");

    expect(app).toContain('href="#main-content"');
    expect(app).toContain('id="main-content"');
    expect(app).toContain("<PageLoader");
    expect(pageLoader).toContain('role="status"');
    expect(pageLoader).toContain('aria-live="polite"');
    expect(app).toContain('aria-label="Log out"');
    expect(app).toContain('aria-keyshortcuts="Meta+K Control+K"');
  });

  it("keeps POS navigation responsive and exposes active-page state", () => {
    const app = readRepositoryFile("client/src/App.tsx");

    expect(app).toContain('aria-label="POS sections"');
    expect(app).toContain("overflow-x-auto");
    expect(app).toContain('aria-current={isOnPOS ? "page" : undefined}');
    expect(app).toContain('aria-current={isOnTransfers ? "page" : undefined}');
  });

  it("announces validation errors and guards form context misuse", () => {
    const form = readRepositoryFile("client/src/components/ui/form.tsx");

    expect(form).toContain("FormFieldContextValue | undefined");
    expect(form).toContain("FormItemContextValue | undefined");
    expect(form).toContain("aria-errormessage={error ? formMessageId : undefined}");
    expect(form).toContain('role="alert"');
  });

  it("preserves visible focus and invalid-field styling", () => {
    const button = readRepositoryFile("client/src/components/ui/button.tsx");
    const input = readRepositoryFile("client/src/components/ui/input.tsx");
    const textarea = readRepositoryFile("client/src/components/ui/textarea.tsx");

    expect(button).toContain("focus-visible:ring-2");
    expect(button).toContain("disabled:cursor-not-allowed");
    expect(input).toContain("aria-[invalid=true]:border-destructive");
    expect(textarea).toContain("aria-[invalid=true]:border-destructive");
  });

  it("announces connectivity and recoverable page failures", () => {
    const offlineBanner = readRepositoryFile("client/src/components/OfflineBanner.tsx");
    const errorBoundary = readRepositoryFile("client/src/components/ErrorBoundary.tsx");

    expect(offlineBanner).toContain('role="status"');
    expect(offlineBanner).toContain('role="alert"');
    expect(errorBoundary).toContain('aria-live="assertive"');
    expect(errorBoundary).toContain("autoFocus");
  });
});
