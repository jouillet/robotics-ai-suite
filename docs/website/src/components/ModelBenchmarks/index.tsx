import { benchmarksQueryOptions } from "@site/src/data/models/queryOptions";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  METRIC_COLORS,
  getChartData,
  getMetricKeys,
  getMetricLabels,
  getModelBenchmarks,
  getYAxisConfig,
} from "./utils";
import styles from "./styles.module.css";

const renderStateMessage = (message: string) => (
  <div className={styles.stateMessage}>{message}</div>
);

export const ModelBenchmarks = ({ slug }: { slug: string }) => {
  const {
    isError,
    isLoading,
    data: benchmarks = [],
  } = useQuery(benchmarksQueryOptions());

  const modelBenchmarks = getModelBenchmarks(benchmarks, slug);
  const chartData = getChartData(modelBenchmarks);
  const metricKeys = getMetricKeys(modelBenchmarks);
  const metricLabels = getMetricLabels(modelBenchmarks, metricKeys);
  const { yAxisMax, yTicks } = getYAxisConfig(chartData, metricKeys);

  if (isLoading) {
    return renderStateMessage("Loading benchmarks...");
  }

  if (isError) {
    return renderStateMessage("Unable to load benchmarks.");
  }

  if (chartData.length === 0 || metricKeys.length === 0) {
    return renderStateMessage("No benchmark data available for this model.");
  }

  return (
    <div className={styles.container}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          className={styles.chart}
          data={chartData}
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          barCategoryGap="30%"
          barGap={4}
        >
          <CartesianGrid vertical={false} strokeDasharray="" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            domain={[0, yAxisMax]}
            ticks={yTicks}
            axisLine={false}
            tickLine={false}
            label={{
              value: "",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              textAnchor: "middle",
            }}
          />
          <Tooltip />
          <Legend />

          {metricKeys.map((metricKey, index) => (
            <Bar
              key={metricKey}
              dataKey={metricKey}
              name={metricLabels[metricKey]}
              fill={METRIC_COLORS[index % METRIC_COLORS.length]}
              radius={[2, 2, 0, 0]}
            >
              <LabelList dataKey={metricKey} position="top" />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
