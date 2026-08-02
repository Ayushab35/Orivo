export type ThemeName = 'light' | 'dark';

/**
 * Executive Decision Intelligence palette.
 * Dark-first. Muted, calm, premium. No shiny gold, no purple, no astrology clichés.
 */
export const colors = {
  dark: {
    bg: "#161B26", 
    bgInset: "#121722",

    surface: "#232A3D", 
    surfaceAlt: "#2B334A", 
    surfaceMuted: "#1D2333",

    primary: "#E8EAF2",
    primaryInk: "#161B26",

    teal: "#46B097",
    gold: "#C9A961",
    goldInk: "#161B26",

    terracotta: "#C17A52",

    textPrimary: "#F5F6FA", // slightly brighter
    textSecondary: "#A1A7BB", // was #8A8FA3
    textMuted: "#737A90", // was #5A5F73

    border: "#343C54", // was #262C40
    borderStrong: "#444D68", // was #323954

    overlay: "rgba(255,255,255,0.06)",

    danger: "#D88271",
    positive: "#46B097",
    score: "#C9A961",

    accent: "#8B99FF"
  },
  light: {
    bg: "#F5F4EF",
    bgInset: "#EDEBE2",
    surface: "#FFFFFF",
    surfaceAlt: "#F0EEE5",
    surfaceMuted: "#FAF8F1",
    primary: "#0F111A",
    primaryInk: "#FFFFFF",
    teal: "#0F6E56",
    gold: "#8B6A20",
    goldInk: "#FFFFFF",
    terracotta: "#C17A52",
    textPrimary: "#15171F",
    textSecondary: "#5A5F73",
    textMuted: "#8A8FA3",
    border: "#DCD8C9",
    borderStrong: "#C8C3B0",
    overlay: "rgba(15,17,26,0.04)",
    danger: "#B25538",
    positive: "#0F6E56",
    score: "#8B6A20",
    accent: "#3C4A8C",
  },
} as const;

export type ThemeColors = (typeof colors)['dark'];

export const radii = { sm: 8, md: 14, lg: 20, xl: 24, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

export const fontFamily = {
  // Large elegant serif for hero headings (Bloomberg-meets-Apple); modern sans elsewhere.
  display: '"Cormorant Garamond", "Iowan Old Style", Georgia, "Times New Roman", serif',
  body: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
};

export const elevation = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 1,
  },
  flat: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
};

export const DISCLAIMER = 'For self-reflection and decision support — not a guarantee of outcomes.';
