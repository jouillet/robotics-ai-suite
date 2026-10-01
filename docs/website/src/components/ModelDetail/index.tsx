import { useLocation } from "@docusaurus/router";
import { modelQueryOptions } from "@site/src/data/models/queryOptions";
import { useHfConfig } from "@site/src/data/models/useHfConfig";
import { useQuery } from "@tanstack/react-query";
import Layout from "@theme/Layout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChipsetBadge } from "../ChipsetBadge";
import { Divider } from "../Divider";
import Link from "../Link";

import useBaseUrl from "@docusaurus/useBaseUrl";
import ModelsPage from "@site/src/pages/models";
import AiBrain from "../../../static/img/icon/ai-brain.svg";
import Eye from "../../../static/img/icon/eye.svg";
import Robot from "../../../static/img/icon/robot.svg";
import roboticsCharm from "../../../static/img/robotics-charm.png";
import { ModelBreadcrumbs } from "../ModelBreadcrumbs";
import { ModelDetailsTabs } from "../ModelDetailsTabs";
import { ModelLinks } from "../ModelLinks";
import { RelatedModelCard } from "../RelatedModelCard";
import { TechnicalDetails } from "../TechnicalDetails";
import styles from "./styles.module.css";
import clsx from "clsx";

const slugFromPath = (pathname: string) => {
  const parts = pathname.replace(/\/+$/, "").split("/");
  return parts[parts.length - 1] ?? "";
};

// With `trailingSlash: true` the models list is emitted as the static file
// `models/index.html`, which the catch-all `/models/:slug` route also matches
// (slug === "index.html"). Treat that (and a bare `/models`) as the list page.
const isModelsIndexSlug = (slug: string) =>
  slug === "" || slug === "index" || slug === "index.html";

export default function ModelDetail() {
  const cfg = useHfConfig();
  const location = useLocation();
  const slug = slugFromPath(location.pathname);
  const allModelsHref = useBaseUrl("/models/");
  const isIndex = isModelsIndexSlug(slug);

  const {
    data: model,
    isError,
    isLoading,
  } = useQuery({
    ...modelQueryOptions(cfg, slug),
    enabled: Boolean(slug) && !isIndex,
  });

  const relatedLocal = model?.relatedModels ?? [];

  const chipsetLabel = (alias: string) =>
    cfg.chipsets.find((c) => c.alias === alias)?.label ?? alias;

  const CategoryIcon =
    model?.category === "Physical AI"
      ? Robot
      : model?.category === "Vision AI"
        ? Eye
        : AiBrain;

  const categoryHeaderClass =
    model?.category === "Physical AI"
      ? styles.headerPhysical
      : model?.category === "Vision AI"
        ? styles.headerVision
        : styles.headerGen;

  if (isIndex) {
    return <ModelsPage />;
  }

  if (isError) {
    return (
      <Layout
        title={slug}
        description={`AI model: ${slug}`}
        wrapperClassName={styles.layoutBackground}
      >
        <main className="container margin-vert--xl">
          <p className={styles.error}>Failed to load this model.</p>
          <ModelBreadcrumbs modelName={slug} />
        </main>
      </Layout>
    );
  }

  if (isLoading || !model) {
    return (
      <Layout
        title={slug}
        description={`AI model: ${slug}`}
        wrapperClassName={styles.layoutBackground}
      >
        <main className="container margin-vert--xl">
          <p>Loading...</p>
        </main>
      </Layout>
    );
  }

  return (
    <Layout
      title={slug}
      description={`AI model: ${slug}`}
      wrapperClassName={styles.layoutBackground}
    >
      <main
        className={clsx("container", "margin-vert--xl", styles.heroContent)}
      >
        <ModelBreadcrumbs modelName={model.name} />

        <div className={styles.content}>
          <div>
            <header className={styles.header}>
              <h1 className={styles.title}>{model.name}</h1>
              {model.subtitle && (
                <p className={styles.subtitle}>{model.subtitle}</p>
              )}
              <div className={styles.badges}>
                {model.primaryType && (
                  <span className={styles.badge}>{model.primaryType}</span>
                )}

                {model.secondaryTypes.map((type) => (
                  <span key={type} className={styles.badgeSecondary}>
                    {type}
                  </span>
                ))}

                {model.chipsets.map((type) => (
                  <ChipsetBadge key={type} label={chipsetLabel(type)} />
                ))}
              </div>
            </header>

            {model.keyNovelty && (
              <p className={styles.value}>{model.keyNovelty}</p>
            )}

            {model.description && (
              <div className={styles.description}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {model.description}
                </ReactMarkdown>
              </div>
            )}
          </div>

          <div className={styles.imageColumn}>
            {model.hasCustomImage ? (
              <img
                src={model.thumbnail}
                className={styles.taskImage}
                alt={`${model.name} task illustration`}
              />
            ) : (
              <div
                className={clsx(styles.abstractHeader, categoryHeaderClass)}
              >
                <img
                  src={roboticsCharm}
                  alt=""
                  className={styles.ghostCharm}
                  aria-hidden="true"
                />
                {model.architecture && (
                  <span className={styles.archWatermark} aria-hidden="true">
                    {model.architecture}
                  </span>
                )}
                <div className={styles.iconWatermark} aria-hidden="true">
                  <CategoryIcon />
                </div>
              </div>
            )}
          </div>
        </div>

        <ModelDetailsTabs model={model} />

        <Divider />

        <ModelLinks model={model} />

        <Divider />

        <TechnicalDetails model={model} />

        {relatedLocal.length > 0 && (
          <>
            <h2 className={styles.relatedModelsTitle}>Related models</h2>

            <div className={styles.relatedModels}>
              {relatedLocal.map((slug) => (
                <RelatedModelCard slug={slug} key={slug} />
              ))}
            </div>

            <Link
              label="Explore more AI models"
              href={allModelsHref}
              className={styles.exploreMoreLink}
            />
          </>
        )}
      </main>
    </Layout>
  );
}
