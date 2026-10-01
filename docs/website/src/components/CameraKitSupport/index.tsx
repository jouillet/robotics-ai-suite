import React from 'react';
import Link from '@docusaurus/Link';
import cameras from '@site/src/data/cameras';
import devKits from '@site/src/data/devKits';
import { supportingKits } from '@site/src/data/compat';
import styles from './styles.module.css';

// Auto-derived "Compatible development kits" callout for a camera page.
// Pass the camera's id from src/data/cameras.js:
//   <CameraKitSupport camera="gmsl-ar0233" />
// The list of kits, the native/adapter level, and the IPU config code are all
// computed from the data model — nothing here is hand-maintained, so it can
// never drift from the catalog table.
export default function CameraKitSupport({ camera: cameraId }) {
  const camera = cameras.find((c) => c.id === cameraId);
  if (!camera) {
    throw new Error(
      `CameraKitSupport: no camera with id "${cameraId}" in src/data/cameras.js`,
    );
  }

  const matches = supportingKits(camera, devKits);

  return (
    <div className={styles.box}>
      <div className={styles.title}>Compatible development kits</div>
      {matches.length === 0 ? (
        <p className={styles.note}>
          No development kit in this catalog has been validated with this camera
          yet. Follow the interface bring-up steps as the generic procedure.
        </p>
      ) : (
        <ul className={styles.list}>
          {matches.map(({ kit, level }) => (
            <li key={kit.id}>
              <Link to={kit.connectLink || kit.docLink}>{kit.name}</Link> —{' '}
              {level === 'adapter' ? (
                <>
                  requires a {kit.mipiPhy}–{camera.phy} adapter
                </>
              ) : (
                <>native {camera.interface} connection</>
              )}
              . Install the <code>{kit.ipu}</code> configuration files.
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
