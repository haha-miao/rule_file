#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const iconDir = path.join(repoRoot, "icons");
const outputFile = path.join(repoRoot, "icons.json");
const baseUrl = "https://raw.githubusercontent.com/haha-miao/rule_file/main/";
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".ico", ".svg"]);
const versionSuffixPattern = /_\d{2}$/;
const strictIconNames = process.env.STRICT_ICON_NAMES === "1";

function getVersionDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}`;
}

function encodeUrlPath(relativePath) {
  return relativePath
    .split(path.sep)
    .map((segment) =>
      encodeURIComponent(segment).replace(/%28/g, "(").replace(/%29/g, ")")
    )
    .join("/");
}

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function buildIcons() {
  if (!fs.existsSync(iconDir)) {
    throw new Error(`Icon directory does not exist: ${iconDir}`);
  }

  const files = walkFiles(iconDir).sort((a, b) =>
    path.relative(iconDir, a).localeCompare(path.relative(iconDir, b), "en", {
      sensitivity: "base",
    })
  );

  const baseNames = new Map();
  for (const file of files) {
    const name = path.basename(file, path.extname(file));
    if (strictIconNames && !versionSuffixPattern.test(name)) {
      throw new Error(`Icon file name must end with _01, _02, etc: ${path.relative(repoRoot, file)}`);
    }
    baseNames.set(name, (baseNames.get(name) || 0) + 1);
  }

  return files.map((file) => {
    const relativePath = path.relative(repoRoot, file);
    const baseName = path.basename(file, path.extname(file));
    const fallbackName = path
      .relative(iconDir, file)
      .slice(0, -path.extname(file).length)
      .split(path.sep)
      .join("_");

    return {
      name: baseNames.get(baseName) === 1 ? baseName : fallbackName,
      url: `${baseUrl}${encodeUrlPath(relativePath)}`,
    };
  });
}

function main() {
  const data = {
    name: "hahamiao",
    description: `Generated from icons directory. Version: ${getVersionDate()}`,
    icons: buildIcons(),
  };

  const json = `${JSON.stringify(data, null, 2).replace(/\//g, "\\/")}\n`;
  fs.writeFileSync(outputFile, json, "utf8");
  console.log(`Generated ${path.relative(repoRoot, outputFile)} with ${data.icons.length} icons.`);
}

main();
