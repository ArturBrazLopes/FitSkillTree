import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { isExerciseAvailable, readCompletedExercises, type ExerciseNode } from './exercises';

const progressKey = 'fit-tech-tree:completed-exercises:v2';

function useProgressStore() {
  const [completedIds, setCompletedIds] = useState<string[] | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [failedSaveId, setFailedSaveId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetFailed, setResetFailed] = useState(false);
  const currentIds = useRef<string[] | null>(null);
  const writing = useRef(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(progressKey).then(readCompletedExercises).then((ids) => {
      if (!active) return;
      currentIds.current = ids;
      setCompletedIds(ids);
    }).catch(() => {
      if (active) setLoadFailed(true);
    });
    return () => { active = false; };
  }, [loadAttempt]);

  function retryLoad() {
    setLoadFailed(false);
    setLoadAttempt((attempt) => attempt + 1);
  }

  async function completeExercise(node: ExerciseNode) {
    const before = currentIds.current;
    if (!before || writing.current || !isExerciseAvailable(node, before)) return null;

    writing.current = true;
    setSavingId(node.id);
    setFailedSaveId(null);
    const after = [...before, node.id];
    try {
      await AsyncStorage.setItem(progressKey, JSON.stringify(after));
      currentIds.current = after;
      setCompletedIds(after);
      return { before, after };
    } catch {
      setFailedSaveId(node.id);
      return null;
    } finally {
      writing.current = false;
      setSavingId(null);
    }
  }

  async function resetProgress() {
    if (writing.current) return;
    writing.current = true;
    setResetting(true);
    setResetFailed(false);
    try {
      await AsyncStorage.removeItem(progressKey);
      const ids: string[] = [];
      currentIds.current = ids;
      setCompletedIds(ids);
      setFailedSaveId(null);
    } catch {
      setResetFailed(true);
    } finally {
      writing.current = false;
      setResetting(false);
    }
  }

  return { completedIds, loadFailed, retryLoad, failedSaveId, savingId, resetting, resetFailed, completeExercise, resetProgress };
}

const ChallengeProgressContext = createContext<ReturnType<typeof useProgressStore> | null>(null);

export function ChallengeProgressProvider({ children }: { children: ReactNode }) {
  const progress = useProgressStore();
  return <ChallengeProgressContext.Provider value={progress}>{children}</ChallengeProgressContext.Provider>;
}

export function useChallengeProgress() {
  const progress = useContext(ChallengeProgressContext);
  if (!progress) throw new Error('ChallengeProgressProvider is required.');
  return progress;
}
