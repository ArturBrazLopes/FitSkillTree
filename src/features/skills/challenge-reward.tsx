import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../app-theme';
import { ActionButton, Icon } from '../app-ui';
import type { CompletionRewards } from './progression';

export function ChallengeReward({ title, reward, onClose, onViewSkills }: {
  title: string;
  reward: CompletionRewards;
  onClose: () => void;
  onViewSkills: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.summary}>
      <View style={styles.header}>
        <Icon name="check" color={colors.completed} size={28} />
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Desafio concluído</Text>
      </View>
      <Text style={[styles.body, { color: colors.muted }]}>{title}</Text>

      <View style={styles.gains}>
        {reward.gains.map((gain) => (
          <Text key={gain.id} style={[styles.gain, { color: colors.completed, backgroundColor: colors.completedSurface }]}>
            {gain.label} +{gain.points}%
          </Text>
        ))}
      </View>

      {reward.newLevel !== null && <Text style={[styles.highlight, { color: colors.text }]}>Nível {reward.newLevel} alcançado</Text>}
      {reward.newAchievements.length > 0 && (
        <View style={styles.achievements}>
          <Text style={[styles.body, { color: colors.muted }]}>
            {reward.newAchievements.length === 1 ? 'Conquista desbloqueada' : 'Conquistas desbloqueadas'}
          </Text>
          {reward.newAchievements.map((item) => (
            <View key={item.id} style={styles.header}>
              <Icon name="skills" color={colors.completed} />
              <Text style={[styles.highlight, { color: colors.text }]}>{item.name}</Text>
            </View>
          ))}
        </View>
      )}

      <ActionButton label="Ver Habilidades" icon="skills" onPress={onViewSkills} />
      <ActionButton label="Voltar aos desafios" variant="secondary" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flexShrink: 1, fontSize: 27, fontWeight: '800', letterSpacing: -0.7 },
  body: { fontSize: 15, lineHeight: 22 },
  gains: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gain: { borderRadius: 10, fontSize: 16, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 8 },
  achievements: { gap: 5 },
  highlight: { flexShrink: 1, fontSize: 17, fontWeight: '700' },
});
