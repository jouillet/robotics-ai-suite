import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { getBenchmarks, getModel, listModelsPage, type HfConfig } from "./api";

// Infinite grid query, keyed by org + active domain tag. Pages are chained via
// the Hugging Face `Link` header cursor.
export const modelsInfiniteQueryOptions = (
  cfg: HfConfig,
  domainTag: string | undefined,
) => {
  return infiniteQueryOptions({
    queryKey: ["models", cfg.org, domainTag ?? "all"] as const,
    queryFn: ({ pageParam }) =>
      listModelsPage(cfg, { domainTag, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};

export const modelQueryOptions = (cfg: HfConfig, slug: string) => {
  return queryOptions({
    queryKey: ["model", cfg.org, slug] as const,
    queryFn: () => getModel(cfg, slug),
    retry: 3,
  });
};

export const benchmarksQueryOptions = () => {
  return queryOptions({
    queryKey: ["benchmarks", "json"] as const,
    queryFn: () => getBenchmarks(),
    retry: 3,
  });
};
