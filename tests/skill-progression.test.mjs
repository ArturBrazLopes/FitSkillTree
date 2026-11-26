import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getCompletionRewards, getSkillSheet } from '../src/features/skills/progression.ts';
import { exercises, getExercise, isExerciseAvailable, readCompletedExercises } from '../src/features/tech-tree/exercises.ts';

test('the first knee push-up gives one strength point and Primeiro passo', () => {
  const reward = getCompletionRewards(exercises, [], ['knee-1']);
  assert.deepEqual(reward.gains, [{ id: 'strength', label: 'Força', points: 1 }]);
  assert.deepEqual(reward.newAchievements.map(({ name }) => name), ['Primeiro passo']);
  assert.equal(reward.newLevel, null);
});

test('advanced challenges award their difficulty tier and the configured bonus', () => {
  assert.deepEqual(getSkillSheet(exercises, ['squat-15', 'squat-30', 'crunch-15', 'archer-1', 'jump-squat-5']).points,
    { strength: 3, endurance: 7, power: 3, control: 4 });
});

test('ten points advance the level and start a new level bar', () => {
  const before = ['knee-1', 'knee-5', 'knee-10', 'standard-1', 'standard-5', 'squat-5', 'crunch-5'];
  const after = [...before, 'squat-10'];
  assert.equal(getSkillSheet(exercises, before).levelPoints, 9);
  assert.equal(getCompletionRewards(exercises, before, after).newLevel, 2);
  assert.equal(getSkillSheet(exercises, after).levelPoints, 0);
});

test('each alternative unlocks its achievement and completing another never unlocks it again', () => {
  for (const id of ['plank-20', 'wall-sit-20']) {
    assert.ok(getSkillSheet(exercises, [id]).achievements.find((item) => item.id === 'balance').unlocked);
  }
  for (const id of ['explosive-1', 'jump-squat-5', 'explosive-crunch-5']) {
    assert.ok(getSkillSheet(exercises, [id]).achievements.find((item) => item.id === 'power').unlocked);
  }
  assert.deepEqual(getCompletionRewards(exercises, ['plank-20'], ['plank-20', 'wall-sit-20']).newAchievements, []);
});

test('saved IDs still count and repeated, unknown or unsaved IDs add no rewards', () => {
  const saved = readCompletedExercises('["knee-1", "knee-1", "removed-id"]');
  assert.equal(getSkillSheet(exercises, saved).completedCount, 1);
  assert.equal(isExerciseAvailable(getExercise('knee-1'), saved), false);
  assert.deepEqual(getCompletionRewards(exercises, saved, [...saved, 'knee-1', 'removed-id']),
    { gains: [], newLevel: null, newAchievements: [] });
  assert.deepEqual(getCompletionRewards(exercises, saved, saved), { gains: [], newLevel: null, newAchievements: [] });
  const empty = getSkillSheet(exercises, readCompletedExercises(null));
  assert.equal(empty.level, 1);
  assert.equal(empty.completedCount, 0);
  assert.ok(empty.achievements.every((item) => !item.unlocked));
});
