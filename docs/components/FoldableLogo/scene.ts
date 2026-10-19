import {
  Box3,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  ShadowMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
  VSMShadowMap,
  WebGLRenderer,
  type BufferGeometry,
} from 'three';
import type { Frame } from '../../../src/layout.ts';
import {
  coverDp,
  describeDevice,
  innerDp,
  logoPose,
  postures,
  type DeviceState,
  type Hold,
  type Posture,
} from './device.ts';

export interface FoldableScene {
  animateTo(posture: Posture): void;
  snapToDegrees(degrees: number): void;
  dispose(): void;
}

const WORLD_UNITS_PER_DP = 1 / 300;
const BEZEL = 36 * WORLD_UNITS_PER_DP;
const HALF_WIDTH = (innerDp.width / 2) * WORLD_UNITS_PER_DP + BEZEL;
const HEIGHT = innerDp.height * WORLD_UNITS_PER_DP + 2 * BEZEL;
const THICKNESS = 0.13;
const CORNER = 0.26;
const BEVEL = 0.022;
const Z_FIGHT_OFFSET = 0.003;

const BODY = '#262a3c';
const SCREEN_OFF = '#1b1e2b';
const CREASE = '#8a93b0';
const PRIMARY = ['#7c6cf2', '#5a4bd1'] as const;
const SECONDARY = ['#2dc2b4', '#1d958f'] as const;

const FIELD_OF_VIEW = 30;
// The space the camera keeps in view, enough for the device open flat.
const VIEW_WIDTH = 4.5;
const VIEW_HEIGHT = 3.9;

const views: Record<Posture, readonly [yaw: number, pitch: number]> = {
  closed: [24, 10],
  open: [-16, 10],
  tabletop: [-24, 32],
  book: [0, 12],
  tent: [22, 20],
};

type Axis = [number, number, number];

const TOWARD_VIEWER: Axis = [0, 0, 1];
const AWAY_FROM_VIEWER: Axis = [0, 0, -1];
const ACROSS: Axis = [1, 0, 0];
const UP: Axis = [0, 1, 0];
const DOWN: Axis = [0, -1, 0];

function basis(rightHalf: Axis, hinge: Axis, innerDisplay: Axis) {
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(
      new Vector3(...rightHalf),
      new Vector3(...hinge),
      new Vector3(...innerDisplay)
    )
  );
}

const holds: Record<
  Hold,
  {
    quaternion: Quaternion;
    rightHalfFoldShare: number;
    coverTurnOnClose: number;
  }
> = {
  upright: {
    quaternion: new Quaternion(),
    rightHalfFoldShare: 0.5,
    coverTurnOnClose: 1,
  },
  tabletop: {
    quaternion: basis(TOWARD_VIEWER, ACROSS, UP),
    rightHalfFoldShare: 0,
    coverTurnOnClose: 0,
  },
  tent: {
    quaternion: basis(AWAY_FROM_VIEWER, ACROSS, DOWN),
    rightHalfFoldShare: 0.5,
    coverTurnOnClose: 0,
  },
};

class Spring {
  value: number;
  target: number;
  private velocity = 0;
  private readonly stiffness: number;
  private readonly precision: number;

  constructor(value: number, stiffness = 180, precision = 0.001) {
    this.value = value;
    this.target = value;
    this.stiffness = stiffness;
    this.precision = precision;
  }

  jump(value: number) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }

  step(dt: number) {
    if (this.value === this.target && this.velocity === 0) return false;
    const criticalDamping = 2 * Math.sqrt(this.stiffness);
    const steps = Math.ceil(dt / 0.004);
    for (let i = 0; i < steps; i++) {
      const force =
        this.stiffness * (this.target - this.value) -
        criticalDamping * this.velocity;
      this.velocity += (force * dt) / steps;
      this.value += (this.velocity * dt) / steps;
    }
    if (
      Math.abs(this.target - this.value) < this.precision &&
      Math.abs(this.velocity) < this.precision * 10
    )
      this.jump(this.target);
    return true;
  }
}

type FrameSprings = Record<keyof Frame, Spring>;

function frameSprings(frame: Frame): FrameSprings {
  return {
    left: new Spring(frame.left, 180, 0.05),
    top: new Spring(frame.top, 180, 0.05),
    width: new Spring(frame.width, 180, 0.05),
    height: new Spring(frame.height, 180, 0.05),
  };
}

const frameKeys = ['left', 'top', 'width', 'height'] as const;

interface PaintedDisplay {
  size: { width: number; height: number };
  context: CanvasRenderingContext2D;
  texture: CanvasTexture;
  on: Spring;
  quarterTurn: Spring;
  primary: FrameSprings;
  secondary: FrameSprings;
  secondaryOn: Spring;
  crease: Spring;
  springs: Spring[];
  stale: boolean;
}

const separated = (state: DeviceState) =>
  state.appDisplay === 'inner' && state.status === 'partiallyOpen';

function createPaintedDisplay(
  size: PaintedDisplay['size'],
  state: DeviceState,
  on: boolean
): PaintedDisplay {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  const full = { left: 0, top: 0, ...size };
  const springs = {
    on: new Spring(on ? 1 : 0, 400),
    quarterTurn: new Spring(on && state.landscape ? 1 : 0),
    secondaryOn: new Spring(on && state.secondary ? 1 : 0),
    crease: new Spring(on && separated(state) ? 1 : 0),
  };
  const primary = frameSprings(on ? state.primary : full);
  const secondary = frameSprings((on && state.secondary) || full);
  return {
    size,
    context: canvas.getContext('2d')!,
    texture,
    ...springs,
    primary,
    secondary,
    springs: [
      ...Object.values(springs),
      ...Object.values(primary),
      ...Object.values(secondary),
    ],
    stale: true,
  };
}

const OFF_BELOW = 0.02;

function retarget(screen: PaintedDisplay, state: DeviceState, active: boolean) {
  const nothingToAnimateFrom = screen.on.value < OFF_BELOW;
  screen.on.target = active ? 1 : 0;
  if (!active) return;

  const set = (spring: Spring, target: number, jump = nothingToAnimateFrom) => {
    if (jump) spring.jump(target);
    else spring.target = target;
  };
  set(screen.quarterTurn, state.landscape ? 1 : 0);
  set(screen.crease, separated(state) ? 1 : 0);
  set(screen.secondaryOn, state.secondary ? 1 : 0);
  const appearing =
    nothingToAnimateFrom || screen.secondaryOn.value < OFF_BELOW;
  for (const key of frameKeys) {
    set(screen.primary[key], state.primary[key]);
    if (state.secondary)
      set(screen.secondary[key], state.secondary[key], appearing);
  }
}

function paint(screen: PaintedDisplay, font: string) {
  const { context, size } = screen;
  const on = MathUtils.clamp(screen.on.value, 0, 1);
  const quarterTurn = MathUtils.clamp(screen.quarterTurn.value, 0, 1);
  context.globalAlpha = 1;
  context.fillStyle = SCREEN_OFF;
  context.fillRect(0, 0, size.width, size.height);

  const pane = (
    name: string,
    frame: FrameSprings,
    colors: readonly [string, string],
    alpha: number
  ) => {
    if (alpha < 0.01) return;
    const left = frame.left.value;
    const top = frame.top.value;
    const width = frame.width.value;
    const height = frame.height.value;
    context.save();
    context.globalAlpha = alpha;
    context.beginPath();
    context.rect(left, top, width, height);
    context.clip();
    const gradient = context.createLinearGradient(
      left,
      top,
      left + width,
      top + height
    );
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    context.fillStyle = gradient;
    context.fillRect(left, top, width, height);

    const across = MathUtils.lerp(width, height, quarterTurn);
    const down = MathUtils.lerp(height, width, quarterTurn);
    context.translate(left + width / 2, top + height / 2);
    context.rotate((-quarterTurn * Math.PI) / 2);
    context.translate(-across / 2 + 44, -down / 2 + 44);
    context.textBaseline = 'top';
    context.fillStyle = '#fff';
    context.font = `700 62px ${font}`;
    context.fillText(name, 0, 0);
    context.globalAlpha = alpha * 0.75;
    context.font = `500 34px ${font}`;
    context.fillText(`${Math.round(across)} × ${Math.round(down)} dp`, 2, 84);
    context.restore();
  };
  pane(
    'Secondary',
    screen.secondary,
    SECONDARY,
    on * MathUtils.clamp(screen.secondaryOn.value, 0, 1)
  );
  pane('Primary', screen.primary, PRIMARY, on);

  const crease = on * MathUtils.clamp(screen.crease.value, 0, 1);
  if (crease > 0.01) {
    context.globalAlpha = crease;
    context.strokeStyle = CREASE;
    context.lineWidth = 8;
    context.lineCap = 'round';
    context.setLineDash([40, 32]);
    context.beginPath();
    context.moveTo(size.width / 2, 76);
    context.lineTo(size.width / 2, size.height - 76);
    context.stroke();
    context.setLineDash([]);
  }
  screen.texture.needsUpdate = true;
  screen.stale = false;
}

interface Corners {
  topLeft?: number;
  topRight?: number;
  bottomRight?: number;
  bottomLeft?: number;
}

function roundedRect(
  left: number,
  bottom: number,
  right: number,
  top: number,
  { topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0 }: Corners
) {
  const shape = new Shape();
  const quarter = Math.PI / 2;
  shape.moveTo(left + bottomLeft, bottom);
  shape.lineTo(right - bottomRight, bottom);
  if (bottomRight)
    shape.absarc(
      right - bottomRight,
      bottom + bottomRight,
      bottomRight,
      -quarter,
      0
    );
  shape.lineTo(right, top - topRight);
  if (topRight)
    shape.absarc(right - topRight, top - topRight, topRight, 0, quarter);
  shape.lineTo(left + topLeft, top);
  if (topLeft)
    shape.absarc(left + topLeft, top - topLeft, topLeft, quarter, 2 * quarter);
  shape.lineTo(left, bottom + bottomLeft);
  if (bottomLeft)
    shape.absarc(
      left + bottomLeft,
      bottom + bottomLeft,
      bottomLeft,
      2 * quarter,
      3 * quarter
    );
  return shape;
}

const RIGHT = 1;
const LEFT = -1;
type Side = typeof RIGHT | typeof LEFT;

function bodyGeometry(side: Side) {
  const outer = { topRight: CORNER, bottomRight: CORNER };
  const hinge = { topLeft: 0.04, bottomLeft: 0.04 };
  const shape =
    side === RIGHT
      ? roundedRect(0, -HEIGHT / 2, HALF_WIDTH, HEIGHT / 2, {
          ...outer,
          ...hinge,
        })
      : roundedRect(-HALF_WIDTH, -HEIGHT / 2, 0, HEIGHT / 2, {
          topLeft: CORNER,
          bottomLeft: CORNER,
          topRight: 0.04,
          bottomRight: 0.04,
        });
  return new ExtrudeGeometry(shape, {
    depth: THICKNESS - 2 * BEVEL,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelOffset: -BEVEL,
    bevelSegments: 4,
    curveSegments: 20,
  }).translate(0, 0, BEVEL - THICKNESS);
}

function displayGeometry(shape: Shape, uStart: number, uEnd: number) {
  const geometry = new ShapeGeometry(shape, 20);
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    const across = (position.getX(i) - min.x) / (max.x - min.x);
    uv.setXY(
      i,
      MathUtils.lerp(uStart, uEnd, across),
      (position.getY(i) - min.y) / (max.y - min.y)
    );
  }
  return geometry;
}

function spineGeometry() {
  const radius = THICKNESS * 0.97;
  const thetaStart = Math.PI / 2;
  const thetaLength = Math.PI;
  return new CylinderGeometry(
    radius,
    radius,
    HEIGHT - 0.1,
    24,
    1,
    false,
    thetaStart,
    thetaLength
  );
}

function wrapDegrees(degrees: number) {
  return MathUtils.euclideanModulo(degrees + 180, 360) - 180;
}

export function createFoldableScene(
  canvas: HTMLCanvasElement,
  onChange: (state: DeviceState, angle: number) => void
): FoldableScene {
  // Throws where WebGL is unavailable.
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;

  const prefersReducedMotion = matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  const font = getComputedStyle(canvas).fontFamily;
  const disposables: { dispose(): void }[] = [renderer];
  const mesh = (
    geometry: BufferGeometry,
    material: MeshStandardMaterial | MeshBasicMaterial | ShadowMaterial
  ) => {
    disposables.push(geometry, material);
    return new Mesh(geometry, material);
  };

  const scene = new Scene();
  const camera = new PerspectiveCamera(FIELD_OF_VIEW);
  scene.add(camera, new HemisphereLight('#ffffff', '#767c99', 2.4));
  const sun = new DirectionalLight('#ffffff', 2.6);
  sun.position.set(2.5, 9, 5.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 14;
  sun.shadow.blurSamples = 20;
  sun.shadow.bias = -0.0004;
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 });
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);
  camera.add(new DirectionalLight('#ffffff', 1.1));

  const ground = mesh(
    new PlaneGeometry(40, 40),
    new ShadowMaterial({ opacity: 0.12 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  let pose = logoPose;
  let state = describeDevice(pose);
  const screens = {
    cover: createPaintedDisplay(coverDp, state, state.appDisplay === 'cover'),
    inner: createPaintedDisplay(innerDp, state, state.appDisplay === 'inner'),
  };
  const bodyMaterial = new MeshStandardMaterial({
    color: BODY,
    roughness: 0.55,
    metalness: 0.25,
  });
  const display = (geometry: BufferGeometry, screen: PaintedDisplay) => {
    disposables.push(screen.texture);
    return mesh(
      geometry,
      new MeshBasicMaterial({ map: screen.texture, toneMapped: false })
    );
  };
  const half = (side: Side) => {
    const group = new Group();
    const body = mesh(bodyGeometry(side), bodyMaterial);
    body.castShadow = true;
    const edge = side * (HALF_WIDTH - BEZEL);
    const radius = CORNER - BEZEL;
    const top = HEIGHT / 2 - BEZEL;
    const shape =
      side === RIGHT
        ? roundedRect(0, -top, edge, top, {
            topRight: radius,
            bottomRight: radius,
          })
        : roundedRect(edge, -top, 0, top, {
            topLeft: radius,
            bottomLeft: radius,
          });
    const screen = display(
      side === RIGHT
        ? displayGeometry(shape, 0.5, 1)
        : displayGeometry(shape, 0, 0.5),
      screens.inner
    );
    screen.position.z = Z_FIGHT_OFFSET;
    group.add(body, screen);
    return { group, body };
  };
  const right = half(RIGHT);
  const left = half(LEFT);

  const coverWidth = coverDp.width * WORLD_UNITS_PER_DP;
  const coverHeight = coverDp.height * WORLD_UNITS_PER_DP;
  const coverDisplay = display(
    displayGeometry(
      roundedRect(
        -coverWidth / 2,
        -coverHeight / 2,
        coverWidth / 2,
        coverHeight / 2,
        {
          topLeft: CORNER - BEZEL,
          topRight: CORNER - BEZEL,
          bottomRight: CORNER - BEZEL,
          bottomLeft: CORNER - BEZEL,
        }
      ),
      0,
      1
    ).rotateY(Math.PI),
    screens.cover
  );
  coverDisplay.position.set(-HALF_WIDTH / 2, 0, -THICKNESS - Z_FIGHT_OFFSET);
  left.group.add(coverDisplay);

  const spine = mesh(spineGeometry(), bodyMaterial);
  spine.castShadow = true;

  const device = new Group();
  device.add(right.group, left.group, spine);
  scene.add(device);

  const angle = new Spring(pose.degrees, 60, 0.05);
  const yaw = new Spring(views[state.posture][0], 60, 0.01);
  const pitch = new Spring(views[state.posture][1], 60, 0.01);
  const hold = holds[pose.hold];
  const held = { ...hold, quaternion: hold.quaternion.clone() };
  let previousHold = { ...held, quaternion: held.quaternion.clone() };
  const holdBlend = new Spring(1, 60);

  const box = new Box3();
  const target = new Vector3();
  const turned = new Quaternion();
  const up = new Vector3(0, 1, 0);
  let distance = 10;
  let reported = '';

  function place() {
    const to = holds[pose.hold];
    const eased = MathUtils.clamp(holdBlend.value, 0, 1);
    held.quaternion.slerpQuaternions(
      previousHold.quaternion,
      to.quaternion,
      eased
    );
    held.rightHalfFoldShare = MathUtils.lerp(
      previousHold.rightHalfFoldShare,
      to.rightHalfFoldShare,
      eased
    );
    held.coverTurnOnClose = MathUtils.lerp(
      previousHold.coverTurnOnClose,
      to.coverTurnOnClose,
      eased
    );

    const fold = MathUtils.degToRad(180 - angle.value);
    const turn =
      (1 - MathUtils.smoothstep(angle.value, 0, 70)) * held.coverTurnOnClose;
    device.quaternion
      .copy(held.quaternion)
      .multiply(turned.setFromAxisAngle(up, (turn * Math.PI) / 2));
    right.group.rotation.y = -fold * held.rightHalfFoldShare;
    left.group.rotation.y = fold * (1 - held.rightHalfFoldShare);
    spine.rotation.y = (fold * (1 - 2 * held.rightHalfFoldShare)) / 2;

    device.position.set(0, 0, 0);
    device.updateMatrixWorld(true);
    box.makeEmpty().expandByObject(right.body).expandByObject(left.body);
    device.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2
    );
    target.set(0, (box.max.y - box.min.y) / 2, 0);

    const around = MathUtils.degToRad(yaw.value);
    const above = MathUtils.degToRad(pitch.value);
    camera.position
      .set(
        Math.sin(around) * Math.cos(above),
        Math.sin(above),
        Math.cos(around) * Math.cos(above)
      )
      .multiplyScalar(distance)
      .add(target);
    camera.lookAt(target);
  }

  const advance = (spring: Spring, dt: number) => {
    if (!prefersReducedMotion) return spring.step(dt);
    const moved = spring.value !== spring.target;
    spring.jump(spring.target);
    return moved;
  };

  function update(dt: number) {
    let moving = false;
    for (const spring of [angle, yaw, pitch, holdBlend]) {
      if (advance(spring, dt)) moving = true;
    }
    state = describeDevice({ ...pose, degrees: angle.value });
    for (const name of ['cover', 'inner'] as const) {
      const screen = screens[name];
      retarget(screen, state, state.appDisplay === name);
      let changed = screen.stale;
      for (const spring of screen.springs) {
        if (advance(spring, dt)) changed = moving = true;
      }
      if (changed) paint(screen, font);
    }
    place();

    const degrees = Math.round(angle.value);
    const report = `${degrees} ${state.posture} ${state.status} ${state.panes}`;
    if (report !== reported) {
      reported = report;
      onChange(state, degrees);
    }
    return moving;
  }

  let frame = 0;
  let last = 0;
  function tick(now: number) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const moving = update(dt);
    renderer.render(scene, camera);
    frame = moving ? requestAnimationFrame(tick) : 0;
    if (!moving) last = 0;
  }
  function invalidate() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    distance =
      Math.max(VIEW_HEIGHT, VIEW_WIDTH / camera.aspect) /
      (2 * Math.tan(MathUtils.degToRad(FIELD_OF_VIEW / 2)));
    // Draw at once: resizing clears the canvas.
    update(0);
    renderer.render(scene, camera);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  let disposed = false;
  document.fonts.ready.then(() => {
    if (disposed) return;
    screens.cover.stale = true;
    screens.inner.stale = true;
    invalidate();
  });

  let drag: { x: number; y: number } | null = null;
  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!drag) return;
    yaw.jump(yaw.value - (event.clientX - drag.x) * 0.4);
    pitch.jump(
      MathUtils.clamp(pitch.value + (event.clientY - drag.y) * 0.3, 2, 75)
    );
    drag = { x: event.clientX, y: event.clientY };
    invalidate();
  };
  const onPointerUp = () => {
    drag = null;
    canvas.style.cursor = '';
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  return {
    animateTo(posture) {
      const next = postures.find(({ id }) => id === posture)!.pose;
      if (next.hold !== pose.hold) {
        previousHold = { ...held, quaternion: held.quaternion.clone() };
        holdBlend.jump(0);
        holdBlend.target = 1;
      }
      pose = { ...pose, hold: next.hold };
      angle.target = next.degrees;
      const [around, above] = views[posture];
      yaw.jump(wrapDegrees(yaw.value));
      yaw.target = around;
      pitch.target = above;
      invalidate();
    },
    snapToDegrees(degrees) {
      angle.jump(MathUtils.clamp(degrees, 0, 180));
      invalidate();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      disposables.forEach((disposable) => disposable.dispose());
    },
  };
}
