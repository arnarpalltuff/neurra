import { BrainArea, GameId, gameConfigs, AREA_LABELS } from '../constants/gameConfigs';

/**
 * Brain Snapshot summary computation.
 *
 * Compares the last 7 days vs the prior 7 days, per brain area, and produces
 * a single human-readable line for the snapshot overlay shown on app open.
 *
 * Pure function — no store dependencies. Caller passes session data.
 */

interface SessionLite {
  date: string; // ISO YYYY-MM-DD
  games: Array<{ gameId: GameId; accuracy: number }>;
}

const AREAS: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];

function gameArea(gameId: GameId): BrainArea | null {
  return gameConfigs[gameId]?.brainArea ?? null;
}

function daysAgo(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function avgAccuracyForAreaInRange(
  sessions: SessionLite[],
  area: BrainArea,
  fromDays: number,
  toDays: number,
): number | null {
  let total = 0;
  let count = 0;
  for (const s of sessions) {
    const ago = daysAgo(s.date);
    if (ago < fromDays || ago > toDays) continue;
    for (const g of s.games) {
      if (gameArea(g.gameId) === area) {
        total += g.accuracy;
        count++;
      }
    }
  }
  return count > 0 ? total / count : null;
}

export interface SnapshotResult {
  /** One-line summary text. */
  text: string;
  /** Order in which dots should pulse — usually canonical AREAS order. */
  areaOrder: BrainArea[];
  /** Per-area delta in percentage points (positive = improving). */
  deltas: Record<BrainArea, number | null>;
}

/**
 * Compute the snapshot for today.
 *
 * - If there is no recent training (no sessions in last 14 days): a gentle
 *   welcome-back line.
 * - If a single area has a strong delta (≥ 5 pp): name it.
 * - Otherwise: a "balanced" line.
 */
export function computeBrainSnapshot(sessions: SessionLite[]): SnapshotResult {
  const deltas: Record<BrainArea, number | null> = {
    memory: null,
    focus: null,
    speed: null,
    flexibility: null,
    creativity: null,
  };

  for (const area of AREAS) {
    const thisWeek = avgAccuracyForAreaInRange(sessions, area, 0, 6);
    const lastWeek = avgAccuracyForAreaInRange(sessions, area, 7, 13);
    if (thisWeek != null && lastWeek != null) {
      deltas[area] = (thisWeek - lastWeek) * 100; // percentage points
    } else if (thisWeek != null && lastWeek == null) {
      deltas[area] = 0; // new — neutral
    }
  }

  // No sessions in the last two weeks → welcome back.
  const hasRecent = sessions.some((s) => daysAgo(s.date) <= 13);
  if (!hasRecent) {
    return {
      text: 'Welcome back. Your brain is ready when you are.',
      areaOrder: AREAS,
      deltas,
    };
  }

  // Find the area with the largest delta (positive or negative).
  let strongest: { area: BrainArea; delta: number } | null = null;
  let weakest: { area: BrainArea; delta: number } | null = null;
  for (const area of AREAS) {
    const d = deltas[area];
    if (d == null) continue;
    if (!strongest || d > strongest.delta) strongest = { area, delta: d };
    if (!weakest || d < weakest.delta) weakest = { area, delta: d };
  }

  // Strong positive jump (≥ 8 pp).
  if (strongest && strongest.delta >= 8) {
    const pct = Math.round(strongest.delta);
    return {
      text: `${AREA_LABELS[strongest.area]} jumped ${pct}% since last week.`,
      areaOrder: AREAS,
      deltas,
    };
  }

  // Mild positive (≥ 3 pp).
  if (strongest && strongest.delta >= 3) {
    return {
      text: `${AREA_LABELS[strongest.area]} is climbing. Nice work.`,
      areaOrder: AREAS,
      deltas,
    };
  }

  // Notable drop on one area (≤ -5 pp).
  if (weakest && weakest.delta <= -5 && (!strongest || strongest.delta < 3)) {
    return {
      text: `${AREA_LABELS[weakest.area]} could use some attention.`,
      areaOrder: AREAS,
      deltas,
    };
  }

  // Default — balanced.
  return {
    text: 'All five areas are holding steady. Solid week.',
    areaOrder: AREAS,
    deltas,
  };
}
