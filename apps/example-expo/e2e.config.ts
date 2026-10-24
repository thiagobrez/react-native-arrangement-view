import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';

const app = { bundleId: 'arrangementview.example' };

export default {
  tests: 'e2e/**/*.e2e.ts',
  targets: [
    {
      name: 'ios',
      engine: mobile({ platform: 'ios', device: 'iPhone Duo' }),
      app,
    },
    { name: 'android', engine: mobile({ platform: 'android' }), app },
  ],
  workers: 1,
} satisfies E2EConfig;
