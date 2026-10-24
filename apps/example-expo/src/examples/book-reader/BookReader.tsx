import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';
import {
  ArrangementView,
  useArrangementLayout,
  type ArrangementLayout,
} from 'react-native-arrangement-view';
import { pages } from './book';
import { colors, Page } from './Page';
import { Remote } from './Remote';

/**
 * A book reader built on a pager: one page at a time on a closed device,
 * two-page spreads once the device opens, with the gutter on the hinge, and
 * page controls on the lower half in tabletop.
 *
 * Each pager page is an arrangement of two book pages. Where the arrangement
 * shows one pane, the pager turns one page at a time. Where it puts the
 * panes side by side, the pager turns whole spreads instead.
 *
 * The pager is itself the secondary pane of an overlay, with the controls as
 * its primary. An overlay only separates its panes at a hinge, and with
 * vertical axes only at a tabletop one: everywhere else the pager keeps the
 * whole display, and the controls, in front of it, stay out of the way.
 */
export function BookReader() {
  // The page being read. In spreads, the left page of the spread.
  const [page, setPage] = useState(0);
  const [spreads, setSpreads] = useState(false);
  // A tabletop hinge gives the controls the lower half. The upper half shows
  // one page at a time, even where it's wide enough for two: a spread there
  // would be too short to read without scrolling.
  const [tabletop, setTabletop] = useState(false);
  const twoPages = spreads && !tabletop;
  const onArrangementLayoutChange = useCallback(
    ({ secondaryVisible }: ArrangementLayout) => {
      setSpreads(secondaryVisible);
      // The spread an odd page opens to starts on the page before it.
      if (secondaryVisible) setPage((current) => current - (current % 2));
    },
    []
  );
  // What each pager page shows first: every book page, or every left page.
  const starts = pages
    .map((_, index) => index)
    .filter((index) => !twoPages || index % 2 === 0);
  const pager = useRef<PagerView>(null);
  const turn = (target: number, animated: boolean) => {
    const position = starts.indexOf(target - (twoPages ? target % 2 : 0));
    if (animated) pager.current?.setPage(position);
    else pager.current?.setPageWithoutAnimation(position);
  };
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ArrangementView
        style={styles.screen}
        arrangement="overlay"
        axes="vertical"
        onArrangementLayoutChange={({ axis }) =>
          setTabletop(axis === 'vertical')
        }
      >
        <ArrangementView.Primary>
          {tabletop && (
            <Remote page={page} count={pages.length} onTurn={turn} />
          )}
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <PagerView
            ref={pager}
            // A new pager for the other page count, opened where reading left off.
            key={tabletop ? 'tabletop' : twoPages ? 'spreads' : 'pages'}
            testID="reader-pager"
            style={styles.screen}
            initialPage={starts.indexOf(page)}
            onPageSelected={({
              nativeEvent: { position },
            }: PagerViewOnPageSelectedEvent) => setPage(starts[position] ?? 0)}
          >
            {starts.map((start) => (
              <View key={start} collapsable={false} style={styles.screen}>
                {tabletop ? (
                  <Page index={start} />
                ) : (
                  <Spread
                    page={start}
                    onArrangementLayoutChange={onArrangementLayoutChange}
                  />
                )}
              </View>
            ))}
          </PagerView>
        </ArrangementView.Secondary>
      </ArrangementView>
    </SafeAreaView>
  );
}

interface SpreadProps {
  page: number;
  onArrangementLayoutChange: (layout: ArrangementLayout) => void;
}

/**
 * A book page, and the page facing it once there's room. An odd page is the
 * right-hand page of its spread, so it stays on the trailing side and the
 * page before it opens beside it: unfolding shows the same spread the pager
 * moves to.
 */
function Spread({ page, onArrangementLayoutChange }: SpreadProps) {
  const left = page - (page % 2);
  const isLeft = page === left;
  return (
    <ArrangementView
      style={styles.screen}
      axes="horizontal"
      primaryEdge={isLeft ? 'leading' : 'trailing'}
      onArrangementLayoutChange={onArrangementLayoutChange}
    >
      <ArrangementView.Primary>
        <SpreadPage index={page} />
      </ArrangementView.Primary>
      <ArrangementView.Secondary>
        <SpreadPage index={isLeft ? left + 1 : left} />
      </ArrangementView.Secondary>
    </ArrangementView>
  );
}

/** A page that marks the gutter while the spread shows both its pages. */
function SpreadPage({ index }: { index: number }) {
  const layout = useArrangementLayout();
  return <Page index={index} gutter={layout?.secondaryVisible ?? false} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
