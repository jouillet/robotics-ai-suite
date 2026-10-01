import { useHfConfig } from "@site/src/data/models/useHfConfig";
import clsx from "clsx";
import React, { ReactNode, useState } from "react";
import { FiltersSidebar } from "../_FiltersSidebar/FiltersSidebar";
import styles from "./FiltersSidebarLayout.module.css";

export const FiltersSidebarLayout = ({
  cfg,
  children,
}: {
  cfg: ReturnType<typeof useHfConfig>;
  children: ReactNode;
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className={styles.layout}>
      <button
        type="button"
        className={styles.mobileFilterToggle}
        onClick={() => setIsOpenMobile((open) => !open)}
        aria-expanded={isOpenMobile}
        aria-controls="filters-sidebar-content"
      >
        <span className={styles.toggleContent}>
          <svg
            className={styles.filterIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>{isOpenMobile ? "Hide Filters" : "Filter Models"}</span>
        </span>
        <svg
          className={clsx(styles.chevronIcon, {
            [styles.chevronOpen]: isOpenMobile,
          })}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        id="filters-sidebar-content"
        className={clsx(styles.sidebarWrapper, {
          [styles.sidebarOpenMobile]: isOpenMobile,
        })}
      >
        <FiltersSidebar cfg={cfg} />
      </div>

      {children}
    </div>
  );
};
