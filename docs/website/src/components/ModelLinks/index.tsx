import Link from "@docusaurus/Link";
import { type Model } from "@site/src/data/models/api";
import styles from "./styles.module.css";
import External from "../../../static/img/icon/external.svg";
import GithubGray from "../../../static/img/icon/github-gray.png";
import HuggingFace from "../../../static/img/icon/hugging-face.png";
import Paper from "../../../static/img/icon/paper.png";

type ModelLinksProps = {
  model: Model;
};

type LinkItem = {
  label: string;
  icon: string;
  href: string;
};

export const ModelLinks = ({ model }: ModelLinksProps) => {
  const links = [
    { label: "Hugging Face", icon: HuggingFace, href: model.links.huggingface },
    { label: "GitHub", icon: GithubGray, href: model.links.github },
    { label: "Paper", icon: Paper, href: model.links.paper },
  ].filter((link): link is LinkItem => Boolean(link.href));

  if (links.length === 0) {
    return null;
  }

  return (
    <div className={styles.links}>
      {links.map((link) => (
        <Link
          key={link.label}
          className={styles.linkButton}
          to={link.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={link.icon} alt={link.label} className={styles.linkIcon} />
          {link.label}

          <External className={styles.externalIcon} aria-hidden="true" />

          <span className={styles.srOnly}> (opens in a new tab)</span>
        </Link>
      ))}
    </div>
  );
};
