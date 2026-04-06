export const colors = {
  // Backgrounds (layered, never flat)
  bgVoid: '#050710',
  bgDeep: '#080A12',
  bgPrimary: '#0C0F1A',
  bgSecondary: '#131829',
  bgCard: '#131829',
  bgCardTop: '#1B2138',
  bgTertiary: '#1B2138',
  bgElevated: '#1B2138',
  bgHover: '#232A45',

  // Text (warm off-white, never pure white)
  textHero: '#F2EDE4',
  textPrimary: '#EDE9E0',
  textSecondary: '#A0A4B0',
  textTertiary: '#5E6272',
  textDisabled: '#3A3F52',
  textInverse: '#0C0F1A',

  // Accent — solid
  growth: '#6ECF9A',
  growthDim: '#6ECF9A30',
  streak: '#F0B542',
  streakDim: '#F0B54230',
  coral: '#E8707E',
  coralDim: '#E8707E30',
  lavender: '#9B72E0',
  lavenderDim: '#9B72E030',
  sky: '#6BA8E0',
  skyDim: '#6BA8E030',
  warm: '#E09B6B',
  warmDim: '#E09B6B30',

  // Accent — glow (shadow/aura)
  growthGlow: 'rgba(110,207,154,0.25)',
  streakGlow: 'rgba(240,181,66,0.25)',
  coralGlow: 'rgba(232,112,126,0.25)',
  lavenderGlow: 'rgba(155,114,224,0.25)',
  skyGlow: 'rgba(107,168,224,0.25)',
  warmGlow: 'rgba(224,155,107,0.25)',
  novaGlow: 'rgba(255,215,0,0.25)',

  // Accent — tint (large background fills)
  growthTint: 'rgba(110,207,154,0.08)',
  streakTint: 'rgba(240,181,66,0.08)',
  coralTint: 'rgba(232,112,126,0.08)',
  lavenderTint: 'rgba(155,114,224,0.08)',
  skyTint: 'rgba(107,168,224,0.08)',
  warmTint: 'rgba(224,155,107,0.08)',

  // League colors
  ember: '#FF6B35',
  wave: '#4ECDC4',
  stone: '#95A5A6',
  prism: '#9B72E0',
  nova: '#FFD700',
  zenith: '#EDE9E0',

  // Surfaces (translucent fills)
  surfaceDim: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.03)',

  // Accent — border (colored, semi-transparent)
  streakBorder: 'rgba(240,181,66,0.3)',
  skyBorder: 'rgba(107,168,224,0.2)',

  // Borders and dividers
  borderSubtle: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.1)',
  borderAccent: 'rgba(110,207,154,0.2)',
  border: '#1F2A42',
  divider: 'rgba(255,255,255,0.04)',

  // Overlays
  overlay: 'rgba(12,15,26,0.75)',
  modalOverlay: 'rgba(5,7,16,0.85)',
  black50: 'rgba(0,0,0,0.5)',

  // Transparent
  transparent: 'transparent',
};

export type ColorKey = keyof typeof colors;

/** Shorthand alias for use in new/rebuilt screens */
export const C = {
  // Backgrounds (dark, warm, layered)
  bg1: colors.bgVoid,
  bg2: colors.bgPrimary,
  bg3: colors.bgSecondary,
  bg4: colors.bgTertiary,
  bg5: colors.bgHover,

  // Text (warm off-white, never pure white)
  t1: colors.textPrimary,
  t2: colors.textSecondary,
  t3: colors.textTertiary,
  t4: colors.textDisabled,

  // Accents
  green: colors.growth,
  amber: colors.streak,
  coral: colors.coral,
  purple: colors.lavender,
  blue: colors.sky,
  peach: colors.warm,

  // Tints (large background fills)
  greenTint: colors.growthTint,
  amberTint: colors.streakTint,
  coralTint: colors.coralTint,
  purpleTint: colors.lavenderTint,
  blueTint: colors.skyTint,
  peachTint: colors.warmTint,

  // Surface
  surface: colors.surfaceDim,

  // Utility
  border: colors.borderSubtle,
  shadow: 'rgba(0,0,0,0.4)',
  overlay: colors.modalOverlay,
};
