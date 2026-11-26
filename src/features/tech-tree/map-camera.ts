export const board = { width: 1110, height: 1110 };

export type Size = { width: number; height: number };
export type Point = { x: number; y: number };
export type Camera = Point & { zoom: number; angle: number };

export function fitBoard({ width, height }: Size): Camera {
  'worklet';
  if (width <= 0 || height <= 0) return { x: 0, y: 0, zoom: 1, angle: 0 };

  const inset = Math.min(16, width * 0.08, height * 0.08);
  const zoom = Math.min((width - 2 * inset) / board.width, (height - 2 * inset) / board.height, 1.2);
  return { x: (width - board.width * zoom) / 2, y: (height - board.height * zoom) / 2, zoom, angle: 0 };
}

export function keepBoardInReach(camera: Camera, viewport: Size): Camera {
  'worklet';
  const cosine = Math.cos(camera.angle) * camera.zoom;
  const sine = Math.sin(camera.angle) * camera.zoom;
  const widthX = board.width * cosine;
  const widthY = board.width * sine;
  const heightX = -board.height * sine;
  const heightY = board.height * cosine;
  const minX = Math.min(0, widthX) + Math.min(0, heightX);
  const maxX = Math.max(0, widthX) + Math.max(0, heightX);
  const minY = Math.min(0, widthY) + Math.min(0, heightY);
  const maxY = Math.max(0, widthY) + Math.max(0, heightY);
  const marginX = Math.min(86 * camera.zoom, viewport.width / 2);
  const marginY = Math.min(86 * camera.zoom, viewport.height / 2);

  return {
    ...camera,
    x: Math.min(viewport.width - marginX - minX, Math.max(marginX - maxX, camera.x)),
    y: Math.min(viewport.height - marginY - minY, Math.max(marginY - maxY, camera.y)),
  };
}

export function transformAt(camera: Camera, from: Point, to: Point, scale: number, turn: number, viewport: Size): Camera {
  'worklet';
  const minZoom = Math.min(0.35, fitBoard(viewport).zoom);
  const zoom = Math.min(3, Math.max(minZoom, camera.zoom * scale));
  const ratio = zoom / camera.zoom;
  const x = (camera.x - from.x) * ratio;
  const y = (camera.y - from.y) * ratio;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);

  return {
    x: to.x + x * cos - y * sin,
    y: to.y + x * sin + y * cos,
    zoom,
    angle: (camera.angle + turn) % (2 * Math.PI),
  };
}
