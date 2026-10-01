import { getHardwareLabel } from "@site/src/data/models/hardware";
import type { TooltipContentProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import styles from "./BenchmarkTooltip.module.css";

export type BenchmarkTooltipProps = TooltipContentProps<ValueType, NameType> & {
  metricLabel: string;
  unit?: string;
};

export const BenchmarkTooltip = ({
  active,
  label,
  payload,
  metricLabel,
  unit,
}: BenchmarkTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{label}</p>
      <div className={styles.tooltipGroup}>
        <p className={styles.tooltipHardware}>
          {metricLabel}
          {unit ? ` (${unit})` : ""}
        </p>
        {payload.map((entry) => {
          const hardware = String(entry.dataKey ?? "");
          return (
            <div key={hardware} className={styles.tooltipRow}>
              <span>{getHardwareLabel(hardware)}</span>
              <span className={styles.tooltipValue}>
                {Number(entry.value ?? 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
