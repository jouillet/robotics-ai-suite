const { normalizeUrl } = require("@docusaurus/utils");

// Locate the content-docs version container route. Prefer the canonical
// `${baseUrl}docs` path, but fall back to any route carrying `props.version`
// so this keeps working even when a doc is slugged to `/` (which shifts paths).
function findDocsVersionRoute(routes, baseUrl) {
  const docsPlugin = routes.find(
    (route) => route.plugin && route.plugin.name === "docusaurus-plugin-content-docs",
  );
  if (!docsPlugin || !docsPlugin.routes) {
    return undefined;
  }
  const docsPath = normalizeUrl([baseUrl, "docs"]);
  return (
    docsPlugin.routes.find((route) => route.path === docsPath) ??
    docsPlugin.routes.find((route) => route.props && route.props.version)
  );
}

// Recursively collect every descendant route that maps to a source markdown file.
function collectFiles(routes, acc) {
  for (const route of routes || []) {
    if (route.metadata && route.metadata.sourceFilePath) {
      acc.push({ path: route.path, file: route.metadata.sourceFilePath });
    }
    if (route.routes) {
      collectFiles(route.routes, acc);
    }
  }
  return acc;
}

function mapPathsToSourceFilePath(container) {
  const version = container.props.version;

  const docs = version.docs;
  const idToMetadata = Object.fromEntries(
    Object.keys(docs).map((key) => {
      const doc = docs[key];
      return [
        doc.id,
        { title: doc.title, description: doc.description, sidebar: doc.sidebar },
      ];
    }),
  );

  const files = collectFiles(container.routes, []);
  // With `trailingSlash: true`, route paths end in "/" but sidebar link hrefs
  // do not, so match them slash-insensitively.
  const stripSlash = (p) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const pathToFile = Object.fromEntries(
    files.map(({ path, file }) => [stripSlash(path), file]),
  );

  const getFilePath = (item) =>
    "href" in item && item.href ? pathToFile[stripSlash(item.href)] : undefined;
  const getMetadata = (item) =>
    "docId" in item && typeof item.docId === "string" ? idToMetadata[item.docId] : undefined;

  return { getFilePath, getMetadata };
}

function getDocItemsFromSidebars(routes, baseUrl) {
  const container = findDocsVersionRoute(routes, baseUrl);
  if (!container) {
    console.warn("[llms-txt] Could not find content-docs version route; skipping.");
    return [];
  }

  const { getFilePath, getMetadata } = mapPathsToSourceFilePath(container);

  // `file` is the source path relative to siteDir; when docs live outside the
  // site dir it is prefixed with `../`. `webFile` strips that so it can be used
  // as a build-output subpath and URL (both rooted at the site/build dir).
  const toWebFile = (file) => (file ? file.replace(/^(\.\.\/)+/, "") : file);

  function parseItem(item) {
    if (item.type === "link") {
      const file = getFilePath(item);
      const metadata = getMetadata(item);
      return [
        {
          ...item,
          type: "link",
          label: item.label,
          href: item.href,
          description: item.description,
          file,
          webFile: toWebFile(file),
          metadata,
        },
      ];
    }

    if (item.type === "category") {
      const file = getFilePath(item);
      return [
        {
          type: "category",
          label: item.label,
          link: item.link,
          description: item.description,
          file,
          webFile: toWebFile(file),
          items: item.items.flatMap(parseItem),
        },
      ];
    }

    return [];
  }

  const docSidebars = container.props.version.docsSidebars;
  return Object.keys(docSidebars).map((key) => {
    const sidebar = docSidebars[key];
    const items = sidebar.flatMap((item) =>
      typeof item === "string" ? [] : parseItem(item),
    );
    return { key, items };
  });
}

module.exports = { getDocItemsFromSidebars };
