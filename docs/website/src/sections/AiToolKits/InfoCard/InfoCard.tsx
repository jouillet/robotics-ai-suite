import styles from "./InfoCard.module.css";
import { Link } from "../../../components/Link";

type InfoCardProps = {
  link: string;
  title: string;
  logos: string[];
  imageSrc: string;
  description: string;
  listItems: string[];
};

export const InfoCard = ({
  title,
  link,
  logos,
  imageSrc,
  listItems,
  description,
}: InfoCardProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={imageSrc} alt={title} />

        <div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.toolkit}>Toolkit</p>
          <p className={styles.subTitle}>{description}</p>
        </div>
      </div>

      <ul className={styles.list}>
        {listItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <div className={styles.separator} />
      <div className={styles.logos}>
        {logos.map((logo, index) => (
          <div className={styles.logo} key={index}>
            <img src={logo} alt={`Logo ${index + 1}`} />
          </div>
        ))}
      </div>
      <div className={styles.separator} />

      <Link href={link} label="Learn more" />
    </div>
  );
};
