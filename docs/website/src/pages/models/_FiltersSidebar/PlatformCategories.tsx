import React from "react";
import CheckMark from "../../../../static/img/icon/check-mark.svg";
import ChipsetIcon from "../../../../static/img/icon/chipset.svg";
import styles from "./PlatformCategories.module.css";
import { getTierLabel } from "@site/src/data/models/hardware";

export type PlatformCategoryItem = {
  value: string;
  label: string;
  subtitle?: string;
};

type PlatformCategoriesProps = {
  items: PlatformCategoryItem[];
  selectedItems: string[];
  onSelectionChange: (selectedItem: string) => void;
};

export const PlatformCategories = ({
  items,
  selectedItems,
  onSelectionChange,
}: PlatformCategoriesProps): React.JSX.Element => {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Platform</h3>
      <div className={styles.list}>
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.value);
          const label = getTierLabel(item.value) || item.label;

          return (
            <button
              key={item.value}
              type="button"
              className={`${styles.card}${isSelected ? ` ${styles.cardSelected}` : ""}`}
              onClick={() => onSelectionChange(item.value)}
              aria-pressed={isSelected}
            >
              <span className={styles.leadingIcon}>
                {isSelected ? <CheckMark /> : <ChipsetIcon />}
              </span>
              <span className={styles.label}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
