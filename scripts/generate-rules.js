#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const RAW_BASE_URL = "https://raw.githubusercontent.com/haha-miao/rule_file/main/";

function readLines(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFileIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, "utf8");
    if (existing === content) {
      return;
    }
  }

  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function isCommentLine(line) {
  return line.trimStart().startsWith("#");
}

function isBlankLine(line) {
  return line.trim() === "";
}

function getRuleType(line, context = "") {
  const commaIndex = line.indexOf(",");
  if (commaIndex <= 0 || commaIndex === line.length - 1) {
    const location = context ? ` in ${context}` : "";
    throw new Error(`Invalid rule line${location}: ${line}`);
  }

  return line.slice(0, commaIndex);
}

function encodeUrlPath(relativePath) {
  return relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildRawUrl(relativePath) {
  return `${RAW_BASE_URL}${encodeUrlPath(relativePath)}`;
}

function buildClashYaml(sourceLines, sourceName = "") {
  const output = ["payload:"];

  for (const [index, rawLine] of sourceLines.entries()) {
    const line = rawLine.trim();
    if (isBlankLine(line)) {
      output.push("");
      continue;
    }

    if (isCommentLine(line)) {
      output.push(`  ${line}`);
      continue;
    }

    getRuleType(line, `${sourceName}:${index + 1}`);
    output.push(`  - ${line}`);
  }

  return `${output.join("\n")}\n`;
}

function buildReadme(sourceEntries, timestamp) {
  const counts = new Map();
  let total = 0;

  for (const entry of sourceEntries) {
    for (const [index, rawLine] of entry.lines.entries()) {
      const line = rawLine.trim();
      if (isBlankLine(line) || isCommentLine(line)) {
        continue;
      }

      const type = getRuleType(line, `${entry.relativePath}:${index + 1}`);
      counts.set(type, (counts.get(type) || 0) + 1);
      total += 1;
    }
  }

  const output = [
    "## 规则统计",
    "",
    `最后更新时间：${timestamp}`,
    "",
    "各类型规则统计：",
    "| 类型 | 数量(条)  |",
    "| ---- | ----  |",
  ];

  for (const [type, count] of counts.entries()) {
    output.push(`| ${type} | ${count}  |`);
  }

  output.push(`| TOTAL | ${total}  |`);

  output.push("", "## 规则链接", "");

  for (const [index, entry] of sourceEntries.entries()) {
    if (index > 0) {
      output.push("");
    }
    output.push(buildRawUrl(entry.relativePath));
  }

  output.push("");
  return `${output.join("\n")}`;
}

function listSubdirectories(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

function getCurrentTimestamp() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

function listRuleFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".list") &&
        !entry.name.startsWith(".")
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

function listYamlFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".yaml") &&
        !entry.name.startsWith(".")
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

function assertNoStaleClashFiles(repoRoot) {
  const clashRoot = path.join(repoRoot, "clash");

  for (const dirName of listSubdirectories(clashRoot)) {
    const surgeDir = path.join(repoRoot, "surge", dirName);
    const clashDir = path.join(clashRoot, dirName);
    const surgeFiles = listRuleFiles(surgeDir);

    if (fs.existsSync(path.join(clashDir, "README.md")) && surgeFiles.length === 0) {
      throw new Error(
        `Stale generated Clash README has no Surge source: ${path.relative(
          repoRoot,
          path.join(clashDir, "README.md")
        )}`
      );
    }

    for (const yamlFile of listYamlFiles(clashDir)) {
      const sourceFile = path.join(
        surgeDir,
        `${path.basename(yamlFile, ".yaml")}.list`
      );

      if (!fs.existsSync(sourceFile)) {
        throw new Error(
          `Stale generated Clash file has no Surge source: ${path.relative(
            repoRoot,
            path.join(clashDir, yamlFile)
          )}`
        );
      }
    }
  }
}

function assertNoStaleSurgeReadmes(repoRoot) {
  const surgeRoot = path.join(repoRoot, "surge");

  for (const dirName of listSubdirectories(surgeRoot)) {
    const surgeDir = path.join(surgeRoot, dirName);
    if (listRuleFiles(surgeDir).length > 0) {
      continue;
    }

    const readmePath = path.join(surgeDir, "README.md");
    if (fs.existsSync(readmePath)) {
      throw new Error(
        `Stale generated Surge README has no rule source: ${path.relative(
          repoRoot,
          readmePath
        )}`
      );
    }
  }
}

function generateRuleFiles({
  repoRoot = path.resolve(__dirname, ".."),
  timestamp = getCurrentTimestamp(),
} = {}) {
  const surgeRoot = path.join(repoRoot, "surge");
  const clashRoot = path.join(repoRoot, "clash");

  for (const dirName of listSubdirectories(surgeRoot)) {
    const surgeDir = path.join(surgeRoot, dirName);
    const clashDir = path.join(clashRoot, dirName);
    const ruleFiles = listRuleFiles(surgeDir);

    if (ruleFiles.length === 0) {
      continue;
    }

    const surgeReadmeEntries = [];
    const clashReadmeEntries = [];

    for (const ruleFile of ruleFiles) {
      const sourcePath = path.join(surgeDir, ruleFile);
      const sourceLines = readLines(sourcePath);
      const sourceRelativePath = path.relative(repoRoot, sourcePath);
      surgeReadmeEntries.push({
        lines: sourceLines,
        relativePath: sourceRelativePath,
      });
      const clashFile = `${path.basename(ruleFile, ".list")}.yaml`;
      const clashPath = path.join(clashDir, clashFile);
      clashReadmeEntries.push({
        lines: sourceLines,
        relativePath: path.relative(repoRoot, clashPath),
      });
      const clashContent = buildClashYaml(sourceLines, sourceRelativePath);
      writeFileIfChanged(clashPath, clashContent);
    }

    const surgeReadmeContent = buildReadme(surgeReadmeEntries, timestamp);
    const clashReadmeContent = buildReadme(clashReadmeEntries, timestamp);

    writeFileIfChanged(path.join(surgeDir, "README.md"), surgeReadmeContent);
    writeFileIfChanged(path.join(clashRoot, dirName, "README.md"), clashReadmeContent);
  }

  assertNoStaleClashFiles(repoRoot);
  assertNoStaleSurgeReadmes(repoRoot);
}

function main() {
  generateRuleFiles();
}

if (require.main === module) {
  main();
}
