import type { ChangeEvent } from "react";

import clsx from "clsx";
import SearchIcon from "../../../static/img/icon/search.svg";
import styles from "./styles.module.css";

type SearchBoxProps = {
  value: string;
  className?: string;
  placeholder: string;
  ariaLabel?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const SearchBox = ({
  value,
  ariaLabel,
  className,
  placeholder,
  onChange,
}: SearchBoxProps) => {
  return (
    <div className={clsx(styles.searchBox, className)}>
      <SearchIcon
        className={styles.icon}
        aria-hidden="true"
        focusable="false"
      />
      <input
        type="search"
        value={value}
        onChange={onChange}
        className={styles.input}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
    </div>
  );
};
