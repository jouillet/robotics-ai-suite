// -----------------------------------------------------------------------------
// Palette + human-readable labels
// -----------------------------------------------------------------------------

import { getHardwareLabel } from "@site/src/data/models/hardware";

export const METRIC_COLORS = [
  "#c8f000",
  "#3b5ea6",
  "#1e2d5a",
  "#63b3ed",
  "#2f855a",
];

const METRIC_LABELS: Record<string, string> = {
  inference_latency: "Inference Latency",
  throughput: "Throughput",
};

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export type BenchmarkMetric = {
  name: string;
  value: number;
  unit?: string;
};

export type ChartRow = {
  name: string;
  [metricKey: string]: string | number;
};

export type MetricChartDataset = {
  metricKey: string;
  metricLabel: string;
  unit?: string;
  rows: ChartRow[];
  hardwareKeys: string[];
};

// -----------------------------------------------------------------------------
// Minimal structural constraints for the generic helpers below. Each function
// only asks for the fields it actually reads, so callers can pass richer types
// (e.g. the API's Benchmark) without extra plumbing.
// -----------------------------------------------------------------------------

type MetricLike = { name: string; unit?: string; value?: number };
type HasMetrics = { metrics: ReadonlyArray<MetricLike> };
type HasSlug = { slug: string };
type HasHardware = { hardware: string };
type ModelLike = { slug: string; name: string };

// -----------------------------------------------------------------------------
// String + label helpers
// -----------------------------------------------------------------------------

export const toTitleCase = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatMetricLabel = (metricKey: string, unit?: string): string => {
  const base = toTitleCase(METRIC_LABELS[metricKey] ?? metricKey);
  return unit ? `${base} (${unit})` : base;
};

// -----------------------------------------------------------------------------
// Benchmark selection + metric discovery
// -----------------------------------------------------------------------------

export const getModelBenchmarks = <T extends HasSlug>(
  benchmarks: ReadonlyArray<T>,
  slug: string,
): T[] => benchmarks.filter((entry) => entry.slug === slug);

export const getMetricKeys = <T extends HasMetrics>(
  benchmarks: ReadonlyArray<T>,
): string[] =>
  Array.from(
    new Set(benchmarks.flatMap((entry) => entry.metrics.map((m) => m.name))),
  );

const findFirstMetric = <T extends HasMetrics>(
  benchmarks: ReadonlyArray<T>,
  metricKey: string,
): MetricLike | undefined => {
  for (const entry of benchmarks) {
    const match = entry.metrics.find((m) => m.name === metricKey);
    if (match) return match;
  }
  return undefined;
};

export const getMetricLabels = <T extends HasMetrics>(
  benchmarks: ReadonlyArray<T>,
  metricKeys: string[],
): Record<string, string> =>
  Object.fromEntries(
    metricKeys.map((key) => [
      key,
      formatMetricLabel(key, findFirstMetric(benchmarks, key)?.unit),
    ]),
  );

// -----------------------------------------------------------------------------
// Chart-row builders
// -----------------------------------------------------------------------------

export const getChartData = <T extends HasMetrics & HasHardware>(
  benchmarks: ReadonlyArray<T>,
): ChartRow[] =>
  benchmarks.map((entry) => {
    const row: ChartRow = { name: getHardwareLabel(entry.hardware) };
    for (const metric of entry.metrics) {
      row[metric.name] = metric.value ?? 0;
    }
    return row;
  });

// -----------------------------------------------------------------------------
// Y-axis scaling
// -----------------------------------------------------------------------------

// Picks a "nice" tick step (1/2/5 × 10^n) so single-digit latencies and
// hundreds-scale throughputs both render with clean gridlines.
const pickNiceStep = (maxValue: number, targetTicks = 5): number => {
  if (maxValue <= 0) return 1;
  const rough = maxValue / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const niceMultiplier =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceMultiplier * magnitude;
};

const maxValueAcross = (rows: ChartRow[], metricKeys: string[]): number =>
  Math.max(
    0,
    ...rows.flatMap((row) => metricKeys.map((key) => Number(row[key] ?? 0))),
  );

export const getYAxisConfig = (
  chartData: ChartRow[],
  metricKeys: string[],
  step?: number,
  minMax = 0,
): { yAxisMax: number; yTicks: number[] } => {
  const maxMetricValue = maxValueAcross(chartData, metricKeys);
  const effectiveStep = step ?? pickNiceStep(maxMetricValue);

  const yAxisMax = Math.max(
    minMax,
    Math.ceil(maxMetricValue / effectiveStep) * effectiveStep,
    effectiveStep,
  );

  const tickCount = Math.round(yAxisMax / effectiveStep) + 1;
  const yTicks = Array.from({ length: tickCount }, (_, index) =>
    Number((index * effectiveStep).toFixed(6)),
  );

  return { yAxisMax, yTicks };
};

// -----------------------------------------------------------------------------
// Split benchmarks into one dataset per metric so each chart owns its Y scale
// -----------------------------------------------------------------------------

const buildMetricRow = <B extends HasSlug & HasHardware & HasMetrics>(
  model: ModelLike,
  benchmarks: ReadonlyArray<B>,
  metricKey: string,
  hardwareSeen: Set<string>,
): ChartRow | null => {
  const row: ChartRow = { name: model.name };
  let hasValue = false;

  for (const entry of benchmarks) {
    if (entry.slug !== model.slug) continue;
    const metric = entry.metrics.find((m) => m.name === metricKey);
    if (metric?.value == null) continue;

    row[entry.hardware] = metric.value;
    hardwareSeen.add(entry.hardware);
    hasValue = true;
  }

  return hasValue ? row : null;
};

export const getBenchmarksByMetric = <
  B extends HasSlug & HasHardware & HasMetrics,
  M extends ModelLike,
>(
  benchmarks: ReadonlyArray<B>,
  models: ReadonlyArray<M>,
): MetricChartDataset[] => {
  const metricKeys = getMetricKeys(benchmarks);
  const hardwareOrder = Array.from(
    new Set(benchmarks.map((entry) => entry.hardware)),
  );

  return metricKeys.map((metricKey) => {
    const unit = findFirstMetric(benchmarks, metricKey)?.unit;
    const hardwareSeen = new Set<string>();

    const rows = models.flatMap((model) => {
      const row = buildMetricRow(model, benchmarks, metricKey, hardwareSeen);
      return row ? [row] : [];
    });

    return {
      metricKey,
      // Chart titles render the unit separately, so keep the label unit-free.
      metricLabel: toTitleCase(METRIC_LABELS[metricKey] ?? metricKey),
      unit,
      rows,
      hardwareKeys: hardwareOrder.filter((hw) => hardwareSeen.has(hw)),
    };
  });
};
