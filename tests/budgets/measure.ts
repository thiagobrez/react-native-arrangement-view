import { createElement, useState, type ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ArrangementView as AndroidArrangementView } from '../../src/ArrangementView.android.tsx';
import { ArrangementView as IosArrangementView } from '../../src/ArrangementView.ios.tsx';
import type { NativeProps } from '../../src/ArrangementViewNativeComponent.ts';
import { HingeObserver as NativeHingeObserver } from '../../src/HingeObserver.native.tsx';
import { useHingeChange, useHingeSelector } from '../../src/hinge.ts';
import { useArrangementLayout } from '../../src/layout.ts';
import type { ArrangementViewProps } from '../../src/types.ts';
import { native, tally, type Counts } from './react-native.ts';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type NativeEvent<K extends 'onHingeChange' | 'onPanesChange'> = Parameters<
  NonNullable<NativeProps[K]>
>[0]['nativeEvent'];
export type NativeHinge = NativeEvent<'onHingeChange'>;
export type NativePanes = NativeEvent<'onPanesChange'>;

/** A native event, or the app rendering the host again with these props. */
export type Step =
  | { hinge: NativeHinge }
  | { panes: NativePanes }
  | { render: ArrangementViewProps };

/**
 * What the steps made React and native do after mount, mount included.
 * Renders are keyed by reader (`angle`, `halfOpen`, `layout`, `inert`) and by
 * the host's native component, whose renders are the host's own. Counts that
 * stay at zero are left out.
 */
export interface Work {
  renders: Counts;
  /** `angle`: useHingeChange's callback. `onArrangementLayoutChange`: the prop. */
  callbacks: Counts;
  /** `${component}.${prop}`: renders that sent the prop to native in a Fabric commit. */
  nativeUpdates: Counts;
}

type Readers = Record<'angle' | 'halfOpen' | 'layout' | 'inert', ReactNode>;

interface Host {
  native: string;
  render(
    props: ArrangementViewProps,
    readers: Readers,
    onLayout: () => void
  ): ReactNode;
}

const arrangement = (ArrangementView: typeof AndroidArrangementView): Host => ({
  native: 'RNArrangementView',
  render: (props, readers, onLayout) =>
    createElement(
      ArrangementView,
      { ...props, onArrangementLayoutChange: () => onLayout() },
      createElement(
        ArrangementView.Primary,
        null,
        readers.angle,
        readers.inert
      ),
      createElement(
        ArrangementView.Secondary,
        null,
        readers.halfOpen,
        readers.layout
      )
    ),
});

export const AndroidArrangement = arrangement(AndroidArrangementView);
export const IosArrangement = arrangement(IosArrangementView);
export const HingeObserver: Host = {
  native: 'RNHingeObserver',
  render: (props, readers) =>
    createElement(
      NativeHingeObserver,
      props,
      readers.angle,
      readers.halfOpen,
      readers.inert
    ),
};

export async function measure(
  host: Host,
  steps: readonly Step[]
): Promise<Work> {
  native.reset();
  const renders: Counts = {};
  const callbacks: Counts = {};
  function Angle() {
    tally(renders, 'angle');
    useHingeChange(() => tally(callbacks, 'angle'));
    return null;
  }
  function HalfOpen() {
    tally(renders, 'halfOpen');
    useHingeSelector((hinge) => hinge.status === 'partiallyOpen');
    return null;
  }
  function Layout() {
    tally(renders, 'layout');
    useArrangementLayout();
    return null;
  }
  function Inert() {
    tally(renders, 'inert');
    return null;
  }
  // Created once, so a reader renders again only when the library makes it.
  const readers = {
    angle: createElement(Angle),
    halfOpen: createElement(HalfOpen),
    layout: createElement(Layout),
    inert: createElement(Inert),
  };
  let setProps!: (props: ArrangementViewProps) => void;
  function App() {
    const [props, set] = useState<ArrangementViewProps>({});
    setProps = set;
    return host.render(props, readers, () =>
      tally(callbacks, 'onArrangementLayoutChange')
    );
  }

  let root!: ReactTestRenderer;
  await act(() => {
    root = create(createElement(App));
  });
  for (const step of steps)
    await act(() => {
      if ('hinge' in step)
        native.dispatch(host.native, 'onHingeChange', step.hinge);
      else if ('panes' in step)
        native.dispatch(host.native, 'onPanesChange', step.panes);
      else setProps(step.render);
    });
  const work = {
    renders: { ...renders, [host.native]: native.renders(host.native) },
    callbacks,
    nativeUpdates: native.updates(),
  };
  await act(() => root.unmount());
  return work;
}
