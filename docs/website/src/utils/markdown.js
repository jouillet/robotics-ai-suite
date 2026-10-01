// Dependency-free markdown helpers shared by the build plugins (Node/CJS) and
// the browser bundle. Plain CommonJS so both consumers can load it.

// Removes a leading YAML front matter block from markdown.
function stripFrontMatter(content) {
  return content.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n?---\r?\n?/, "");
}

module.exports = { stripFrontMatter };
