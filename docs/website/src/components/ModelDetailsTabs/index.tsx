import { type Model } from "@site/src/data/models/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./styles.module.css";

type ModelDetailsTabsProps = {
  model: Model;
};

export const ModelDetailsTabs = ({ model }: ModelDetailsTabsProps) => {
  if (!model.quickStart) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Quick Start</h2>
      <div className={styles.quickStart}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {model.quickStart}
        </ReactMarkdown>
      </div>
    </section>
  );
};
