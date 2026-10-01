import { Section } from "../../components/Section";
import styles from "./HardwareSystems.module.css";

export const HardwareSystems = (): React.JSX.Element => {
  return (
    <Section className={styles.container}>
      <Section.Title>Reference Hardware Systems</Section.Title>
      <Section.Description>
        Find the hardware that is fit-for-purpose for your edge use case. Browse
        Intel’s curated catalog of Edge AI systems and applications from leading
        ecosystem partners - designed to deliver real-time innovation,
        efficiency, and intelligence right to your business needs.
      </Section.Description>
    </Section>
  );
};
