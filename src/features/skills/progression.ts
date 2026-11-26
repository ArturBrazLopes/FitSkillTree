import type { ExerciseNode } from '../tech-tree/exercises';

export const skillAttributes = [
  { id: 'strength', label: 'Força' },
  { id: 'endurance', label: 'Resistência' },
  { id: 'power', label: 'Explosão' },
  { id: 'control', label: 'Controle' },
] as const;

export type SkillAttribute = typeof skillAttributes[number]['id'];
type Achievement = { id: string; name: string; description: string; anyOf?: readonly string[] };

export const achievements: readonly Achievement[] = [
  { id: 'first-step', name: 'Primeiro passo', description: 'Conclua qualquer desafio.' },
  { id: 'push-up', name: 'Flexão conquistada', description: 'Conclua 1 flexão normal.', anyOf: ['standard-1'] },
  { id: 'legs', name: 'Pernas firmes', description: 'Conclua 10 agachamentos.', anyOf: ['squat-10'] },
  { id: 'core', name: 'Centro firme', description: 'Conclua 10 abdominais.', anyOf: ['crunch-10'] },
  { id: 'balance', name: 'Equilíbrio', description: 'Conclua a prancha ou o agachamento na parede de 20 segundos.',
    anyOf: ['plank-20', 'wall-sit-20'] },
  { id: 'power', name: 'Potência', description: 'Conclua 1 flexão explosiva, 5 agachamentos com salto ou 5 abdominais explosivos.',
    anyOf: ['explosive-1', 'jump-squat-5', 'explosive-crunch-5'] },
];

export const pointsPerLevel = 10;

function emptyAttributes(): Record<SkillAttribute, number> {
  return { strength: 0, endurance: 0, power: 0, control: 0 };
}

function addChallengePoints(totals: Record<SkillAttribute, number>, node: ExerciseNode) {
  const [primary, bonus] = node.attributes;
  totals[primary] += node.difficulty >= 3 ? 3 : node.difficulty >= 2 ? 2 : 1;
  if (bonus) totals[bonus] += 1;
}

export function getSkillSheet(catalog: readonly ExerciseNode[], completedIds: readonly string[]) {
  const points = emptyAttributes();
  const availablePoints = emptyAttributes();
  const completed = new Set(completedIds);
  const knownCompletions = new Set<string>();
  for (const node of catalog) {
    addChallengePoints(availablePoints, node);
    if (completed.has(node.id)) {
      knownCompletions.add(node.id);
      addChallengePoints(points, node);
    }
  }

  const totalPoints = Object.values(points).reduce((sum, value) => sum + value, 0);
  return {
    points,
    availablePoints,
    completedCount: knownCompletions.size,
    level: 1 + Math.floor(totalPoints / pointsPerLevel),
    levelPoints: totalPoints % pointsPerLevel,
    achievements: achievements.map((achievement) => ({
      ...achievement,
      unlocked: achievement.anyOf ? achievement.anyOf.some((id) => knownCompletions.has(id)) : knownCompletions.size > 0,
    })),
  };
}

export function getCompletionRewards(catalog: readonly ExerciseNode[], before: readonly string[], after: readonly string[]) {
  const previous = getSkillSheet(catalog, before);
  const next = getSkillSheet(catalog, after);
  const alreadyUnlocked = new Set(previous.achievements.filter((item) => item.unlocked).map((item) => item.id));
  return {
    gains: skillAttributes.map((attribute) => ({ ...attribute, points: next.points[attribute.id] - previous.points[attribute.id] }))
      .filter((gain) => gain.points > 0),
    newLevel: next.level > previous.level ? next.level : null,
    newAchievements: next.achievements.filter((item) => item.unlocked && !alreadyUnlocked.has(item.id)),
  };
}

export type CompletionRewards = ReturnType<typeof getCompletionRewards>;
