export type ThemeName = 'light' | 'dark';

export const colors = {
  light: {
    bg: '#FAF6EF',
    surface: '#FFFFFF',
    surfaceAlt: '#F4EFE2',
    primary: '#1C2541',
    primaryInk: '#FFFFFF',
    teal: '#0F6E56',
    gold: '#BD8B2E',
    goldInk: '#FFFFFF',
    terracotta: '#C17A52',
    textPrimary: '#2B2A28',
    textSecondary: '#6E6A62',
    border: '#E4DFD3',
    overlay: 'rgba(28, 37, 65, 0.06)',
    danger: '#C17A52',
  },
  dark: {
    bg: '#11141F',
    surface: '#1A1F30',
    surfaceAlt: '#222840',
    primary: '#E9ECF5',
    primaryInk: '#11141F',
    teal: '#3FB48E',
    gold: '#D9A53D',
    goldInk: '#11141F',
    terracotta: '#D89271',
    textPrimary: '#F4F1E8',
    textSecondary: '#9C9684',
    border: '#2D3447',
    overlay: 'rgba(255, 255, 255, 0.04)',
    danger: '#D89271',
  },
} as const;

export type ThemeColors = (typeof colors)['light'];

export const radii = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const fontFamily = {
  // System fallbacks; deliberately not "Inter/Roboto". Use Georgia for display accents.
  display: 'Georgia, "Iowan Old Style", "Apple Garamond", serif',
  body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
};

export const elevation = {
  card: {
    shadowColor: '#1C2541',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
};

export const DISCLAIMER = 'For self-reflection and decision support — not a guarantee of outcomes.';
