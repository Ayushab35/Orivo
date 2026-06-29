import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ThemeName, ThemeColors } from './theme';

type Ctx = {
  theme: ThemeName;
  c: ThemeColors;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeCtx = createContext<Ctx>({ theme: 'light', c: colors.light, setTheme: () => {}, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [theme, setThemeState] = useState<ThemeName>('light');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('orivo.theme');
      if (saved === 'light' || saved === 'dark') setThemeState(saved);
      else if (system === 'dark') setThemeState('dark');
    })();
  }, [system]);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    AsyncStorage.setItem('orivo.theme', t);
  };
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <ThemeCtx.Provider value={{ theme, c: colors[theme], setTheme, toggleTheme }}>{children}</ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
