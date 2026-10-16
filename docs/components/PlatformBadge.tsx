import styles from './PlatformBadge.module.css';

const labels = { ios: 'iOS only', android: 'Android only' } as const;

export type Platform = keyof typeof labels;

export function isPlatform(value: string): value is Platform {
  return value in labels;
}

/** A pill marking a feature or an example that only one platform has. */
export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className={`${styles.badge} ${styles[platform]}`}>
      {labels[platform]}
    </span>
  );
}
