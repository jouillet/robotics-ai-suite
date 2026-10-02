import React, { useEffect, useRef } from "react";
import { useLocation } from "@docusaurus/router";
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
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (!gtag) return;
      const timer = window.setTimeout(() => {
        gtag("event", "page_view", {
          page_location: window.location.href,
          page_title: document.title,
        });
      }, 100);
      return () => window.clearTimeout(timer);
    }
  }, [pathname]);

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
