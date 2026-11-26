import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../app-theme';
import { Icon, type IconName } from '../app-ui';
import { isExerciseAvailable, type ExerciseNode } from './exercises';

export type ChallengeStatus = 'start' | 'unknown' | 'completed' | 'available' | 'locked';

export function getChallengeStatus(node: ExerciseNode | undefined, completedIds: readonly string[] | null): ChallengeStatus {
  if (!node) return 'start';
  if (completedIds === null) return 'unknown';
  if (completedIds.includes(node.id)) return 'completed';
  return isExerciseAvailable(node, completedIds) ? 'available' : 'locked';
}

export const statusLabels: Record<ChallengeStatus, string> = {
  start: 'Ponto de partida',
  unknown: 'Status indisponível',
  completed: 'Concluído',
  available: 'Disponível',
  locked: 'Bloqueado',
};

export const statusIcons: Record<ChallengeStatus, IconName> = {
  start: 'web',
  unknown: 'minus',
  completed: 'check',
  available: 'play',
  locked: 'lock',
};

export function useStatusColors(status: ChallengeStatus) {
  const { colors } = useAppTheme();
  switch (status) {
    case 'start':
    case 'completed':
      return { foreground: colors.completed, background: colors.completedSurface };
    case 'available':
      return { foreground: colors.available, background: colors.availableSurface };
    default:
      return { foreground: colors.locked, background: colors.lockedSurface };
  }
}

export function StatusLabel({ status }: { status: ChallengeStatus }) {
  const { foreground } = useStatusColors(status);
  return (
    <View style={styles.status}>
      <Icon name={statusIcons[status]} color={foreground} size={16} />
      <Text style={[styles.label, { color: foreground }]}>{statusLabels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  label: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
});
