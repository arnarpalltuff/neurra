/**
 * Push / local notification copy pools (Phase Q).
 * Selection logic (no repeat within 7 days, weighting) can be layered in notificationSchedule.
 */

export function pickDailyReminderBody(ctx: { streak: number; name: string }): string {
  const pool = [
    "Kova's got today's session ready. 5 minutes?",
    `Day ${Math.max(1, ctx.streak)} waiting. Keep it alive. 🔥`,
    'A tiny session keeps your grove growing.',
    'Five minutes with Neurra — your brain will notice.',
    'Ready when you are. Kova saved you a seat.',
    `${ctx.name ? `${ctx.name}, ` : ''}your daily reps are waiting.`,
    'Consistency beats intensity. Tap in for one round.',
    'The stream in your grove is flowing — come say hi.',
    'New day, same you — sharper than yesterday.',
    'Micro-break for your mind?',
    'Training time. Kova believes in you.',
    'No pressure — just progress if you want it.',
    'Your streak likes attention.',
    'Quick session? Future you says thanks.',
    'Neurra’s ready. Are you? (Totally okay if later.)',
    'Small win: open the app. Bigger win: one game.',
  ];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export const STREAK_AT_RISK: string[] = [
  '🔥 Your streak is on the line. Still time today.',
  'Evening check-in: one short session saves the flame.',
  'Streak watch — Kova’s rooting for you tonight.',
  'Before bed: tap Neurra once. Future you smiles.',
  'Your grove gets sad when the streak sleeps empty.',
  'Last call for today’s session — you’ve got this.',
  'Five minutes now beats starting over tomorrow.',
  'Streak SOS: gentle nudge, zero guilt.',
  'Kova left the light on in the grove.',
  'Quick play keeps the 🔥 alive.',
  'Not too late — your brain is still online.',
];

export const MISSED_ONE_DAY: string[] = [
  'Yesterday was a rest day. Today’s a fresh start.',
  'Blank day happens. Your progress didn’t disappear.',
  'Welcome back — Kova saved your spot.',
  'One miss ≠ game over. Step back in anytime.',
  'The grove forgives. Ready for a quick round?',
  'Streak reset, story continues.',
  'New run starts now if you want it.',
  'No lecture — just an open door.',
];

export const MISSED_FEW_DAYS: string[] = [
  'It’s been a few days. Your grove misses you.',
  'Pause is normal. Neurra’s still here.',
  'Whenever you’re ready — no catch-up homework.',
  'Soft return: one easy session today?',
  'Kova: “Hi. Still friends?”',
];

export const FUN_RANDOM: string[] = [
  'Your brain burns ~320 calories a day thinking. Let’s make it 321.',
  'Neurons that fire together, wire together — cliché because it’s true.',
  'You’re allowed to be bad at a game before you get good.',
  'Kova fact: moss is patient. So is progress.',
  'One session > zero sessions. Math checks out.',
  'Your attention is a muscle. Light reps count.',
  'No leaderboard pressure unless you want it.',
  'Tiny habits > heroic sprints.',
  'Coffee optional. Curiosity required.',
  'Science says breaks help. So does coming back.',
];
