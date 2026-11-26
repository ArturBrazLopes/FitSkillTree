import Constants from 'expo-constants';
import type { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';

import type { PoseFrame, WorldLandmark } from './exercise-counter';

export const networkPoseGapMs = 1400;

export function getMetroPoseUrl() {
  if (!__DEV__) return null;
  const bundleUrl = Constants.manifest2?.launchAsset?.url;
  if (!bundleUrl) return null;
  try {
    const url = new URL(bundleUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? `${url.origin}/_fittechtree` : null;
  } catch {
    return null;
  }
}

export async function checkPoseServer(url: string, signal: AbortSignal) {
  const response = await fetch(`${url}/health`, { signal, redirect: 'error' });
  if (!response.ok || (await response.json())?.service !== 'fittechtree-pose') {
    throw new Error('Servidor de pose indisponível.');
  }
}

export async function requestPose(url: string, photo: File, timestampMs: number, signal: AbortSignal): Promise<PoseFrame> {
  const response = await fetch(`${url}/pose`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg' },
    body: await photo.arrayBuffer(),
    signal,
    redirect: 'error',
  });
  if (!response.ok) throw new Error('Falha na análise de pose.');
  const pose = await response.json();
  if (!Number.isFinite(pose?.aspectRatio) || pose.aspectRatio <= 0 ||
      !Array.isArray(pose.landmarks) || ![0, 33].includes(pose.landmarks.length) ||
      !pose.landmarks.every((point: PoseFrame['landmarks'][number] | null) =>
        point && [point.x, point.y, point.visibility].every(Number.isFinite))) {
    throw new Error('Resposta de pose inválida.');
  }
  const world = pose.worldLandmarks;
  const worldLandmarks = Array.isArray(world) && world.length === 33 && world.every((point: WorldLandmark | null) =>
    point && [point.x, point.y, point.z].every(Number.isFinite)) ? world : undefined;
  return { timestampMs, aspectRatio: pose.aspectRatio, landmarks: pose.landmarks, worldLandmarks };
}
