import { Cpu, Handshake, CircuitBoard } from "lucide-react";
import { Section } from "../../components/Section";
import styles from "./RoboticsEcosystem.module.css";

const resources = [
  {
    title: "Intel Robotics",
    description: "See how Intel enables intelligent robotics solutions",
    href: "https://www.intel.com/robotics",
    icon: Cpu,
  },
  {
    title: "Open Edge Platform",
    description: "Discover the modular AI software stack behind the Robotics AI Suite",
    href: "https://builders.intel.com/intel-technologies/software/edge-ai-suites",
    icon: CircuitBoard,
  },
  {
    title: "Edge AI Systems",
    description: "Explore validated edge AI systems to scale robotics deployments",
    href: "https://builders.intel.com/communities/robotics/scale#hardware",
    icon: Handshake,
  },
];

export const RoboticsEcosystem = () => (
  <Section className={styles.container} id="robotics-ecosystem">
    <Section.Title>Explore the Intel Robotics Ecosystem</Section.Title>
    <div className={styles.resources}>
      {resources.map(({ title, description, href, icon: Icon }) => (
        <a className={styles.resource} href={href} key={title}>
          <Icon className={styles.icon} aria-hidden="true" />
          <h3>{title}</h3>
          <p>{description}</p>
        </a>
      ))}
    </div>
  </Section>
);
