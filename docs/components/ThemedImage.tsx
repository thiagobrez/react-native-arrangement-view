import { withBase } from '@rspress/core/runtime';
import styles from './ThemedImage.module.css';

type Props = {
  /** A path in public/, without the -light.png or -dark.png ending. */
  src: string;
  alt: string;
  width: number;
  height: number;
};

/** An image drawn once for the light theme and once for the dark one. */
export function ThemedImage({ src, alt, width, height }: Props) {
  return (
    <>
      <img
        className={styles.light}
        src={withBase(`/${src}-light.png`)}
        alt={alt}
        width={width}
        height={height}
      />
      <img
        className={styles.dark}
        src={withBase(`/${src}-dark.png`)}
        alt={alt}
        width={width}
        height={height}
      />
    </>
  );
}
