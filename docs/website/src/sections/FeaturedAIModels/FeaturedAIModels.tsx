import { ModelCardItem } from "@site/src/components/ModelCardItem";
import { useQuery } from "@tanstack/react-query";
import { Link } from "../../components/Link";
import { Section } from "../../components/Section";
import { listModelsPage } from "../../data/models/api";
import { useHfConfig } from "../../data/models/useHfConfig";
import styles from "./FeaturedAIModels.module.css";
import useBaseUrl from "@docusaurus/useBaseUrl";

const FEATURED_LIMIT = 4;

export const FeaturedAIModels = () => {
  const cfg = useHfConfig();
  const allModelsHref = useBaseUrl("/models/");

  const { data } = useQuery({
    queryKey: ["featured-models", cfg.org] as const,
    queryFn: () => listModelsPage(cfg),
  });
  const models = (data?.models ?? []).slice(0, FEATURED_LIMIT);
  return (
    <Section className={styles.container} id="featured-ai-models">
      <Section.Title>Featured AI Models</Section.Title>

      <Section.Description>
        Explore our library of pre-trained models optimized for edge
        deployments on Intel hardware. Browse a wide range of robotics use cases and quickly deploy models on your edge system. Need more
        customization? Fine-tune your model in just a click with Physical AI
        Studio.
      </Section.Description>

      <div className={styles.cards}>
        {models.map((model) => (
          <ModelCardItem
            key={model.slug}
            model={model}
            className={styles.card}
          />
        ))}
      </div>

      <Link
        className={styles.exploreMore}
        label="Explore more AI models"
        href={allModelsHref}
      />
    </Section>
  );
};
