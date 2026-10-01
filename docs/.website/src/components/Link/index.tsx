import styles from "./styles.module.css";
import useBaseUrl from "@docusaurus/useBaseUrl";

type LinkProps = {
  href: string;
  label: string;
  className?: string;
};

export const Link = ({ href, label, className }: LinkProps) => {
  const siteBaseUrl = useBaseUrl("/");
  const baseUrlHref = useBaseUrl(href);
  const isRootRelative = href.startsWith("/");
  const isAlreadyBaseUrlPrefixed =
    siteBaseUrl !== "/" && href.startsWith(siteBaseUrl);
  const resolvedHref =
    isRootRelative && !isAlreadyBaseUrlPrefixed ? baseUrlHref : href;

  return (
    <a className={`${styles.link} ${className ?? ""}`} href={resolvedHref}>
      {label}
    </a>
  );
};

export default Link;
