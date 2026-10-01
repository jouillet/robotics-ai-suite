// Injects the AI actions toolbar directly under each doc's title at build time
// by inserting an <AiActions/> node right after the first level-1 heading.
// `AiActions` is registered as a global MDX component (src/theme/MDXComponents).
function remarkAiActions() {
  return (tree) => {
    const node = {
      type: "mdxJsxFlowElement",
      name: "AiActions",
      attributes: [],
      children: [],
    };
    const idx = tree.children.findIndex(
      (child) => child.type === "heading" && child.depth === 1,
    );
    if (idx === -1) {
      tree.children.unshift(node);
    } else {
      tree.children.splice(idx + 1, 0, node);
    }
  };
}

module.exports = remarkAiActions;
