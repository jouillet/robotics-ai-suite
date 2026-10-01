import Link from "../../components/Link";
import styles from "./BlueprintCard.module.css";

type CardProps = {
  icon: string;
  href: string;
  title: string;
  description: string;
  imageClassName?: string;
};

export const BlueprintCard = ({
  icon,
  href,
  title,
  description,
  imageClassName,
}: CardProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img className={imageClassName} src={icon} alt={title} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <Link className={styles.link} label="Read More" href={href} />
      </div>
    </div>
  );
};
