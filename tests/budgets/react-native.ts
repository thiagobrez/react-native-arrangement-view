import { createElement, useEffect, useRef, type ReactNode } from 'react';
import { isDeepStrictEqual } from 'node:util';

type Props = Record<string, unknown>;
export type Counts = Record<string, number>;

export const tally = (counts: Counts, key: string) => {
  counts[key] = (counts[key] ?? 0) + 1;
};

const renders: Counts = {};
const updates: Counts = {};
const mounted = new Map<object, { name: string; props: Props }>();

// Fabric sends a host prop only when its value differs, and never sends a
// callback: events reach JS by name, so a new function is no native work.
const sameProp = (previous: unknown, next: unknown) =>
  (typeof previous === 'function' && typeof next === 'function') ||
  isDeepStrictEqual(previous, next);

function nativeComponent(name: string) {
  return function NativeComponent({
    children,
    ...props
  }: Props & { children?: ReactNode }) {
    const previous = useRef<Props | null>(null);
    tally(renders, name);
    if (previous.current) {
      const keys = new Set([
        ...Object.keys(previous.current),
        ...Object.keys(props),
      ]);
      for (const key of keys)
        if (!sameProp(previous.current[key], props[key]))
          tally(updates, `${name}.${key}`);
    }
    previous.current = props;
    mounted.set(previous, { name, props });
    useEffect(
      () => () => {
        mounted.delete(previous);
      },
      []
    );
    return createElement(name, null, children);
  };
}

export const native = {
  reset() {
    for (const counts of [renders, updates])
      for (const key of Object.keys(counts)) delete counts[key];
    mounted.clear();
  },
  renders: (name: string) => renders[name] ?? 0,
  /** `${component}.${prop}`: renders after mount that changed the prop, each sent to native in a Fabric commit. */
  updates: (): Counts => ({ ...updates }),
  /** Calls an event prop of the one mounted `name`, as Fabric delivers a native event. */
  dispatch(name: string, event: string, nativeEvent: unknown) {
    const instances = [...mounted.values()].filter((i) => i.name === name);
    if (instances.length !== 1)
      throw new Error(
        `expected one mounted ${name}, found ${instances.length}`
      );
    const handler = instances[0]!.props[event] as (event: {
      nativeEvent: unknown;
    }) => void;
    handler({ nativeEvent });
  },
};

export const codegenNativeComponent = nativeComponent;
export const View = nativeComponent('View');
export const StyleSheet = { create: <T>(styles: T) => styles };
