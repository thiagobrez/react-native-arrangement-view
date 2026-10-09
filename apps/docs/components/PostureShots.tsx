import { withBase } from '@rspress/core/runtime';
import styles from './Comparison.module.css';

const platforms = [
  { dir: 'ios', label: 'iOS' },
  { dir: 'android', label: 'Android' },
];

type Props = {
  /** A folder in the repository's docs/ directory. */
  dir: string;
  postures: { file: string; label: string }[];
};

/** The iOS and Android screenshots of an example in each posture. */
export function PostureShots({ dir, postures }: Props) {
  return (
    <div className={styles.grid}>
      {postures.map((posture) => (
        <figure key={posture.file} className={styles.row}>
          <figcaption className={styles.caption}>{posture.label}</figcaption>
          {platforms.map((platform) => (
            <div key={platform.dir} className={styles.shot}>
              <img
                src={withBase(`/${dir}/${platform.dir}-${posture.file}.jpg`)}
                alt={`${platform.label}, ${posture.label.toLowerCase()}`}
                loading="lazy"
              />
              <span className={styles.platform}>{platform.label}</span>
            </div>
          ))}
        </figure>
      ))}
    </div>
  );
}
