import MDXComponents from "@theme-original/MDXComponents";
import AiActions from "@site/src/components/AiActions";

// Registering AiActions globally lets the remark-ai-actions plugin inject
// <AiActions/> into every doc without a per-file import.
export default {
  ...MDXComponents,
  AiActions,
};
