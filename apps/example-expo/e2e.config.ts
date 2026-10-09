import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';

// The tests open whatever is installed under the app's bundle id. Build and
// install it first; see the e2e section in CONTRIBUTING.md.
const app = { bundleId: 'arrangementview.example' };

export default {
  tests: 'e2e/**/*.e2e.ts',
  targets: [
    {
      name: 'ios',
      engine: mobile({ platform: 'ios', device: 'iPhone Duo' }),
      app,
    },
    // The booted emulator, a foldable one such as the Pixel 10 Pro Fold.
    { name: 'android', engine: mobile({ platform: 'android' }), app },
  ],
  // Folding the iPhone Duo takes 10 to 16 seconds.
  actionTimeout: 30_000,
  workers: 1,
} satisfies E2EConfig;
