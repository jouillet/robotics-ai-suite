import { type HfConfig } from "@site/src/data/models/api";
import React from "react";
import { useModelFilters } from "../_hooks/useModelFilters";
import styles from "./FiltersSidebar.module.css";
import { ModelCategories } from "./ModelCategories";
import { PlatformCategories } from "./PlatformCategories";

type FiltersSidebarProps = {
  cfg: HfConfig;
};

export const FiltersSidebar = ({
  cfg,
}: FiltersSidebarProps): React.JSX.Element => {
  const {
    allSelected,
    selectedDomain,
    selectedChipsets,
    selectedCategory,
    toggleChipset,
    setSelectedDomain,
    handleToggleSelected,
    setSelectedCategory,
  } = useModelFilters(cfg);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.filterHeader}>
        <span className={styles.filterLabel}>Filter by</span>
        <button onClick={handleToggleSelected} className={styles.clearBtn}>
          {allSelected ? "Clear All" : "Select All"}
        </button>
      </div>

      <PlatformCategories
        items={cfg.chipsets.map((chipset) => ({
          value: chipset.alias,
          label: chipset.label,
        }))}
        selectedItems={selectedChipsets}
        onSelectionChange={toggleChipset}
      />

      <ModelCategories
        domains={cfg.domains}
        onToggle={setSelectedDomain}
        selectedDomain={selectedDomain}
        selectedCategory={selectedCategory}
        onCategoryToggle={setSelectedCategory}
      />
    </aside>
  );
};
