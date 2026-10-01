import motherBoard from "../../../../static/img/mother-board.png";
import DottedCardDetails from "../../../components/DottedCardDetails";
import Link from "../../../components/Link";
import styles from "./DeveloperKit.module.css";

type DeveloperKitProps = {
  className: string;
};

export const DeveloperKit = ({ className }: DeveloperKitProps) => {
  const docsHref = "/development-stack/platform_foundation/development_kits/index.html";

  return (
    <div className={className}>
      <h3>
        Robotics <br />
        <span>Development Kit</span>
      </h3>

      <p className={styles.description}>
        Edge computing platforms for running complete robotics stacks, from ROS2
        and AI to perception, navigation, and real-time control.
      </p>

      <div className={styles.mapContent}>
        <div className={styles.cards}>
          <DottedCardDetails
            title="Single Intel SoC"
            readModeLink="/"
            className={styles.dottedCard}
          >
            Intel IPU + Intel® Arc™ graphics + Intel NPU + CPU for nextgen robotics
          </DottedCardDetails>

          <DottedCardDetails
            title="Robotics IO Ready"
            readModeLink="/"
            className={styles.dottedCard}
          >
            CAN-FD EtherCAT-capable 2.5GbE, MIPI-CSI-2 8× GMSL inputs
          </DottedCardDetails>

          <DottedCardDetails
            title="Edge Friendly"
            readModeLink="/"
            className={styles.dottedCard}
          >
            One platform for vision, AI, and control
          </DottedCardDetails>
        </div>

        <img
          className={styles.motherBoard}
          src={motherBoard}
          alt="Mother Board"
        />
      </div>

      <Link
        label="See all developer kits"
        href={docsHref}
        className={styles.link}
      />
    </div>
  );
};
