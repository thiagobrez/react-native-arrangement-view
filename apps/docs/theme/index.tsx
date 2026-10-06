import { useSite, useVersion } from '@rspress/core/runtime';
import { Layout as BaseLayout, Link } from '@rspress/core/theme-original';
import styles from './index.module.css';

/** Tells readers of an older version's pages where the latest docs are. */
function OutdatedVersionBanner() {
  const { site } = useSite();
  const version = useVersion();
  const latest = site.multiVersion.default;

  if (!version || version === latest) {
    return null;
  }

  return (
    <div className={styles.banner}>
      You're reading the docs for {version}, an older version.{' '}
      <Link href="/">Go to the latest version, {latest}.</Link>
    </div>
  );
}

function Layout() {
  return <BaseLayout beforeDocContent={<OutdatedVersionBanner />} />;
}

export { Layout };
export * from '@rspress/core/theme-original';
