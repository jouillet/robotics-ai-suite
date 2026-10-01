import { Section } from "../../components/Section";
import { Tabs, Tab } from "../../components/Tabs";
import { sectionIds } from "../Robotics/util";
import { Gmsl } from "./Gmsl/Gmsl";
import { Usb } from "./Usb/Usb";
import styles from "./RobotPerception.module.css";

export const RobotPerception = () => {
  return (
    <Section className={styles.container} id={sectionIds.perception}>
      <Section.Title>Robot Perception</Section.Title>

      <Section.Description>
        Cameras and sensors enable robots to see and understand their
        environment, supporting perception, navigation, inspection, and
        AI‑driven decision making.
      </Section.Description>

      <Tabs className={styles.tabs}>
        <Tab title="GMSL">
          <Gmsl />
        </Tab>
        <Tab title="USB">
          <Usb />
        </Tab>
      </Tabs>
    </Section>
  );
};
