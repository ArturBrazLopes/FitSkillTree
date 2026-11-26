import type { CameraView } from 'expo-camera';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { advanceFloorCounter, advanceSquatCounter, resetFloorCounter, resetSquatCounter,
  type PoseFrame, type PoseLandmark } from './exercise-counter';
import type { ExerciseNode } from './exercises';
import { fitPoseToPreview } from './pose-camera-preview';
import { getMetroPoseUrl, networkPoseGapMs } from './pose-server';
import { startPoseStream } from './pose-stream';

type TrackingOptions = {
  exercise: ExerciseNode['tracking'];
  target: number | undefined;
  enabled: boolean;
  camera: RefObject<CameraView | null>;
  active: RefObject<boolean>;
  failCamera: () => void;
};

type TrackingProgress = { repetitions: number; status: 'positioning' | 'ready' | 'active'; detail?: string };

export function useChallengeTracking({ exercise, target, enabled, camera, active, failCamera }: TrackingOptions) {
  const [serverUrl] = useState(() => target === undefined ? null : getMetroPoseUrl());
  const [serverError, setServerError] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const previewAspect = useRef(1);
  const squatCounter = useRef(resetSquatCounter());
  const floorCounter = useRef(resetFloorCounter());
  const poseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fpsWindow = useRef<{ start: number; frames: number } | null>(null);
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([]);
  const [analysisFps, setAnalysisFps] = useState<number | null>(null);
  const [progress, setProgress] = useState<TrackingProgress>({ repetitions: 0, status: 'positioning' });
  const goalReached = target !== undefined && progress.repetitions >= target;

  const clearPoseTimer = useCallback(() => {
    if (poseTimer.current !== null) clearTimeout(poseTimer.current);
    poseTimer.current = null;
  }, []);

  const losePose = useCallback(() => {
    clearPoseTimer();
    squatCounter.current = resetSquatCounter(squatCounter.current.repetitions);
    floorCounter.current = resetFloorCounter(floorCounter.current.repetitions);
    fpsWindow.current = null;
    setAnalysisFps(null);
    setLandmarks((points) => points.length === 0 ? points : []);
    setProgress((current) => current.status === 'positioning' && !current.detail
      ? current : { repetitions: current.repetitions, status: 'positioning' });
  }, [clearPoseTimer]);

  const handlePose = useCallback((pose: PoseFrame) => {
    if (!active.current || target === undefined || !exercise) return;
    clearPoseTimer();
    poseTimer.current = setTimeout(losePose, networkPoseGapMs);
    const now = performance.now();
    const window = fpsWindow.current;
    if (!window) fpsWindow.current = { start: now, frames: 0 };
    else {
      window.frames += 1;
      const elapsed = now - window.start;
      if (elapsed >= 1000) {
        setAnalysisFps(window.frames * 1000 / elapsed);
        fpsWindow.current = { start: now, frames: 0 };
      }
    }

    const frame = fitPoseToPreview(pose, previewAspect.current);
    setLandmarks(frame.landmarks);
    let next: TrackingProgress;
    if (exercise === 'squat') {
      if (squatCounter.current.repetitions >= target) return;
      const result = advanceSquatCounter(squatCounter.current, frame, networkPoseGapMs);
      squatCounter.current = result;
      next = { repetitions: result.repetitions, status: result.phase === 'bottom' ? 'active'
        : result.phase === 'standing' ? 'ready' : 'positioning' };
    } else {
      if (floorCounter.current.repetitions >= target) return;
      // The portrait preview can crop joints that are still available to the detector.
      const result = advanceFloorCounter(floorCounter.current, pose, exercise, networkPoseGapMs);
      floorCounter.current = result;
      next = { repetitions: result.repetitions, status: result.phase, detail: result.detail };
    }
    setProgress((current) => current.status === next.status && current.repetitions === next.repetitions && current.detail === next.detail
      ? current : next);
  }, [active, clearPoseTimer, exercise, losePose, target]);

  useEffect(() => {
    if (!serverUrl || goalReached) return;
    if (!enabled) {
      losePose();
      setConnected(false);
      return;
    }

    setServerError('');
    const stop = startPoseStream({
      address: serverUrl,
      getCamera: () => camera.current,
      isActive: () => active.current,
      onConnected: () => setConnected(true),
      onPose: handlePose,
      onPoseLost: losePose,
      onConnectionFailed: () => {
        losePose();
        setConnected(false);
        setServerError('O detector no PC não respondeu. Confira o terminal do Expo e tente novamente.');
      },
      onCameraFailed: failCamera,
    });
    return () => {
      stop();
      clearPoseTimer();
    };
  }, [active, camera, clearPoseTimer, connectionAttempt, enabled, failCamera, goalReached, handlePose, losePose, serverUrl]);

  return { progress, goalReached, connected, serverUrl, serverError, landmarks, analysisFps, previewAspect,
    reconnect: () => setConnectionAttempt((count) => count + 1) };
}
