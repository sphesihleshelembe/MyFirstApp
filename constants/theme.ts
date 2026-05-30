export const colors = {
  background: '#0A0A0F',
  surface: '#12121A',
  surfaceElevated: '#1A1A26',
  border: '#1E1E2E',
  borderLight: '#2A2A3E',

  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryGlow: 'rgba(37, 99, 235, 0.15)',

  accent: '#0EA5E9',
  accentGlow: 'rgba(14, 165, 233, 0.12)',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',

  success: '#10B981',
  successGlow: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  error: '#EF4444',
  errorGlow: 'rgba(239, 68, 68, 0.12)',

  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
};
