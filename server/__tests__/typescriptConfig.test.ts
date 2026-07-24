import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8")) as Record<
    string,
    any
  >;
}

describe("TypeScript project coverage", () => {
  it("references every application area and existing library", () => {
    const config = readJson("tsconfig.json");
    const references = config.references.map((reference: { path: string }) => reference.path);

    expect(references).toEqual(
      expect.arrayContaining([
        "./tsconfig.client.json",
        "./tsconfig.server.json",
        "./tsconfig.shared.json",
        "./tsconfig.scripts.json",
        "./tsconfig.tests.json",
        "./tsconfig.integration-tests.json",
        "./lib/db",
        "./lib/api-client-react",
        "./lib/api-zod",
      ]),
    );
  });

  it.each([
    ["tsconfig.client.json", "client/src/**/*.ts"],
    ["tsconfig.server.json", "server/**/*.ts"],
    ["tsconfig.shared.json", "shared/**/*.ts"],
    ["tsconfig.scripts.json", "scripts/**/*.ts"],
  ])("%s includes its real source tree", (configPath, includePattern) => {
    const config = readJson(configPath);

    expect(config.extends).toBe("./tsconfig.base.json");
    expect(config.include).toContain(includePattern);
    expect(config.compilerOptions.emitDeclarationOnly).toBe(true);
    expect(config.compilerOptions.outDir).toMatch(/^\.typescript-build\//);
  });

  it("preserves client and shared aliases", () => {
    const config = readJson("tsconfig.client.json");

    expect(config.compilerOptions.paths["@/*"]).toEqual(["client/src/*"]);
    expect(config.compilerOptions.paths["@shared/*"]).toEqual(["shared/*"]);
  });
});
