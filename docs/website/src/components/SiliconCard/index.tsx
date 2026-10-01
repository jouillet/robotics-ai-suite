import React from 'react';
import styles from './styles.module.css';

export default function SiliconCard({ title, tier, description, points }) {
  return (
    <div className="col col--6 margin-bottom--lg">
      <div className={`card shadow--md ${styles.card}`}>
        <div className="card__body">
          {tier && <div className={styles.tier}>{tier}</div>}
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
          {points && (
            <ul className={styles.points}>
              {points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
