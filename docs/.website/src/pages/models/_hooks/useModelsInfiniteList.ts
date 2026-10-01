import { type HfConfig, type Model } from "@site/src/data/models/api";
import { modelsInfiniteQueryOptions } from "@site/src/data/models/queryOptions";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RefObject, useEffect, useMemo, useRef } from "react";

type UseModelsInfiniteListResult = {
  models: Model[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
};

export const useModelsInfiniteList = (
  cfg: HfConfig,
  domainTag: string | undefined,
): UseModelsInfiniteListResult => {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(modelsInfiniteQueryOptions(cfg, domainTag));

  const models = useMemo(
    () => data?.pages.flatMap((page) => page.models) ?? [],
    [data],
  );

  // Fetch the next page when the sentinel enters view.
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    models,
    isLoading,
    isFetchingNextPage,
    sentinelRef,
  };
};
