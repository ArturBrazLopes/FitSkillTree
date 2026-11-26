import { type CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';

export function useChallengeCamera() {
  const [permission, requestPermission, refreshPermission] = useCameraPermissions();
  const requestedPermission = useRef(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const active = useRef(AppState.currentState === null || AppState.currentState === 'active');
  const [foreground, setForeground] = useState(active.current);
  const camera = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const failCamera = useCallback(() => {
    setCameraReady(false);
    setCameraFailed(true);
  }, []);

  const askForPermission = useCallback(() => {
    requestedPermission.current = true;
    setRequesting(true);
    void requestPermission().catch(failCamera).finally(() => setRequesting(false));
  }, [failCamera, requestPermission]);

  useEffect(() => {
    if (permission?.status === 'undetermined' && !requestedPermission.current) askForPermission();
  }, [permission?.status, askForPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      active.current = state === 'active';
      setForeground(active.current);
      if (active.current) void refreshPermission().catch(failCamera);
      else setCameraReady(false);
    });
    return () => subscription.remove();
  }, [failCamera, refreshPermission]);

  function retryCamera() {
    setCameraFailed(false);
    if (permission?.granted) return;
    if (permission?.canAskAgain === false) {
      void Linking.openSettings().catch(failCamera);
      return;
    }
    askForPermission();
  }

  const checkingPermission = !cameraFailed && (permission === null || requesting
    || (permission.status === 'undetermined' && !requestedPermission.current));
  const showingCamera = permission?.granted === true && !cameraFailed && foreground;

  return { camera, active, permission, cameraFailed, checkingPermission, showingCamera,
    cameraReady, setCameraReady, failCamera, retryCamera };
}
