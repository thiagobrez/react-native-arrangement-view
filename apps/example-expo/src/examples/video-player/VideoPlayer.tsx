import { StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { ArrangementView } from 'react-native-arrangement-view';
import { Controls } from './Controls';

// Big Buck Bunny (CC BY 3.0, Blender Foundation): the 720p rendition of an HLS
// test stream. A single rendition keeps the resolution fixed while the panes
// resize; the Android emulator's decoder garbles frames after a switch.
const source = {
  uri: 'https://test-streams.mux.dev/x36xhzz/url_0/193039199_mp4_h264_aac_hd_7.m3u8',
  metadata: { title: 'Big Buck Bunny', artist: 'Blender Foundation' },
};

/**
 * A full-screen player, arranged as Apple's iPhone Duo guidance describes:
 * the controls are the overlay's primary pane, in front of the video. While
 * nothing separates the panes (closed, or open flat), they float over the
 * full-screen video and hide while it plays. A half-open hinge separates
 * them: in tabletop the video stands on the upright half and the controls
 * fill the half resting on the table; held like a book, the video takes the
 * leading half and the controls the trailing one.
 */
export function VideoPlayer() {
  const player = useVideoPlayer(source, (created) => {
    created.loop = true;
    created.timeUpdateEventInterval = 0.25;
    created.play();
  });

  return (
    <View style={styles.screen}>
      <ArrangementView style={styles.arrangement} arrangement="overlay">
        <ArrangementView.Primary>
          <Controls player={player} />
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <View testID="video-pane" style={styles.pane}>
            <VideoView
              style={styles.pane}
              player={player}
              nativeControls={false}
              contentFit="contain"
            />
          </View>
        </ArrangementView.Secondary>
      </ArrangementView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  arrangement: { flex: 1 },
  pane: { flex: 1 },
});
