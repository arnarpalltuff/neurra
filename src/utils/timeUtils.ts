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

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
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
