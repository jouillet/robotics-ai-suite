import Layout from "@theme/Layout";
import { SuiteHero } from "@site/src/components/SuiteHero";
import { NpmContent } from "../../components/Skills/NpmContent";
import SkillCatalog from "../../components/Skills/SkillCatalog";
import styles from "./index.module.css";
import clsx from "clsx";

export default function Skills() {
  return (
    <Layout
      title="AI Skills"
      description="AI skills for the Robotics AI Suite."
    >
      <SuiteHero>
        <div className={clsx(styles.heroContent, "container")}>
          <h1 className={styles.title}>AI Skills</h1>
          <p className={styles.subtitle}>
            Skills for the Robotics AI Suite to power AI agents and workflows. Each skill maps to a
            section of the documentation that involves writing code or a task a
            coding agent can carry out for you — configuring the OS, bringing up
            sensors and motion buses, wiring middleware, and running models.
          </p>
        </div>
      </SuiteHero>
      <NpmContent />

      <main className={styles.main}>
        <SkillCatalog />
      </main>
    </Layout>
  );
}
