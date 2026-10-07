import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';
import {
  ArrangementView,
  type ArrangementLayout,
} from 'react-native-arrangement-view';
import { pages } from './book';
import { colors, Page } from './Page';

/**
 * A book reader built on a pager: one page at a time on a closed device, and
 * two-page spreads once the device opens, with the gutter on the hinge.
 *
 * Each pager page is an arrangement of two book pages. Where the arrangement
 * shows one pane, the pager turns one page at a time. Where it puts the
 * panes side by side, the pager turns whole spreads instead.
 */
export function BookReader() {
  // The page being read. In spreads, the left page of the spread.
  const [page, setPage] = useState(0);
  const [spreads, setSpreads] = useState(false);
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
    .filter((index) => !spreads || index % 2 === 0);
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <PagerView
        // A new pager for the other page count, opened where reading left off.
        key={spreads ? 'spreads' : 'pages'}
        testID="reader-pager"
        style={styles.screen}
        initialPage={starts.indexOf(page)}
        onPageSelected={({
          nativeEvent: { position },
        }: PagerViewOnPageSelectedEvent) => setPage(starts[position] ?? 0)}
      >
        {starts.map((start) => (
          <View key={start} collapsable={false} style={styles.screen}>
            <Spread
              page={start}
              onArrangementLayoutChange={onArrangementLayoutChange}
            />
          </View>
        ))}
      </PagerView>
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
        <Page index={page} />
      </ArrangementView.Primary>
      <ArrangementView.Secondary>
        <Page index={isLeft ? left + 1 : left} />
      </ArrangementView.Secondary>
    </ArrangementView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
