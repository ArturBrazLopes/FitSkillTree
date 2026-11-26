import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../features/app-theme';
import { ActionButton } from '../features/app-ui';
import { getCompletionRewards, type CompletionRewards } from '../features/skills/progression';
import { ChallengeDetails } from '../features/tech-tree/challenge-details';
import { useChallengeProgress } from '../features/tech-tree/challenge-progress';
import { exerciseCount, exercises, getExercise, getExerciseTitle, isExerciseAvailable, type ExerciseNode } from '../features/tech-tree/exercises';
import { TreeMap } from '../features/tech-tree/tree-map';

export default function TreeScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { completedIds, loadFailed, retryLoad, failedSaveId, savingId, resetting, resetFailed,
    completeExercise, resetProgress } = useChallengeProgress();
  const [openId, setOpenId] = useState<string | null>(null);
  const [reward, setReward] = useState<CompletionRewards | null>(null);

  async function finishExercise(node: ExerciseNode) {
    const result = await completeExercise(node);
    if (result) setReward(getCompletionRewards(exercises, result.before, result.after));
  }

  function closeChallenge() {
    setOpenId(null);
    setReward(null);
  }

  function confirmReset() {
    Alert.alert('Reiniciar progresso?', 'O progresso de todos os exercícios será apagado.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reiniciar', style: 'destructive', onPress: () => { void resetProgress(); } },
    ]);
  }

  const count = completedIds?.length ?? 0;
  const next = completedIds && exercises.find((node) => isExerciseAvailable(node, completedIds));
  const resetDisabled = count === 0 || savingId !== null || resetting;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Desafios</Text>
            <Text accessibilityLiveRegion="polite" style={[styles.progressLabel, { color: loadFailed ? colors.error : colors.muted }]}>
              {loadFailed ? 'Falha ao carregar o progresso.' : completedIds === null
                ? 'Carregando progresso…'
                : resetting ? 'Reiniciando progresso…' : `${count} de ${exerciseCount} desafios concluídos`}
            </Text>
          </View>
          {loadFailed && <ActionButton label="Tentar novamente" variant="secondary" onPress={retryLoad} />}
          {next && (
            <ActionButton accessibilityLabel={`Próximo desafio: ${getExerciseTitle(next)}`} label="Próximo" icon="arrow"
              variant="secondary" disabled={resetting} onPress={() => setOpenId(next.id)} />
          )}
        </View>
        <TreeMap completedIds={completedIds} onOpen={setOpenId} onReset={confirmReset} resetDisabled={resetDisabled} />
        {resetFailed && (
          <Text accessibilityRole="alert" style={[styles.resetError, { color: colors.error }]}>
            Falha ao reiniciar o progresso. Tente novamente.
          </Text>
        )}
      </View>

      {openId !== null && (
        <ChallengeDetails
          key={openId}
          node={getExercise(openId)}
          completedIds={completedIds}
          saving={savingId !== null || resetting}
          saveFailed={failedSaveId === openId}
          reward={reward}
          onClose={closeChallenge}
          onViewSkills={() => {
            closeChallenge();
            router.navigate('/habilidades');
          }}
          onComplete={(node) => { void finishExercise(node); }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  heading: { flexGrow: 1, flexShrink: 1, minWidth: 140, gap: 2 },
  title: { fontSize: 36, fontWeight: '700', letterSpacing: -1.5 },
  progressLabel: { fontSize: 14, lineHeight: 20, fontVariant: ['tabular-nums'] },
  resetError: { paddingHorizontal: 20, paddingBottom: 12, fontSize: 14 },
});
