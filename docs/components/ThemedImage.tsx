import { withBase } from '@rspress/core/runtime';
import styles from './ThemedImage.module.css';

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

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
