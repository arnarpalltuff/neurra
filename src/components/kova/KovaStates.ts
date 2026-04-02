export type KovaEmotion =
  | 'happy'
  | 'proud'
  | 'encouraging'
  | 'sleepy'
  | 'excited'
  | 'wilted'
  | 'worried'
  | 'relieved'
  | 'curious'
  | 'celebrating'
  | 'zen'
  | 'idle';

export type KovaStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function stageFromXP(xp: number): KovaStage {
  if (xp >= 75000) return 7;
  if (xp >= 30000) return 6;
  if (xp >= 12000) return 5;
  if (xp >= 5000) return 4;
  if (xp >= 2000) return 3;
  if (xp >= 500) return 2;
  return 1;
}

export const stageNames: Record<KovaStage, string> = {
  1: 'Seed',
  2: 'Sprout',
  3: 'Budding',
  4: 'Blooming',
  5: 'Flourishing',
  6: 'Radiant',
  7: 'Ancient',
};

export const stageColors: Record<KovaStage, string> = {
  1: '#4A7C59',
  2: '#5D9E75',
  3: '#7DD3A8',
  4: '#6EC89A',
  5: '#7DD3A8',
  6: '#A8E6C8',
  7: '#C8F0DC',
};

export const emotionGlowColors: Record<KovaEmotion, string> = {
  happy: '#7DD3A8',
  proud: '#FBBF24',
  encouraging: '#7CB8E8',
  sleepy: '#A87CE8',
  excited: '#E8A87C',
  wilted: '#6B7280',
  worried: '#9CA3AF',
  relieved: '#7DD3A8',
  curious: '#7CB8E8',
  celebrating: '#FBBF24',
  zen: '#7CB8E8',
  idle: '#7DD3A8',
};
