import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { ArrangementView } from 'react-native-arrangement-view';
import { Controls, type Frame } from './Controls';

// Big Buck Bunny (CC BY 3.0, Blender Foundation): the 720p rendition of an HLS
// test stream. A single rendition keeps the resolution fixed while the panes
// resize; the Android emulator's decoder garbles frames after a switch.
const source = {
  uri: 'https://test-streams.mux.dev/x36xhzz/url_0/193039199_mp4_h264_aac_hd_7.m3u8',
  metadata: { title: 'Big Buck Bunny', artist: 'Blender Foundation' },
};

type PaneView = ComponentRef<typeof View>;

const frameOf = (view: PaneView) =>
  new Promise<Frame>((resolve) =>
    view.measureInWindow((x, y, width, height) =>
      resolve({ x, y, width, height })
    )
  );

const sameFrame = (a: Frame, b: Frame) =>
  Math.abs(a.x - b.x) < 1 &&
  Math.abs(a.y - b.y) < 1 &&
  Math.abs(a.width - b.width) < 1 &&
  Math.abs(a.height - b.height) < 1;

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

  // Overlaid panes share a frame; separated ones don't. Both are measured
  // together so that a resize never compares a new frame with an old one.
  const controlsPane = useRef<PaneView>(null);
  const videoPane = useRef<PaneView>(null);
  const [layout, setLayout] = useState({
    frame: { x: 0, y: 0, width: 0, height: 0 },
    separated: false,
  });
  const measure = () => {
    if (!controlsPane.current || !videoPane.current) return;
    Promise.all([
      frameOf(controlsPane.current),
      frameOf(videoPane.current),
    ]).then(([controls, video]) =>
      setLayout({ frame: controls, separated: !sameFrame(controls, video) })
    );
  };

  return (
    <View style={styles.screen}>
      <ArrangementView style={styles.arrangement} arrangement="overlay">
        <ArrangementView.Primary>
          <View ref={controlsPane} onLayout={measure} style={styles.pane}>
            <Controls
              player={player}
              frame={layout.frame}
              separated={layout.separated}
            />
          </View>
        </ArrangementView.Primary>
        <ArrangementView.Secondary>
          <View
            ref={videoPane}
            testID="video-pane"
            onLayout={measure}
            style={styles.pane}
          >
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
