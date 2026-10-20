import { StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { ArrangementView } from 'react-native-arrangement-view';
import { Controls } from './Controls';

// Big Buck Bunny (CC BY 3.0, Blender Foundation): the 720p rendition of an HLS
// test stream. The Android emulator's decoder garbles frames after a
// resolution switch.
const fixed720pRendition = {
  uri: 'https://test-streams.mux.dev/x36xhzz/url_0/193039199_mp4_h264_aac_hd_7.m3u8',
  metadata: { title: 'Big Buck Bunny', artist: 'Blender Foundation' },
};

export function VideoPlayer() {
  const player = useVideoPlayer(fixed720pRendition, (created) => {
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
