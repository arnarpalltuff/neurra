import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrainArea, gameConfigs, GameId } from '../constants/gameConfigs';
import { useProgressStore } from './progressStore';

export interface WeeklyReport {
  weekId: string;
  createdAt: string;
  daysTrained: number;
  totalMinutesEstimate: number;
  improvement: { area: BrainArea; before: number; after: number } | null;
  bestMoment: string;
  streakAtEnd: number;
  xpEarned: number;
  nextFocus: BrainArea;
}

function mondayOfWeek(d: Date): string {
  const c = new Date(d);
  const day = c.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  c.setDate(c.getDate() + diff);
  c.setHours(0, 0, 0, 0);
  return c.toISOString().slice(0, 10);
}

function previousWeekMonday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return mondayOfWeek(d);
}

export function weekIdFromMonday(monday: string): string {
  return `w-${monday}`;
}

function areaForGame(gameId: GameId): BrainArea | undefined {
  return gameConfigs[gameId]?.brainArea;
}

function avgAccuracyByArea(sessions: { games: { gameId: GameId; accuracy: number }[] }[]): Record<BrainArea, { sum: number; n: number }> {
  const acc: Record<BrainArea, { sum: number; n: number }> = {
    memory: { sum: 0, n: 0 },
    focus: { sum: 0, n: 0 },
    speed: { sum: 0, n: 0 },
    flexibility: { sum: 0, n: 0 },
    creativity: { sum: 0, n: 0 },
  };
  for (const s of sessions) {
    for (const g of s.games) {
      const a = areaForGame(g.gameId);
      if (!a) continue;
      acc[a].sum += g.accuracy * 100;
      acc[a].n += 1;
    }
  }
  return acc;
}

function toScores(raw: Record<BrainArea, { sum: number; n: number }>): Record<BrainArea, number> {
  const out = {} as Record<BrainArea, number>;
  (Object.keys(raw) as BrainArea[]).forEach((k) => {
    const v = raw[k];
    out[k] = v.n > 0 ? Math.round(v.sum / v.n) : 0;
  });
  return out;
}

function weakestArea(scores: Record<BrainArea, number>): BrainArea {
  const areas: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];
  let min = areas[0]!;
  for (const a of areas) {
    if ((scores[a] ?? 0) < (scores[min] ?? 0)) min = a;
  }
  return min;
}

interface WeeklyReportState {
  reports: Record<string, WeeklyReport>;
  homeBannerDismissedWeekId: string | null;
  generateIfNeeded: () => void;
  dismissHomeBanner: (weekId: string) => void;
}

export const useWeeklyReportStore = create<WeeklyReportState>()(
  persist(
    (set, get) => ({
      reports: {},
      homeBannerDismissedWeekId: null,

      dismissHomeBanner: (weekId) => set({ homeBannerDismissedWeekId: weekId }),

      generateIfNeeded: () => {
        const prevMon = previousWeekMonday();
        const wid = weekIdFromMonday(prevMon);
        if (get().reports[wid]) return;

        const allSessions = useProgressStore.getState().sessions;
        const brainScores = useProgressStore.getState().brainScores;
        const streak = useProgressStore.getState().streak;

        const weekStart = new Date(`${prevMon}T00:00:00`);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);

        const inWeek = allSessions.filter((s) => {
          const t = new Date(s.date).getTime();
          return t >= weekStart.getTime() && t < weekEnd.getTime();
        });

        if (inWeek.length === 0) return;

        const priorWeek = allSessions.filter((s) => {
          const t = new Date(s.date).getTime();
          return t >= prevWeekStart.getTime() && t < weekStart.getTime();
        });

        const days = new Set<string>();
        let xpEarned = 0;
        let bestScore = 0;
        let bestMoment = 'You kept training this week.';
        for (const s of inWeek) {
          days.add(s.date.slice(0, 10));
          xpEarned += s.totalXP;
          for (const g of s.games) {
            if (g.score > bestScore) {
              bestScore = g.score;
              const name = gameConfigs[g.gameId]?.name ?? 'a game';
              bestMoment = `Best moment: ${name} — ${g.score} pts.`;
            }
          }
        }

        const before = toScores(avgAccuracyByArea(priorWeek));
        const after = toScores(avgAccuracyByArea(inWeek));
        let improvement: WeeklyReport['improvement'] = null;
        let bestDelta = 0;
        const areas: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];
        for (const a of areas) {
          const d = after[a] - before[a];
          if (d > bestDelta) {
            bestDelta = d;
            improvement = { area: a, before: before[a], after: after[a] };
          }
        }
        if (bestDelta <= 0) improvement = null;

        const report: WeeklyReport = {
          weekId: wid,
          createdAt: new Date().toISOString(),
          daysTrained: days.size,
          totalMinutesEstimate: Math.max(5, inWeek.length * 5),
          improvement,
          bestMoment,
          streakAtEnd: streak,
          xpEarned,
          nextFocus: weakestArea(brainScores),
        };

        set((s) => ({ reports: { ...s.reports, [wid]: report } }));
      },
    }),
    {
      name: 'neurra-weekly-reports',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function getLatestReportWeekId(): string | null {
  const ids = Object.keys(useWeeklyReportStore.getState().reports);
  if (ids.length === 0) return null;
  return ids.sort().slice(-1)[0] ?? null;
}
