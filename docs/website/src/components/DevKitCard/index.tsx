import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function DevKitCard({ title, image, description, specs, link }) {
  return (
    <div className="col col--12">
      <div className={`card shadow--md margin-bottom--lg ${styles.cardHorizontal}`}>

        {/* Left column: Image */}
        <div className={styles.imageContainer}>
          <img src={image} alt={title} style={{ width: '100%', objectFit: 'contain' }} />
        </div>

        {/* Right column: Content */}
        <div className={styles.contentContainer}>
          <div className="card__body">
            <h3>{title}</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--ifm-color-emphasis-800)' }}>{description}</p>
            <hr />
            <ul style={{ fontSize: '0.9rem', paddingLeft: '1.2rem', marginBottom: '0' }}>
              {specs.ai && <li><strong>Unified AI:</strong> {specs.ai}</li>}
              {specs.memory && <li><strong>Memory:</strong> {specs.memory}</li>}
              {specs.vision && <li><strong>Vision Bandwidth:</strong> {specs.vision}</li>}
              {specs.control && <li><strong>Precision Control:</strong> {specs.control}</li>}
            </ul>
          </div>
          <div className="card__footer" style={{ marginTop: 'auto', textAlign: 'right' }}>
            <Link className="button button--primary" to={link}>Get Started</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
