import { useMemo } from 'react';
import { useUserStore } from '../stores/userStore';
import { useProgressStore } from '../stores/progressStore';
import { useKovaStore, stageConfigFor } from '../stores/kovaStore';
import { getTimeOfDay, daysSince } from '../utils/timeUtils';
import { gameConfigs, GameId } from '../constants/gameConfigs';
import type { KovaContext } from '../services/kovaAI';

/**
 * Gathers all the data Kova needs to generate personal, contextual messages.
 * Reads from all relevant stores and computes derived stats.
 */
export function useKovaContext(overrides?: Partial<KovaContext>): KovaContext {
  const userName = useUserStore(s => s.name) ?? 'friend';
  const joinDate = useUserStore(s => s.joinDate);
  const mood = useUserStore(s => s.mood);

  const streak = useProgressStore(s => s.streak);
  const longestStreak = useProgressStore(s => s.longestStreak);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const xp = useProgressStore(s => s.xp);
  const level = useProgressStore(s => s.level);
  const lastSessionDate = useProgressStore(s => s.lastSessionDate);
  const brainScores = useProgressStore(s => s.brainScores);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const sessions = useProgressStore(s => s.sessions);
  const personalBests = useProgressStore(s => s.personalBests);
  const isSessionDoneToday = useProgressStore(s => s.isSessionDoneToday);

  const kovaStage = useKovaStore(s => s.currentStage);
  const kovaStreak = useKovaStore(s => s.currentStreak);

  return useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = getTimeOfDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[now.getDay()];

    const daysSinceJoining = joinDate
      ? Math.max(0, Math.floor((now.getTime() - new Date(joinDate).getTime()) / 86400000))
      : 0;
    const daysSinceLastSession = daysSince(lastSessionDate);

    const areas = Object.entries(brainScores) as Array<[string, number]>;
    const strongest = areas.reduce((a, b) => (a[1] >= b[1] ? a : b), areas[0]);
    const weakest = areas.reduce((a, b) => (a[1] <= b[1] ? a : b), areas[0]);

    // Find favorite game from history
    const gameCounts: Record<string, number> = {};
    for (const [gameId, results] of Object.entries(gameHistory)) {
      if (results) gameCounts[gameId] = results.length;
    }
    const favoriteEntry = Object.entries(gameCounts).reduce(
      (a, b) => (a[1] >= b[1] ? a : b),
      ['pulse', 0],
    );
    const favoriteGameName = gameConfigs[favoriteEntry[0] as GameId]?.name ?? favoriteEntry[0];

    const allResults = Object.values(gameHistory)
      .filter(Boolean)
      .flat()
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    const recentAccuracy = allResults.length > 0
      ? Math.round(allResults.reduce((sum, g) => sum + g.accuracy, 0) / allResults.length * 100)
      : 0;

    // Last 3 games
    const last3 = allResults.slice(0, 3).map(g => ({
      name: gameConfigs[g.gameId]?.name ?? g.gameId,
      score: g.score,
      accuracy: Math.round(g.accuracy * 100),
    }));

    // Best time of day from session history
    const timeBuckets: Record<string, number[]> = { morning: [], afternoon: [], evening: [] };
    for (const s of sessions) {
      const h = new Date(s.date).getHours();
      const bucket = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
      const avgAcc = s.games.length > 0
        ? s.games.reduce((sum, g) => sum + g.accuracy, 0) / s.games.length
        : 0;
      timeBuckets[bucket].push(avgAcc);
    }
    const bestTime = Object.entries(timeBuckets)
      .map(([k, v]) => [k, v.length > 0 ? v.reduce((a, b) => a + b, 0) / v.length : 0] as [string, number])
      .reduce((a, b) => (a[1] >= b[1] ? a : b), ['morning', 0])[0];

    const todayDone = isSessionDoneToday();

    // Days trained this week
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const daysThisWeek = new Set(
      sessions
        .filter(s => new Date(s.date) > weekAgo)
        .map(s => new Date(s.date).toDateString()),
    ).size;

    const stageConfig = stageConfigFor(kovaStage);

    const base: KovaContext = {
      userName,
      currentStreak: Math.max(streak, kovaStreak),
      longestStreak,
      totalSessions,
      totalXP: Math.round(xp),
      level,
      kovaStage: stageConfig.name,
      daysSinceJoining,
      lastSessionDate: lastSessionDate ?? '',
      daysSinceLastSession: daysSinceLastSession === Infinity ? 999 : daysSinceLastSession,
      todaySessionCompleted: todayDone,
      brainScores,
      strongestArea: strongest[0],
      weakestArea: weakest[0],
      favoriteGame: favoriteGameName,
      favoriteGameCount: favoriteEntry[1] as number,
      recentAccuracy,
      bestTimeOfDay: bestTime,
      currentMood: mood ?? null,
      timeOfDay,
      dayOfWeek,
      lastThreeGames: last3,
      personalBests: personalBests as Record<string, number>,
      streakAtRisk: streak > 0 && !todayDone && hour >= 20,
      justCompletedSession: false,
      justGotPersonalBest: false,
      justLeveledUp: false,
      justEvolvedKova: false,
      returnedAfterBreak: daysSinceLastSession >= 2,
      daysInCurrentWeek: daysThisWeek,
    };

    return overrides ? { ...base, ...overrides } : base;
  }, [
    userName, joinDate, mood, streak, longestStreak, totalSessions, xp, level,
    lastSessionDate, brainScores, gameHistory, sessions, personalBests,
    kovaStage, kovaStreak,
  ]);
}
