import type { SkillAttribute } from '../skills/progression';

export const startNodeId = 'start';

export type ExerciseNode = {
  id: string;
  prerequisiteId: string;
  title: string;
  description: string;
  difficulty: number;
  focus?: string;
  attributes: readonly [primary: SkillAttribute, bonus?: SkillAttribute];
} & (
  | { repetitions: number; durationSeconds?: never; tracking?: 'squat' | 'push-up' | 'crunch' }
  | { durationSeconds: number; repetitions?: never; tracking?: never }
);

const kneeDescription = 'Faça as repetições de flexão mantendo os joelhos apoiados no chão.';
const standardDescription = 'Faça as repetições de flexão com o corpo alinhado e apoiado nas mãos e nos pés.';
const squatDescription = 'Flexione os joelhos e leve o quadril para trás. Suba mantendo os pés apoiados no chão.';
const crunchDescription = 'Deite-se com os joelhos flexionados e os pés apoiados. Eleve os ombros do chão e volte devagar.';
const wallSitDescription = 'Apoie as costas na parede e flexione os joelhos até uma posição que consiga sustentar. Mantenha os pés apoiados e respire normalmente.';
const jumpSquatDescription = 'Agache e suba com impulso para dar um salto curto. Aterrisse suavemente com os joelhos flexionados e recupere a posição antes de repetir.';
const plankDescription = 'Apoie os antebraços e as pontas dos pés no chão. Mantenha o corpo alinhado e respire normalmente.';
const explosiveCrunchDescription = 'Eleve os ombros do chão com uma contração rápida do abdômen e desça devagar. Mantenha os pés apoiados e evite puxar o pescoço.';

export const exercises: readonly ExerciseNode[] = [
  { id: 'knee-1', prerequisiteId: startNodeId, title: '1 flexão com apoio nos joelhos', description: kneeDescription, difficulty: 1, repetitions: 1, tracking: 'push-up', attributes: ['strength'] },
  { id: 'knee-5', prerequisiteId: 'knee-1', title: '5 flexões com apoio nos joelhos', description: kneeDescription, difficulty: 1.4, repetitions: 5, tracking: 'push-up', attributes: ['strength'] },
  { id: 'knee-10', prerequisiteId: 'knee-5', title: '10 flexões com apoio nos joelhos', description: kneeDescription, difficulty: 1.8, repetitions: 10, tracking: 'push-up', attributes: ['strength'] },
  { id: 'standard-1', prerequisiteId: 'knee-10', title: '1 flexão normal', description: standardDescription, difficulty: 2.2, repetitions: 1, tracking: 'push-up', attributes: ['strength'] },
  { id: 'standard-5', prerequisiteId: 'standard-1', title: '5 flexões normais', description: standardDescription, difficulty: 2.7, repetitions: 5, tracking: 'push-up', attributes: ['strength'] },
  { id: 'standard-10', prerequisiteId: 'standard-5', title: '10 flexões normais', description: standardDescription, difficulty: 3.3, repetitions: 10, tracking: 'push-up', attributes: ['strength'] },
  { id: 'archer-1', prerequisiteId: 'standard-10', title: '1 flexão em arco', description: 'Faça uma flexão deslocando o peso para um lado, com o outro braço estendido.', focus: 'Controle do movimento', difficulty: 3.8, repetitions: 1, attributes: ['control', 'strength'] },
  { id: 'standard-15', prerequisiteId: 'standard-10', title: '15 flexões normais', description: standardDescription, focus: 'Resistência', difficulty: 4, repetitions: 15, tracking: 'push-up', attributes: ['endurance', 'strength'] },
  { id: 'explosive-1', prerequisiteId: 'standard-10', title: '1 flexão explosiva', description: 'Faça uma flexão com impulso suficiente para que as mãos saiam brevemente do chão na subida.', focus: 'Explosão', difficulty: 4.4, repetitions: 1, attributes: ['power'] },
  { id: 'squat-5', prerequisiteId: startNodeId, title: '5 agachamentos', description: squatDescription, difficulty: 1, repetitions: 5, tracking: 'squat', attributes: ['strength'] },
  { id: 'squat-10', prerequisiteId: 'squat-5', title: '10 agachamentos', description: squatDescription, difficulty: 1.5, repetitions: 10, tracking: 'squat', attributes: ['strength'] },
  { id: 'squat-15', prerequisiteId: 'squat-10', title: '15 agachamentos', description: squatDescription, difficulty: 2, repetitions: 15, tracking: 'squat', attributes: ['endurance', 'strength'] },
  { id: 'squat-20', prerequisiteId: 'squat-15', title: '20 agachamentos', description: squatDescription, difficulty: 2.4, repetitions: 20, tracking: 'squat', attributes: ['endurance', 'strength'] },
  { id: 'squat-25', prerequisiteId: 'squat-20', title: '25 agachamentos', description: squatDescription, difficulty: 2.8, repetitions: 25, tracking: 'squat', attributes: ['endurance', 'strength'] },
  { id: 'squat-30', prerequisiteId: 'squat-25', title: '30 agachamentos', description: squatDescription, difficulty: 3.2, repetitions: 30, tracking: 'squat', attributes: ['endurance', 'strength'] },
  { id: 'wall-sit-20', prerequisiteId: 'squat-15', title: 'Agachamento isométrico na parede', description: wallSitDescription, difficulty: 2.5, durationSeconds: 20, focus: 'Isometria', attributes: ['control'] },
  { id: 'wall-sit-40', prerequisiteId: 'wall-sit-20', title: 'Agachamento isométrico na parede', description: wallSitDescription, difficulty: 3.2, durationSeconds: 40, focus: 'Isometria', attributes: ['control'] },
  { id: 'jump-squat-5', prerequisiteId: 'squat-20', title: '5 agachamentos com salto', description: jumpSquatDescription, difficulty: 3.3, repetitions: 5, focus: 'Explosão', attributes: ['power'] },
  { id: 'jump-squat-10', prerequisiteId: 'jump-squat-5', title: '10 agachamentos com salto', description: jumpSquatDescription, difficulty: 4, repetitions: 10, focus: 'Explosão', attributes: ['power'] },
  { id: 'crunch-5', prerequisiteId: startNodeId, title: '5 abdominais', description: crunchDescription, difficulty: 1, repetitions: 5, tracking: 'crunch', attributes: ['strength'] },
  { id: 'crunch-10', prerequisiteId: 'crunch-5', title: '10 abdominais', description: crunchDescription, difficulty: 1.5, repetitions: 10, tracking: 'crunch', attributes: ['strength'] },
  { id: 'crunch-15', prerequisiteId: 'crunch-10', title: '15 abdominais', description: crunchDescription, difficulty: 2, repetitions: 15, tracking: 'crunch', attributes: ['endurance', 'control'] },
  { id: 'crunch-20', prerequisiteId: 'crunch-15', title: '20 abdominais', description: crunchDescription, difficulty: 2.4, repetitions: 20, tracking: 'crunch', attributes: ['endurance', 'control'] },
  { id: 'crunch-25', prerequisiteId: 'crunch-20', title: '25 abdominais', description: crunchDescription, difficulty: 2.8, repetitions: 25, tracking: 'crunch', attributes: ['endurance', 'control'] },
  { id: 'crunch-30', prerequisiteId: 'crunch-25', title: '30 abdominais', description: crunchDescription, difficulty: 3.2, repetitions: 30, tracking: 'crunch', attributes: ['endurance', 'control'] },
  { id: 'plank-20', prerequisiteId: 'crunch-15', title: 'Prancha isométrica', description: plankDescription, difficulty: 2.5, durationSeconds: 20, focus: 'Isometria', attributes: ['control'] },
  { id: 'plank-40', prerequisiteId: 'plank-20', title: 'Prancha isométrica', description: plankDescription, difficulty: 3.2, durationSeconds: 40, focus: 'Isometria', attributes: ['control'] },
  { id: 'explosive-crunch-5', prerequisiteId: 'crunch-20', title: '5 abdominais explosivos', description: explosiveCrunchDescription, difficulty: 3.1, repetitions: 5, focus: 'Explosão', attributes: ['power'] },
  { id: 'explosive-crunch-10', prerequisiteId: 'explosive-crunch-5', title: '10 abdominais explosivos', description: explosiveCrunchDescription, difficulty: 3.7, repetitions: 10, focus: 'Explosão', attributes: ['power'] },
];

export const exerciseCount = exercises.length;

export function getExerciseTitle(node: ExerciseNode) {
  return node.durationSeconds === undefined ? node.title : `${node.title} · ${node.durationSeconds} s`;
}

export function getExercise(id: string) {
  return exercises.find((node) => node.id === id);
}

export function isExerciseAvailable(node: ExerciseNode, completedIds: readonly string[]) {
  return !completedIds.includes(node.id) && (
    node.prerequisiteId === startNodeId || completedIds.includes(node.prerequisiteId)
  );
}

export function readCompletedExercises(storedValue: string | null): string[] {
  const storedIds: unknown = storedValue === null ? [] : JSON.parse(storedValue);

  if (!Array.isArray(storedIds)) {
    throw new Error('O progresso salvo está em um formato inválido.');
  }

  return exercises.filter((node) => storedIds.includes(node.id)).map((node) => node.id);
}
