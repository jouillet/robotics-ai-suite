import clsx from "clsx";
import PhysicalAIFlowLabel from "../../../static/img/ai-toolkit/physical-ai-flow-label.png";
import PhysicalAIFlow from "../../../static/img/ai-toolkit/physical-ai-flow.png";
import AnomalibStudio from "../../../static/img/icon/anomalib-studio.png";
import DLStreamer from "../../../static/img/icon/dl-streamer.png";
import GenAI from "../../../static/img/icon/gen-ai.png";
import Geti from "../../../static/img/icon/geti.png";
import LLaMAC from "../../../static/img/icon/llamac.png";
import LLM from "../../../static/img/icon/llm.png";
import OpenVINO from "../../../static/img/icon/openvino.png";
import PhysicalAIFramework from "../../../static/img/icon/physical-ai-framework.png";
import PhysicalAIStudio from "../../../static/img/icon/physical-ai-studio.png";
import PhysicalAI from "../../../static/img/icon/physical-ai.png";
import SGL from "../../../static/img/icon/sgl.png";
import Ultralytics from "../../../static/img/icon/ultralytics.png";
import VisionAI from "../../../static/img/icon/vision-ai.png";

import { Section } from "../../components/Section";
import { sectionIds } from "../Robotics/util";
import styles from "./AiToolKits.module.css";
import { InfoCard } from "./InfoCard/InfoCard";

export const AiToolKits = () => {
  return (
    <Section className={styles.container} id={sectionIds.aiToolkits}>
      <Section.Title>AI Toolkits</Section.Title>

      <Section.Description>
        Ready to build your own robotics application? Accelerate development
        with open-source AI frameworks and tools, from ready-to-use building
        blocks for perception and reasoning to end-to-end perception-to-action
        pipelines, all optimised for Intel edge hardware.
      </Section.Description>

      <div className={styles.grid}>
        <div className={styles.primaryPanel}>
          <InfoCard
            title="Physical AI"
            link="/development-stack/ai_resources/physical-ai/index.html"
            description="Perception to action for robot tasks"
            imageSrc={PhysicalAI}
            logos={[PhysicalAIFramework, PhysicalAIStudio, OpenVINO]}
            listItems={[
              "Runs a closed loop that turns camera and robot state observations into actions at runtime.",
              "Enables learned manipulation and task execution on real hardware.",
            ]}
          />

          <div className={styles.flowContainer}>
            <img src={PhysicalAIFlow} alt="Physical AI Flow" />
            <img
              className={styles.flowLabel}
              src={PhysicalAIFlowLabel}
              alt="Physical AI Flow Label"
            />
          </div>
        </div>

        <div className={clsx(styles.secondaryPanel, styles.column1)}>
          <InfoCard
            title="Vision AI"
            link="/development-stack/ai_resources/vision-ai/index.html"
            description="Perception for robot autonomy"
            imageSrc={VisionAI}
            logos={[AnomalibStudio, Geti, DLStreamer, Ultralytics]}
            listItems={[
              "Runs detection, segmentation, tracking, and anomaly pipelines on edge compute.",
              "Enables object localization, free space understanding, obstacle awareness, and visual quality inspection for robot decisions.",
            ]}
          />
        </div>

        <div className={clsx(styles.secondaryPanel, styles.column2)}>
          <InfoCard
            title="Gen AI"
            link="/development-stack/ai_resources/gen-ai/index.html"
            description="Reasoning and coordination for robot execution"
            imageSrc={GenAI}
            logos={[LLM, OpenVINO, SGL, LLaMAC]}
            listItems={[
              "Run local language model pipelines for command understanding and planning.",
              "Enables instruction to action decomposition, task sequencing, and tool or API orchestration.",
            ]}
          />
        </div>
      </div>
    </Section>
  );
};
