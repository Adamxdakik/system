import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");

function readRepositoryFile(relativePath: string) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

describe("frontend build safety", () => {
  it("does not load environment-sensitive source-rewriting plugins", () => {
    const viteConfig = readRepositoryFile("vite.config.ts");

    expect(viteConfig).not.toContain("@replit/vite-plugin-cartographer");
    expect(viteConfig).not.toContain("@replit/vite-plugin-dev-banner");
    expect(viteConfig).not.toContain("process.env.REPL_ID");
    expect(viteConfig).not.toContain("await import(");
  });

  it("keeps the deterministic React and runtime-error plugin chain", () => {
    const viteConfig = readRepositoryFile("vite.config.ts");

    expect(viteConfig).toContain('import react from "@vitejs/plugin-react";');
    expect(viteConfig).toContain(
      'import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";',
    );
    expect(viteConfig).toContain("plugins: [react(), runtimeErrorOverlay()]");
  });
});
