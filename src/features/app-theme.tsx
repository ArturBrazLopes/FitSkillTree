import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const themeKey = 'fit-tech-tree:dark-mode';

const light = {
  background: '#f5f4ee', surface: '#fbfaf6', text: '#20231e', muted: '#555950', border: '#d8d9ce',
  connector: '#818578', pressed: '#eaece2', focus: '#496442',
  locked: '#5f645a', available: '#354e31', completed: '#446041', error: '#9a3029',
  availableSurface: '#dbe5cf', completedSurface: '#e4e9dc', lockedSurface: '#f5f4ee',
  action: '#354e31', actionPressed: '#435d3c', onAction: '#f8faf3', backdrop: '#1317119e',
};

const dark: typeof light = {
  background: '#171916', surface: '#20231e', text: '#f3f3eb', muted: '#b4b9a9', border: '#373d33',
  connector: '#6d7467', pressed: '#2c3228', focus: '#c1d5af',
  locked: '#a2a798', available: '#d8e9ca', completed: '#bdd1ae', error: '#ffb3a9',
  availableSurface: '#364633', completedSurface: '#2a3628', lockedSurface: '#171916',
  action: '#c1d5af', actionPressed: '#aec79c', onAction: '#20271c', backdrop: '#090b09b3',
};

type AppTheme = {
  colors: typeof light;
  darkMode: boolean;
  themeReady: boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
};

const AppThemeContext = createContext<AppTheme | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, updateDarkMode] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(themeKey)
      .then((value) => { if (active) updateDarkMode(value === 'true'); })
      .catch(() => { /* The app defaults to the light theme if storage is unavailable. */ })
      .finally(() => { if (active) setThemeReady(true); });
    return () => { active = false; };
  }, []);

  async function setDarkMode(enabled: boolean) {
    await AsyncStorage.setItem(themeKey, String(enabled));
    updateDarkMode(enabled);
  }

  const colors = darkMode ? dark : light;
  const baseTheme = darkMode ? DarkTheme : DefaultTheme;

  return (
    <AppThemeContext.Provider value={{ colors, darkMode, themeReady, setDarkMode }}>
      <ThemeProvider value={{ ...baseTheme, colors: {
        ...baseTheme.colors, primary: colors.completed, background: colors.background,
        card: colors.surface, text: colors.text, border: colors.border, notification: colors.error,
      } }}>
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const theme = useContext(AppThemeContext);
  if (!theme) throw new Error('AppThemeProvider is required.');
  return theme;
}
