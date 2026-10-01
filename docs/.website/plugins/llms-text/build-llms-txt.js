const fs = require("node:fs");
const path = require("node:path");
const { normalizeUrl } = require("@docusaurus/utils");
const { stripFrontMatter } = require("../../src/utils/markdown");

function formatItem(item, depth, options, full = false) {
  const { siteDir, siteUrl, baseUrl, shouldExportFile } = options;

  if (item.type === "category") {
    return [
      ``,
      `${"#".repeat(depth)} ${item.label}`,
      ...(item.description ? ["", item.description] : []),
      ``,
      ...item.items.flatMap((child) => formatItem(child, depth + 1, options, full)),
    ];
  }

  if (item.type === "link") {
    if (item.file && item.file.endsWith("redirect.md")) {
      item.file = undefined;
      item.webFile = undefined;
    }

    const pageUrl = normalizeUrl([siteUrl, item.href]);
    const fileUrl = item.webFile ? normalizeUrl([siteUrl, baseUrl, item.webFile]) : undefined;

    const title = item.metadata ? item.metadata.title : item.label;
    const description = item.metadata?.description ?? item.description ?? "";

    if (full && item.file) {
      const absolute = path.join(siteDir, item.file);
      if (fs.existsSync(absolute)) {
        return [stripFrontMatter(fs.readFileSync(absolute, "utf8"))];
      }
    }

    if (shouldExportFile(item) && fileUrl) {
      return [`- [${title}](${fileUrl}): ${description}`];
    }
    return [`- [${title}](${pageUrl}): ${description}`];
  }

  return [];
}

function buildLLMsTxt(sidebars, options, full = false) {
  const docsRecords = sidebars
    .flatMap((sidebar) => {
      const details = options.sidebarsConfig[sidebar.key];
      const content = sidebar.items.flatMap((item) => formatItem(item, 3, options, full));

      if (details === undefined) {
        return content;
      }

      return [`## ${details.title}`, ``, details.description, ``, ...content, ``];
    })
    .join("\n");

  return `# ${options.title}

${options.siteDescription}


${docsRecords}`;
}

module.exports = { buildLLMsTxt };
