import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function BlueprintCard({ title, Diagram, description, link }) {
  return (
    <div className="col col--4 margin-bottom--lg">
      <Link to={link} className={styles.cardLink}>
        <div className={`card shadow--md ${styles.card}`}>
          <div className={styles.imageContainer}>
            <Diagram
              className={styles.diagram}
              role="img"
              aria-label={`${title} architecture diagram`}
            />
          </div>
          <div className="card__body">
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
