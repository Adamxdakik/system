import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const baselinePath = path.resolve(".ci/typescript-diagnostics-baseline.json");
const result = spawnSync("npm run check:all", {
  encoding: "utf8",
  env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
  maxBuffer: 50 * 1024 * 1024,
  shell: true,
});
const output = `${result.stdout || ""}\n${result.stderr || ""}`;
const diagnostics = {};
const diagnosticPattern = /^(.+?)\(\d+,\d+\): error (TS\d+):/gm;

for (const match of output.matchAll(diagnosticPattern)) {
  const file = path.relative(process.cwd(), path.resolve(match[1])).replaceAll("\\", "/");
  const key = `${file}::${match[2]}`;
  diagnostics[key] = (diagnostics[key] || 0) + 1;
}

const normalized = Object.fromEntries(
  Object.entries(diagnostics).sort(([left], [right]) => left.localeCompare(right)),
);

if (process.argv.includes("--update")) {
  if (result.status !== 0 && !Object.keys(normalized).length) {
    process.stderr.write(output);
    throw new Error("TypeScript failed without parseable diagnostics.");
  }
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        command: "npm run check:all",
        typescriptVersion: "5.6.3",
        diagnostics: normalized,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `Recorded ${Object.values(normalized).reduce((sum, count) => sum + count, 0)} diagnostics in ${baselinePath}.`,
  );
  process.exit(0);
}

if (result.status === 0) {
  console.log("Whole-application TypeScript check passes with zero diagnostics.");
  process.exit(0);
}
if (!Object.keys(normalized).length) {
  process.stderr.write(output);
  throw new Error("TypeScript failed without parseable diagnostics.");
}
if (!fs.existsSync(baselinePath)) {
  throw new Error(`Missing committed TypeScript baseline: ${baselinePath}`);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8")).diagnostics;
const regressions = Object.entries(normalized)
  .filter(([key, count]) => !(key in baseline) || count > baseline[key])
  .map(([key, count]) => `${key}: ${count} (baseline ${baseline[key] ?? 0})`);

if (regressions.length) {
  console.error(`TypeScript baseline regressed:\n${regressions.join("\n")}`);
  process.exit(1);
}

const currentTotal = Object.values(normalized).reduce((sum, count) => sum + count, 0);
const baselineTotal = Object.values(baseline).reduce((sum, count) => sum + count, 0);
console.log(`TypeScript baseline passed: ${currentTotal} diagnostics (baseline ${baselineTotal}).`);
