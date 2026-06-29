import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ThemeName, ThemeColors } from './theme';

type Ctx = {
  theme: ThemeName;
  c: ThemeColors;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
};

const Default = colors.dark;
const ThemeCtx = createContext<Ctx>({ theme: 'dark', c: Default, setTheme: () => {}, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('orivo.theme');
      if (saved === 'light' || saved === 'dark') setThemeState(saved);
    })();
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    AsyncStorage.setItem('orivo.theme', t);
  };
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return <ThemeCtx.Provider value={{ theme, c: colors[theme], setTheme, toggleTheme }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
