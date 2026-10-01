import {
  getBenchmarksByMetric,
  getYAxisConfig,
} from "@site/src/components/ModelBenchmarks/utils";
import {
  getHardwareColor,
  getHardwareLabel,
} from "@site/src/data/models/hardware";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCategoryFilter } from "../_hooks/useCategoryFilter";
import styles from "./BenchmarksTab.module.css";
import { BenchmarkTooltip } from "./BenchmarkTooltip";

export const BenchmarksTab = (): React.JSX.Element => {
  const {
    relevantBenchmarks,
    isLoading,
    items: filteredItems,
  } = useCategoryFilter({ alwaysFetchBenchmarks: true });

  const displayedSlugs = new Set(filteredItems.map(({ slug }) => slug));
  const displayedBenchmarks = relevantBenchmarks.filter(({ slug }) =>
    displayedSlugs.has(slug),
  );

  const datasets = getBenchmarksByMetric(
    displayedBenchmarks,
    filteredItems,
  ).filter((d) => d.rows.length > 0 && d.hardwareKeys.length > 0);

  const legendHardware = Array.from(
    new Set(datasets.flatMap((d) => d.hardwareKeys)),
  );

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (filteredItems.length === 0 || datasets.length === 0) {
    return <p>No benchmark data available for the selected models.</p>;
  }

  return (
    <div className={styles.container}>
      {legendHardware.length > 0 && (
        <ul className={styles.legend} aria-label="Hardware legend">
          {legendHardware.map((hw, i) => (
            <li key={hw} className={styles.legendItem}>
              <span
                className={styles.legendSwatch}
                style={{ background: getHardwareColor(hw, i) }}
                aria-hidden
              />
              <span>{getHardwareLabel(hw)}</span>
            </li>
          ))}
        </ul>
      )}

      {datasets.map((dataset) => {
        const { yAxisMax, yTicks } = getYAxisConfig(
          dataset.rows,
          dataset.hardwareKeys,
        );

        return (
          <section key={dataset.metricKey} className={styles.chartSection}>
            <h4 className={styles.chartTitle}>
              {dataset.metricLabel}
              {dataset.unit ? (
                <span className={styles.chartUnit}> ({dataset.unit})</span>
              ) : null}
            </h4>
            <div className={styles.chartArea}>
              <div className={styles.comingSoonOverlay} aria-hidden>
                <span className={styles.comingSoonText}>COMING SOON</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={dataset.rows}
                margin={{ top: 12, right: 20, left: 0, bottom: 40 }}
                barCategoryGap="20%"
                barGap={2}
              >
                {dataset.rows.map((row, i) =>
                  i % 2 === 1 ? (
                    <ReferenceArea
                      key={`band-${row.name}`}
                      x1={row.name as string}
                      x2={row.name as string}
                      fill="#ffffff08"
                      fillOpacity={1}
                      ifOverflow="visible"
                      stroke="none"
                    />
                  ) : null,
                )}
                <CartesianGrid vertical={false} strokeDasharray="" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                  padding={{ left: 8, right: 8 }}
                />
                <YAxis
                  domain={[0, yAxisMax]}
                  ticks={yTicks}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: "#ffffff0d" }}
                  allowEscapeViewBox={{ x: false, y: true }}
                  position={{ y: -8 }}
                  offset={12}
                  content={(props) => (
                    <BenchmarkTooltip
                      {...props}
                      metricLabel={dataset.metricLabel}
                      unit={dataset.unit}
                    />
                  )}
                />
                {dataset.hardwareKeys.map((hw, index) => (
                  <Bar
                    key={hw}
                    dataKey={hw}
                    name={getHardwareLabel(hw)}
                    fill={getHardwareColor(hw, index)}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            </div>
          </section>
        );
      })}
    </div>
  );
};
