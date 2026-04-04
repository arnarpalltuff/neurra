import { AgeGroup } from '../stores/userStore';
import { BrainScores } from '../stores/progressStore';

/**
 * Simulated percentile distributions per age group.
 * Each area has a mean and stddev. We use a normal approximation
 * to compute what percentile the user's score falls in.
 *
 * In production, these would come from real aggregate user data.
 */
const AGE_DISTRIBUTIONS: Record<AgeGroup, Record<keyof BrainScores, { mean: number; stddev: number }>> = {
  'under18': {
    memory: { mean: 62, stddev: 18 },
    focus: { mean: 58, stddev: 20 },
    speed: { mean: 68, stddev: 16 },
    flexibility: { mean: 55, stddev: 19 },
    creativity: { mean: 65, stddev: 17 },
  },
  '18-24': {
    memory: { mean: 65, stddev: 17 },
    focus: { mean: 60, stddev: 18 },
    speed: { mean: 70, stddev: 15 },
    flexibility: { mean: 58, stddev: 18 },
    creativity: { mean: 63, stddev: 16 },
  },
  '25-34': {
    memory: { mean: 63, stddev: 16 },
    focus: { mean: 62, stddev: 17 },
    speed: { mean: 66, stddev: 16 },
    flexibility: { mean: 60, stddev: 17 },
    creativity: { mean: 60, stddev: 16 },
  },
  '35-44': {
    memory: { mean: 58, stddev: 17 },
    focus: { mean: 60, stddev: 18 },
    speed: { mean: 60, stddev: 17 },
    flexibility: { mean: 58, stddev: 18 },
    creativity: { mean: 57, stddev: 17 },
  },
  '45-54': {
    memory: { mean: 53, stddev: 18 },
    focus: { mean: 56, stddev: 19 },
    speed: { mean: 54, stddev: 18 },
    flexibility: { mean: 54, stddev: 19 },
    creativity: { mean: 55, stddev: 18 },
  },
  '55-64': {
    memory: { mean: 48, stddev: 19 },
    focus: { mean: 52, stddev: 20 },
    speed: { mean: 48, stddev: 19 },
    flexibility: { mean: 50, stddev: 20 },
    creativity: { mean: 52, stddev: 19 },
  },
  '65+': {
    memory: { mean: 42, stddev: 20 },
    focus: { mean: 48, stddev: 21 },
    speed: { mean: 42, stddev: 20 },
    flexibility: { mean: 45, stddev: 21 },
    creativity: { mean: 48, stddev: 20 },
  },
};

/** Standard normal CDF approximation (Abramowitz & Stegun) */
function normalCDF(z: number): number {
  if (z < -6) return 0;
  if (z > 6) return 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

export interface PercentileResult {
  area: keyof BrainScores;
  score: number;
  percentile: number; // 0-100, higher = better than more people
  label: string; // e.g. "Top 35%"
}

/** Get percentile rankings for all brain areas given an age group */
export function getPercentiles(
  scores: BrainScores,
  ageGroup: AgeGroup,
): PercentileResult[] {
  const dist = AGE_DISTRIBUTIONS[ageGroup];
  const areas = Object.keys(scores) as Array<keyof BrainScores>;

  return areas.map((area) => {
    const { mean, stddev } = dist[area];
    const z = (scores[area] - mean) / stddev;
    const percentile = Math.round(normalCDF(z) * 100);
    const topPercent = 100 - percentile;
    const label = topPercent <= 1 ? 'Top 1%' : `Top ${topPercent}%`;
    return { area, score: scores[area], percentile, label };
  });
}

/** Get a single random percentile callout for session summary (1 in 3 chance) */
export function getSessionPercentileCallout(
  scores: BrainScores,
  ageGroup: AgeGroup | null,
  sessionAccuracy: number,
): string | null {
  if (!ageGroup) return null;
  // Only show 1 in 3 sessions
  if (Math.random() > 0.33) return null;

  const percentiles = getPercentiles(scores, ageGroup);
  const best = percentiles.reduce((a, b) => (a.percentile > b.percentile ? a : b));
  const ageLabel = ageGroup === 'under18' ? 'under 18' : ageGroup === '65+' ? '65+' : `ages ${ageGroup}`;

  const templates = [
    `Your ${best.area} score puts you in the ${best.label.toLowerCase()} for ${ageLabel}.`,
    `Your ${best.area} is stronger than ${best.percentile}% of people in your age group.`,
    `For ${ageLabel}, your ${best.area} is ${best.label.toLowerCase()}. Keep it up!`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/** Age group display labels */
export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  'under18': 'Under 18',
  '18-24': '18–24',
  '25-34': '25–34',
  '35-44': '35–44',
  '45-54': '45–54',
  '55-64': '55–64',
  '65+': '65+',
};
