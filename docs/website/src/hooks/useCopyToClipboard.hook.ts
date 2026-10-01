import { useCallback, useState } from "react";

// Copies arbitrary text to the clipboard and flashes a `copied` flag that
// auto-resets after `resetMs`.
export const useCopyToClipboard = (resetMs = 2000) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string): Promise<void> => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), resetMs);
    },
    [resetMs],
  );

  return { copied, copy };
};
