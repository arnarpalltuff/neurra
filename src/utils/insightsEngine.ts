import { BrainArea, GameId, gameConfigs, AREA_LABELS } from '../constants/gameConfigs';
import type { SessionRecord, BrainScores, GameResult } from '../stores/progressStore';

// ── Types ─────────────────────────────────────────────

export type InsightType =
  | 'pulse'       // Brain Pulse score
  | 'pattern'     // Time/behavior patterns
  | 'trend'       // Improvement/decline trends
  | 'correlation' // Mood–performance links
  | 'milestone'   // Achievement markers
  | 'tip'         // Actionable suggestions
  | 'discovery';  // Game/area discoveries

export interface Insight {
  id: string;
  type: InsightType;
  icon: string;
  title: string;
  body: string;
  priority: number; // higher = show first
  accent: string;   // hex color for card accent
}

export type BrainWeather = 'blazing' | 'sunny' | 'partly_cloudy' | 'cloudy' | 'foggy';

export interface BrainPulseData {
  score: number;       // 0–100
  trend: number;       // change vs last week (e.g. +5, -3)
  weather: BrainWeather;
  weatherLabel: string;
  weatherEmoji: string;
  strongestArea: BrainArea;
  weakestArea: BrainArea;
  streak7DayAvg: number;
}

interface InsightInput {
  sessions: SessionRecord[];
  brainScores: BrainScores;
  gameHistory: Partial<Record<GameId, GameResult[]>>;
  personalBests: Partial<Record<GameId, number>>;
  streak: number;
  longestStreak: number;
  totalSessions: number;
  xp: number;
  level: number;
  mood: string | null;
  moodHistory: Array<{ date: string; mood: string }>;
}

// ── Brain Pulse Score ─────────────────────────────────

function calcBrainPulse(input: InsightInput): BrainPulseData {
  const { brainScores, sessions } = input;
  const areas = Object.entries(brainScores) as Array<[BrainArea, number]>;

  // Base score: average of brain area scores (already 0–100 range)
  const base = areas.reduce((sum, [, v]) => sum + v, 0) / Math.max(areas.length, 1);

  // Recency boost: if trained in last 2 days, small boost
  const now = Date.now();
  const recentSessions = sessions.filter(
    s => now - new Date(s.date).getTime() < 2 * 86400000,
  );
  const recencyBoost = recentSessions.length > 0 ? 5 : 0;

  // Consistency boost: streak gives a small bonus
  const streakBoost = Math.min(input.streak * 0.5, 8);

  // Trend: compare last 7-day accuracy vs prior 7-day accuracy
  const last7 = sessionsInWindow(sessions, 7);
  const prior7 = sessionsInWindow(sessions, 14).filter(
    s => !last7.includes(s),
  );
  const last7Acc = avgAccuracy(last7);
  const prior7Acc = avgAccuracy(prior7);
  const trend = prior7.length > 0 ? Math.round((last7Acc - prior7Acc) * 100) : 0;

  const raw = base + recencyBoost + streakBoost;
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  // Weather
  let weather: BrainWeather;
  let weatherLabel: string;
  let weatherEmoji: string;
  if (score >= 85) { weather = 'blazing'; weatherLabel = 'On fire'; weatherEmoji = '🔥'; }
  else if (score >= 70) { weather = 'sunny'; weatherLabel = 'Sharp day'; weatherEmoji = '☀️'; }
  else if (score >= 50) { weather = 'partly_cloudy'; weatherLabel = 'Warming up'; weatherEmoji = '⛅'; }
  else if (score >= 30) { weather = 'cloudy'; weatherLabel = 'A bit hazy'; weatherEmoji = '☁️'; }
  else { weather = 'foggy'; weatherLabel = 'Foggy start'; weatherEmoji = '🌫️'; }

  // Strongest/weakest
  const sorted = [...areas].sort((a, b) => b[1] - a[1]);
  const strongestArea = sorted[0]?.[0] ?? 'memory';
  const weakestArea = sorted[sorted.length - 1]?.[0] ?? 'creativity';

  return {
    score,
    trend,
    weather,
    weatherLabel,
    weatherEmoji,
    strongestArea,
    weakestArea,
    streak7DayAvg: last7Acc,
  };
}

// ── Insight Generation ────────────────────────────────

export function generateInsights(input: InsightInput): {
  pulse: BrainPulseData;
  insights: Insight[];
} {
  const pulse = calcBrainPulse(input);
  const insights: Insight[] = [];

  // 1. Time-of-day pattern
  const timeInsight = detectTimePattern(input.sessions);
  if (timeInsight) insights.push(timeInsight);

  // 2. Mood correlation
  const moodInsight = detectMoodCorrelation(input);
  if (moodInsight) insights.push(moodInsight);

  // 3. Brain area trends
  const trendInsights = detectAreaTrends(input);
  insights.push(...trendInsights);

  // 4. Streak impact
  const streakInsight = detectStreakImpact(input);
  if (streakInsight) insights.push(streakInsight);

  // 5. Balance analysis
  const balanceInsight = analyzeBalance(input.brainScores);
  if (balanceInsight) insights.push(balanceInsight);

  // 6. Game discoveries
  const discoveryInsights = detectGameDiscoveries(input);
  insights.push(...discoveryInsights);

  // 7. Milestones
  const milestoneInsights = detectMilestones(input);
  insights.push(...milestoneInsights);

  // 8. Improvement rate
  const rateInsight = detectImprovementRate(input.sessions);
  if (rateInsight) insights.push(rateInsight);

  // 9. Day-of-week pattern
  const dayInsight = detectDayPattern(input.sessions);
  if (dayInsight) insights.push(dayInsight);

  // Sort by priority (highest first)
  insights.sort((a, b) => b.priority - a.priority);

  return { pulse, insights };
}

// ── Pattern Detectors ─────────────────────────────────

function detectTimePattern(sessions: SessionRecord[]): Insight | null {
  if (sessions.length < 10) return null;

  const buckets: Record<string, { total: number; count: number }> = {
    morning: { total: 0, count: 0 },
    afternoon: { total: 0, count: 0 },
    evening: { total: 0, count: 0 },
  };

  for (const s of sessions) {
    const hour = new Date(s.date).getHours();
    const bucket = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const acc = s.games.reduce((a, g) => a + g.accuracy, 0) / Math.max(s.games.length, 1);
    buckets[bucket].total += acc;
    buckets[bucket].count += 1;
  }

  const avgs = Object.entries(buckets)
    .filter(([, v]) => v.count >= 3)
    .map(([k, v]) => ({ time: k, avg: v.total / v.count }))
    .sort((a, b) => b.avg - a.avg);

  if (avgs.length < 2) return null;

  const best = avgs[0];
  const worst = avgs[avgs.length - 1];
  const diff = Math.round((best.avg - worst.avg) * 100);

  if (diff < 5) return null;

  const labels: Record<string, string> = {
    morning: 'morning', afternoon: 'afternoon', evening: 'evening',
  };
  const emojis: Record<string, string> = {
    morning: '🌅', afternoon: '☀️', evening: '🌙',
  };

  return {
    id: 'time-pattern',
    type: 'pattern',
    icon: emojis[best.time] ?? '⏰',
    title: `You're a ${labels[best.time]} brain`,
    body: `Your accuracy is ${diff}% higher in the ${labels[best.time]} compared to the ${labels[worst.time]}. Try to train when you're sharpest.`,
    priority: 80,
    accent: '#6BA8E0',
  };
}

function detectMoodCorrelation(input: InsightInput): Insight | null {
  const { sessions, moodHistory } = input;
  if (moodHistory.length < 5 || sessions.length < 5) return null;

  // Map dates to moods
  const moodByDate: Record<string, string> = {};
  for (const m of moodHistory) moodByDate[m.date] = m.mood;

  // Group session accuracy by mood
  const moodAcc: Record<string, { total: number; count: number }> = {};
  for (const s of sessions) {
    const date = s.date.split('T')[0];
    const mood = moodByDate[date];
    if (!mood) continue;
    const acc = s.games.reduce((a, g) => a + g.accuracy, 0) / Math.max(s.games.length, 1);
    if (!moodAcc[mood]) moodAcc[mood] = { total: 0, count: 0 };
    moodAcc[mood].total += acc;
    moodAcc[mood].count += 1;
  }

  const entries = Object.entries(moodAcc)
    .filter(([, v]) => v.count >= 2)
    .map(([k, v]) => ({ mood: k, avg: v.total / v.count }))
    .sort((a, b) => b.avg - a.avg);

  if (entries.length < 2) return null;

  const best = entries[0];
  const overall = entries.reduce((a, e) => a + e.avg * moodAcc[e.mood].count, 0) /
    entries.reduce((a, e) => a + moodAcc[e.mood].count, 0);
  const boost = Math.round((best.avg - overall) * 100);

  if (boost < 3) return null;

  const moodEmoji: Record<string, string> = {
    great: '😄', good: '🙂', okay: '😐', low: '😔', rough: '😟',
  };

  return {
    id: 'mood-correlation',
    type: 'correlation',
    icon: moodEmoji[best.mood] ?? '🧠',
    title: `"${best.mood}" mood = sharper brain`,
    body: `When you log feeling "${best.mood}", your scores are ${boost}% higher than average. Your mood and brain are connected.`,
    priority: 75,
    accent: '#6ECF9A',
  };
}

function detectAreaTrends(input: InsightInput): Insight[] {
  const results: Insight[] = [];
  const { sessions } = input;

  if (sessions.length < 8) return results;

  const last14 = sessionsInWindow(sessions, 14);
  const prior14 = sessionsInWindow(sessions, 28).filter(s => !last14.includes(s));

  if (prior14.length < 3 || last14.length < 3) return results;

  const areaAccRecent: Partial<Record<BrainArea, number[]>> = {};
  const areaAccPrior: Partial<Record<BrainArea, number[]>> = {};

  for (const s of last14) {
    for (const g of s.games) {
      const area = gameConfigs[g.gameId]?.brainArea;
      if (!area) continue;
      (areaAccRecent[area] ??= []).push(g.accuracy);
    }
  }

  for (const s of prior14) {
    for (const g of s.games) {
      const area = gameConfigs[g.gameId]?.brainArea;
      if (!area) continue;
      (areaAccPrior[area] ??= []).push(g.accuracy);
    }
  }

  const areas: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];
  const accentColors: Record<BrainArea, string> = {
    memory: '#6ECF9A', focus: '#6BA8E0', speed: '#F0B542',
    flexibility: '#9B72E0', creativity: '#E09B6B',
  };

  let biggest = { area: '' as BrainArea, change: 0 };

  for (const area of areas) {
    const recent = areaAccRecent[area];
    const prior = areaAccPrior[area];
    if (!recent || !prior || recent.length < 2 || prior.length < 2) continue;

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
    const change = Math.round((recentAvg - priorAvg) * 100);

    if (Math.abs(change) > Math.abs(biggest.change)) {
      biggest = { area, change };
    }
  }

  if (Math.abs(biggest.change) >= 5) {
    const improving = biggest.change > 0;
    results.push({
      id: `trend-${biggest.area}`,
      type: 'trend',
      icon: improving ? '📈' : '📉',
      title: improving
        ? `${AREA_LABELS[biggest.area]} is surging`
        : `${AREA_LABELS[biggest.area]} needs attention`,
      body: improving
        ? `Your ${AREA_LABELS[biggest.area].toLowerCase()} scores jumped ${biggest.change}% in the last 2 weeks. Whatever you're doing, keep going.`
        : `Your ${AREA_LABELS[biggest.area].toLowerCase()} dipped ${Math.abs(biggest.change)}% recently. A few focused sessions could turn this around.`,
      priority: improving ? 85 : 90,
      accent: accentColors[biggest.area],
    });
  }

  return results;
}

function detectStreakImpact(input: InsightInput): Insight | null {
  const { streak, longestStreak, sessions } = input;

  if (streak >= 7) {
    // Calculate accuracy during streak vs before
    const streakSessions = sessions.slice(-streak);
    const preStreakSessions = sessions.slice(0, -streak);

    if (preStreakSessions.length < 3) return null;

    const streakAcc = avgAccuracy(streakSessions);
    const preAcc = avgAccuracy(preStreakSessions);
    const diff = Math.round((streakAcc - preAcc) * 100);

    if (diff > 3) {
      return {
        id: 'streak-impact',
        type: 'pattern',
        icon: '🔥',
        title: `${streak} days strong`,
        body: `During this streak, your accuracy is ${diff}% higher than before. Consistency is literally making you sharper.`,
        priority: 70,
        accent: '#F0B542',
      };
    }
  }

  if (longestStreak >= 14 && streak < longestStreak) {
    return {
      id: 'streak-record',
      type: 'milestone',
      icon: '🏔️',
      title: `Your record: ${longestStreak} days`,
      body: `You once trained ${longestStreak} days straight. You're at ${streak} now. Can you beat it?`,
      priority: 50,
      accent: '#F0B542',
    };
  }

  return null;
}

function analyzeBalance(brainScores: BrainScores): Insight | null {
  const areas = Object.entries(brainScores) as Array<[BrainArea, number]>;
  const nonZero = areas.filter(([, v]) => v > 0);
  if (nonZero.length < 3) return null;

  const scores = nonZero.map(([, v]) => v);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, v) => a + (v - avg) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 8) {
    return {
      id: 'balance-good',
      type: 'pattern',
      icon: '⚖️',
      title: 'Well-balanced brain',
      body: "Your scores are evenly spread across all five brain areas. That's rare — most people have big gaps.",
      priority: 45,
      accent: '#6ECF9A',
    };
  }

  const sortedAsc = [...nonZero].sort((a, b) => a[1] - b[1]);
  const weakest = sortedAsc[0][0];
  const strongest = sortedAsc[sortedAsc.length - 1][0];
  const gap = Math.round(brainScores[strongest] - brainScores[weakest]);

  return {
    id: 'balance-gap',
    type: 'tip',
    icon: '🎯',
    title: `Bridge the ${gap}-point gap`,
    body: `${AREA_LABELS[strongest]} is your powerhouse, but ${AREA_LABELS[weakest]} is lagging behind. A few targeted sessions could close the gap.`,
    priority: 60,
    accent: '#E09B6B',
  };
}

function detectGameDiscoveries(input: InsightInput): Insight[] {
  const results: Insight[] = [];
  const { gameHistory } = input;

  // Find unplayed games
  const allGames = Object.values(gameConfigs).filter(g => g.available);
  const unplayed = allGames.filter(g => {
    const history = gameHistory[g.id];
    return !history || history.length === 0;
  });

  if (unplayed.length > 0 && unplayed.length <= 4) {
    const game = unplayed[0];
    results.push({
      id: `discover-${game.id}`,
      type: 'discovery',
      icon: game.icon,
      title: `Try ${game.name}`,
      body: `You haven't played ${game.name} yet. It trains ${AREA_LABELS[game.brainArea].toLowerCase()} — give it a shot!`,
      priority: 55,
      accent: game.color,
    });
  }

  // Find best game
  const gamePlays = Object.entries(gameHistory)
    .filter(([, results]) => results && results.length >= 5)
    .map(([id, results]) => {
      const avg = results!.reduce((a, r) => a + r.accuracy, 0) / results!.length;
      const config = gameConfigs[id as GameId];
      return { id: id as GameId, avg, name: config?.name ?? id, icon: config?.icon ?? '🎮', color: config?.color ?? '#6ECF9A' };
    })
    .sort((a, b) => b.avg - a.avg);

  if (gamePlays.length >= 3) {
    const best = gamePlays[0];
    const avgAll = gamePlays.reduce((a, g) => a + g.avg, 0) / gamePlays.length;
    const diff = Math.round((best.avg - avgAll) * 100);

    if (diff > 5) {
      results.push({
        id: 'best-game',
        type: 'pattern',
        icon: best.icon,
        title: `${best.name} is your superpower`,
        body: `You're ${diff}% above your average in ${best.name}. That's your brain's sweet spot.`,
        priority: 50,
        accent: best.color,
      });
    }
  }

  return results;
}

function detectMilestones(input: InsightInput): Insight[] {
  const results: Insight[] = [];
  const { totalSessions, xp, brainScores, level } = input;

  const sessionMilestones = [10, 25, 50, 100, 250, 500, 1000];
  for (const m of sessionMilestones) {
    if (totalSessions >= m && totalSessions < m + 3) {
      results.push({
        id: `milestone-sessions-${m}`,
        type: 'milestone',
        icon: '🎉',
        title: `${m} sessions!`,
        body: `You've completed ${m} brain training sessions. That's real commitment — your brain thanks you.`,
        priority: 65,
        accent: '#9B72E0',
      });
      break;
    }
  }

  // Brain area mastery (any area hits 80+)
  const areas = Object.entries(brainScores) as Array<[BrainArea, number]>;
  const mastered = areas.filter(([, v]) => v >= 80);
  if (mastered.length > 0 && mastered.length <= 2) {
    const [area] = mastered[0];
    results.push({
      id: `mastery-${area}`,
      type: 'milestone',
      icon: '🧠',
      title: `${AREA_LABELS[area]} mastery`,
      body: `Your ${AREA_LABELS[area].toLowerCase()} score hit ${Math.round(brainScores[area])}. You're operating at an elite level in this area.`,
      priority: 70,
      accent: '#6ECF9A',
    });
  }

  return results;
}

function detectImprovementRate(sessions: SessionRecord[]): Insight | null {
  if (sessions.length < 14) return null;

  const last7 = sessionsInWindow(sessions, 7);
  const prior7 = sessionsInWindow(sessions, 14).filter(s => !last7.includes(s));

  if (last7.length < 3 || prior7.length < 3) return null;

  const recentAcc = avgAccuracy(last7);
  const priorAcc = avgAccuracy(prior7);
  const change = Math.round((recentAcc - priorAcc) * 100);

  if (change >= 5) {
    return {
      id: 'improvement-rate',
      type: 'trend',
      icon: '🚀',
      title: `${change}% sharper this week`,
      body: `Your accuracy climbed ${change}% compared to last week. That's faster than most brain trainers improve.`,
      priority: 88,
      accent: '#6ECF9A',
    };
  }

  if (change <= -5) {
    return {
      id: 'decline-rate',
      type: 'trend',
      icon: '💪',
      title: 'Bounce-back time',
      body: `Your accuracy dipped ${Math.abs(change)}% this week. Totally normal — brains have rhythms. Tomorrow's a fresh start.`,
      priority: 72,
      accent: '#E8707E',
    };
  }

  return null;
}

function detectDayPattern(sessions: SessionRecord[]): Insight | null {
  if (sessions.length < 14) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAcc: Array<{ total: number; count: number }> = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));

  for (const s of sessions) {
    const day = new Date(s.date).getDay();
    const acc = s.games.reduce((a, g) => a + g.accuracy, 0) / Math.max(s.games.length, 1);
    dayAcc[day].total += acc;
    dayAcc[day].count += 1;
  }

  const withAvg = dayAcc
    .map((d, i) => ({ day: i, avg: d.count > 0 ? d.total / d.count : 0, count: d.count }))
    .filter(d => d.count >= 2)
    .sort((a, b) => b.avg - a.avg);

  if (withAvg.length < 3) return null;

  const best = withAvg[0];
  const worst = withAvg[withAvg.length - 1];
  const diff = Math.round((best.avg - worst.avg) * 100);

  if (diff < 5) return null;

  return {
    id: 'day-pattern',
    type: 'pattern',
    icon: '📅',
    title: `${dayNames[best.day]}s are your peak`,
    body: `You score ${diff}% better on ${dayNames[best.day]}s than ${dayNames[worst.day]}s. Your brain has a weekly rhythm.`,
    priority: 55,
    accent: '#6BA8E0',
  };
}

// ── Helpers ───────────────────────────────────────────

function sessionsInWindow(sessions: SessionRecord[], days: number): SessionRecord[] {
  const cutoff = Date.now() - days * 86400000;
  return sessions.filter(s => new Date(s.date).getTime() >= cutoff);
}

function avgAccuracy(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;
  let total = 0;
  let count = 0;
  for (const s of sessions) {
    for (const g of s.games) {
      total += g.accuracy;
      count += 1;
    }
  }
  return count > 0 ? total / count : 0;
}
