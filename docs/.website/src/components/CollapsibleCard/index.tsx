import { ReactNode } from "react";
import styles from "./styles.module.css";

type CollapsibleCardProps = {
  href?: string;
  title: string;
  isOpen: boolean;
  children?: ReactNode;
  className?: string;
  onToggle: () => void;
};

export const CollapsibleCard = ({
  title,
  href,
  children,
  className = "",
  isOpen,
  onToggle,
}: CollapsibleCardProps) => {
  return (
    <div
      className={`${styles.container} ${isOpen ? styles.open : ""} ${className}`}
    >
      <div className={styles.header}>
        {href ? (
          <a href={href} className={styles.titleLink}>
            {title}
          </a>
        ) : (
          <span className={styles.title}>{title}</span>
        )}
        <button
          className={styles.iconButton}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
        >
          <span className={styles.icon} aria-hidden="true">
            {isOpen ? "−" : "+"}
          </span>
        </button>
      </div>

      <div className={`${styles.content} ${isOpen ? styles.contentOpen : ""}`}>
        <div className={styles.contentInner}>{children}</div>
      </div>
    </div>
  );
};
