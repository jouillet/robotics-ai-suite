import { modelQueryOptions } from "@site/src/data/models/queryOptions";
import { useHfConfig } from "@site/src/data/models/useHfConfig";
import { useQuery } from "@tanstack/react-query";
import styles from "./styles.module.css";
import { ModelCardItem } from "../ModelCardItem";

export const RelatedModelCard = ({ slug }: { slug: string }) => {
  const cfg = useHfConfig();

  const response = useQuery({
    ...modelQueryOptions(cfg, slug),
    enabled: Boolean(slug),
  });
  const { data: model, isError, isLoading } = response;

  if (isError) {
    return null;
  }

  if (isLoading || !model) {
    return <div>Loading...</div>;
  }

  return <ModelCardItem model={model} className={styles.card} />;
};
