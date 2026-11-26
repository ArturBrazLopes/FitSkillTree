import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../app-theme';
import { Icon } from '../app-ui';
import { getSkillSheet, pointsPerLevel, skillAttributes } from './progression';

function ProgressBar({ label, value, total }: { label: string; value: number; total: number }) {
  const { colors } = useAppTheme();
  const width = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: value }} style={[styles.track, { backgroundColor: colors.pressed }]}>
      <View style={[styles.fill, { width: `${width}%`, backgroundColor: colors.completed }]} />
    </View>
  );
}

export function SkillSheet({ sheet, challengeCount }: { sheet: ReturnType<typeof getSkillSheet>; challengeCount: number }) {
  const { colors } = useAppTheme();
  const unlockedCount = sheet.achievements.filter((item) => item.unlocked).length;

  return (
    <>
      <View style={[styles.levelCard, { backgroundColor: colors.completedSurface, borderColor: colors.border }]}>
        <View style={styles.levelRow}>
          <Icon name="skills" color={colors.completed} size={32} />
          <View style={styles.levelText}>
            <Text accessibilityRole="header" style={[styles.level, { color: colors.text }]}>Nível {sheet.level}</Text>
            <Text style={[styles.body, { color: colors.muted }]}>Desafios concluídos · {sheet.completedCount} de {challengeCount}</Text>
          </View>
        </View>
        {sheet.completedCount === challengeCount ? (
          <Text style={[styles.body, { color: colors.muted }]}>Todos os desafios concluídos.</Text>
        ) : (
          <>
            <ProgressBar label={`Progresso para o nível ${sheet.level + 1}`} value={sheet.levelPoints} total={pointsPerLevel} />
            <Text style={[styles.body, { color: colors.muted }]}>{sheet.levelPoints} de {pointsPerLevel} pontos para o nível {sheet.level + 1}</Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>Atributos</Text>
        <Text style={[styles.body, { color: colors.muted }]}>Cada ponto acrescenta +1% ao atributo no jogo. As barras mostram o avanço nos desafios.</Text>
        <View style={[styles.attributeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {skillAttributes.map(({ id, label }) => (
            <View key={id} style={styles.attribute}>
              <View style={styles.attributeRow}>
                <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.gain, { color: colors.completed }]}>+{sheet.points[id]}% desde o início</Text>
              </View>
              <ProgressBar label={`Progresso de ${label} nos desafios`} value={sheet.points[id]} total={sheet.availablePoints[id]} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.attributeRow}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>Conquistas</Text>
          <Text style={[styles.gain, { color: colors.muted }]}>{unlockedCount} de {sheet.achievements.length}</Text>
        </View>
        {sheet.achievements.map((item) => (
          <View key={item.id} style={[styles.achievement, { backgroundColor: item.unlocked ? colors.completedSurface : colors.surface,
            borderColor: colors.border }]}>
            <Icon name={item.unlocked ? 'check' : 'lock'} color={item.unlocked ? colors.completed : colors.muted} size={21} />
            <View style={styles.achievementText}>
              <Text accessibilityLabel={item.unlocked ? item.name : `${item.name}, bloqueada`}
                style={[styles.label, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.body, { color: item.unlocked ? colors.completed : colors.muted }]}>
                {item.unlocked ? 'Desbloqueada' : item.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  levelCard: { gap: 10, padding: 18, borderWidth: 1, borderRadius: 18 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelText: { flex: 1, gap: 2 },
  level: { fontSize: 29, fontWeight: '800', letterSpacing: -0.7 },
  body: { fontSize: 14, lineHeight: 20 },
  track: { height: 7, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  section: { gap: 10 },
  heading: { fontSize: 22, fontWeight: '800', flexShrink: 1 },
  attributeCard: { padding: 16, borderWidth: 1, borderRadius: 16, gap: 16 },
  attribute: { gap: 7 },
  attributeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between' },
  label: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  gain: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  achievement: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  achievementText: { flex: 1, gap: 3 },
});
