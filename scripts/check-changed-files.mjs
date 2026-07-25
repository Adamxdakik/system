import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ESLint } from "eslint";
import prettier from "prettier";

const mode = process.argv[2];
if (!["format", "lint"].includes(mode)) {
  throw new Error("Usage: node scripts/check-changed-files.mjs <format|lint>");
}

const base = process.env.CHANGED_FILES_BASE || "origin/main";
const head = process.env.CHANGED_FILES_HEAD || "HEAD";
const range = process.env.CHANGED_FILES_RANGE || `${base}...${head}`;
const excluded = [
  ".cache/",
  ".local/",
  ".typescript-build/",
  "artifacts/",
  "attached_assets/",
  "build/",
  "client/dist/",
  "coverage/",
  "dist/",
  "node_modules/",
];
const lintExtensions = new Set([".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);

function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
}

function isExcluded(file) {
  const normalized = file.replaceAll("\\", "/");
  return excluded.some((prefix) => normalized.startsWith(prefix));
}

function changedFiles() {
  return git(["diff", "--name-only", "--diff-filter=ACMRT", range])
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => !isExcluded(file) && fs.existsSync(file));
}

function addedLines(file) {
  const output = git(["diff", "--unified=0", range, "--", file]);
  const lines = new Set();
  for (const match of output.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(match[1]);
    const count = match[2] === undefined ? 1 : Number(match[2]);
    for (let line = start; line < start + count; line += 1) lines.add(line);
  }
  return lines;
}

function contiguousRanges(lines) {
  const sorted = [...lines].sort((left, right) => left - right);
  const ranges = [];
  for (const line of sorted) {
    const last = ranges.at(-1);
    if (last && line === last.end + 1) last.end = line;
    else ranges.push({ start: line, end: line });
  }
  return ranges;
}

const files = changedFiles();

if (mode === "format") {
  const failures = [];
  for (const file of files) {
    const info = await prettier.getFileInfo(file, {
      ignorePath: ".prettierignore",
    });
    if (info.ignored || !info.inferredParser) continue;
    const original = fs.readFileSync(file, "utf8");
    const config = await prettier.resolveConfig(file);
    const formatted = await prettier.format(original, {
      ...config,
      filepath: file,
    });
    if (formatted === original) continue;
    const originalLines = original.split(/\r?\n/);
    for (const range of contiguousRanges(addedLines(file))) {
      const changedLines = originalLines
        .slice(range.start - 1, range.end)
        .map((line) => line.trimEnd())
        .filter((line) => line.trim().length > 0);
      if (changedLines.some((line) => !formatted.includes(line))) {
        failures.push(`${file}: ${range.start}-${range.end}`);
      }
    }
  }
  if (failures.length) {
    console.error(`Prettier changes are required on changed lines:\n${failures.join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log(`Changed-line formatting passed for ${files.length} changed files.`);
  }
} else {
  const lintFiles = files.filter((file) => lintExtensions.has(path.extname(file)));
  if (lintFiles.length === 0) {
    console.log("No changed source files require ESLint.");
    process.exit(0);
  }
  const eslint = new ESLint();
  const results = await eslint.lintFiles(lintFiles);
  const failures = [];
  for (const result of results) {
    const relative = path.relative(process.cwd(), result.filePath).replaceAll("\\", "/");
    const additions = addedLines(relative);
    for (const message of result.messages) {
      if (message.line && additions.has(message.line)) {
        failures.push(
          `${relative}:${message.line}:${message.column} ${message.message} (${message.ruleId ?? "fatal"})`,
        );
      }
    }
  }
  if (failures.length) {
    console.error(`ESLint errors or warnings occur on changed lines:\n${failures.join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log(`Changed-line lint passed for ${lintFiles.length} source files.`);
  }
}
