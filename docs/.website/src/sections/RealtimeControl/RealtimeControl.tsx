import lockIcon from "../../../static/img/realtime-control/lock.png";
import timeIcon from "../../../static/img/realtime-control/time.png";
import { Section } from "../../components/Section";
import { sectionIds } from "../Robotics/util";
import styles from "./RealtimeControl.module.css";
import { RealtimeControlCard } from "./RealtimeControlCard";

export const RealtimeControl = () => {
  const securityHref = "/development-stack/components/security/index.html";
  const realTimeSetupHref =
    "/development-stack/components/realtime_determinism/index.html";

  return (
    <Section className={styles.container} id={sectionIds.realtimeControl}>
      <Section.Title>Trusted Robotics</Section.Title>

      <Section.Description>
        Deploy robotics workloads with deterministic control, functional safety,
        and end-to-end security.
      </Section.Description>

      <div className={styles.cards}>
        <RealtimeControlCard
          icon={timeIcon}
          title="Realtime Control"
          subtitle="Predictable control from sensors to actuators"
          className={styles.cardOne}
          description={[
            "Real-time Linux provides deterministic task scheduling.",
            "Dedicated CPU cores keep control loops separate from AI workloads.",
            "Intel® TCC reduces timing variation from cache, memory, and power management.",
            "PTP synchronization, EtherCAT, and CAN support coordinated sensing and robot control.",
          ]}
          href={realTimeSetupHref}
        />

        <RealtimeControlCard
          icon={lockIcon}
          title="Security"
          subtitle="Protection from boot to deployment"
          className={styles.cardOne}
          description={[
            "Secure Boot verifies the boot chain and prevents unauthorized software from loading.",
            "Signed kernel modules protect the operating system from untrusted extensions.",
            "Full-disk encryption protects models, configuration, and operational data at rest.",
            "OS hardening and security updates reduce the system’s exposed attack surface.",
          ]}
          href={securityHref}
        />
      </div>
    </Section>
  );
};
