const fs = require("node:fs");
const path = require("node:path");
const { stripFrontMatter } = require("../../src/utils/markdown");

async function copyOverMarkdownFiles(docItems, options) {
  const { siteDir, outDir, shouldExportFile } = options;

  const copyFile = async (item) => {
    if (item.file && shouldExportFile(item)) {
      try {
        const source = path.join(siteDir, item.file);
        if (fs.existsSync(source)) {
          const content = stripFrontMatter(fs.readFileSync(source, "utf8"));
          const destination = path.join(outDir, item.webFile);
          await fs.promises.mkdir(path.dirname(destination), { recursive: true });
          fs.writeFileSync(destination, content, { encoding: "utf8" });
        }
      } catch (e) {
        console.error(`[llms-txt] Error copying markdown file ${item.file}`, e);
      }
    }

    if (Array.isArray(item.items)) {
      await Promise.all(item.items.map(copyFile));
    }
  };

  await Promise.all(docItems.map(copyFile));
}

module.exports = { copyOverMarkdownFiles };
