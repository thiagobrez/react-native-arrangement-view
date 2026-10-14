import { useSite, useVersion } from '@rspress/core/runtime';
import { Layout as BaseLayout, Link } from '@rspress/core/theme-original';
import styles from './index.module.css';

/**
 * Tells readers of another version's pages where the latest docs are. Versions
 * are listed newest first, so one before the default isn't released yet.
 */
function VersionBanner() {
  const { site } = useSite();
  const version = useVersion();
  const { default: latest, versions } = site.multiVersion;

  if (!version || version === latest) {
    return null;
  }

  const unreleased = versions.indexOf(version) < versions.indexOf(latest);
  return (
    <div className={styles.banner}>
      You're reading the docs for {version},{' '}
      {unreleased ? "which isn't released yet." : 'an older version.'}{' '}
      <Link href="/">Go to the latest version, {latest}.</Link>
    </div>
  );
}

function Layout() {
  return <BaseLayout beforeDocContent={<VersionBanner />} />;
}

export { Layout };
export * from '@rspress/core/theme-original';
