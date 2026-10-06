import { withBase } from '@rspress/core/runtime';
import styles from './Comparison.module.css';

const orientations = [
  { file: 'portrait', label: 'Portrait' },
  { file: 'landscape-right', label: 'Turned right' },
  { file: 'portrait-upside-down', label: 'Upside down' },
  { file: 'landscape-left', label: 'Turned left' },
];

const platforms = [
  { dir: 'ios', label: 'iOS' },
  { dir: 'android', label: 'Android' },
];

type Props = {
  arrangement: 'split' | 'overlay';
  posture: 'closed' | 'half' | 'flat';
};

/** The iOS and Android screenshots of one posture in every orientation. */
export function Comparison({ arrangement, posture }: Props) {
  return (
    <div className={styles.grid}>
      {orientations.map((orientation) => (
        <figure key={orientation.file} className={styles.row}>
          <figcaption className={styles.caption}>
            {orientation.label}
          </figcaption>
          {platforms.map((platform) => (
            <div key={platform.dir} className={styles.shot}>
              <img
                src={withBase(
                  `/comparison/${platform.dir}/${posture}-${orientation.file}-${arrangement}.jpg`
                )}
                alt={`${platform.label}, ${orientation.label.toLowerCase()}, ${arrangement}`}
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
