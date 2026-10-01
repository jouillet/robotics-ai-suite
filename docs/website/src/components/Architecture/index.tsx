import { useEffect, useState } from "react";
import { type Model } from "@site/src/data/models/api";
import styles from "./styles.module.css";

type ArchitectureProps = {
  model: Model;
};

const useBodyScrollLock = (isLocked: boolean): void => {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
};

export const Architecture = ({ model }: ArchitectureProps) => {
  const [detailed, setDetailed] = useState(false);
  const [zoomed, setZoomed] = useState<string | null>(null);

  useBodyScrollLock(Boolean(zoomed));

  const onZoom = (src: string): void => setZoomed(src);

  if (!model.overviewSvg) {
    return <p className={styles.empty}>No architecture diagram available.</p>;
  }

  const src =
    detailed && model.detailedSvg ? model.detailedSvg : model.overviewSvg;

  const alt = `${model.name} ${detailed ? "detailed" : ""} architecture diagram`;

  return (
    <>
      {model.hasDiagrams ? (
        <div className={styles.toggle} role="group" aria-label="Diagram detail">
          <button
            type="button"
            aria-label="Simple architecture diagram"
            aria-pressed={!detailed}
            onClick={() => setDetailed(false)}
          >
            Simple
          </button>
          <button
            type="button"
            aria-label="Detailed architecture diagram"
            aria-pressed={detailed}
            onClick={() => setDetailed(true)}
          >
            Detailed
          </button>
        </div>
      ) : null}

      <div className={styles.diagramFrame}>
        <img
          src={src}
          alt={alt}
          className={styles.diagram}
          onClick={() => onZoom(src)}
        />
      </div>

      {zoomed ? (
        <div
          role="dialog"
          aria-label={alt}
          className={styles.lightbox}
          onClick={() => setZoomed(null)}
        >
          <img className={styles.lightboxImage} src={zoomed} alt={alt} />
        </div>
      ) : null}
    </>
  );
};
