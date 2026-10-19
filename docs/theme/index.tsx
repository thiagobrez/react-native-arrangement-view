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
import { newestFirst } from '../versions';
import styles from './index.module.css';

function VersionBanner() {
  const { site } = useSite();
  const version = useVersion();
  const released = site.multiVersion.default;

  if (!version || version === released) {
    return null;
  }

  const unreleased = newestFirst(version, released) < 0;
  return (
    <div className={styles.banner}>
      You're reading the docs for {version},{' '}
      {unreleased ? "which isn't released yet." : 'an older version.'}{' '}
      <Link href="/">Go to the latest version, {released}.</Link>
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
