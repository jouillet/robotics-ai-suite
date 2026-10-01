import React from "react";
import Chipset from "../../../static/img/icon/chipset.svg";
import styles from "./styles.module.css";

type ChipsetBadgeProps = {
  label: string;
  className?: string;
};

export function ChipsetBadge({ label, className = "" }: ChipsetBadgeProps) {
  return (
    <div className={`${styles.badge} ${className}`}>
      <Chipset aria-hidden="true" focusable="false" />
      {label}
    </div>
  );
}
