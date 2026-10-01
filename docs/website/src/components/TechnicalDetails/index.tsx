import { type Model } from "@site/src/data/models/api";
import styles from "./styles.module.css";

type TechnicalDetailsProps = {
  model: Model;
};

type Fact = { label: string; value: string | undefined };

export const TechnicalDetails = ({ model }: TechnicalDetailsProps) => {
  const facts: Fact[] = [
    { label: "License", value: model.license },
    { label: "Size", value: model.size },
    { label: "Release date", value: model.releaseDate },
    { label: "Datasets", value: model.datasets },
  ].filter((fact): fact is Fact => Boolean(fact.value));

  if (facts.length === 0) {
    return null;
  }

  return (
    <>
      <h3 className={styles.title}>Technical Details</h3>

      <div className={styles.facts}>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.factRow}>
            <div className={styles.factLabel}>{fact.label}</div>
            <div className={styles.factValue}>{fact.value}</div>
          </div>
        ))}
      </div>
    </>
  );
};
