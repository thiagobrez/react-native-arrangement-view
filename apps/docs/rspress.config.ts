import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from '@rspress/core';

const assets = path.join(import.meta.dirname, '../../docs');
const repo = 'https://github.com/thiagobrez/react-native-arrangement-view';

export default defineConfig({
  root: path.join(import.meta.dirname, 'docs'),
  base: '/react-native-arrangement-view/',
  title: 'react-native-arrangement-view',
  description:
    'Foldable devices adaptive arrangement views and hinge observation for React Native.',
  icon: pathToFileURL(path.join(assets, 'logo/logo.svg')).href,
  logo: '/logo/logo.svg',
  logoText: 'react-native-arrangement-view',
  globalStyles: path.join(import.meta.dirname, 'styles/index.css'),
  multiVersion: {
    default: 'v0.2',
    versions: ['v0.2', 'v0.1'],
  },
  builderConfig: {
    server: {
      // Serve the logo and screenshots the README uses from the repository's
      // docs/ directory, so both read the same files.
      publicDir: { name: assets },
    },
  },
  themeConfig: {
    socialLinks: [{ icon: 'github', mode: 'link', content: repo }],
    editLink: {
      docRepoBaseUrl: `${repo}/tree/main/apps/docs/docs`,
    },
  },
});
