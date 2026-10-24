import { getHostComponent, NitroModules } from 'react-native-nitro-modules';
import NitroPaneHostConfig from '../nitrogen/generated/shared/json/NitroPaneHostConfig.json';
import type { Hinge } from './specs/Hinge.nitro';
import type {
  NitroPaneHostProps,
  NitroPaneHost as NitroPaneHostSpec,
} from './specs/NitroPaneHost.nitro';

export type { HingeSample } from './specs/Hinge.nitro';

let hinge: Hinge | undefined;
export function getHinge(): Hinge {
  hinge ??= NitroModules.createHybridObject<Hinge>('Hinge');
  return hinge;
}

export const NitroPaneHost = getHostComponent<
  NitroPaneHostProps,
  Pick<NitroPaneHostSpec, never>
>('NitroPaneHost', () => NitroPaneHostConfig);
