import assert from 'node:assert/strict';
import { test } from 'node:test';

import { advanceSquatCounter, resetSquatCounter } from '../src/features/tech-tree/exercise-counter.ts';

const standing = [[0.5, 0.25], [0.5, 0.5], [0.5, 0.75]];
const deep = [[0.3, 0.52], [0.53, 0.55], [0.5, 0.75]];
const shallow = [[0.4, 0.34], [0.54, 0.53], [0.5, 0.75]];

function frame(timestampMs, points, side = 'left', aspectRatio = 1) {
  const landmarks = [];
  const firstIndex = side === 'left' ? 23 : 24;
  points.forEach(([x, y, visibility = 1], index) => {
    landmarks[firstIndex + index * 2] = { x, y, visibility };
  });
  return { timestampMs, aspectRatio, landmarks };
}

function hold(counter, points, start, side, aspectRatio) {
  for (const offset of [0, 80, 160]) {
    counter = advanceSquatCounter(counter, frame(start + offset, points, side, aspectRatio));
  }
  return counter;
}

test('counts complete cycles once each across different cadences', () => {
  let counter = hold(resetSquatCounter(), standing, 0);
  counter = hold(counter, deep, 240);
  assert.equal(counter.repetitions, 0);
  assert.equal(counter.phase, 'bottom');
  counter = hold(counter, standing, 480);
  assert.equal(counter.repetitions, 1);
  counter = hold(counter, standing, 720);
  counter = hold(counter, deep, 1060);
  counter = hold(counter, standing, 1610);
  assert.equal(counter.repetitions, 2);
});

test('ignores shallow movements, brief landmark jitter and starting at the bottom', () => {
  let counter = hold(resetSquatCounter(), deep, 0);
  counter = hold(counter, standing, 240);
  counter = hold(counter, shallow, 480);
  counter = advanceSquatCounter(counter, frame(690, deep));
  counter = hold(counter, standing, 720);
  assert.equal(counter.repetitions, 0);
});

test('preserves the count and discards incomplete cycles after occlusion or a gap', () => {
  let counter = hold(resetSquatCounter(2), standing, 0);
  counter = hold(counter, deep, 240);
  counter = advanceSquatCounter(counter, frame(440, [deep[0], [0.53, 0.55, 0.2], deep[2]]));
  counter = hold(counter, standing, 500);
  assert.equal(counter.repetitions, 2);
  counter = hold(counter, deep, 750);
  counter = hold(counter, standing, 1600);
  assert.equal(counter.repetitions, 2);
  counter = hold(counter, deep, 1840);
  counter = hold(counter, standing, 2080);
  assert.equal(counter.repetitions, 3);
});

test('does not combine legs or apply stale frames to a cycle', () => {
  let counter = hold(resetSquatCounter(), standing, 0, 'left');
  counter = hold(counter, deep, 240, 'right');
  assert.equal(advanceSquatCounter(counter, frame(300, standing)), counter);
  counter = hold(counter, standing, 480, 'right');
  assert.equal(counter.repetitions, 0);
  counter = hold(counter, deep, 720, 'right');
  counter = hold(counter, standing, 960, 'right');
  assert.equal(counter.repetitions, 1);
});

test('accepts slower photo intervals within the network time window', () => {
  let counter = resetSquatCounter();
  for (const [index, pose] of [standing, standing, deep, deep, standing, standing].entries()) {
    counter = advanceSquatCounter(counter, frame(index * 710, pose), 1400);
  }
  assert.equal(counter.repetitions, 1);
});
