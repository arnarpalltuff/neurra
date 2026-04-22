/**
 * AI Brain Coach — Claude-powered daily briefings.
 *
 * Uses the Anthropic API to generate personalized coaching based on
 * the player's last 7 days of training data.
 *
 * - Called once per day on app open
 * - Cached in AsyncStorage
 * - Falls back to static greetings if API unavailable
 * - Only activates after 3+ completed sessions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr, getTimeOfDay } from '../utils/timeUtils';
import { invokeClaudeProxy } from './supabaseClient';

export interface CoachBriefing {
  greeting: string;
  insight: string;
  recommendation: string;
  encouragement: string;
}

interface SessionSummary {
  date: string;
  gameCount: number;
  avgAccuracy: number;
  totalXP: number;
  brainAreas: Record<string, number>;
}

const CACHE_PREFIX = 'briefing_';

// ── Static Fallback ─────────────────────────────────

function getStaticBriefing(name: string, streak: number): CoachBriefing {
  const tod = getTimeOfDay();
  const greetings: Record<string, string> = {
    morning: `Good morning, ${name}! `,
    afternoon: `Hey ${name}! `,
    evening: `Evening, ${name}! `,
    lateNight: `Still up, ${name}? `,
  };

  return {
    greeting: `${greetings[tod]}Day ${streak} — let's keep going.`,
    insight: "Your brain is building new pathways every session.",
    recommendation: "Today's session has a good mix of skills.",
    encouragement: "Showing up is the hardest part. You already did it.",
  };
}

// ── API Call ─────────────────────────────────────────

interface AnthropicMessageResponse {
  content?: Array<{ type: string; text?: string }>;
}

async function callCoachAPI(
  name: string,
  data: SessionSummary[],
  streak: number,
  storyEnabled: boolean,
  storyDay: number,
): Promise<CoachBriefing> {
  const tod = getTimeOfDay();
  const storyContext = storyEnabled
    ? `\nStory mode is ON (day ${storyDay}). Frame insights through Kova's perspective in The Shimmer. Instead of clinical language, use metaphors about light, The Fade, and The Shimmer.`
    : '';

  const prompt = `You are Kova, a warm, encouraging brain training companion. You speak in short, friendly sentences. Never use clinical language. Be specific about the data but frame everything positively.${storyContext}

The user's name is ${name}. Time of day: ${tod}. Current streak: ${streak} days.

Here is their last 7 days of brain training data:
${JSON.stringify(data, null, 2)}

Generate a daily briefing with exactly 4 parts:
1. greeting: A warm hello personalized to their streak and time of day (1 sentence)
2. insight: ONE specific observation from their data (1-2 sentences)
3. recommendation: What brain area to focus on today and why (1 sentence)
4. encouragement: A short, genuine motivational message referencing their specific progress (1-2 sentences)

Respond ONLY in JSON format with these exact keys: greeting, insight, recommendation, encouragement. No markdown, no backticks.`;

  const result = await invokeClaudeProxy<AnthropicMessageResponse>({
    prompt,
    maxTokens: 300,
    model: 'claude-sonnet-4-20250514',
  });
  const text = result.content?.[0]?.text || '';
  return JSON.parse(text) as CoachBriefing;
}

// ── Public API ──────────────────────────────────────

/**
 * Get or generate the daily coaching briefing.
 * Checks cache first, then calls API, then falls back to static.
 */
export async function getDailyBriefing(params: {
  name: string;
  streak: number;
  totalSessions: number;
  sessions: SessionSummary[];
  storyEnabled: boolean;
  storyDay: number;
}): Promise<CoachBriefing> {
  const { name, streak, totalSessions, sessions, storyEnabled, storyDay } = params;

  // Not enough data for AI coaching
  if (totalSessions < 3) {
    return getStaticBriefing(name, streak);
  }

  // Check cache
  const today = todayStr();
  const cacheKey = `${CACHE_PREFIX}${today}`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  // Try API (Supabase Edge Function holds the Anthropic key server-side).
  try {
    const briefing = await callCoachAPI(name, sessions, streak, storyEnabled, storyDay);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(briefing)).catch(() => {});
    return briefing;
  } catch (e) {
    console.warn('[brainCoach] API call failed, using fallback:', e);
  }

  // Fallback
  return getStaticBriefing(name, streak);
}

/**
 * Convert raw session records to the summary format sent to the API.
 * Only sends aggregate stats — never personal info beyond first name.
 */
export function summarizeSessions(
  sessions: Array<{
    date: string;
    games: Array<{ gameId: string; accuracy: number; score: number }>;
    totalXP: number;
  }>,
): SessionSummary[] {
  return sessions.slice(-7).map(s => ({
    date: s.date.split('T')[0],
    gameCount: s.games.length,
    avgAccuracy: s.games.length > 0
      ? Math.round(s.games.reduce((a, g) => a + g.accuracy, 0) / s.games.length * 100) / 100
      : 0,
    totalXP: s.totalXP,
    brainAreas: {},
  }));
}
