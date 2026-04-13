import type { BrainScores } from '../stores/progressStore';
import type { BrainSnapshot } from '../stores/brainHistoryStore';
import { todayStr } from './timeUtils';

/**
 * F2 Brain Weather classifier.
 *
 * Turns abstract per-area progress into a single emotional metaphor:
 * sunny / partly-cloudy / cloudy / rainy / stormy / lightning / rainbow.
 */

export type BrainWeather =
  | 'sunny'
  | 'partlyCloudy'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'lightning'
  | 'rainbow';

export interface BrainWeatherReport {
  weather: BrainWeather;
  icon: string;
  headline: string;
  /** Hex color used for the subtle home-screen tint. */
  tint: string;
  /** Brain area name for lightning weather, otherwise null. */
  surgingArea: string | null;
}

const AREAS: Array<keyof BrainScores> = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];

function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  const last = new Date(`${dateStr}T12:00:00`);
  const today = new Date(`${todayStr()}T12:00:00`);
  return Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

const AREA_LABEL: Record<keyof BrainScores, string> = {
  memory: 'Memory',
  focus: 'Focus',
  speed: 'Speed',
  flexibility: 'Flexibility',
  creativity: 'Creativity',
};

interface WeatherInputs {
  current: BrainScores;
  weekAgo: BrainSnapshot | null;
  streak: number;
  lastSessionDate: string | null;
  /** True if the user trained today after a 3+ day gap. */
  returningToday: boolean;
}

export function classifyBrainWeather(inputs: WeatherInputs): BrainWeatherReport {
  const { current, weekAgo, streak, lastSessionDate, returningToday } = inputs;
  const gap = daysSince(lastSessionDate);

  // ── Rainbow: just came back from a 3+ day gap and trained today.
  if (returningToday) {
    return {
      weather: 'rainbow',
      icon: '🌈',
      headline: 'Welcome back. The forecast is looking up.',
      tint: 'rgba(155,114,224,0.06)',
      surgingArea: null,
    };
  }

  // ── Stormy: missed 3+ days, streak broken.
  if (gap >= 3 && streak === 0) {
    return {
      weather: 'stormy',
      icon: '⛈',
      headline: "Rough weather. But storms pass. Let's train.",
      tint: 'rgba(0,0,0,0.18)',
      surgingArea: null,
    };
  }

  // Without history, fall back on streak alone.
  if (!weekAgo) {
    if (streak >= 3) {
      return {
        weather: 'sunny',
        icon: '☀️',
        headline: "Clear skies. Your brain's in good shape.",
        tint: 'rgba(240,181,66,0.06)',
        surgingArea: null,
      };
    }
    return {
      weather: 'cloudy',
      icon: '☁️',
      headline: 'A few clouds. Train a little to clear them.',
      tint: 'rgba(160,164,176,0.05)',
      surgingArea: null,
    };
  }

  // Compute per-area deltas.
  const deltas = AREAS.map((area) => ({
    area,
    delta: current[area] - weekAgo.scores[area],
    pct: weekAgo.scores[area] > 0 ? (current[area] - weekAgo.scores[area]) / weekAgo.scores[area] : 0,
  }));

  // ── Lightning: any area surged 20%+.
  const surger = deltas.find((d) => d.pct >= 0.20 && d.delta >= 5);
  if (surger) {
    return {
      weather: 'lightning',
      icon: '⚡',
      headline: `Your ${AREA_LABEL[surger.area]} is surging. Ride the lightning.`,
      tint: 'rgba(240,181,66,0.08)',
      surgingArea: AREA_LABEL[surger.area],
    };
  }

  const improved = deltas.filter((d) => d.delta > 1).length;
  const declined = deltas.filter((d) => d.delta < -1).length;

  // ── Sunny: 4-5 areas improved/stable AND streak alive.
  if (improved >= 4 && declined <= 1 && streak > 0) {
    return {
      weather: 'sunny',
      icon: '☀️',
      headline: "Clear skies. Your brain's in good shape.",
      tint: 'rgba(240,181,66,0.06)',
      surgingArea: null,
    };
  }

  // ── Partly cloudy: mixed signals.
  if (improved >= 2 && declined <= 2) {
    return {
      weather: 'partlyCloudy',
      icon: '⛅',
      headline: 'A few clouds. Some areas need attention.',
      tint: 'rgba(107,168,224,0.05)',
      surgingArea: null,
    };
  }

  // ── Rainy: most declined or untrained.
  if (declined >= 3) {
    return {
      weather: 'rainy',
      icon: '🌧',
      headline: 'A bit of rain. A short session helps.',
      tint: 'rgba(107,168,224,0.07)',
      surgingArea: null,
    };
  }

  // ── Default: cloudy.
  return {
    weather: 'cloudy',
    icon: '☁️',
    headline: 'Mostly cloudy. Time to train and shake it loose.',
    tint: 'rgba(160,164,176,0.05)',
    surgingArea: null,
  };
}
