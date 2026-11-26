import assert from 'node:assert/strict';
import { test } from 'node:test';

import { advanceFloorCounter, resetFloorCounter } from '../src/features/tech-tree/exercise-counter.ts';

function pushUp(timestampMs, leftBent, rightBent, missingWrist = false) {
  const landmarks = [];
  const worldLandmarks = [];
  for (const [side, bent] of [leftBent, rightBent].entries()) {
    const sign = side === 0 ? -1 : 1;
    const x = sign * 0.22;
    landmarks[11 + side] = { x: 0.5 + sign * 0.15, y: 0.5, visibility: 1 };
    landmarks[13 + side] = { x: 0.5 + sign * 0.18, y: 0.57, visibility: 1 };
    landmarks[15 + side] = { x: 0.5 + sign * 0.19, y: 0.65, visibility: side === 1 && missingWrist ? 0.2 : 1 };
    worldLandmarks[23 + side] = { x: sign * 0.16, y: 0, z: 0 };
    worldLandmarks[11 + side] = { x, y: -0.24, z: -0.36 };
    worldLandmarks[13 + side] = { x, y: bent ? -0.24 : -0.10, z: bent ? -0.50 : -0.36 };
    worldLandmarks[15 + side] = { x, y: bent ? -0.10 : 0.04, z: bent ? -0.50 : -0.36 };
    if (typeof bent === 'number') {
      const angle = bent * Math.PI / 180;
      worldLandmarks[13 + side] = { x, y: -0.10, z: -0.36 };
      worldLandmarks[15 + side] = { x, y: -0.10 - 0.14 * Math.cos(angle), z: -0.36 + 0.14 * Math.sin(angle) };
    }
  }
  return { timestampMs, aspectRatio: 1, landmarks, worldLandmarks };
}

function crunch(timestampMs, shoulderY, side = 0) {
  const landmarks = [];
  landmarks[11 + side] = { x: 0.3, y: shoulderY, visibility: 1 };
  landmarks[23 + side] = { x: 0.55, y: 0.69, visibility: 1 };
  landmarks[25 + side] = { x: 0.74, y: 0.48, visibility: 1 };
  return { timestampMs, aspectRatio: 1, landmarks };
}

function run(exercise, frames, initial = resetFloorCounter()) {
  return frames.reduce((counter, frame) => advanceFloorCounter(counter, frame, exercise, 1400), initial);
}

test('frontal push-up requires both 3D elbow angles and counts one clear descent', () => {
  const counter = run('push-up', [pushUp(0, false, false), pushUp(200, false, false),
    pushUp(400, true, false), pushUp(600, false, false), pushUp(800, false, false)]);
  assert.equal(counter.repetitions, 0);
  assert.equal(counter.phase, 'ready');
  const bottom = run('push-up', [pushUp(1000, true, true)], counter);
  assert.equal(bottom.phase, 'active');
  assert.equal(run('push-up', [pushUp(1200, false, false), pushUp(1400, false, false),
    pushUp(1600, false, false)], bottom).repetitions, 1);
});

test('occluding an arm discards the incomplete push-up and preserves completed reps', () => {
  const counter = run('push-up', [pushUp(0, false, false), pushUp(200, false, false), pushUp(400, true, true),
    pushUp(600, true, true, true), pushUp(800, false, false), pushUp(1000, false, false)], resetFloorCounter(2));
  assert.equal(counter.repetitions, 2);
  assert.match(run('push-up', [pushUp(0, false, false, true)]).detail, /mãos dos dois lados/);
});

test('moderate elbow angles need two samples at the bottom and the panel shows the target', () => {
  const ready = run('push-up', [pushUp(0, 145, 145), pushUp(200, 145, 145)]);
  assert.equal(ready.phase, 'ready');
  const halfway = run('push-up', [pushUp(400, 120, 120)], ready);
  assert.equal(halfway.phase, 'ready');
  assert.match(halfway.detail, /120° e 120°.*125°/);
  const finished = run('push-up', [pushUp(600, 120, 120), pushUp(800, 145, 145), pushUp(1000, 145, 145)], halfway);
  assert.equal(finished.repetitions, 1);
});

test('side crunch uses a lying reference and counts only a lift followed by a return', () => {
  const counter = run('crunch', [crunch(0, 0.56), crunch(200, 0.56), crunch(400, 0.69), crunch(600, 0.69),
    crunch(800, 0.66), crunch(1000, 0.69)]);
  assert.equal(counter.repetitions, 0);
  const raised = run('crunch', [crunch(1200, 0.56)], counter);
  assert.equal(raised.phase, 'active');
  assert.match(raised.detail, /52%/);
  assert.equal(run('crunch', [crunch(1400, 0.69), crunch(1600, 0.69)], raised).repetitions, 1);
  assert.equal(run('crunch', [crunch(1400, 0.69, 1), crunch(1600, 0.69, 1)], raised).repetitions, 0);
  assert.equal(run('crunch', [crunch(2800, 0.69), crunch(3000, 0.69)], raised).repetitions, 0);
});
