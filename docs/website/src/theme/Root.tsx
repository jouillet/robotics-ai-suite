import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

type RootProps = {
  children: React.ReactNode;
};

export default function Root({ children }: RootProps): React.JSX.Element {
  useEffect(() => {
    const updateLinks = () => {
      for (const link of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
        const url = new URL(link.href, window.location.href);
        if ((url.protocol === "http:" || url.protocol === "https:") &&
            url.origin !== window.location.origin) {
          link.target = "_blank";
          link.relList.add("noopener", "noreferrer");
        }
      }
    };

    updateLinks();
    const observer = new MutationObserver(updateLinks);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
