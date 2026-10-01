import clsx from "clsx";
import React from "react";
import styles from "./styles.module.css";

type SuiteHeroProps = {
  className?: string;
  children: React.ReactNode;
};

export const SuiteHero = ({ className, children }: SuiteHeroProps) => {
  return (
    <section className={clsx(styles.suiteHero, className)}>{children}</section>
  );
};
