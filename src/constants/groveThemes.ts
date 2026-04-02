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
  'deep-ocean': {
    skyTop: '#020818', skyBottom: '#0A1A3A',
    groundBase: '#0D2A40', groundHighlight: '#1A4060',
    waterColor: '#0088AA', waterGlow: '#00CCDD',
    treeLeaf: '#FF6B6B', treeTrunk: '#4A6B8A',
    crystalColor: '#00BCD4', crystalGlow: '#80DEEA',
    gardenFlower: '#FF8A65', mushroomCap: '#E040FB', mushroomGlow: '#EA80FC',
    particleColor: '#00E5FF', ambientLight: '#4DD0E1', islandEdge: '#0D3050',
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
  'volcanic-ember': {
    skyTop: '#0A0505', skyBottom: '#1A0808',
    groundBase: '#2A1510', groundHighlight: '#3A2018',
    waterColor: '#FF4500', waterGlow: '#FF6B35',
    treeLeaf: '#FF6B35', treeTrunk: '#3A2820',
    crystalColor: '#FF0000', crystalGlow: '#FF4040',
    gardenFlower: '#FFD700', mushroomCap: '#FF4500', mushroomGlow: '#FF6B35',
    particleColor: '#FF8C00', ambientLight: '#FF6B35', islandEdge: '#1A0A08',
  },
  'zen-garden': {
    skyTop: '#1A1A2E', skyBottom: '#2A2A40',
    groundBase: '#D4C4A8', groundHighlight: '#E8D8C0',
    waterColor: '#4A90C0', waterGlow: '#7CB8E8',
    treeLeaf: '#FFB7C5', treeTrunk: '#5A3A28',
    crystalColor: '#8A8A8A', crystalGlow: '#B0B0B0',
    gardenFlower: '#FFB7C5', mushroomCap: '#FF6347', mushroomGlow: '#FF8A70',
    particleColor: '#FFB7C5', ambientLight: '#FFE0E8', islandEdge: '#B0A090',
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
  'ancient-ruins': {
    skyTop: '#0A1A10', skyBottom: '#1A3020',
    groundBase: '#3A3A30', groundHighlight: '#5A5A48',
    waterColor: '#2A6A5A', waterGlow: '#4ECDC4',
    treeLeaf: '#5AA060', treeTrunk: '#4A3A28',
    crystalColor: '#50C878', crystalGlow: '#80E0A0',
    gardenFlower: '#DAA520', mushroomCap: '#7DD3A8', mushroomGlow: '#A8E6C8',
    particleColor: '#DAA520', ambientLight: '#A0C8A0', islandEdge: '#2A2A20',
  },
  'aurora-borealis': {
    skyTop: '#0A0A20', skyBottom: '#0A1A30',
    groundBase: '#E8E8F0', groundHighlight: '#F0F0FF',
    waterColor: '#4A8BAA', waterGlow: '#80C8E8',
    treeLeaf: '#A0D8E0', treeTrunk: '#8A8AA0',
    crystalColor: '#A0E0FF', crystalGlow: '#C0F0FF',
    gardenFlower: '#A87CE8', mushroomCap: '#80C0E0', mushroomGlow: '#A0E0FF',
    particleColor: '#7DD3A8', ambientLight: '#A0F0C0', islandEdge: '#C0C0D0',
  },
  'bioluminescent-deep': {
    skyTop: '#000000', skyBottom: '#050510',
    groundBase: '#0A0A15', groundHighlight: '#151520',
    waterColor: '#00FFAA', waterGlow: '#40FFD0',
    treeLeaf: '#00FF80', treeTrunk: '#1A2A20',
    crystalColor: '#00DDFF', crystalGlow: '#60FFFF',
    gardenFlower: '#FF00FF', mushroomCap: '#8800FF', mushroomGlow: '#BB44FF',
    particleColor: '#00FF80', ambientLight: '#40FF80', islandEdge: '#0A0A10',
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
