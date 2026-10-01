import { benchmarksQueryOptions } from "@site/src/data/models/queryOptions";
import { useHfConfig } from "@site/src/data/models/useHfConfig";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { filterModels } from "../_util/filterModels";
import { useModelFilters } from "./useModelFilters";
import { useModelsInfiniteList } from "./useModelsInfiniteList";

interface UseCategoryFilterOptions {
  alwaysFetchBenchmarks?: boolean;
}

export const useCategoryFilter = (options: UseCategoryFilterOptions = {}) => {
  const { alwaysFetchBenchmarks = false } = options;
  const cfg = useHfConfig();

  const { searchQuery, selectedDomainTag, selectedChipsets, selectedCategory } =
    useModelFilters(cfg);

  // If a specific subcategory (pipeline_tag) is selected, query HF directly with that filter tag.
  // If Physical AI is selected without a subcategory, query HF with 'robotics'.
  const activeHfFilter =
    selectedCategory ??
    (selectedDomainTag === "physical-ai" ? "robotics" : undefined);

  const {
    models,
    isLoading: isModelsLoading,
    isFetchingNextPage,
    sentinelRef,
  } = useModelsInfiniteList(cfg, activeHfFilter);

  const { data: allBenchmarks = [], isLoading: isBenchmarksLoading } = useQuery(
    {
      ...benchmarksQueryOptions(),
      enabled: Boolean(selectedCategory) || alwaysFetchBenchmarks,
    },
  );

  const relevantBenchmarks = useMemo(
    () =>
      selectedCategory
        ? allBenchmarks.filter(({ category }) =>
            category?.includes(selectedCategory),
          )
        : allBenchmarks,
    [allBenchmarks, selectedCategory],
  );

  const filteredItems = useMemo(
    () =>
      filterModels(
        models,
        searchQuery,
        selectedChipsets,
        selectedDomainTag,
        selectedCategory,
      ),
    [models, searchQuery, selectedChipsets, selectedDomainTag, selectedCategory],
  );

  return {
    items: filteredItems,
    sentinelRef,
    isFetchingNextPage,
    relevantBenchmarks,
    isLoading: isModelsLoading || isBenchmarksLoading,
  };
};
