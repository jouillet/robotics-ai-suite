import React, { useMemo, useState } from 'react';
import Link from '@docusaurus/Link';
import cameras from '@site/src/data/cameras';
import devKits from '@site/src/data/devKits';
import { CAPABILITY_ORDER } from '@site/src/data/constants';
import { support } from '@site/src/data/compat';
import styles from './styles.module.css';

const ALL = 'all';

// Type column text, derived from the camera's capability tags.
function typeLabel(camera) {
  return CAPABILITY_ORDER.filter((cap) => camera.capabilities.includes(cap)).join(
    ' · ',
  );
}

// Sorted unique values for a filter dropdown.
function options(values) {
  return Array.from(new Set(values)).sort();
}

export default function CameraTable() {
  const [kitId, setKitId] = useState(ALL);
  const [iface, setIface] = useState(ALL);
  const [capability, setCapability] = useState(ALL);
  const [vendor, setVendor] = useState(ALL);

  const selectedKit = useMemo(
    () => devKits.find((k) => k.id === kitId) || null,
    [kitId],
  );

  const interfaceOptions = options(cameras.map((c) => c.interface));
  const vendorOptions = options(cameras.map((c) => c.vendor));
  const capabilityOptions = CAPABILITY_ORDER.filter((cap) =>
    cameras.some((c) => c.capabilities.includes(cap)),
  );

  const rows = useMemo(() => {
    return cameras
      .map((camera) => ({
        camera,
        level: selectedKit ? support(camera, selectedKit) : 'all',
      }))
      .filter((row) => row.level !== null)
      .filter((row) => iface === ALL || row.camera.interface === iface)
      .filter(
        (row) =>
          capability === ALL || row.camera.capabilities.includes(capability),
      )
      .filter((row) => vendor === ALL || row.camera.vendor === vendor);
  }, [selectedKit, iface, capability, vendor]);

  const filtersActive =
    kitId !== ALL || iface !== ALL || capability !== ALL || vendor !== ALL;

  function resetFilters() {
    setKitId(ALL);
    setIface(ALL);
    setCapability(ALL);
    setVendor(ALL);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <Filter id="ct-kit" label="Development kit" value={kitId} onChange={setKitId}>
          <option value={ALL}>All kits</option>
          {devKits.map((kit) => (
            <option key={kit.id} value={kit.id}>
              {kit.name}
            </option>
          ))}
        </Filter>

        <Filter id="ct-iface" label="Interface" value={iface} onChange={setIface}>
          <option value={ALL}>All interfaces</option>
          {interfaceOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Filter>

        <Filter
          id="ct-cap"
          label="Capability"
          value={capability}
          onChange={setCapability}
        >
          <option value={ALL}>All capabilities</option>
          {capabilityOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Filter>

        <Filter id="ct-vendor" label="Vendor" value={vendor} onChange={setVendor}>
          <option value={ALL}>All vendors</option>
          {vendorOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Filter>

        <div className={styles.meta}>
          <span className={styles.count}>
            {rows.length} of {cameras.length} cameras
          </span>
          {filtersActive && (
            <button type="button" className={styles.reset} onClick={resetFilters}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Camera</th>
            <th>Interface</th>
            <th>Type</th>
            <th>Vendor</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ camera, level }) => (
            <tr key={camera.id}>
              <td>
                <Link to={camera.href}>
                  <strong>{camera.name}</strong>
                </Link>
              </td>
              <td>{camera.interface}</td>
              <td>{typeLabel(camera)}</td>
              <td>{camera.vendor}</td>
              <td>
                {level === 'adapter' ? (
                  <span className={styles.adapter}>
                    Requires {selectedKit.mipiPhy}-{camera.phy} adapter
                  </span>
                ) : (
                  <span className={styles.muted}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <p className={styles.empty}>No cameras match the selected filters.</p>
      )}
    </div>
  );
}

function Filter({ id, label, value, onChange, children }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  );
}
