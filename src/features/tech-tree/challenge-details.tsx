import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../app-theme';
import { ActionButton } from '../app-ui';
import { ChallengeReward } from '../skills/challenge-reward';
import type { CompletionRewards } from '../skills/progression';
import { ChallengeCamera } from './challenge-camera';
import { getChallengeStatus, StatusLabel, useStatusColors } from './challenge-status';
import { getExercise, getExerciseTitle, type ExerciseNode } from './exercises';

type ChallengeDetailsProps = {
  node?: ExerciseNode;
  completedIds: readonly string[] | null;
  saving: boolean;
  saveFailed: boolean;
  reward: CompletionRewards | null;
  onClose: () => void;
  onViewSkills: () => void;
  onComplete: (node: ExerciseNode) => void;
};

const difficultyFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function ChallengeDetails({ node, completedIds, saving, saveFailed, reward, onClose, onViewSkills, onComplete }: ChallengeDetailsProps) {
  const { colors } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const [started, setStarted] = useState(false);
  const cameraOpen = started && !reward;
  const status = getChallengeStatus(node, completedIds);
  const { background: statusBackground } = useStatusColors(status);
  const prerequisite = node && getExercise(node.prerequisiteId);
  const requirementMet = prerequisite && completedIds?.includes(prerequisite.id);

  function goBack() {
    if (saving) return;
    if (cameraOpen) setStarted(false);
    else onClose();
  }

  return (
    <Modal transparent statusBarTranslucent={cameraOpen} navigationBarTranslucent={cameraOpen}
      animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={goBack}>
      {cameraOpen && node ? (
        <ChallengeCamera
          key={node.id}
          node={node}
          saving={saving}
          saveFailed={saveFailed}
          onBack={goBack}
          onComplete={() => onComplete(node)}
        />
      ) : (
        <SafeAreaView style={[styles.overlay, { backgroundColor: colors.backdrop }]}>
          <Pressable accessible={false} focusable={false} importantForAccessibility="no" onPress={onClose} style={StyleSheet.absoluteFill} />
          <View accessibilityViewIsModal style={[styles.popup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ScrollView bounces={false} contentContainerStyle={styles.content}>
              {reward && node ? (
                <ChallengeReward title={getExerciseTitle(node)} reward={reward} onClose={onClose} onViewSkills={onViewSkills} />
              ) : (
                <>
                  <View style={styles.header}>
                    <View style={[styles.status, { backgroundColor: statusBackground }]}>
                      <StatusLabel status={status} />
                    </View>
                    <ActionButton accessibilityLabel="Fechar detalhes" icon="close" variant="quiet" onPress={onClose} />
                  </View>
                  <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{node ? getExerciseTitle(node) : 'Início'}</Text>
                  <Text style={[styles.description, { color: colors.muted }]}>
                    {node?.description ?? 'Escolha um desafio disponível para começar.'}
                  </Text>

                  {node && (
                    <>
                      {node.focus && <Text style={[styles.focus, { color: colors.muted }]}>Foco em {node.focus.toLocaleLowerCase('pt-BR')}</Text>}
                      <View style={[styles.section, { borderTopColor: colors.border }]}>
                        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Pré-requisito</Text>
                        <Text style={[styles.body, { color: colors.muted }]}>
                          {prerequisite ? getExerciseTitle(prerequisite) : 'Nenhum exercício anterior.'}
                        </Text>
                        {prerequisite && completedIds !== null && (
                          <Text style={[styles.body, { color: requirementMet ? colors.completed : colors.muted }]}>
                            {requirementMet ? 'Concluído' : 'Conclua este exercício para liberar o desafio.'}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.section, { borderTopColor: colors.border }]}>
                        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Dificuldade</Text>
                        <Text style={[styles.body, { color: colors.muted }]}>{difficultyFormat.format(node.difficulty)} de 5</Text>
                      </View>

                      {status === 'available' && <ActionButton label="Iniciar desafio" icon="play"
                        disabled={saving} onPress={() => setStarted(true)} />}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  popup: { width: '100%', maxWidth: 480, maxHeight: '92%', flexShrink: 1, borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  content: { padding: 20, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  status: { borderRadius: 12, padding: 8, flexShrink: 1 },
  title: { fontSize: 29, fontWeight: '700', letterSpacing: -0.8 },
  description: { fontSize: 16, lineHeight: 24 },
  focus: { fontSize: 14, fontWeight: '700' },
  section: { borderTopWidth: 1, paddingTop: 12, gap: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
});
