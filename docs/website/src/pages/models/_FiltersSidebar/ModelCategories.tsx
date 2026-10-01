import React from "react";
import AiBrain from "../../../../static/img/icon/ai-brain.svg";
import ChevronDown from "../../../../static/img/icon/chevron-down.svg";
import Eye from "../../../../static/img/icon/eye.svg";
import Robot from "../../../../static/img/icon/robot.svg";
import CheckMark from "../../../../static/img/icon/check-mark.svg";
import styles from "./ModelCategories.module.css";
import { Domain } from "@site/src/data/models/api";

export type SubOption = {
  label: string;
  value: string;
};

export type Category = {
  value: string;
  label: string;
  icon: React.ReactNode;
  subOptions: SubOption[];
};

export type ModelCategoriesProps = {
  domains: Domain[];
  selectedDomain: string;
  selectedCategory: string | undefined;
  onToggle: (value: string | undefined) => void;
  onCategoryToggle: (category: string | undefined, domain?: string) => void;
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    value: "gen-ai",
    label: "Gen AI",
    icon: <AiBrain />,
    subOptions: [
      { label: "Text Generation", value: "text-generation" },
      { label: "Vision-Language", value: "image-text-to-text" },
      { label: "Speech Recognition", value: "automatic-speech-recognition" },
      { label: "Image Generation", value: "text-to-image" },
    ],
  },
  {
    value: "physical-ai",
    label: "Physical AI",
    icon: <Robot />,
    subOptions: [
      { label: "Robotics & VLA", value: "robotics" },
    ],
  },
  {
    value: "vision-ai",
    label: "Vision AI",
    icon: <Eye />,
    subOptions: [
      { label: "Object Detection", value: "object-detection" },
      { label: "Image Segmentation", value: "image-segmentation" },
      { label: "Image Classification", value: "image-classification" },
    ],
  },
];

export const ModelCategories = ({
  domains,
  selectedDomain,
  selectedCategory,
  onToggle,
  onCategoryToggle,
}: ModelCategoriesProps) => {
  const filteredCategories = DEFAULT_CATEGORIES.filter((category) =>
    domains.some((domain) => domain.tag === category.value),
  );

  const handleCategory = (category: Category) => {
    onToggle(selectedDomain === category.value ? undefined : category.value);
  };

  const handleSubOption = (category: Category, value: string) => {
    onCategoryToggle(
      value === selectedCategory ? undefined : value,
      category.value,
    );
  };

  return (
    <>
      <h3 className={styles.title}>AI Domain/Model Type</h3>
      <div className={styles.container}>
        {filteredCategories.map((category) => {
          const isOpen = selectedDomain === category.value;

          return (
            <div
              key={category.value}
              className={`${styles.item}${isOpen ? ` ${styles.itemOpen}` : ""}`}
            >
              <button
                type="button"
                className={styles.header}
                onClick={() => handleCategory(category)}
                aria-expanded={isOpen}
              >
                <span className={styles.headerLeft}>
                  <span className={styles.leadIcon}>
                    {isOpen ? <CheckMark /> : category.icon}
                  </span>
                  <span className={styles.label}>{category.label}</span>
                </span>
                <span
                  className={`${styles.chevron}${isOpen ? ` ${styles.chevronOpen}` : ""}`}
                >
                  <ChevronDown />
                </span>
              </button>

              <div
                className={`${styles.subOptionsWrapper}${isOpen ? ` ${styles.subOptionsWrapperOpen}` : ""}`}
              >
                <div className={styles.subOptionsInner}>
                  <div className={styles.subOptions}>
                    {category.subOptions.map((option) => {
                      const isSelected =
                        isOpen && selectedCategory === option.value;

                      return (
                        <button
                          key={option.value}
                          className={`${styles.subOption}${isSelected ? ` ${styles.subOptionSelected}` : ""}`}
                          onClick={() => handleSubOption(category, option.value)}
                        >
                          {isSelected && (
                            <span className={styles.subOptionCheck}>
                              <CheckMark />
                            </span>
                          )}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
