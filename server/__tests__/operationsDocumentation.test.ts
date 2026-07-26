import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const sourceInspectionTests = new Set(["server/__tests__/frontendBuildSafety.test.ts"]);

function repositoryFiles(relativeRoot: string): string[] {
  const absoluteRoot = path.join(repositoryRoot, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return [];

  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if ([".ts", ".tsx", ".js", ".mjs", ".cjs"].includes(path.extname(entry.name))) {
        files.push(absolutePath);
      }
    }
  };

  visit(absoluteRoot);
  return files;
}

function environmentUsage(): Map<string, Set<string>> {
  const usage = new Map<string, Set<string>>();
  const patterns = [
    /process\.env\.([A-Z][A-Z0-9_]*)/g,
    /process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
    /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
    /environmentInteger\(\s*["']([A-Z][A-Z0-9_]*)["']/g,
  ];

  for (const root of ["server", "client", "scripts", "shared", "lib"]) {
    for (const absolutePath of repositoryFiles(root)) {
      const relativePath = path.relative(repositoryRoot, absolutePath).split(path.sep).join("/");
      if (sourceInspectionTests.has(relativePath)) continue;

      const source = fs.readFileSync(absolutePath, "utf8");
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        for (const match of source.matchAll(pattern)) {
          const name = match[1];
          const files = usage.get(name) ?? new Set<string>();
          files.add(relativePath);
          usage.set(name, files);
        }
      }
    }
  }

  return usage;
}

describe("operations documentation", () => {
  it("keeps the environment usage audit and operator registry synchronized with code", () => {
    const actualUsage = environmentUsage();
    const audit = JSON.parse(
      fs.readFileSync(path.join(repositoryRoot, "docs/operations/environment-usage.json"), "utf8"),
    ) as { variables: Array<{ name: string; files: string[] }> };
    const auditedUsage = new Map(
      audit.variables.map((variable) => [variable.name, [...variable.files].sort()]),
    );

    expect([...auditedUsage.keys()].sort()).toEqual([...actualUsage.keys()].sort());
    for (const [name, files] of actualUsage) {
      expect(auditedUsage.get(name), `${name} source-file audit`).toEqual([...files].sort());
    }

    const documentation = fs.readFileSync(
      path.join(repositoryRoot, "docs/operations/environment-variables.md"),
      "utf8",
    );
    for (const name of actualUsage.keys()) {
      expect(documentation, `${name} must be documented`).toContain(`\`${name}\``);
    }
  });

  it("keeps the safe environment example documented and repair mode disabled", () => {
    const documentation = fs.readFileSync(
      path.join(repositoryRoot, "docs/operations/environment-variables.md"),
      "utf8",
    );
    const example = fs.readFileSync(path.join(repositoryRoot, ".env.example"), "utf8");
    const exampleVariables = [...example.matchAll(/^\s*#?\s*([A-Z][A-Z0-9_]*)=/gm)].map(
      (match) => match[1],
    );

    for (const name of exampleVariables) {
      expect(documentation, `${name} from .env.example must be documented`).toContain(
        `\`${name}\``,
      );
    }
    expect(example).not.toMatch(/^\s*ALLOW_FINANCIAL_REPAIR\s*=\s*true\s*$/m);
    expect(example).not.toMatch(/^\s*FINANCIAL_REPAIR_SECRET\s*=.+$/m);
  });
});
