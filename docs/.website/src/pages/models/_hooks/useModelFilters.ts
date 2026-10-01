import { useHistory, useLocation } from "@docusaurus/router";
import { type HfConfig } from "@site/src/data/models/api";
import { useCallback, useMemo } from "react";

const ALL_DOMAINS = "__all__";
const CHIPSETS_NONE = "__none__";

export type UseModelFiltersResult = {
  searchQuery: string;
  selectedDomain: string;
  selectedDomainTag: string | undefined;
  selectedCategory: string | undefined;
  selectedChipsets: string[];
  allSelected: boolean;
  setSearchQuery: (query: string) => void;
  setSelectedDomain: (domain: string | undefined) => void;
  setSelectedCategory: (category: string | undefined, domain?: string) => void;
  toggleChipset: (chipset: string) => void;
  handleToggleSelected: () => void;
};

export const useModelFilters = (cfg: HfConfig): UseModelFiltersResult => {
  const location = useLocation();
  const history = useHistory();

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const searchQuery = queryParams.get("search") ?? "";
  const selectedDomainParam = queryParams.get("domain");
  const selectedChipsetsParam = queryParams.get("chipsets");
  const selectedCategoryParam = queryParams.get("category");

  const allChipsetAliases = useMemo(
    () => cfg.chipsets.map(({ alias }) => alias),
    [cfg.chipsets],
  );
  const allChipsetAliasSet = useMemo(
    () => new Set(allChipsetAliases),
    [allChipsetAliases],
  );

  const selectedDomain =
    selectedDomainParam && selectedDomainParam !== ALL_DOMAINS
      ? selectedDomainParam
      : ALL_DOMAINS;

  const selectedChipsets = useMemo(() => {
    if (!selectedChipsetsParam) {
      return allChipsetAliases;
    }
    if (selectedChipsetsParam === CHIPSETS_NONE) {
      return [];
    }
    const fromParam = selectedChipsetsParam
      .split(",")
      .filter((alias) => allChipsetAliasSet.has(alias));
    return Array.from(new Set(fromParam));
  }, [selectedChipsetsParam, allChipsetAliases, allChipsetAliasSet]);

  const allChipsetsSelected =
    selectedChipsets.length === allChipsetAliases.length &&
    allChipsetAliases.every((chipset) => selectedChipsets.includes(chipset));

  const allSelected =
    selectedDomain === ALL_DOMAINS &&
    allChipsetsSelected &&
    !searchQuery.trim() &&
    !selectedCategoryParam;

  const encodeChipsets = useCallback(
    (chipsets: string[]): string | undefined => {
      if (chipsets.length === 0) {
        return CHIPSETS_NONE;
      }
      const isAll =
        chipsets.length === allChipsetAliases.length &&
        allChipsetAliases.every((alias) => chipsets.includes(alias));
      if (isAll) {
        return undefined;
      }
      return allChipsetAliases
        .filter((alias) => chipsets.includes(alias))
        .join(",");
    },
    [allChipsetAliases],
  );

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(location.search);
      for (const [key, val] of Object.entries(updates)) {
        if (!val) {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      history.replace({
        pathname: location.pathname,
        search: params.toString(),
      });
    },
    [history, location.pathname, location.search],
  );

  const selectedCategory = selectedCategoryParam ?? undefined;

  const setSelectedCategory = useCallback(
    (category: string | undefined, domain?: string) => {
      const updates: Record<string, string | undefined> = {
        category: category || undefined,
      };
      if (domain !== undefined) {
        updates.domain = domain === ALL_DOMAINS ? undefined : domain;
      }
      updateParams(updates);
    },
    [updateParams],
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      updateParams({ search: query.trim() || undefined });
    },
    [updateParams],
  );

  const setSelectedDomain = useCallback(
    (domain: string | undefined) => {
      updateParams({
        domain: domain === ALL_DOMAINS ? undefined : domain,
        category: undefined,
      });
    },
    [updateParams],
  );

  const toggleChipset = useCallback(
    (chipset: string) => {
      const next = selectedChipsets.includes(chipset)
        ? selectedChipsets.filter((v) => v !== chipset)
        : [...selectedChipsets, chipset];
      updateParams({ chipsets: encodeChipsets(next) });
    },
    [encodeChipsets, selectedChipsets, updateParams],
  );

  const clearAll = useCallback(() => {
    updateParams({
      domain: undefined,
      chipsets: CHIPSETS_NONE,
      category: undefined,
      search: undefined,
    });
  }, [updateParams]);

  const selectAll = useCallback(() => {
    updateParams({
      domain: undefined,
      chipsets: undefined,
      category: undefined,
      search: undefined,
    });
  }, [updateParams]);

  const handleToggleSelected = useCallback(() => {
    if (allSelected) {
      clearAll();
      return;
    }
    selectAll();
  }, [allSelected, clearAll, selectAll]);

  return {
    searchQuery,
    selectedDomain,
    selectedDomainTag:
      selectedDomain === ALL_DOMAINS ? undefined : selectedDomain,
    selectedCategory,
    selectedChipsets,
    allSelected,
    setSearchQuery,
    setSelectedDomain,
    setSelectedCategory,
    toggleChipset,
    handleToggleSelected,
  };
};
