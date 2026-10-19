import {
  normalizeImagePath,
  useFrontmatter,
  useSite,
  useVersion,
} from '@rspress/core/runtime';
import {
  HomeHero as BaseHomeHero,
  Layout as BaseLayout,
  Link,
  Tag as BaseTag,
  type HomeHeroProps,
} from '@rspress/core/theme-original';
import { FoldableLogo } from '../components/FoldableLogo/FoldableLogo';
import { isPlatform, PlatformBadge } from '../components/PlatformBadge';
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

function HomeHero(props: HomeHeroProps) {
  const { frontmatter } = useFrontmatter();
  const image = frontmatter.hero?.image;
  const src = typeof image?.src === 'string' ? image.src : image?.src?.light;

  return (
    <BaseHomeHero
      {...props}
      image={
        src && (
          <FoldableLogo src={normalizeImagePath(src)} alt={image?.alt ?? ''} />
        )
      }
    />
  );
}

function Tag({ tag }: { tag?: string }) {
  return tag && isPlatform(tag) ? (
    <PlatformBadge platform={tag} />
  ) : (
    <BaseTag tag={tag} />
  );
}

export { HomeHero, Layout, Tag };
export * from '@rspress/core/theme-original';
