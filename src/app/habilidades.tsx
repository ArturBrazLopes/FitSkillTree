import { ActivityIndicator, Text, View } from 'react-native';

import { useAppTheme } from '../features/app-theme';
import { ActionButton } from '../features/app-ui';
import { SecondaryScreen } from '../features/secondary-screen';
import { getSkillSheet } from '../features/skills/progression';
import { SkillSheet } from '../features/skills/skill-sheet';
import { useChallengeProgress } from '../features/tech-tree/challenge-progress';
import { exerciseCount, exercises } from '../features/tech-tree/exercises';

export default function SkillsScreen() {
  const { colors } = useAppTheme();
  const { completedIds, loadFailed, retryLoad } = useChallengeProgress();

  return (
    <SecondaryScreen title="Habilidades">
      {loadFailed ? (
        <View style={{ gap: 12 }}>
          <Text accessibilityRole="alert" style={{ color: colors.error }}>Falha ao carregar o progresso.</Text>
          <ActionButton label="Tentar novamente" variant="secondary" onPress={retryLoad} />
        </View>
      ) : completedIds === null ? (
        <ActivityIndicator accessibilityLabel="Carregando progresso" color={colors.completed} />
      ) : (
        <SkillSheet sheet={getSkillSheet(exercises, completedIds)} challengeCount={exerciseCount} />
      )}
    </SecondaryScreen>
  );
}
