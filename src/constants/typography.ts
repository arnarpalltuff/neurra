import { TextStyle } from 'react-native';

/**
 * Neurra type scale.
 *
 * Headlines: Quicksand (rounded, warm)
 * Body/Numbers: Nunito (clean, readable)
 * Kova speech: Caveat (handwritten character)
 *
 * Fonts are loaded in app/_layout.tsx via useFonts.
 * Until loaded the system font is used as fallback.
 */

/** Shorthand font family references */
export const fonts = {
  heading: 'Quicksand_700Bold',
  headingMed: 'Quicksand_600SemiBold',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  kova: 'Caveat_400Regular',
};

/** Shorthand font sizes */
export const sizes = {
  hero: 52,
  h1: 26,
  h2: 20,
  h3: 17,
  body: 15,
  caption: 13,
  micro: 11,
};

// Keep old exports for backward-compat during migration
export const typography = {
  fontFamily: {
    heading: 'Quicksand_700Bold',
    headingMedium: 'Quicksand_600SemiBold',
    body: 'Nunito_400Regular',
    bodySemiBold: 'Nunito_600SemiBold',
    bodyBold: 'Nunito_700Bold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 22,
    xl: 28,
    xxl: 56,
    hero: 56,
    mega: 64,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const type: Record<string, TextStyle> = {
  hero: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 56,
    letterSpacing: -2,
    lineHeight: 56,
    color: '#F5F0E8',
  },
  h1: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
    lineHeight: 32,
    color: '#E8E4DF',
  },
  h2: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 26,
    color: '#E8E4DF',
  },
  h3: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 17,
    letterSpacing: 0,
    lineHeight: 22,
    color: '#E8E4DF',
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 22,
    color: '#E8E4DF',
  },
  bodyMuted: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 22,
    color: '#9CA3AF',
  },
  caption: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    letterSpacing: 0.2,
    lineHeight: 18,
    color: '#6B7280',
  },
  micro: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.0,
    lineHeight: 14,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  kova: {
    fontFamily: 'Caveat_400Regular',
    fontSize: 18,
    letterSpacing: 0.3,
    lineHeight: 25,
    color: '#E8E4DF',
  },
  button: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 16,
    color: '#0B0E17',
  },
  statLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    letterSpacing: 0.5,
    lineHeight: 16,
    color: '#6B7280',
  },
};
