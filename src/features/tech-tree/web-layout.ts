import { startNodeId } from './exercises';
import { board, type Point } from './map-camera';

type Placement = [id: string, radius: number, offset?: number];

const tracks: { title: string; angle: number; label: Point; nodes: Placement[] }[] = [
  {
    title: 'Flexões',
    angle: -90,
    label: { x: 376, y: 45 },
    nodes: [
      ['knee-1', 94],
      ['knee-5', 178],
      ['knee-10', 262],
      ['standard-1', 346],
      ['standard-5', 346, 16],
      ['standard-10', 430, 16],
      ['archer-1', 514, -7],
      ['standard-15', 514, 16],
      ['explosive-1', 514, 38],
    ],
  },
  {
    title: 'Agachamentos',
    angle: 150,
    label: { x: 163, y: 860 },
    nodes: [
      ['squat-5', 94],
      ['squat-10', 178],
      ['squat-15', 262],
      ['squat-20', 346],
      ['squat-25', 430],
      ['squat-30', 514],
      ['wall-sit-20', 334, -23],
      ['wall-sit-40', 431, -27],
      ['jump-squat-5', 403, 22],
      ['jump-squat-10', 492, 25],
    ],
  },
  {
    title: 'Abdominais',
    angle: 30,
    label: { x: 947, y: 860 },
    nodes: [
      ['crunch-5', 94],
      ['crunch-10', 178],
      ['crunch-15', 262],
      ['crunch-20', 346],
      ['crunch-25', 430],
      ['crunch-30', 514],
      ['plank-20', 334, 23],
      ['plank-40', 431, 27],
      ['explosive-crunch-5', 403, -22],
      ['explosive-crunch-10', 492, -25],
    ],
  },
];

export const webCenter = { x: board.width / 2, y: board.height / 2 };

function pointAt(radius: number, angle: number): Point {
  const radians = angle * Math.PI / 180;
  return {
    x: webCenter.x + radius * Math.cos(radians),
    y: webCenter.y + radius * Math.sin(radians),
  };
}

export const webLabels = tracks.map(({ title, label }) => ({ title, ...label }));

export const webPositions = new Map<string, Point>([[startNodeId, webCenter]]);

for (const { angle, nodes } of tracks) {
  for (const [id, radius, offset = 0] of nodes) {
    webPositions.set(id, pointAt(radius, angle + offset));
  }
}
