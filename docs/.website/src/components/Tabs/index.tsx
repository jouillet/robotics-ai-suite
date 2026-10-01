import clsx from "clsx";
import React, { useState, Children, isValidElement, ReactElement } from "react";
import styles from "./styles.module.css";

type TabProps = {
  title: string;
  id?: string;
  children: React.ReactNode;
};

export const Tab = ({ children }: TabProps) => {
  return <>{children}</>;
};

type TabsProps = {
  className?: string;
  initialActiveIndex?: number;
  initialActiveTabId?: string;
  onTabChange?: (tabId: string, index: number) => void;
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const Tabs = ({
  className,
  children,
  initialActiveIndex = 0,
  initialActiveTabId,
  onTabChange,
}: TabsProps) => {
  const tabs = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<TabProps>[];

  const getTabKey = (tab: ReactElement<TabProps>, index: number) => {
    if (tab.props.id) {
      return tab.props.id;
    }

    const fromTitle = slugify(tab.props.title);
    return fromTitle || String(index);
  };

  const [activeIndex, setActiveIndex] = useState(() => {
    if (initialActiveTabId) {
      const indexFromId = tabs.findIndex(
        (tab, index) => getTabKey(tab, index) === initialActiveTabId,
      );

      if (indexFromId >= 0) {
        return indexFromId;
      }
    }

    if (initialActiveIndex >= 0 && initialActiveIndex < tabs.length) {
      return initialActiveIndex;
    }

    return 0;
  });

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
    const tab = tabs[index];

    if (tab) {
      onTabChange?.(getTabKey(tab, index), index);
    }
  };

  return (
    <div className={className}>
      <ul className="tabs">
        {tabs.map((tab, index) => (
          <li
            key={index}
            className={clsx(styles.tabsItem, "tabs__item", {
              [styles.activeItem]: index === activeIndex,
              "tabs__item--active": index === activeIndex,
            })}
            onClick={() => handleTabClick(index)}
          >
            {tab.props.title}
          </li>
        ))}
      </ul>
      <div className={clsx(styles.tabsContent, "tabs__content")}>
        {tabs[activeIndex]?.props.children}
      </div>
    </div>
  );
};
