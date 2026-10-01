import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { type Model } from "@site/src/data/models/api";
import { useHfConfig } from "@site/src/data/models/useHfConfig";
import clsx from "clsx";
import React from "react";
import AiBrain from "../../../static/img/icon/ai-brain.svg";
import Eye from "../../../static/img/icon/eye.svg";
import Robot from "../../../static/img/icon/robot.svg";
import roboticsCharm from "../../../static/img/robotics-charm.png";
import { ChipsetBadge } from "../ChipsetBadge";
import { LoadingImage } from "../LoadingImage";
import styles from "./styles.module.css";

type TagStyle = { color: string; border: string };

// Colour palette for model type badges. Unknown types fall back to DEFAULT_TAG.
const TAG_STYLES: Record<string, TagStyle> = {
  "Vision-Language": {
    color: "#6ddcff",
    border: "rgba(109, 220, 255, 0.4)",
  },
  "Text Generation": {
    color: "#ffd700",
    border: "rgba(255, 217, 0, 0.4)",
  },
  "Object Detection": {
    color: "#00f2ff",
    border: "rgba(0, 242, 255, 0.4)",
  },
  "Image Segmentation": {
    color: "#c084fc",
    border: "rgba(192, 132, 252, 0.4)",
  },
  "Image Classification": {
    color: "#38bdf8",
    border: "rgba(56, 189, 248, 0.4)",
  },
  "Speech Recognition": {
    color: "#fb923c",
    border: "rgba(251, 146, 60, 0.4)",
  },
  "Image Generation": {
    color: "#f472b6",
    border: "rgba(244, 114, 182, 0.4)",
  },
  "Robotics & VLA": {
    color: "#4ade80",
    border: "rgba(74, 222, 128, 0.4)",
  },
  "Feature Extraction": {
    color: "#94a3b8",
    border: "rgba(148, 163, 184, 0.4)",
  },
  "Text-to-Speech": {
    color: "#f97316",
    border: "rgba(249, 115, 22, 0.4)",
  },
  INT4: {
    color: "#c8f000",
    border: "rgba(200, 240, 0, 0.4)",
  },
  INT8: {
    color: "#60a5fa",
    border: "rgba(96, 165, 250, 0.4)",
  },
  FP16: {
    color: "#a78bfa",
    border: "rgba(167, 139, 250, 0.4)",
  },
  BF16: {
    color: "#f43f5e",
    border: "rgba(244, 63, 94, 0.4)",
  },
  W8A16: {
    color: "#2dd4bf",
    border: "rgba(45, 212, 191, 0.4)",
  },
  "Encoder/Decoder": {
    color: "rgba(128,198,255,0.87)",
    border: "rgba(128,198,255,0.25)",
  },
  ViT: { color: "rgba(165,116,205,0.87)", border: "rgba(165,116,205,0.25)" },
  "Diffusion Head": {
    color: "rgba(0,242,255,0.87)",
    border: "rgba(0,242,255,0.25)",
  },
  "Large Language Model": {
    color: "rgba(255,217,0,0.87)",
    border: "rgba(255,217,0,0.25)",
  },
  "Vision Language Action": {
    color: "rgba(255,128,131,0.87)",
    border: "rgba(255,128,131,0.25)",
  },
  Robotics: {
    color: "rgba(255,144,0,0.87)",
    border: "rgba(255,144,0,0.25)",
  },
};

const DEFAULT_TAG: TagStyle = {
  color: "rgba(227,227,229,0.87)",
  border: "rgba(227,227,229,0.25)",
};

const TagBadge = ({ label }: { label: string }) => {
  const tag = TAG_STYLES[label] ?? DEFAULT_TAG;
  return (
    <span
      className={styles.tagBadge}
      style={{ color: tag.color, border: `1px solid ${tag.border}` }}
    >
      {label}
    </span>
  );
};

type ModelCardItemProps = {
  model: Model;
  className?: string;
};

export const ModelCardItem = ({
  model,
  className = "",
}: ModelCardItemProps) => {
  const cfg = useHfConfig();
  const modelHref = useBaseUrl(`/models/${model.slug}`);

  const chipsetLabel = (alias: string) =>
    cfg.chipsets.find((c) => c.alias === alias)?.label ?? alias;

  const modelTags = [model.primaryType, ...model.secondaryTypes].filter(
    (t): t is string => Boolean(t),
  );

  const CategoryIcon =
    model.category === "Physical AI"
      ? Robot
      : model.category === "Vision AI"
        ? Eye
        : AiBrain;

  const categoryHeaderClass =
    model.category === "Physical AI"
      ? styles.headerPhysical
      : model.category === "Vision AI"
        ? styles.headerVision
        : styles.headerGen;

  return (
    <Link to={modelHref} className={`${styles.card} ${className}`}>
      <div className={styles.cardImageWrap}>
        {model.hasCustomImage ? (
          <LoadingImage
            name={model.name}
            src={model.thumbnail}
            className={styles.cardImage}
          />
        ) : (
          <div className={clsx(styles.abstractHeader, categoryHeaderClass)}>
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
        <div className={styles.cardTags}>
          {modelTags.map((label) => (
            <TagBadge key={label} label={label} />
          ))}
        </div>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{model.name}</h3>
        <p className={styles.cardDesc}>
          {model.keyNovelty || model.description}
        </p>

        <div className={styles.tags}>
          {model.chipsets.map((type) => (
            <ChipsetBadge
              key={type}
              label={chipsetLabel(type)}
              className={styles.chipsetBadge}
            />
          ))}
        </div>
      </div>
    </Link>
  );
};
