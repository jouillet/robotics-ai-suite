import { ReactElement, ReactNode } from "react";
import styles from "./styles.module.css";

type SectionBaseProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  beforeContent?: ReactElement;
};

type SectionPartProps = {
  children: ReactNode;
};

type SectionComponent = (({ children }: SectionBaseProps) => ReactElement) & {
  Icon: ({ children }: SectionPartProps) => ReactElement;
  Title: ({ children }: SectionPartProps) => ReactElement;
  Subtitle: ({ children }: SectionPartProps) => ReactElement;
  Description: ({ children }: SectionPartProps) => ReactElement;
};

const SectionTitle = ({ children }: SectionPartProps) => {
  return <h2 className={styles.title}>{children}</h2>;
};

const SectionSubtitle = ({ children }: SectionPartProps) => {
  return <h3 className={styles.subtitle}>{children}</h3>;
};

const SectionDescription = ({ children }: SectionPartProps) => {
  return <p className={styles.description}>{children}</p>;
};

SectionTitle.displayName = "Section.Title";
SectionSubtitle.displayName = "Section.Subtitle";
SectionDescription.displayName = "Section.Description";

const SectionRoot = ({
  children,
  beforeContent,
  className,
  id,
}: SectionBaseProps) => {
  return (
    <section id={id} className={`${styles.section} ${className}`}>
      {beforeContent}
      <div className={styles.content}>{children}</div>
    </section>
  );
};

export const Section = SectionRoot as SectionComponent;

Section.Title = SectionTitle;
Section.Subtitle = SectionSubtitle;
Section.Description = SectionDescription;
