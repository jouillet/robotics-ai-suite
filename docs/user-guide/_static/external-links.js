document.addEventListener("DOMContentLoaded", () => {
  const updateLinks = (root) => {
    for (const link of root.querySelectorAll("a[href]")) {
      const url = new URL(link.href, window.location.href);
      if ((url.protocol === "http:" || url.protocol === "https:") &&
          url.origin !== window.location.origin) {
        link.target = "_blank";
        link.relList.add("noopener", "noreferrer");
      }
    }
  };

  updateLinks(document);
  new MutationObserver(() => updateLinks(document)).observe(document.body, {
    childList: true,
    subtree: true,
  });
});