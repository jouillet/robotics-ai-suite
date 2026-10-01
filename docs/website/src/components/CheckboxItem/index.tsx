import styles from "./styles.module.css";

type CheckboxItemProps = {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
};

export const CheckboxItem = ({
  label,
  count,
  checked,
  onChange,
}: CheckboxItemProps) => {
  return (
    <label className={styles.checkbox} onClick={onChange}>
      <span
        className={`${styles.checkboxBox} ${checked ? styles.checkboxBoxChecked : ""}`}
      >
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path
              d="M1 3L3 5L7 1"
              stroke="#00c7fd"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={styles.checkboxLabel}>{label}</span>
      {typeof count === "number" && (
        <span className={styles.checkboxCount}>{count}</span>
      )}
    </label>
  );
};
