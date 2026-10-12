import { useEffect, useRef, useState } from 'react';
import {
  describeDevice,
  initialPose,
  postures,
  type Posture,
} from './device.ts';
import styles from './FoldableLogo.module.css';
import type { FoldableScene } from './scene.ts';

type Props = {
  /** The logo's image, shown until the model loads and where WebGL is unavailable. */
  src: string;
  alt: string;
};

/**
 * The logo as a 3D model of the foldable it draws. The device folds, and
 * takes each posture, and its displays show the two panes arranged the way
 * the library arranges them.
 */
export function FoldableLogo({ src, alt }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<FoldableScene | null>(null);
  const [model, setModel] = useState<'loading' | 'ready' | 'unavailable'>(
    'loading'
  );
  const [angle, setAngle] = useState(initialPose.angle);
  const [device, setDevice] = useState(() => describeDevice(initialPose));
  // A posture that was picked stays the current one while the device folds to
  // it, through the postures on the way. Folding by hand goes by the fold.
  const [picked, setPicked] = useState<Posture | null>(null);

  useEffect(() => {
    let unmounted = false;
    // three.js is loaded apart from the page, and only in a browser.
    import('./scene.ts')
      .then(({ createFoldableScene }) => {
        if (unmounted || !canvas.current) return;
        scene.current = createFoldableScene(canvas.current, (next, degrees) => {
          setDevice(next);
          setAngle(degrees);
        });
        setModel('ready');
      })
      .catch(() => setModel('unavailable'));
    return () => {
      unmounted = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  if (model === 'unavailable') {
    return <img className={styles.image} src={src} alt={alt} />;
  }

  const ready = model === 'ready';
  const current = picked ?? device.posture;
  const posture = postures.find(({ id }) => id === current);
  return (
    <div className={styles.logo}>
      <div className={styles.stage}>
        <img
          className={styles.placeholder}
          src={src}
          alt={ready ? '' : alt}
          data-hidden={ready}
        />
        <canvas
          ref={canvas}
          className={styles.canvas}
          data-ready={ready}
          aria-hidden={!ready}
          role="img"
          aria-label={`${alt}: a foldable device, ${posture?.label.toLowerCase()}, showing ${device.panes.toLowerCase()}. Drag to turn it.`}
        />
      </div>
      <div className={styles.postures} role="group" aria-label="Posture">
        {postures.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={styles.posture}
            aria-pressed={current === id}
            disabled={!ready}
            onClick={() => {
              setPicked(id);
              scene.current?.pose(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <label className={styles.hinge}>
        Hinge
        <input
          type="range"
          min={0}
          max={180}
          value={angle}
          disabled={!ready}
          aria-valuetext={`${angle} degrees`}
          onChange={(event) => {
            setPicked(null);
            scene.current?.fold(Number(event.target.value));
          }}
        />
        <output className={styles.angle}>{angle}°</output>
      </label>
      <p className={styles.state}>
        <code>{device.status}</code>
        {device.panes}
      </p>
    </div>
  );
}
