import CopyIcon from "../../../../../static/img/icon/copy.svg";
import type { Skill } from "../../../../data/skills";
import { useCopyToClipboard } from "../../../../hooks/useCopyToClipboard.hook";
import styles from "./styles.module.css";

export const SkillCard = ({ skill }: { skill: Skill }) => {
  const installCommand =
    skill.installCommand || `npx skills add intel/skills --skill ${skill.id}`;
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className={styles.item}>
      <h3 className={styles.name}>
        {skill.sourceUrl ? (
          <a
            href={skill.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.nameLink}
            title={`View source for ${skill.name} on GitHub`}
          >
            {skill.name}
          </a>
        ) : (
          skill.name
        )}
      </h3>
      <p className={styles.description}>{skill.summary || skill.description}</p>

      <div className={styles.footer}>
        <div className={styles.tags}>
          {skill.labels.map((label) => (
            <span key={label} className={styles.badge}>
              {label}
            </span>
          ))}
        </div>

        <button
          className={styles.copyButton}
          onClick={() => copy(installCommand)}
          title={`Copy install command: ${installCommand}`}
        >
          {copied ? (
            "✓ Copied"
          ) : (
            <>
              <CopyIcon /> Use Skill
            </>
          )}
        </button>
      </div>
    </div>
  );
};

{
  /*       <div className={clsx("card__footer", styles.footer)}>
        <button
          type="button"
          className={styles.copyButton}
          onClick={copyInstallCommand}
          aria-live="polite"
          aria-label={
            copied
              ? `Install command copied for ${skill.name}`
              : `Copy install command for ${skill.name}`
          }
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div> */
}
