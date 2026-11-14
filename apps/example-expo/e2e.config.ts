import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';
import { explorer } from './qa/explorer.ts';

const app = { bundleId: 'arrangementview.example' };
const ios = mobile({ platform: 'ios', device: 'iPhone Duo' });
const android = mobile({ platform: 'android' });

export default {
  tests: 'e2e/**/*.e2e.ts',
  targets: [
    { name: 'ios', engine: ios, app },
    { name: 'android', engine: android, app },
  ],
  agents: { explorer: explorer(ios, android) },
  workers: 1,
} satisfies E2EConfig;
