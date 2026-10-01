import CopyIcon from "../../../static/img/icon/copy.svg";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard.hook";
import styles from "./styles.module.css";

const npmInstallCommand = "npx skills add intel/skills";

export const NpmContent = () => {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <p className={styles.title}>Get started</p>

        <div className={styles.gradientContainer}>
          $ {npmInstallCommand}
          <button
            className={styles.copyButton}
            onClick={() => copy(npmInstallCommand)}
          >
            {copied ? "✓" : <CopyIcon />}
          </button>
        </div>
      </div>
    </div>
  );
};
