import { SuiteHero } from "@site/src/components/SuiteHero";
import { Tab, Tabs } from "@site/src/components/Tabs";
import Layout from "@theme/Layout";
import clsx from "clsx";
import React from "react";
import { AllModelsTab } from "./_tabs/AllModelsTab";
// import { BenchmarksTab } from "./_tabs/BenchmarksTab";
import styles from "./index.module.css";
import { useUrlQueryParam } from "@site/src/hooks/useUrlQueryParam.hook";
import { FiltersSidebarLayout } from "./_FiltersSidebarLayout/FiltersSidebarLayout";
import { useHfConfig } from "@site/src/data/models/useHfConfig";

export default function Models(): React.JSX.Element {
  const cfg = useHfConfig();

  const { value: initialActiveTabId, setValue: setTabInUrl } =
    useUrlQueryParam("tab");

  const handleTabChange = (tabId: string) => {
    setTabInUrl(tabId);
  };

  return (
    <Layout
      title="AI Models"
      description="AI models for the Robotics AI Suite."
    >
      <div className={styles.page}>
        <SuiteHero>
          <div className={clsx(styles.heroContent, "container")}>
            <h1 className={styles.heroTitle}>AI Models</h1>
            <p className={styles.heroText}>
              Build with PyTorch, Physical AI Studio, or your tooling of
              choice—then deploy with OpenVINO™ across Intel CPUs, GPUs, and
              NPUs. Browse the catalog below for models available on Hugging
              Face, pre-optimized and ready for fine-tuning or edge deployment.
            </p>
          </div>
        </SuiteHero>

        <main className={styles.main}>
          <div className={clsx(styles.container, "container")}>
            <Tabs
              className={styles.tabs}
              initialActiveTabId={initialActiveTabId}
              onTabChange={handleTabChange}
            >
              <Tab title="All Models">
                <FiltersSidebarLayout cfg={cfg}>
                  <AllModelsTab />
                </FiltersSidebarLayout>
              </Tab>
              {/* <Tab title="Benchmarks">
                <FiltersSidebarLayout cfg={cfg}>
                  <BenchmarksTab />
                </FiltersSidebarLayout>
              </Tab> */}
            </Tabs>
          </div>
        </main>
      </div>
    </Layout>
  );
}
