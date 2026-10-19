import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig, type RspressPlugin } from '@rspress/core';
import { newestFirst } from './versions.ts';

const root = path.join(import.meta.dirname, 'docs');
const sharedPublicDir = path.join(import.meta.dirname, 'public');
const repo = 'https://github.com/thiagobrez/react-native-arrangement-view';
const site = 'https://thiagobrez.github.io/react-native-arrangement-view/';
const title = 'react-native-arrangement-view';
const description = 'Foldable layouts and hinge state for React Native.';

const versions = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort(newestFirst);

function releasedDocsVersion(folders: string[]) {
  const { version } = JSON.parse(
    fs.readFileSync(path.join(import.meta.dirname, '../package.json'), 'utf8')
  );
  const [major, minor] = version.split('.');
  const folder = `v${major}.${minor}`;
  if (!folders.includes(folder)) {
    throw new Error(
      `${version} is released, but docs/${folder}/ doesn't exist.`
    );
  }
  return folder;
}

const released = releasedDocsVersion(versions);

/** Routes don't include the base path. */
function pageUrl(routePath: string) {
  const file = routePath.endsWith('/') ? routePath : `${routePath}.html`;
  return new URL(file.slice(1), site).href;
}

function releasedVersionSitemap(): RspressPlugin {
  const urls = new Set<string>();

  return {
    name: 'sitemap',
    extendPageData(page, isProd) {
      if (isProd && page.version === released) {
        urls.add(pageUrl(page.routePath));
      }
    },
    afterBuild(_config, isProd) {
      if (!isProd) {
        return;
      }
      const entries = [...urls]
        .sort()
        .map((url) => `<url><loc>${url}</loc></url>`);
      fs.writeFileSync(
        path.join(import.meta.dirname, 'doc_build/sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`
      );
    },
  };
}

export default defineConfig({
  root,
  base: '/react-native-arrangement-view/',
  title,
  description,
  icon: pathToFileURL(path.join(sharedPublicDir, 'logo/logo.svg')).href,
  logo: '/logo/logo.svg',
  logoText: 'react-native-arrangement-view',
  // Link previews need absolute URLs, so these point at the deployed site.
  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: `${site}og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    (route) =>
      route.version === released
        ? ['link', { rel: 'canonical', href: pageUrl(route.routePath) }]
        : ['meta', { name: 'robots', content: 'noindex, follow' }],
    (route) =>
      route.version === released
        ? ['meta', { property: 'og:url', content: pageUrl(route.routePath) }]
        : undefined,
  ],
  llms: true,
  plugins: [releasedVersionSitemap()],
  globalStyles: path.join(import.meta.dirname, 'styles/index.css'),
  multiVersion: { default: released, versions },
  builderConfig: {
    server: {
      publicDir: { name: sharedPublicDir },
    },
  },
  themeConfig: {
    socialLinks: [{ icon: 'github', mode: 'link', content: repo }],
    editLink: {
      docRepoBaseUrl: `${repo}/tree/main/docs/docs`,
    },
  },
});
