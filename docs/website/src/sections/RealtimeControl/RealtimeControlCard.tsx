import { Link } from "../../components/Link";
import styles from "./RealtimeControlCard.module.css";

type RealtimeControlCardProps = {
  href?: string;
  icon: string;
  title: string;
  subtitle: string;
  className: string;
  description: string[];
};

export const RealtimeControlCard = ({
  href,
  icon,
  title,
  subtitle,
  className,
  description,
}: RealtimeControlCardProps) => {
  return (
    <div className={className}>
      <div className={styles.header}>
        <img src={icon} alt={title} />
        <h3 className={styles.title}>{title}</h3>
      </div>
      <h3 className={styles.subtitle}>{subtitle}</h3>

      <ul className={styles.items}>
        {description.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      {href ? (
        <Link className={styles.link} label="Learn more" href={href} />
      ) : (
        <span className={styles.comingSoon}>Coming soon</span>
      )}
    </div>
  );
};
