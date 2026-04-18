import { GroveThemeId } from '../stores/groveStore';

export interface GroveThemePalette {
  skyTop: string;
  skyBottom: string;
  groundBase: string;
  groundHighlight: string;
  waterColor: string;
  waterGlow: string;
  treeLeaf: string;
  treeTrunk: string;
  crystalColor: string;
  crystalGlow: string;
  gardenFlower: string;
  mushroomCap: string;
  mushroomGlow: string;
  particleColor: string;
  ambientLight: string;
  islandEdge: string;
}

export const GROVE_PALETTES: Record<GroveThemeId, GroveThemePalette> = {
  'floating-isle': {
    skyTop: '#0B1628', skyBottom: '#1A2847',
    groundBase: '#1B3A2A', groundHighlight: '#2A5A3A',
    waterColor: '#3A7CA5', waterGlow: '#5ABCD8',
    treeLeaf: '#7DD3A8', treeTrunk: '#5A3A28',
    crystalColor: '#7CB8E8', crystalGlow: '#A8D8FF',
    gardenFlower: '#E87C8A', mushroomCap: '#A87CE8', mushroomGlow: '#C8A0FF',
    particleColor: '#FBBF24', ambientLight: '#E8D5B0', islandEdge: '#2A4A35',
  },
  'cloud-kingdom': {
    skyTop: '#E8D5C4', skyBottom: '#F0E6D8',
    groundBase: '#E0D0C0', groundHighlight: '#F0E8DD',
    waterColor: '#C8D8E8', waterGlow: '#E0F0FF',
    treeLeaf: '#FFD700', treeTrunk: '#D4A574',
    crystalColor: '#FFC0CB', crystalGlow: '#FFE4E8',
    gardenFlower: '#FFB6C1', mushroomCap: '#DDA0DD', mushroomGlow: '#F0D0FF',
    particleColor: '#FFD700', ambientLight: '#FFF8E8', islandEdge: '#D0C0B0',
  },
  'cosmic-void': {
    skyTop: '#000008', skyBottom: '#0A0020',
    groundBase: '#0A0A20', groundHighlight: '#1A1A40',
    waterColor: '#8A2BE2', waterGlow: '#BA55D3',
    treeLeaf: '#00CED1', treeTrunk: '#2A1A40',
    crystalColor: '#FFD700', crystalGlow: '#FFF8DC',
    gardenFlower: '#FF69B4', mushroomCap: '#7B68EE', mushroomGlow: '#9B88FF',
    particleColor: '#E0E0FF', ambientLight: '#8080FF', islandEdge: '#0A0A30',
  },
};

// Time-of-day sky gradient overrides (for default theme)
export function getTimeOfDaySky(): { top: string; bottom: string; ambientMult: number } {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return { top: '#1A2040', bottom: '#3A4A70', ambientMult: 0.9 };    // Morning
  if (hour >= 10 && hour < 16) return { top: '#1A2847', bottom: '#2A4870', ambientMult: 1.0 };   // Day
  if (hour >= 16 && hour < 20) return { top: '#2A1A30', bottom: '#4A2A40', ambientMult: 0.85 };  // Evening
  return { top: '#050810', bottom: '#0A1020', ambientMult: 0.6 };                                 // Night
}
