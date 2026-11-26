import type { CameraView } from 'expo-camera';
import { File } from 'expo-file-system';

import type { PoseFrame } from './exercise-counter';
import { checkPoseServer, networkPoseGapMs, requestPose } from './pose-server';

const captureIntervalMs = 1000 / 12;

type PoseStreamOptions = {
  address: string;
  getCamera: () => CameraView | null;
  isActive: () => boolean;
  onConnected: () => void;
  onPose: (pose: PoseFrame) => void;
  onPoseLost: () => void;
  onConnectionFailed: () => void;
  onCameraFailed: () => void;
};

function discardPhoto(photo: File) {
  try {
    if (photo.exists) photo.delete();
  } catch {
    console.warn('Não foi possível remover a foto temporária do cache.');
  }
}

export function startPoseStream({ address, getCamera, isActive, onConnected, onPose,
  onPoseLost, onConnectionFailed, onCameraFailed }: PoseStreamOptions) {
  let pendingRequest: AbortController | undefined;
  let stopped = false;
  let nextFrame: ReturnType<typeof setTimeout> | undefined;
  let latest: { photo: File; timestamp: number } | undefined;
  let sending = false;
  let missedFrames = 0;
  let captureFailures = 0;

  function stop() {
    stopped = true;
    pendingRequest?.abort();
    clearTimeout(nextFrame);
    if (latest) discardPhoto(latest.photo);
    latest = undefined;
  }

  async function withTimeout<T>(request: (signal: AbortSignal) => Promise<T>, timeout: number) {
    const connection = new AbortController();
    pendingRequest = connection;
    const timer = setTimeout(() => connection.abort(), timeout);
    try {
      return await request(connection.signal);
    } finally {
      clearTimeout(timer);
      pendingRequest = undefined;
    }
  }

  function disconnect() {
    if (stopped || !isActive()) return;
    stop();
    onConnectionFailed();
  }

  async function sendLatest() {
    if (stopped || !isActive() || sending || !latest) return;
    const { photo, timestamp } = latest;
    latest = undefined;
    sending = true;
    try {
      const pose = await withTimeout((signal) => requestPose(address, photo, timestamp, signal), 4000);
      if (stopped || !isActive()) return;
      missedFrames = 0;
      if (performance.now() - timestamp <= networkPoseGapMs) onPose(pose);
      else onPoseLost();
    } catch {
      if (stopped || !isActive()) return;
      missedFrames += 1;
      if (missedFrames >= 3) disconnect();
      else onPoseLost();
    } finally {
      discardPhoto(photo);
      sending = false;
      void sendLatest();
    }
  }

  async function capture() {
    const camera = getCamera();
    if (stopped || !isActive() || !camera) return;
    const timestamp = performance.now();
    let delay = captureIntervalMs;
    try {
      const result = await camera.takePictureAsync({ quality: 0.4, shutterSound: false });
      if (!result) throw new Error('Captura indisponível.');
      const photo = new File(result.uri);
      if (stopped || !isActive()) {
        discardPhoto(photo);
        return;
      }
      captureFailures = 0;
      if (latest) discardPhoto(latest.photo);
      latest = { photo, timestamp };
      void sendLatest();
    } catch {
      if (stopped || !isActive()) return;
      captureFailures += 1;
      if (captureFailures >= 3) {
        stop();
        onCameraFailed();
        return;
      }
      delay = 350;
    }
    nextFrame = setTimeout(() => { void capture(); }, Math.max(0, delay - (performance.now() - timestamp)));
  }

  void withTimeout((signal) => checkPoseServer(address, signal), 30000).then(() => {
    if (stopped || !isActive()) return;
    onConnected();
    void capture();
  }).catch(disconnect);

  return stop;
}
