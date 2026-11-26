import { useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useAppTheme } from '../features/app-theme';
import { Icon } from '../features/app-ui';
import { SecondaryScreen } from '../features/secondary-screen';

export default function SettingsScreen() {
  const { colors, darkMode, themeReady, setDarkMode } = useAppTheme();
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function changeTheme(enabled: boolean) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setFailed(false);
    try {
      await setDarkMode(enabled);
    } catch {
      setFailed(true);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <SecondaryScreen title="Ajustes">
      <View style={styles.appearance}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Aparência</Text>
        <View style={[styles.setting, { borderTopColor: colors.border }]}>
          <Icon name="moon" color={colors.completed} />
          <View style={styles.settingText}>
            <Text style={[styles.label, { color: colors.text }]}>Modo escuro</Text>
            <Text accessibilityLiveRegion="polite" style={[styles.description, { color: colors.muted }]}>
              {busy ? 'Salvando preferência…' : !themeReady ? 'Carregando tema…' : darkMode ? 'Ativado' : 'Desativado'}
            </Text>
          </View>
          <Switch accessibilityLabel="Modo escuro" value={darkMode} disabled={busy || !themeReady}
            hitSlop={8} trackColor={{ false: colors.locked, true: colors.completed }} onValueChange={changeTheme} />
        </View>
        {failed && <Text accessibilityRole="alert" style={{ color: colors.error }}>Falha ao salvar o tema. Tente novamente.</Text>}
      </View>
    </SecondaryScreen>
  );
}

const styles = StyleSheet.create({
  appearance: { gap: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '700' },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: 1 },
  settingText: { flex: 1, gap: 4 },
  label: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 14 },
});
