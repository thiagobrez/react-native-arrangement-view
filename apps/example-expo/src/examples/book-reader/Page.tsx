import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useArrangementLayout } from 'react-native-arrangement-view';
import { chapter, pages, sectionBreak } from './book';

export const colors = {
  background: '#10121a',
  text: '#dcd6c8',
  muted: '#7d8197',
  gutter: '#2a2e3f',
};

/**
 * One page of the book, with its number at the foot. In a spread, a line
 * along its inner edge marks the gutter.
 */
export function Page({ index }: { index: number }) {
  const layout = useArrangementLayout();
  const paragraphs = pages[index] ?? [];
  const isLeft = index % 2 === 0;
  return (
    <View testID={`page-${index + 1}`} style={styles.page}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
      >
        {index === 0 && (
          <View style={styles.heading}>
            <Text style={styles.chapterNumber}>{chapter.number}</Text>
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
          </View>
        )}
        <View style={styles.body}>
          {paragraphs.map(({ text, continues }, key) =>
            text === sectionBreak ? (
              <Text key={key} style={[styles.paragraph, styles.break]}>
                {text}
              </Text>
            ) : (
              <Text key={key} style={styles.paragraph}>
                {!continues && indent}
                {italicize(text)}
              </Text>
            )
          )}
        </View>
        {paragraphs.length > 0 && (
          <Text testID={`folio-${index + 1}`} style={styles.folio}>
            {index + 1}
          </Text>
        )}
      </ScrollView>
      {layout?.secondaryVisible && (
        <View
          pointerEvents="none"
          style={[
            styles.gutter,
            isLeft ? styles.gutterRight : styles.gutterLeft,
          ]}
        />
      )}
    </View>
  );
}

/** Renders `_text_` in italics. */
function italicize(text: string) {
  return text.split('_').map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={styles.italic}>
        {part}
      </Text>
    ) : (
      part
    )
  );
}

// React Native has no text-indent; two em spaces stand in for it.
const indent = '\u2003\u2003';

const serif = Platform.select({ ios: 'Iowan Old Style', default: 'serif' });

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24 },
  heading: { alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 28 },
  chapterNumber: {
    color: colors.muted,
    fontFamily: serif,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  chapterTitle: { color: colors.text, fontFamily: serif, fontSize: 26 },
  body: { flex: 1, gap: 4 },
  paragraph: {
    color: colors.text,
    fontFamily: serif,
    fontSize: 17,
    lineHeight: 26,
  },
  italic: { fontStyle: 'italic' },
  break: { textAlign: 'center', marginVertical: 12 },
  folio: {
    color: colors.muted,
    fontFamily: serif,
    fontSize: 13,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    paddingVertical: 16,
  },
  gutter: { position: 'absolute', top: 0, bottom: 0, width: 1 },
  gutterLeft: { left: 0, backgroundColor: colors.gutter },
  gutterRight: { right: 0, backgroundColor: colors.gutter },
});
