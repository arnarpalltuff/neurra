import { C } from '../constants/colors';
import type { DecorationCategory } from '../stores/groveStore';

export interface GlowStyle {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

const CATEGORY_GLOW: Record<DecorationCategory, GlowStyle> = {
  lighting: {
    shadowColor: C.amber,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  water: {
    shadowColor: C.blue,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  nature: {
    shadowColor: C.green,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  whimsical: {
    shadowColor: C.purple,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  seating: {
    shadowColor: C.peach,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  structures: {
    shadowColor: C.blue,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  seasonal: {
    shadowColor: C.peach,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  pro: {
    shadowColor: C.purple,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
};

export function decorationGlow(category: DecorationCategory | undefined): GlowStyle {
  return CATEGORY_GLOW[category ?? 'nature'];
}

/** Categories whose decorations should get a subtle ambient opacity flicker. */
export function isLightingCategory(category: DecorationCategory | undefined): boolean {
  return category === 'lighting' || category === 'pro';
}
