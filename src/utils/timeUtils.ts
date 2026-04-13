export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'lateNight';

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 23) return 'evening';
  return 'lateNight';
}

export function getDayOfWeek(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

/** @deprecated Use localDateStr() which respects device timezone. */
export function todayStr(): string {
  return localDateStr();
}

export function formatStreak(streak: number): string {
  if (streak === 0) return 'Start your streak!';
  if (streak === 1) return 'Day 1 🔥';
  return `${streak} days 🔥`;
}

export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
  return `${s}s`;
}

/**
 * Get the local date string for a given date (or today).
 * Uses device timezone, NOT UTC.
 */
export function localDateStr(date?: Date): string {
  const d = date ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Check if a date string (YYYY-MM-DD) is yesterday in local time. */
export function isYesterday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return localDateStr(yesterday) === dateStr;
}

/** Check if a date string (YYYY-MM-DD) is today in local time. */
export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return localDateStr() === dateStr;
}

/** Number of calendar days between a date string and today. 0 = today, 1 = yesterday. */
export function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.round((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

/** Milliseconds remaining until local midnight. */
export function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/** Format milliseconds as a human-readable countdown (e.g. "5h 23m", "12m 45s"). */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
