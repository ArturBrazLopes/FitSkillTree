import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppThemeProvider, useAppTheme } from '../features/app-theme';
import { Icon, type IconName } from '../features/app-ui';
import { ChallengeProgressProvider } from '../features/tech-tree/challenge-progress';

export const unstable_settings = { anchor: 'index' };

const routes = [
  { name: 'index', title: 'Desafios', icon: 'web' },
  { name: 'historico', title: 'Histórico', icon: 'history' },
  { name: 'habilidades', title: 'Habilidades', icon: 'skills' },
  { name: 'configuracoes', title: 'Ajustes', icon: 'settings' },
] satisfies { name: string; title: string; icon: IconName }[];

function AppTabs() {
  const { darkMode, colors } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();

  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Tabs
        backBehavior="initialRoute"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.completed,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            height: Math.max(60, Math.ceil(32 + 26 * fontScale)) + bottom,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          tabBarItemStyle: styles.tab,
          tabBarLabel: ({ color, children }) => <Text style={[styles.tabLabel, { color }]}>{children}</Text>,
        }}
      >
        {routes.map(({ name, title, icon }) => (
          <Tabs.Screen key={name} name={name} options={{
            title,
            tabBarIcon: ({ focused }) => <Icon name={icon} color={focused ? colors.completed : colors.muted} />,
          }} />
        ))}
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <ChallengeProgressProvider>
          <AppTabs />
        </ChallengeProgressProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tab: { minHeight: 48, flex: 1, marginHorizontal: 2, borderRadius: 8 },
  tabLabel: { flexShrink: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
});
