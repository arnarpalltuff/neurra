import { GameId, gameConfigs, BrainArea } from '../constants/gameConfigs';
import { SessionRecord, GameResult, BrainScores } from '../stores/progressStore';

export interface WeeklyStats {
  weekLabel: string; // e.g. "Mar 24"
  sessions: number;
  totalXP: number;
  avgAccuracy: number;
}

export interface GameProgression {
  gameId: GameId;
  gameName: string;
  icon: string;
  scores: Array<{ date: string; score: number; accuracy: number }>;
  trend: 'improving' | 'declining' | 'flat';
  bestScore: number;
  avgScore: number;
  totalPlays: number;
}

export interface BrainAreaTrend {
  area: BrainArea;
  current: number;
  weekAgo: number;
  monthAgo: number;
  change: number; // current - weekAgo
}

export interface PerformanceOverview {
  totalSessions: number;
  totalXP: number;
  avgAccuracy: number;
  avgSessionXP: number;
  weeklyStats: WeeklyStats[];
  gameProgressions: GameProgression[];
  brainTrends: BrainAreaTrend[];
  streakHistory: Array<{ date: string; hadSession: boolean }>;
  bestDay: { date: string; xp: number } | null;
}

/**
 * Generate a full performance overview from session history.
 */
export function getPerformanceOverview(
  sessions: SessionRecord[],
  gameHistory: Partial<Record<GameId, GameResult[]>>,
  brainScores: BrainScores,
  totalXP: number,
): PerformanceOverview {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  // Overall stats
  const allAccuracies = sorted.flatMap(s => s.games.map(g => g.accuracy));
  const avgAccuracy = allAccuracies.length > 0
    ? allAccuracies.reduce((a, b) => a + b, 0) / allAccuracies.length
    : 0;
  const avgSessionXP = sorted.length > 0
    ? sorted.reduce((sum, s) => sum + s.totalXP, 0) / sorted.length
    : 0;

  // Weekly stats (last 8 weeks)
  const weeklyStats = computeWeeklyStats(sorted);

  // Game progressions
  const gameProgressions = computeGameProgressions(gameHistory);

  // Brain area trends
  const brainTrends = computeBrainTrends(sorted, brainScores);

  // Streak history (last 30 days)
  const streakHistory = computeStreakHistory(sorted);

  // Best day
  const dayXP: Record<string, number> = {};
  for (const s of sorted) {
    const day = s.date.split('T')[0];
    dayXP[day] = (dayXP[day] ?? 0) + s.totalXP;
  }
  const bestDay = Object.entries(dayXP).sort((a, b) => b[1] - a[1])[0];

  return {
    totalSessions: sorted.length,
    totalXP,
    avgAccuracy,
    avgSessionXP: Math.round(avgSessionXP),
    weeklyStats,
    gameProgressions,
    brainTrends,
    streakHistory,
    bestDay: bestDay ? { date: bestDay[0], xp: bestDay[1] } : null,
  };
}

function computeWeeklyStats(sessions: SessionRecord[]): WeeklyStats[] {
  const weeks: WeeklyStats[] = [];
  const now = new Date();

  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (w + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - w * 7);

    const weekSessions = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= weekStart && d < weekEnd;
    });

    const totalXP = weekSessions.reduce((sum, s) => sum + s.totalXP, 0);
    const allAcc = weekSessions.flatMap(s => s.games.map(g => g.accuracy));
    const avgAcc = allAcc.length > 0 ? allAcc.reduce((a, b) => a + b, 0) / allAcc.length : 0;

    const month = weekStart.toLocaleString('en', { month: 'short' });
    const day = weekStart.getDate();

    weeks.push({
      weekLabel: `${month} ${day}`,
      sessions: weekSessions.length,
      totalXP,
      avgAccuracy: avgAcc,
    });
  }

  return weeks;
}

function computeGameProgressions(
  gameHistory: Partial<Record<GameId, GameResult[]>>,
): GameProgression[] {
  const progressions: GameProgression[] = [];

  for (const [gameId, results] of Object.entries(gameHistory)) {
    if (!results || results.length === 0) continue;
    const config = gameConfigs[gameId as GameId];
    if (!config) continue;

    const sorted = [...results].sort((a, b) => a.date.localeCompare(b.date));
    const scores = sorted.map(r => ({ date: r.date.split('T')[0], score: r.score, accuracy: r.accuracy }));
    const allScores = sorted.map(r => r.score);
    const bestScore = Math.max(...allScores);
    const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

    // Trend: compare first half vs second half
    const half = Math.floor(allScores.length / 2);
    let trend: 'improving' | 'declining' | 'flat' = 'flat';
    if (allScores.length >= 4) {
      const firstAvg = allScores.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const secondAvg = allScores.slice(half).reduce((a, b) => a + b, 0) / (allScores.length - half);
      const diff = secondAvg - firstAvg;
      if (diff > firstAvg * 0.05) trend = 'improving';
      else if (diff < -firstAvg * 0.05) trend = 'declining';
    }

    progressions.push({
      gameId: gameId as GameId,
      gameName: config.name,
      icon: config.icon,
      scores: scores.slice(-20), // last 20 plays
      trend,
      bestScore,
      avgScore,
      totalPlays: results.length,
    });
  }

  return progressions.sort((a, b) => b.totalPlays - a.totalPlays);
}

function computeBrainTrends(
  sessions: SessionRecord[],
  currentScores: BrainScores,
): BrainAreaTrend[] {
  const areas: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);

  return areas.map(area => {
    // Estimate historical scores from session accuracy
    const areaGames = sessions.flatMap(s =>
      s.games.filter(g => gameConfigs[g.gameId]?.brainArea === area)
    );

    const weekAgoGames = areaGames.filter(g => new Date(g.date) <= weekAgo).slice(-5);
    const monthAgoGames = areaGames.filter(g => new Date(g.date) <= monthAgo).slice(-5);

    const weekAgoScore = weekAgoGames.length > 0
      ? Math.round(weekAgoGames.reduce((s, g) => s + g.accuracy * 100, 0) / weekAgoGames.length)
      : currentScores[area];
    const monthAgoScore = monthAgoGames.length > 0
      ? Math.round(monthAgoGames.reduce((s, g) => s + g.accuracy * 100, 0) / monthAgoGames.length)
      : currentScores[area];

    return {
      area,
      current: currentScores[area],
      weekAgo: weekAgoScore,
      monthAgo: monthAgoScore,
      change: Math.round(currentScores[area] - weekAgoScore),
    };
  });
}

function computeStreakHistory(sessions: SessionRecord[]): Array<{ date: string; hadSession: boolean }> {
  const history: Array<{ date: string; hadSession: boolean }> = [];
  const sessionDates = new Set(sessions.map(s => s.date.split('T')[0]));

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    history.push({ date: dateStr, hadSession: sessionDates.has(dateStr) });
  }

  return history;
}
