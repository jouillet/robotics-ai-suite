import useBaseUrl from "@docusaurus/useBaseUrl";
import Link from "../Link";
import styles from "./styles.module.css";

type ModelBreadcrumbsProps = {
  modelName: string;
};

export const ModelBreadcrumbs = ({ modelName }: ModelBreadcrumbsProps) => {
  const homeHref = useBaseUrl("/");
  const allModelsHref = useBaseUrl("/models/");

  return (
    <div className={styles.container}>
      <Link href={homeHref} label="Home" className={styles.link} />/
      <Link
        href={allModelsHref}
        label="All models"
        className={styles.link}
      />/ {modelName}
    </div>
  );
};
