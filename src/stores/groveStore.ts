import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrainArea } from '../constants/gameConfigs';

// ── Types ──────────────────────────────────────────────

export type GroveThemeId =
  | 'floating-isle'
  | 'cloud-kingdom'
  | 'cosmic-void';

export interface GroveTheme {
  id: GroveThemeId;
  name: string;
  cost: number; // 0 = free, -1 = Pro only
  description: string;
}

export const GROVE_THEMES: GroveTheme[] = [
  { id: 'floating-isle', name: 'Floating Isle', cost: 0, description: 'Lush green island in a soft sky' },
  { id: 'cloud-kingdom', name: 'Cloud Kingdom', cost: 500, description: 'Floating among soft clouds and gold' },
  { id: 'cosmic-void', name: 'Cosmic Void', cost: 1000, description: 'Floating in space with stardust rivers' },
];

export type DecorationCategory =
  | 'lighting'
  | 'seating'
  | 'water'
  | 'nature'
  | 'whimsical'
  | 'structures'
  | 'seasonal'
  | 'pro';

export interface DecorationDef {
  id: string;
  name: string;
  emoji: string;
  category: DecorationCategory;
  cost: number; // -1 = Pro only
  footprint: number; // radius in grid units
}

const DECORATION_DEFS_BY_ID: Record<string, DecorationDef> = {};

/** O(1) decoration lookup by id. */
export function decorationById(id: string): DecorationDef | undefined {
  return DECORATION_DEFS_BY_ID[id];
}

export const DECORATION_DEFS: DecorationDef[] = [
  // Lighting
  { id: 'paper-lantern', name: 'Paper Lantern', emoji: '🏮', category: 'lighting', cost: 50, footprint: 1 },
  { id: 'fairy-lights', name: 'Fairy Lights', emoji: '✨', category: 'lighting', cost: 100, footprint: 2 },
  { id: 'firefly-jar', name: 'Firefly Jar', emoji: '🫙', category: 'lighting', cost: 75, footprint: 1 },
  { id: 'glowing-stone', name: 'Glowing Stone', emoji: '💎', category: 'lighting', cost: 75, footprint: 1 },
  { id: 'candle-cluster', name: 'Candle Cluster', emoji: '🕯️', category: 'lighting', cost: 60, footprint: 1 },
  { id: 'mushroom-lamp', name: 'Mushroom Lamp', emoji: '🍄', category: 'lighting', cost: 150, footprint: 1 },
  // Seating
  { id: 'wooden-bench', name: 'Wooden Bench', emoji: '🪑', category: 'seating', cost: 100, footprint: 2 },
  { id: 'hammock', name: 'Hammock', emoji: '🛌', category: 'seating', cost: 200, footprint: 3 },
  { id: 'meditation-cushion', name: 'Meditation Cushion', emoji: '🧘', category: 'seating', cost: 150, footprint: 1 },
  { id: 'swing', name: 'Swing', emoji: '🎠', category: 'seating', cost: 250, footprint: 2 },
  { id: 'treehouse', name: 'Treehouse', emoji: '🏡', category: 'seating', cost: 300, footprint: 3 },
  // Water
  { id: 'fountain', name: 'Small Fountain', emoji: '⛲', category: 'water', cost: 150, footprint: 2 },
  { id: 'bird-bath', name: 'Bird Bath', emoji: '🐦', category: 'water', cost: 100, footprint: 1 },
  { id: 'stepping-stones', name: 'Stepping Stones', emoji: '🪨', category: 'water', cost: 120, footprint: 2 },
  { id: 'wooden-bridge', name: 'Wooden Bridge', emoji: '🌉', category: 'water', cost: 200, footprint: 3 },
  { id: 'koi-fish', name: 'Koi Fish', emoji: '🐟', category: 'water', cost: 250, footprint: 1 },
  // Nature
  { id: 'flower-pot-rose', name: 'Rose Pot', emoji: '🌹', category: 'nature', cost: 50, footprint: 1 },
  { id: 'flower-pot-tulip', name: 'Tulip Pot', emoji: '🌷', category: 'nature', cost: 50, footprint: 1 },
  { id: 'flower-pot-sunflower', name: 'Sunflower Pot', emoji: '🌻', category: 'nature', cost: 50, footprint: 1 },
  { id: 'bush-round', name: 'Round Bush', emoji: '🌳', category: 'nature', cost: 75, footprint: 2 },
  { id: 'bird-feeder', name: 'Bird Feeder', emoji: '🏠', category: 'nature', cost: 100, footprint: 1 },
  { id: 'beehive', name: 'Beehive', emoji: '🐝', category: 'nature', cost: 150, footprint: 1 },
  { id: 'butterfly-garden', name: 'Butterfly Garden', emoji: '🦋', category: 'nature', cost: 200, footprint: 2 },
  // Whimsical
  { id: 'tiny-door', name: 'Tiny Door', emoji: '🚪', category: 'whimsical', cost: 150, footprint: 1 },
  { id: 'windmill', name: 'Miniature Windmill', emoji: '🌬️', category: 'whimsical', cost: 200, footprint: 2 },
  { id: 'telescope', name: 'Telescope', emoji: '🔭', category: 'whimsical', cost: 200, footprint: 1 },
  { id: 'star-chart', name: 'Star Chart', emoji: '⭐', category: 'whimsical', cost: 250, footprint: 2 },
  { id: 'message-bottle', name: 'Message in a Bottle', emoji: '🍾', category: 'whimsical', cost: 150, footprint: 1 },
  // Structures
  { id: 'stone-arch', name: 'Stone Archway', emoji: '🏛️', category: 'structures', cost: 300, footprint: 3 },
  { id: 'wooden-gate', name: 'Wooden Gate', emoji: '🚧', category: 'structures', cost: 200, footprint: 2 },
  { id: 'well', name: 'Wishing Well', emoji: '🪣', category: 'structures', cost: 250, footprint: 2 },
  { id: 'greenhouse', name: 'Greenhouse', emoji: '🏗️', category: 'structures', cost: 400, footprint: 3 },
  { id: 'gazebo', name: 'Gazebo', emoji: '⛺', category: 'structures', cost: 500, footprint: 3 },
  // Pro exclusive
  { id: 'crystal-chandelier', name: 'Crystal Chandelier Tree', emoji: '💠', category: 'pro', cost: -1, footprint: 2 },
  { id: 'aurora-fountain', name: 'Aurora Fountain', emoji: '🌈', category: 'pro', cost: -1, footprint: 2 },
  { id: 'starfall-monument', name: 'Starfall Monument', emoji: '🌠', category: 'pro', cost: -1, footprint: 2 },
  { id: 'ancient-portal', name: 'Ancient Portal', emoji: '🌀', category: 'pro', cost: -1, footprint: 3 },
  { id: 'dragon-egg', name: 'Dragon Egg', emoji: '🥚', category: 'pro', cost: -1, footprint: 1 },
];

// Populate the lookup map once at module load.
for (const def of DECORATION_DEFS) {
  DECORATION_DEFS_BY_ID[def.id] = def;
}

export interface PlacedDecoration {
  defId: string;
  x: number;
  y: number;
  rotation: number;
  placedAt: string; // ISO date
}

export interface GiftFlower {
  fromName: string;
  x: number;
  y: number;
  placedAt: string;
}

export type VisitorId =
  | 'fireflies' | 'butterfly' | 'bird' | 'fox' | 'koi'
  | 'owl' | 'deer' | 'dragonfly' | 'rabbits' | 'phoenix';

export type VisitorCategory = 'firefly' | 'butterfly' | 'bird' | 'ground' | 'hover';

export interface VisitorDef {
  emoji: string;
  category: VisitorCategory;
  /** Ambient glow color. Undefined = no tinted glow. */
  glow?: string;
}

/**
 * Canonical visitor render config. Consumers in grove look up here instead
 * of maintaining parallel emoji/category/glow tables.
 */
export const VISITOR_DEFS: Record<VisitorId, VisitorDef> = {
  fireflies: { emoji: '✨', category: 'firefly', glow: '#F0B542' },
  butterfly: { emoji: '🦋', category: 'butterfly' },
  bird:      { emoji: '🐦', category: 'bird' },
  fox:       { emoji: '🦊', category: 'ground' },
  koi:       { emoji: '🐟', category: 'hover', glow: '#E09B6B' },
  owl:       { emoji: '🦉', category: 'hover' },
  deer:      { emoji: '🦌', category: 'ground' },
  dragonfly: { emoji: '🪰', category: 'firefly', glow: '#6BA8E0' },
  rabbits:   { emoji: '🐰', category: 'ground' },
  phoenix:   { emoji: '🔥', category: 'bird',   glow: '#E8707E' },
};

export interface ZoneGrowth {
  area: BrainArea;
  currentGrowth: number;  // 0-12
  peakGrowth: number;     // highest ever
  isWilting: boolean;
  lastTrainedDate: string | null;
  /** F7: consecutive days this area was trained. Resets if a full calendar day passes without training. */
  streakCount: number;
}

// ── Zone Config ────────────────────────────────────────

export interface ZoneConfig {
  area: BrainArea;
  name: string;
  element: string;
  icon: string;
  /** Layout slot on the grove scene (Phase N) */
  position: 'northwest' | 'northeast' | 'south' | 'southwest' | 'southeast';
}

export const ZONE_CONFIGS: ZoneConfig[] = [
  { area: 'memory', name: 'The Ancestor Tree', element: 'Tree', icon: '🌳', position: 'northwest' },
  { area: 'focus', name: 'The Crystal Spire', element: 'Crystal', icon: '💎', position: 'northeast' },
  { area: 'speed', name: 'The Living Stream', element: 'Stream', icon: '💧', position: 'south' },
  { area: 'flexibility', name: 'The Winding Garden', element: 'Garden', icon: '🌺', position: 'southwest' },
  { area: 'creativity', name: 'The Mycelium Network', element: 'Mushrooms', icon: '🍄', position: 'southeast' },
];

// ── Growth Calculation ─────────────────────────────────

function calcZoneGrowth(
  brainScore: number,
  peakGrowth: number,
  lastTrainedDate: string | null,
): { growth: number; isWilting: boolean } {
  const rawGrowth = (brainScore / 100) * 12;

  if (!lastTrainedDate) {
    return { growth: rawGrowth, isWilting: false };
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(lastTrainedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince > 14) {
    const wiltFactor = Math.max(0.6, 1 - (daysSince - 14) * 0.02);
    const wiltedGrowth = Math.max(peakGrowth * 0.6, rawGrowth * wiltFactor);
    return { growth: Math.min(12, Math.max(0, wiltedGrowth)), isWilting: true };
  }

  return { growth: Math.min(12, Math.max(0, rawGrowth)), isWilting: false };
}

// ── Store ──────────────────────────────────────────────

interface GroveState {
  activeTheme: GroveThemeId;
  unlockedThemes: GroveThemeId[];
  placedDecorations: PlacedDecoration[];
  ownedDecorations: string[]; // defIds in inventory (not placed)
  zoneGrowths: Record<BrainArea, ZoneGrowth>;
  giftFlowers: GiftFlower[];
  unlockedVisitors: VisitorId[];
  /** Zone that just recovered from wilting — triggers sparkle until cleared */
  revivedSparkleArea: BrainArea | null;

  // Actions
  setTheme: (themeId: GroveThemeId) => void;
  unlockTheme: (themeId: GroveThemeId) => void;
  buyDecoration: (defId: string) => void;
  placeDecoration: (defId: string, x: number, y: number, rotation?: number) => void;
  moveDecoration: (index: number, x: number, y: number) => void;
  storeDecoration: (index: number) => void;
  sellDecoration: (index: number) => void;
  updateZoneGrowth: (area: BrainArea, brainScore: number) => void;
  markAreaTrained: (area: BrainArea) => { newStreak: number; reachedSeven: boolean };
  /** F7: brain areas that currently hold a 7+ day streak ("Specialist" badge). */
  activeSpecialists: BrainArea[];
  recalcAllZones: (brainScores: Record<BrainArea, number>) => void;
  /** F7: walk all zones and zero out streaks where the last trained day is more than 1 day ago. */
  recalcAreaStreaks: () => void;
  addGiftFlower: (fromName: string, x: number, y: number) => void;
  updateVisitors: (streak: number, level: number, focusScore: number, streamGrowth: number) => void;
  clearRevivedSparkle: () => void;
}

const defaultZoneGrowth = (area: BrainArea): ZoneGrowth => ({
  area,
  currentGrowth: 0,
  peakGrowth: 0,
  isWilting: false,
  lastTrainedDate: null,
  streakCount: 0,
});

export const useGroveStore = create<GroveState>()(
  persist(
    (set, get) => ({
      activeTheme: 'floating-isle',
      unlockedThemes: ['floating-isle'],
      placedDecorations: [],
      ownedDecorations: [],
      zoneGrowths: {
        memory: defaultZoneGrowth('memory'),
        focus: defaultZoneGrowth('focus'),
        speed: defaultZoneGrowth('speed'),
        flexibility: defaultZoneGrowth('flexibility'),
        creativity: defaultZoneGrowth('creativity'),
      },
      giftFlowers: [],
      unlockedVisitors: ['fireflies'],
      revivedSparkleArea: null,
      activeSpecialists: [],

      clearRevivedSparkle: () => set({ revivedSparkleArea: null }),

      setTheme: (themeId) =>
        set((s) => {
          if (!s.unlockedThemes.includes(themeId)) return {};
          return { activeTheme: themeId };
        }),

      unlockTheme: (themeId) =>
        set((s) => ({
          unlockedThemes: s.unlockedThemes.includes(themeId)
            ? s.unlockedThemes
            : [...s.unlockedThemes, themeId],
        })),

      buyDecoration: (defId) =>
        set((s) => ({
          ownedDecorations: [...s.ownedDecorations, defId],
        })),

      placeDecoration: (defId, x, y, rotation = 0) =>
        set((s) => {
          if (s.placedDecorations.length >= 20) return {};
          const idx = s.ownedDecorations.indexOf(defId);
          if (idx === -1) return {};
          const newOwned = [...s.ownedDecorations];
          newOwned.splice(idx, 1);
          return {
            ownedDecorations: newOwned,
            placedDecorations: [...s.placedDecorations, {
              defId, x, y, rotation, placedAt: new Date().toISOString(),
            }],
          };
        }),

      moveDecoration: (index, x, y) =>
        set((s) => {
          const newPlaced = [...s.placedDecorations];
          if (!newPlaced[index]) return {};
          newPlaced[index] = { ...newPlaced[index], x, y };
          return { placedDecorations: newPlaced };
        }),

      storeDecoration: (index) =>
        set((s) => {
          const item = s.placedDecorations[index];
          if (!item) return {};
          const newPlaced = s.placedDecorations.filter((_, i) => i !== index);
          return {
            placedDecorations: newPlaced,
            ownedDecorations: [...s.ownedDecorations, item.defId],
          };
        }),

      sellDecoration: (index) =>
        set((s) => {
          const item = s.placedDecorations[index];
          if (!item) return {};
          const newPlaced = s.placedDecorations.filter((_, i) => i !== index);
          return { placedDecorations: newPlaced };
          // Coin refund (50%) handled by caller via progressStore.addCoins
        }),

      updateZoneGrowth: (area, brainScore) =>
        set((s) => {
          const zone = s.zoneGrowths[area];
          const { growth, isWilting } = calcZoneGrowth(
            brainScore, zone.peakGrowth, zone.lastTrainedDate,
          );
          return {
            zoneGrowths: {
              ...s.zoneGrowths,
              [area]: {
                ...zone,
                currentGrowth: growth,
                peakGrowth: Math.max(zone.peakGrowth, growth),
                isWilting,
              },
            },
          };
        }),

      markAreaTrained: (area) => {
        const s = get();
        const zone = s.zoneGrowths[area];
        const wasWilting = zone?.isWilting ?? false;
        const today = new Date().toISOString().split('T')[0];

        // F7: advance per-area streak. yesterday → +1, today → no change, gap → reset to 1.
        let newStreak = zone?.streakCount ?? 0;
        if (zone?.lastTrainedDate === today) {
          // already trained today, streak unchanged
          newStreak = zone.streakCount;
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = yesterday.toISOString().split('T')[0];
          if (zone?.lastTrainedDate === yStr) {
            newStreak = (zone.streakCount ?? 0) + 1;
          } else {
            newStreak = 1;
          }
        }

        const reachedSeven = newStreak === 7 && (zone?.streakCount ?? 0) < 7;

        const specialists = new Set(s.activeSpecialists);
        if (newStreak >= 7) specialists.add(area);

        set({
          revivedSparkleArea: wasWilting ? area : s.revivedSparkleArea,
          zoneGrowths: {
            ...s.zoneGrowths,
            [area]: {
              ...zone,
              lastTrainedDate: today,
              isWilting: false,
              streakCount: newStreak,
            },
          },
          activeSpecialists: Array.from(specialists),
        });

        return { newStreak, reachedSeven };
      },

      recalcAreaStreaks: () =>
        set((s) => {
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          const todayStr = today.toISOString().split('T')[0];
          const yStr = yesterday.toISOString().split('T')[0];

          const areas: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];
          const newGrowths = { ...s.zoneGrowths };
          const specialists = new Set(s.activeSpecialists);
          let changed = false;

          for (const area of areas) {
            const zone = newGrowths[area];
            if (!zone || zone.streakCount === 0) continue;
            if (zone.lastTrainedDate === todayStr || zone.lastTrainedDate === yStr) continue;
            // Streak is stale.
            newGrowths[area] = { ...zone, streakCount: 0 };
            specialists.delete(area);
            changed = true;
          }

          if (!changed) return {};
          return { zoneGrowths: newGrowths, activeSpecialists: Array.from(specialists) };
        }),

      recalcAllZones: (brainScores) =>
        set((s) => {
          const areas: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];
          const newGrowths = { ...s.zoneGrowths };
          for (const area of areas) {
            const zone = newGrowths[area];
            const { growth, isWilting } = calcZoneGrowth(
              brainScores[area], zone.peakGrowth, zone.lastTrainedDate,
            );
            newGrowths[area] = {
              ...zone,
              currentGrowth: growth,
              peakGrowth: Math.max(zone.peakGrowth, growth),
              isWilting,
            };
          }
          return { zoneGrowths: newGrowths };
        }),

      addGiftFlower: (fromName, x, y) =>
        set((s) => {
          const newFlowers = [...s.giftFlowers, {
            fromName, x, y, placedAt: new Date().toISOString(),
          }];
          // Cap at 10, remove oldest
          if (newFlowers.length > 10) newFlowers.shift();
          return { giftFlowers: newFlowers };
        }),

      updateVisitors: (streak, level, focusScore, streamGrowth) =>
        set((s) => {
          const visitors = new Set<VisitorId>(s.unlockedVisitors);
          visitors.add('fireflies'); // always

          // Condition-based unlocks
          if (level >= 1 || streak >= 1) visitors.add('butterfly');  // 10 sessions approx
          if (streak >= 7) visitors.add('bird');
          if (level >= 15) visitors.add('fox');
          if (streamGrowth >= 6) visitors.add('koi');
          if (streak >= 30) visitors.add('owl');
          if (level >= 30) visitors.add('deer');
          if (focusScore >= 80) visitors.add('dragonfly');
          if (streak >= 60) visitors.add('rabbits');
          if (streak >= 100) visitors.add('phoenix');

          return { unlockedVisitors: Array.from(visitors) };
        }),
    }),
    {
      name: 'neurra-grove',
      storage: createJSONStorage(() => AsyncStorage),
      // v2: streakCount + activeSpecialists backfill.
      // v3: grove themes cut 9 → 3 — reset activeTheme if stale, filter unlockedThemes.
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Partial<GroveState> & {
          zoneGrowths?: Partial<Record<BrainArea, Partial<ZoneGrowth>>>;
        };
        if (version < 2) {
          const areas: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];
          const fixedZones: Record<BrainArea, ZoneGrowth> = {
            memory: defaultZoneGrowth('memory'),
            focus: defaultZoneGrowth('focus'),
            speed: defaultZoneGrowth('speed'),
            flexibility: defaultZoneGrowth('flexibility'),
            creativity: defaultZoneGrowth('creativity'),
          };
          for (const area of areas) {
            const oldZone = state.zoneGrowths?.[area];
            if (oldZone) {
              fixedZones[area] = {
                area,
                currentGrowth: oldZone.currentGrowth ?? 0,
                peakGrowth: oldZone.peakGrowth ?? 0,
                isWilting: oldZone.isWilting ?? false,
                lastTrainedDate: oldZone.lastTrainedDate ?? null,
                streakCount: oldZone.streakCount ?? 0,
              };
            }
          }
          state.zoneGrowths = fixedZones;
          if (!Array.isArray(state.activeSpecialists)) {
            state.activeSpecialists = [];
          }
        }
        if (version < 3) {
          const VALID_THEMES: GroveThemeId[] = ['floating-isle', 'cloud-kingdom', 'cosmic-void'];
          const isValid = (id: unknown): id is GroveThemeId =>
            typeof id === 'string' && (VALID_THEMES as string[]).includes(id);

          if (!isValid(state.activeTheme)) {
            state.activeTheme = 'floating-isle';
          }
          if (Array.isArray(state.unlockedThemes)) {
            state.unlockedThemes = (state.unlockedThemes as unknown[]).filter(isValid);
            if (!state.unlockedThemes.includes('floating-isle')) {
              state.unlockedThemes.unshift('floating-isle');
            }
          } else {
            state.unlockedThemes = ['floating-isle'];
          }
        }
        return state;
      },
    }
  )
);
