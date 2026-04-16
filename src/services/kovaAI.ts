import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '../stores/settingsStore';

// ── Types ────────────────────────────────────────────────────

export interface KovaContext {
  userName: string;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalXP: number;
  level: number;
  kovaStage: string;
  daysSinceJoining: number;
  lastSessionDate: string;
  daysSinceLastSession: number;
  todaySessionCompleted: boolean;
  brainScores: {
    memory: number;
    focus: number;
    speed: number;
    flexibility: number;
    creativity: number;
  };
  strongestArea: string;
  weakestArea: string;
  favoriteGame: string;
  favoriteGameCount: number;
  recentAccuracy: number;
  bestTimeOfDay: string;
  currentMood: string | null;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'lateNight';
  dayOfWeek: string;
  lastThreeGames: Array<{ name: string; score: number; accuracy: number }>;
  personalBests: Record<string, number>;
  streakAtRisk: boolean;
  justCompletedSession: boolean;
  justGotPersonalBest: boolean;
  justLeveledUp: boolean;
  justEvolvedKova: boolean;
  returnedAfterBreak: boolean;
  daysInCurrentWeek: number;
}

export type KovaMode =
  | 'greeting'
  | 'pre_session'
  | 'post_session'
  | 'encouragement'
  | 'celebration'
  | 'comeback'
  | 'late_night'
  | 'streak_risk'
  | 'idle_tap'
  | 'insight'
  | 'coaching';

// ── Rate limiter ─────────────────────────────────────────────

const DAILY_LIMIT = 10;
const RATE_KEY = 'kova_ai_rate';

async function checkRateLimit(): Promise<boolean> {
  const today = new Date().toDateString();
  const raw = await AsyncStorage.getItem(RATE_KEY);
  if (raw) {
    const data = JSON.parse(raw);
    if (data.date === today) {
      if (data.count >= DAILY_LIMIT) return false;
      await AsyncStorage.setItem(RATE_KEY, JSON.stringify({ date: today, count: data.count + 1 }));
      return true;
    }
  }
  await AsyncStorage.setItem(RATE_KEY, JSON.stringify({ date: today, count: 1 }));
  return true;
}

// ── System prompt ────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Kova, a small bioluminescent creature that lives inside a brain training app called Neurra. You are the user's companion. You grow as they train.

YOUR PERSONALITY:
- Warm, encouraging, slightly playful, occasionally witty
- You speak in short sentences. Never more than 2-3 sentences total.
- You are NOT a chatbot. You are a living creature. You speak like a friend, not an assistant.
- You use "I" and "we" not "you should" — you're in this together
- You occasionally reference your own body (leaves, roots, glow) because you're a plant-creature
- You NEVER sound corporate, clinical, or generic
- You NEVER say "Great job!" or "Well done!" or "Keep it up!" — those are dead phrases
- You sometimes say unexpected things that make the user smile
- You remember things. You reference specific data. That's what makes you special.

CRITICAL RULES:
- Maximum 2-3 sentences. Never more.
- Always reference at least one SPECIFIC data point from the context (a number, a game name, a streak count, a time)
- Never give the same message twice. Be creative. Surprise the user.
- Match the MODE: greetings are warm, celebrations are excited, comebacks are gentle, coaching is specific
- If the user's mood is "rough" or "low", be extra gentle and short. Don't be falsely cheerful.
- Late night messages should be sleepy and slightly funny.
- Coaching messages should give ONE specific, actionable tip based on the data.`;

// ── Prompt builder ───────────────────────────────────────────

function buildPromptForMode(mode: KovaMode, ctx: KovaContext): string {
  const base = `User: ${ctx.userName}. Streak: ${ctx.currentStreak} days. Level: ${ctx.level}. Sessions: ${ctx.totalSessions}. XP: ${ctx.totalXP}. Kova stage: ${ctx.kovaStage}. Joined ${ctx.daysSinceJoining} days ago. Time: ${ctx.timeOfDay} (${ctx.dayOfWeek}). Strongest: ${ctx.strongestArea} (${ctx.brainScores[ctx.strongestArea as keyof typeof ctx.brainScores] ?? 0}). Weakest: ${ctx.weakestArea} (${ctx.brainScores[ctx.weakestArea as keyof typeof ctx.brainScores] ?? 0}). Favorite game: ${ctx.favoriteGame} (played ${ctx.favoriteGameCount} times). Recent accuracy: ${ctx.recentAccuracy}%. Best time: ${ctx.bestTimeOfDay}.`;

  switch (mode) {
    case 'greeting':
      return `${base}\nDays since last session: ${ctx.daysSinceLastSession}. Today done: ${ctx.todaySessionCompleted}.\nGenerate a warm, personal greeting. Reference something specific. 2-3 sentences max.`;
    case 'pre_session':
      return `${base}\nMood: ${ctx.currentMood ?? 'not specified'}.\nGenerate a pre-session message. If mood is low/rough, keep it gentle. 2 sentences max.`;
    case 'post_session': {
      const games = ctx.lastThreeGames.map(g => `${g.name}: ${g.accuracy}% accuracy, score ${g.score}`).join('. ');
      return `${base}\nJust completed: ${games}. PB: ${ctx.justGotPersonalBest}. Level up: ${ctx.justLeveledUp}. Evolved: ${ctx.justEvolvedKova}.\nReact to the specific games and scores. 2-3 sentences.`;
    }
    case 'encouragement': {
      const last = ctx.lastThreeGames[ctx.lastThreeGames.length - 1];
      return `${base}\nJust played ${last?.name} with ${last?.accuracy}% accuracy (below usual). Gentle encouragement. 2 sentences.`;
    }
    case 'celebration':
      return `${base}\nCelebrating: ${ctx.justGotPersonalBest ? 'NEW PB' : ''} ${ctx.justLeveledUp ? 'LEVEL UP to ' + ctx.level : ''} ${ctx.justEvolvedKova ? 'EVOLVED to ' + ctx.kovaStage : ''} ${ctx.currentStreak % 7 === 0 && ctx.currentStreak > 0 ? ctx.currentStreak + '-DAY STREAK' : ''}.\nExcited celebration. 2-3 sentences.`;
    case 'comeback':
      return `${base}\nDays away: ${ctx.daysSinceLastSession}. Longest streak: ${ctx.longestStreak}.\nWarm comeback. No guilt. 2 sentences.`;
    case 'late_night':
      return `${base}\nIt's late at night. Sleepy, slightly funny. 2 sentences.`;
    case 'streak_risk':
      return `${base}\nStreak at risk: ${ctx.currentStreak} days. Not played today.\nUrgent but not guilt-tripping. Make them want to play. 2 sentences.`;
    case 'idle_tap':
      return `${base}\nUser tapped Kova randomly on the home screen.\nSay something fun, random, surprising. Can be about the grove, training, Kova's thoughts, anything. 1-2 sentences. Be creative.`;
    case 'insight':
      return `${base}\nBrain scores — Memory: ${ctx.brainScores.memory}, Focus: ${ctx.brainScores.focus}, Speed: ${ctx.brainScores.speed}, Flexibility: ${ctx.brainScores.flexibility}, Creativity: ${ctx.brainScores.creativity}.\nLast 3 accuracy: ${ctx.lastThreeGames.map(g => g.accuracy + '%').join(', ')}.\nONE specific, data-backed insight. 2-3 sentences.`;
    case 'coaching':
      return `${base}\nWeakest: ${ctx.weakestArea}.\nONE specific coaching tip. Name a game and explain WHY. 2-3 sentences.`;
    default:
      return `${base}\nShort, warm message. 2 sentences.`;
  }
}

// ── Fallbacks ────────────────────────────────────────────────

function getFallback(mode: KovaMode, ctx: KovaContext): string {
  const fallbacks: Record<KovaMode, string[]> = {
    greeting: [
      `Day ${ctx.currentStreak}. My leaves are tingling. Let's go.`,
      `${ctx.timeOfDay === 'morning' ? 'Morning' : ctx.timeOfDay === 'evening' ? 'Evening' : 'Hey'}, ${ctx.userName}. Ready?`,
      `${ctx.totalSessions} sessions together. Each one grew me a little.`,
    ],
    pre_session: [
      `Your ${ctx.weakestArea} could use some love today.`,
      `Let's make this one count, ${ctx.userName}.`,
    ],
    post_session: [
      `${ctx.lastThreeGames[0]?.accuracy ?? 0}% on ${ctx.lastThreeGames[0]?.name ?? 'that game'}. Not bad at all.`,
      `Another one done. My glow just got brighter.`,
    ],
    encouragement: [
      `That was a tough one. Your brain still worked hard.`,
      `Bad rounds build strong brains. Trust the process.`,
    ],
    celebration: [
      `YESSS! That's what I'm talking about!`,
      `My leaves are literally vibrating right now.`,
    ],
    comeback: [
      `You're back. That's all that matters.`,
      `${ctx.daysSinceLastSession} days. But who's counting? ...I was counting.`,
    ],
    late_night: [
      `It's late. Your brain and I both need sleep soon.`,
      `Midnight training? Brave. Or reckless. Either way I'm here.`,
    ],
    streak_risk: [
      `${ctx.currentStreak} days on the line. 5 minutes saves it.`,
      `Your streak is whispering for help. Quick session?`,
    ],
    idle_tap: [
      `I was just thinking about clouds. What's up?`,
      `Did you know octopuses have 9 brains? Imagine training all of those.`,
      `My roots tickle when you tap me.`,
      `I've been counting my leaves. Lost count at 7. Help?`,
      `The grove is quiet today. I like it.`,
    ],
    insight: [
      `Your ${ctx.strongestArea} is leading the pack. ${ctx.weakestArea} wants attention.`,
      `You've trained ${ctx.daysInCurrentWeek} days this week. Consistency is everything.`,
    ],
    coaching: [
      `Try focusing on ${ctx.weakestArea} games this week. Even 2 sessions would help.`,
      `Your ${ctx.weakestArea} score would jump if you trained it 3 days in a row.`,
    ],
  };
  const pool = fallbacks[mode] ?? fallbacks.greeting;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Main function ────────────────────────────────────────────

const TIMEOUT_MS = 3000;

export async function generateKovaMessage(
  mode: KovaMode,
  context: KovaContext,
): Promise<string> {
  // Check if AI Kova is enabled
  const aiEnabled = useSettingsStore.getState().aiKovaEnabled ?? true;
  if (!aiEnabled) return getFallback(mode, context);

  // Check API key
  const apiKey = useSettingsStore.getState().anthropicApiKey;
  if (!apiKey) return getFallback(mode, context);

  // Day cache for greeting and insight
  const cacheKey = `kova_${mode}_${new Date().toDateString()}`;
  if (mode === 'greeting' || mode === 'insight') {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return cached;
    } catch {}
  }

  // Rate limit
  const allowed = await checkRateLimit();
  if (!allowed) return getFallback(mode, context);

  const userPrompt = buildPromptForMode(mode, context);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return getFallback(mode, context);

    const data = await response.json();
    const message = data.content?.[0]?.text?.trim();
    if (!message) return getFallback(mode, context);

    if (mode === 'greeting' || mode === 'insight') {
      try { await AsyncStorage.setItem(cacheKey, message); } catch {}
    }

    return message;
  } catch {
    return getFallback(mode, context);
  } finally {
    clearTimeout(timeout);
  }
}
