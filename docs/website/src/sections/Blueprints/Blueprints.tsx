import { Section } from "../../components/Section";
import { sectionIds } from "../Robotics/util";
import { BlueprintCard } from "./BlueprintCard";
import AutonomousMobileRobot from "../../../static/img/blueprints/autonomous-mobile-robot.png";
import StationaryRobotVisionControl from "../../../static/img/blueprints/stationary-robot.png";
import HumanoidRobots from "../../../static/img/blueprints/humanoid-robots.png";
import styles from "./Blueprints.module.css";

const base = "/development-stack/hardware_blueprints";
export const Blueprints = () => {
  const amrDocsHref = `${base}/amr/index.html`;
  const stationaryArmDocsHref = `${base}/stationary_arm/index.html`;
  const humanoidDocsHref = `${base}/humanoid/index.html`;

  return (
    <Section className={styles.container} id={sectionIds.blueprints}>
      <Section.Title>Blueprints</Section.Title>
      <Section.Subtitle>
        Explore real-world reference implementation
      </Section.Subtitle>

      <Section.Description>
        Kick-start your robotics journey with specialized reference
        applications. Built on Intel’s robotics expertise, these reference apps
        help developers design, test, and deploy real-time autonomous systems on
        Intel silicon - scaling from ARM-based platforms to cobots and humanoid
        robots.
      </Section.Description>

      <div className={styles.cards}>
        <BlueprintCard
          icon={AutonomousMobileRobot}
          href={amrDocsHref}
          title="Autonomous Mobile Robot"
          description="Autonomously navigate AMRs in industrial environments using real-time SLAM and open-source AI models."
        />
        <BlueprintCard
          icon={StationaryRobotVisionControl}
          href={stationaryArmDocsHref}
          title="Stationary Robot"
          description="Run real-time control, perception, and AI on Intel with advanced 3D vision and depth sensing."
        />
        <BlueprintCard
          icon={HumanoidRobots}
          href={humanoidDocsHref}
          title="Humanoid Robot"
          imageClassName={styles.humanoidIcon}
          description="Enable natural robot interaction via voice and text using LLMs and Vision AI to generate actions and accelerate task planning."
        />
      </div>
    </Section>
  );
};
