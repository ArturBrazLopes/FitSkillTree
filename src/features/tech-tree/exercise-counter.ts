export type PoseLandmark = { x: number; y: number; visibility: number };
export type WorldLandmark = { x: number; y: number; z: number };

export type PoseFrame = {
  timestampMs: number;
  aspectRatio: number;
  landmarks: PoseLandmark[];
  worldLandmarks?: WorldLandmark[];
};

const legs = [[23, 25, 27], [24, 26, 28]] as const;
type Leg = typeof legs[number];

const poseTimeoutMs = 600;
const standingAngle = 160;
const bottomAngle = 110;
const standingHoldMs = 120;
const bottomHoldMs = 70;

type SquatCounter = {
  repetitions: number;
  phase: 'positioning' | 'standing' | 'bottom';
  leg: Leg | null;
  lastTimestamp: number | null;
  stableSince: number | null;
  standingHipHeight: number;
  standingLegLength: number;
};

export function resetSquatCounter(repetitions = 0): SquatCounter {
  return { repetitions, phase: 'positioning', leg: null, lastTimestamp: null, stableSince: null,
    standingHipHeight: 0, standingLegLength: 0 };
}

export function isVisibleLandmark(point: PoseLandmark | undefined, confidence = 0.55): point is PoseLandmark {
  return !!point && point.visibility >= confidence && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
}

function measureLeg(frame: PoseFrame, leg: Leg) {
  const [hip, knee, ankle] = leg.map((index) => frame.landmarks[index]);
  if (!isVisibleLandmark(hip) || !isVisibleLandmark(knee) || !isVisibleLandmark(ankle)) return null;

  // Both axes must use the same scale before measuring angles.
  const thighX = (hip.x - knee.x) * frame.aspectRatio;
  const thighY = hip.y - knee.y;
  const shinX = (ankle.x - knee.x) * frame.aspectRatio;
  const shinY = ankle.y - knee.y;
  const thigh = Math.hypot(thighX, thighY);
  const shin = Math.hypot(shinX, shinY);
  if (thigh < 0.035 || shin < 0.035) return null;
  const cosine = (thighX * shinX + thighY * shinY) / (thigh * shin);

  return {
    leg,
    angle: Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI,
    hipHeight: ankle.y - hip.y,
    legLength: thigh + shin,
    visibility: Math.min(hip.visibility, knee.visibility, ankle.visibility),
  };
}

export function advanceSquatCounter(previous: SquatCounter, frame: PoseFrame, maxGap = poseTimeoutMs): SquatCounter {
  const now = frame.timestampMs;
  if (previous.lastTimestamp !== null && now <= previous.lastTimestamp) return previous;

  const counter = previous.lastTimestamp !== null && now - previous.lastTimestamp >= maxGap
    ? resetSquatCounter(previous.repetitions)
    : previous;
  const [left, right] = legs.map((leg) => measureLeg(frame, leg));
  const bestLeg = left && right ? (left.visibility >= right.visibility ? left : right) : left ?? right;
  const measurement = counter.leg === legs[0] ? left : counter.leg === legs[1] ? right : bestLeg;
  if (!measurement) return { ...resetSquatCounter(counter.repetitions), lastTimestamp: now };

  const next = { ...counter, leg: measurement.leg, lastTimestamp: now };
  if (counter.phase === 'standing') {
    const hipDrop = counter.standingHipHeight - measurement.hipHeight;
    const reachedBottom = measurement.angle <= bottomAngle && hipDrop >= 0.15 * counter.standingLegLength;
    next.stableSince = reachedBottom ? counter.stableSince ?? now : null;
    if (next.stableSince !== null && now - next.stableSince >= bottomHoldMs) {
      next.phase = 'bottom';
      next.stableSince = null;
    }
    return next;
  }

  next.stableSince = measurement.angle >= standingAngle ? counter.stableSince ?? now : null;
  if (next.stableSince !== null && now - next.stableSince >= standingHoldMs) {
    next.phase = 'standing';
    next.standingHipHeight = measurement.hipHeight;
    next.standingLegLength = measurement.legLength;
    next.stableSince = null;
    if (counter.phase === 'bottom') next.repetitions += 1;
  }
  return next;
}

type FloorExercise = 'push-up' | 'crunch';
type Side = 0 | 1;
type CrunchReference = { height: number; torsoLength: number };
const floorConfidence = 0.4;
const extendedElbow = 142;
const bentElbow = 125;
const crunchLift = 0.15;
type FloorCounter = {
  repetitions: number;
  phase: 'positioning' | 'ready' | 'active';
  lastTimestamp: number | null;
  stableSince: number | null;
  side: Side | null;
  reference: CrunchReference | null;
  detail: string;
};

export function resetFloorCounter(repetitions = 0): FloorCounter {
  return { repetitions, phase: 'positioning', lastTimestamp: null, stableSince: null, side: null, reference: null, detail: '' };
}

function jointAngle(a: WorldLandmark, joint: WorldLandmark, b: WorldLandmark, minimumLength: number) {
  const u = [a.x - joint.x, a.y - joint.y, a.z - joint.z];
  const v = [b.x - joint.x, b.y - joint.y, b.z - joint.z];
  const uLength = Math.hypot(...u);
  const vLength = Math.hypot(...v);
  if (uLength < minimumLength || vLength < minimumLength) return null;
  const cosine = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (uLength * vLength);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
}

function measurePushUp(frame: PoseFrame, phase: FloorCounter['phase']) {
  const world = frame.worldLandmarks;
  if (!world) return { issue: 'Ainda não recebi a pose 3D.' };
  const arms = [[11, 13, 15], [12, 14, 16]];
  if (arms.flat().some((index) => !isVisibleLandmark(frame.landmarks[index], floorConfidence) || !world[index])) {
    return { issue: 'Mostre os ombros, cotovelos e mãos dos dois lados.' };
  }

  const leftHip = world[23];
  const rightHip = world[24];
  const [left, right] = arms.map(([shoulder, elbow, wrist]) => jointAngle(world[shoulder], world[elbow], world[wrist], 0.04));
  if (left === null || right === null) return { issue: 'Ajuste o celular para que os dois braços apareçam inteiros.' };
  if (phase === 'positioning' && leftHip && rightHip) {
    const torsoX = world[11].x + world[12].x - leftHip.x - rightHip.x;
    const torsoY = world[11].y + world[12].y - leftHip.y - rightHip.y;
    const torsoZ = world[11].z + world[12].z - leftHip.z - rightHip.z;
    if (Math.hypot(torsoX, torsoZ) < 0.65 * Math.abs(torsoY)) {
      return { issue: 'Entre na posição de flexão no chão para começar.' };
    }
  }
  const limit = phase === 'ready' ? `até ${bentElbow}°` : `${extendedElbow}° ou mais`;
  return { ready: Math.min(left, right) >= extendedElbow, active: Math.max(left, right) <= bentElbow,
    decisive: Math.max(left, right) <= 110, side: null, reference: null,
    detail: `Cotovelos ${Math.round(left)}° e ${Math.round(right)}°. Alvo nos dois: ${limit}.` };
}

function measureCrunchSide(frame: PoseFrame, side: Side) {
  const shoulder = frame.landmarks[11 + side];
  const hip = frame.landmarks[23 + side];
  const knee = frame.landmarks[25 + side];
  if (!isVisibleLandmark(shoulder, floorConfidence) || !isVisibleLandmark(hip, floorConfidence) || !isVisibleLandmark(knee, floorConfidence)) return null;

  const height = hip.y - shoulder.y;
  const torsoLength = Math.hypot((shoulder.x - hip.x) * frame.aspectRatio, height);
  if (torsoLength < 0.035) return null;
  return { side, height, torsoLength, kneeLift: hip.y - knee.y,
    confidence: Math.min(shoulder.visibility, hip.visibility, knee.visibility) };
}

function measureCrunch(frame: PoseFrame, counter: FloorCounter) {
  const left = measureCrunchSide(frame, 0);
  const right = measureCrunchSide(frame, 1);
  const best = left && right ? (left.confidence >= right.confidence ? left : right) : left ?? right;
  const pose = counter.side === 0 ? left : counter.side === 1 ? right : best;
  if (!pose) return { issue: 'Deixe ombro, quadril e joelho do mesmo lado visíveis.' };

  const reference = counter.reference;
  if (!reference && (Math.abs(pose.height) > 0.44 * pose.torsoLength || pose.kneeLift <= 0)) {
    return { issue: 'Apoie os ombros no chão e dobre os joelhos para marcar o início.' };
  }
  const lift = reference ? (pose.height - reference.height) / reference.torsoLength : 0;
  return {
    ready: !reference || Math.abs(lift) <= 0.07,
    active: lift >= crunchLift,
    decisive: lift >= 0.22,
    side: pose.side,
    reference: reference ?? { height: pose.height, torsoLength: pose.torsoLength },
    detail: reference ? `Elevação dos ombros: ${Math.max(0, Math.round(lift * 100))}%. ${counter.phase === 'active' ? 'Volte a até 7%.' : 'Alvo de 15%.'}`
      : 'Marcando a posição deitada…',
  };
}

export function advanceFloorCounter(previous: FloorCounter, frame: PoseFrame, exercise: FloorExercise, maxGap = poseTimeoutMs): FloorCounter {
  const now = frame.timestampMs;
  if (previous.lastTimestamp !== null && now <= previous.lastTimestamp) return previous;
  const counter = previous.lastTimestamp !== null && now - previous.lastTimestamp >= maxGap
    ? resetFloorCounter(previous.repetitions)
    : previous;
  if (frame.landmarks.length === 0) {
    return { ...resetFloorCounter(counter.repetitions), lastTimestamp: now, detail: 'Nenhuma pessoa identificada na imagem.' };
  }
  const pose = exercise === 'push-up' ? measurePushUp(frame, counter.phase) : measureCrunch(frame, counter);
  if (pose.issue !== undefined) return { ...resetFloorCounter(counter.repetitions), lastTimestamp: now, detail: pose.issue };

  const next = { ...counter, side: pose.side, lastTimestamp: now, detail: pose.detail };
  if (counter.phase === 'ready') {
    next.stableSince = pose.active ? counter.stableSince ?? now : null;
    // A clear peak can fall between photos. Borderline peaks still need confirmation.
    if (pose.decisive || (next.stableSince !== null && now - next.stableSince >= 55)) {
      next.phase = 'active';
      next.stableSince = null;
    }
    return next;
  }

  next.stableSince = pose.ready ? counter.stableSince ?? now : null;
  if (next.stableSince !== null && now - next.stableSince >= 85) {
    next.phase = 'ready';
    next.stableSince = null;
    next.reference = pose.reference;
    if (counter.phase === 'active') next.repetitions += 1;
  }
  return next;
}
