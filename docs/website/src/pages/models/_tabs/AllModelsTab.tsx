import { ModelCardItem } from "@site/src/components/ModelCardItem";
import { SearchBox } from "@site/src/components/SearchBox";
import { useHfConfig } from "@site/src/data/models/useHfConfig";
import { pluralize } from "@site/src/utils/pluralize";
import React from "react";
import { useCategoryFilter } from "../_hooks/useCategoryFilter";
import { useModelFilters } from "../_hooks/useModelFilters";
import styles from "./AllModelsTab.module.css";

export const AllModelsTab = (): React.JSX.Element => {
  const cfg = useHfConfig();

  const { searchQuery, setSearchQuery } = useModelFilters(cfg);

  const {
    items: filteredItems,
    isLoading,
    sentinelRef,
    isFetchingNextPage,
  } = useCategoryFilter();

  return (
    <div className={styles.cardsArea}>
      <div className={styles.searchBar}>
        <SearchBox
          value={searchQuery}
          className={styles.searchBox}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search models"
        />

        <p className={styles.count}>
          {isLoading ? (
            "Loading models…"
          ) : (
            <>
              <span>{filteredItems.length}</span>{" "}
              {pluralize(filteredItems.length, "Model")} found
            </>
          )}
        </p>
      </div>

      <p className={styles.count}>
        {isFetchingNextPage ? "Loading more…" : ""}
      </p>
      {!isLoading && filteredItems.length === 0 ? (
        <p className={styles.empty}>
          No models match the current search and filter selection.
        </p>
      ) : (
        <div className={styles.grid}>
          {filteredItems.map((model) => (
            <ModelCardItem key={model.slug} model={model} />
          ))}
        </div>
      )}
      <div ref={sentinelRef} />
      {isFetchingNextPage && <p className={styles.count}>Loading more…</p>}
    </div>
  );
};
