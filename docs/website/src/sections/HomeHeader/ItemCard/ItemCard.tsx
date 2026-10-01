import React from "react";
import styles from "./ItemCard.module.css";

type ItemCardProps = {
  title: string;
  icon: string;
  description?: React.ReactNode;
};

export const ItemCard = ({ title, icon, description }: ItemCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.iconContainer}>
        <img src={icon} alt={title} />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
};
