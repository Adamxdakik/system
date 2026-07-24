import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ESLint } from "eslint";
import prettier from "prettier";
import os from "node:os";

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
  return execFileSync("git", args, { encoding: "utf8" });
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

function changedOutputLines(original, formatted) {
  if (original === formatted) return new Set();
  const temporary = path.join(
    os.tmpdir(),
    `prettier-${process.pid}-${Math.random().toString(16).slice(2)}`,
  );
  fs.mkdirSync(path.dirname(temporary), { recursive: true });
  fs.writeFileSync(temporary, formatted);
  try {
    const output = execFileSync(
      "git",
      ["diff", "--no-index", "--unified=0", "--", fileForDiff(original), temporary],
      { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
    );
    return parseFormattedRanges(output);
  } catch (error) {
    if (error.status === 1) return parseFormattedRanges(error.stdout || "");
    throw error;
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

function fileForDiff(contents) {
  const temporary = path.join(
    os.tmpdir(),
    `source-${process.pid}-${Math.random().toString(16).slice(2)}`,
  );
  fs.mkdirSync(path.dirname(temporary), { recursive: true });
  fs.writeFileSync(temporary, contents);
  temporaryFiles.push(temporary);
  return temporary;
}

function parseFormattedRanges(output) {
  const lines = new Set();
  for (const match of output.matchAll(/^@@ -(\d+)(?:,(\d+))? \+\d+(?:,\d+)? @@/gm)) {
    const start = Number(match[1]);
    const count = match[2] === undefined ? 1 : Number(match[2]);
    for (let line = start; line < start + count; line += 1) lines.add(line);
  }
  return lines;
}

const temporaryFiles = [];
const files = changedFiles();

try {
  if (mode === "format") {
    const failures = [];
    for (const file of files) {
      const info = await prettier.getFileInfo(file);
      if (info.ignored || !info.inferredParser) continue;
      const original = fs.readFileSync(file, "utf8");
      const formatted = await prettier.format(original, {
        ...(await prettier.resolveConfig(file)),
        filepath: file,
      });
      const additions = addedLines(file);
      const formattingChanges = changedOutputLines(original, formatted);
      if ([...formattingChanges].some((line) => additions.has(line))) {
        failures.push(file);
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
} finally {
  for (const file of temporaryFiles) fs.rmSync(file, { force: true });
}
