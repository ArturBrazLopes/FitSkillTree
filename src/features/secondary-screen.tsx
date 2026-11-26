import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from './app-theme';
import { ActionButton, Icon, ScreenHeading, type IconName } from './app-ui';

export function SecondaryScreen({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeading title={title} />
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function EmptyState({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <View style={styles.empty}>
      <Icon name={icon} color={colors.completed} size={32} />
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      <ActionButton label="Explorar desafios" icon="arrow" variant="secondary" onPress={() => router.navigate('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 16, paddingTop: 24, gap: 24 },
  empty: { alignItems: 'center', gap: 16, paddingHorizontal: 12, paddingVertical: 40 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  description: { maxWidth: 340, fontSize: 16, lineHeight: 24, textAlign: 'center' },
});
