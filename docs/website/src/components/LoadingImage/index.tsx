import { useQuery } from "@tanstack/react-query";
import styles from "./styles.module.css";

type LoadingImageProps = {
  src: string;
  name: string;
  className?: string;
};

const loadImage = (src: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

export const LoadingImage = ({
  src,
  name,
  className = "",
}: LoadingImageProps) => {
  const { isFetching } = useQuery({
    queryKey: ["image-load", src],
    queryFn: () => loadImage(src),
    enabled: Boolean(src),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  return (
    <span className={styles.imageFrame}>
      {isFetching && (
        <span className={styles.spinnerWrap} aria-hidden="true">
          <span className={styles.spinner} />
        </span>
      )}
      <img
        src={src}
        alt={name}
        className={`${className} ${isFetching ? styles.imageHidden : ""}`.trim()}
      />
    </span>
  );
};
