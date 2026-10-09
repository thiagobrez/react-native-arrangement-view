import { withBase } from '@rspress/core/runtime';
import styles from './Comparison.module.css';

const allPlatforms = [
  { dir: 'ios', label: 'iOS' },
  { dir: 'android', label: 'Android' },
] as const;

type Platform = (typeof allPlatforms)[number]['dir'];

type Props = {
  /** A folder in the repository's docs/ directory. */
  dir: string;
  postures: { file: string; label: string }[];
  /** For an example that runs on one platform only. Default both. */
  platforms?: Platform[];
};

/** The iOS and Android screenshots of an example in each posture. */
export function PostureShots({
  dir,
  postures,
  platforms = ['ios', 'android'],
}: Props) {
  const shown = allPlatforms.filter((platform) =>
    platforms.includes(platform.dir)
  );
  return (
    <div className={styles.grid}>
      {postures.map((posture) => (
        <figure
          key={posture.file}
          className={shown.length === 1 ? styles.single : styles.row}
        >
          <figcaption className={styles.caption}>{posture.label}</figcaption>
          {shown.map((platform) => (
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
