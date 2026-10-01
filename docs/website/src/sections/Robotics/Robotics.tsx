import { Section } from "../../components/Section";
import { DeveloperKit } from "./DeveloperKit/DeveloperKit";
import styles from "./Robotics.module.css";
import { SoftwareStack } from "./SoftwareStack/SoftwareStack";

export const Robotics = () => {
  return (
    <Section className={styles.container}>
      <div className={styles.content}>
        <DeveloperKit className={styles.developerKit} />
        <SoftwareStack className={styles.softwareStack} />
      </div>
    </Section>
  );
};
