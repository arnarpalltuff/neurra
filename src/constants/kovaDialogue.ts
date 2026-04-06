import { getTimeOfDay } from '../utils/timeUtils';
import { pickRandom } from '../utils/arrayUtils';

// ── Greeting pools ──────────────────────────────────

const MORNING_GREETINGS = [
  "Rise and shine! Your neurons are warming up.",
  "Morning brain is fresh brain. Let's use it.",
  "Good morning! Ready to flex those synapses?",
  "The early bird catches the... neural pathway.",
  "Coffee + brain training = unstoppable.",
  "Your brain woke up hungry. Let's feed it.",
];

const AFTERNOON_GREETINGS = [
  "Afternoon check-in! Quick session?",
  "Perfect time for a brain break.",
  "Midday boost — your brain will thank you.",
  "Let's shake off that afternoon fog.",
  "A few minutes now, sharper for the rest of the day.",
  "Your afternoon brain needs this.",
];

const EVENING_GREETINGS = [
  "Winding down? Your brain isn't.",
  "Evening sessions build the best habits.",
  "End the day stronger than you started.",
  "You're here. That's what matters.",
  "One more session before the day ends.",
  "Evening training — the secret weapon.",
];

const LATE_NIGHT_GREETINGS = [
  "Still up? Me too. Let's train.",
  "Night owl mode activated.",
  "Late-night neurons are creative neurons.",
  "Can't sleep? Let's put that brain to work.",
  "The quiet hours. Perfect for focus.",
];

const STREAK_GREETINGS = [
  "Day {streak}! You're on fire.",
  "{streak} days strong. Keep going.",
  "Your streak is glowing — day {streak}!",
  "Look at that streak — {streak} days!",
  "{streak} days. You're building something real.",
];

const RETURN_GREETINGS = [
  "Welcome back! I missed you.",
  "You're back! Let's pick up where we left off.",
  "Hey stranger. Ready to jump back in?",
  "Glad you're here. Every session counts.",
  "Welcome back — your brain remembers more than you think.",
];

const FIRST_SESSION_GREETINGS = [
  "Welcome! I'm Kova, your brain training buddy.",
  "Hey! First session? You're going to love this.",
  "Let's get started! I'll be with you every step.",
];

const GENERIC_GREETINGS = [
  "Let's train that brain!",
  "I've been waiting for you.",
  "Ready when you are.",
  "Your brain called — it wants a workout.",
  "Another day, another neuron.",
  "Let's make today count.",
  "I believe in you.",
  "Brains love consistency.",
  "Small steps, big growth.",
  "You showed up. That's half the battle.",
  "Your future self will thank you.",
  "Time to level up.",
  "Let's see what you've got today.",
  "Warming up the neural pathways...",
  "The brain gym is open.",
  "You're building something here.",
  "One session at a time.",
  "Ready to surprise yourself?",
  "Let's get those neurons firing.",
];

// ── Post-session messages ────────────────────────────

export const POST_SESSION_MOOD_LOW = [
  "You showed up even on a hard day. That takes real strength.",
  "Tough days make the streak mean more.",
  "Your brain doesn't care about your mood — it grew today.",
];

export const POST_SESSION_PERFECT = [
  "That was incredible. I'm glowing!",
  "Flawless. Your brain is on another level today.",
  "Perfect score. I'm genuinely impressed.",
];

export const POST_SESSION_GOOD = [
  "We did it! Great session.",
  "Solid work. Your neurons are happy.",
  "That's the kind of session that builds real growth.",
];

export const POST_SESSION_OKAY = [
  "That was tough. You showed up — that's what matters.",
  "Not every session is your best. But every session counts.",
  "The hardest part was starting. You did that.",
];

// ── Getter ───────────────────────────────────────────

interface GreetingContext {
  streak?: number;
  totalSessions?: number;
  daysSinceLastSession?: number;
}

export function getGreeting(ctx: GreetingContext = {}): string {
  const { streak = 0, totalSessions = 0, daysSinceLastSession } = ctx;

  // First session ever
  if (totalSessions === 0) {
    return pickRandom(FIRST_SESSION_GREETINGS);
  }

  // Returning after absence
  if (daysSinceLastSession != null && daysSinceLastSession > 2) {
    return pickRandom(RETURN_GREETINGS);
  }

  // Streak milestone
  if (streak > 0 && streak % 5 === 0) {
    return pickRandom(STREAK_GREETINGS).replace('{streak}', String(streak));
  }

  // Time-of-day based (40% chance)
  if (Math.random() < 0.4) {
    const tod = getTimeOfDay();
    switch (tod) {
      case 'morning': return pickRandom(MORNING_GREETINGS);
      case 'afternoon': return pickRandom(AFTERNOON_GREETINGS);
      case 'evening': return pickRandom(EVENING_GREETINGS);
      case 'lateNight': return pickRandom(LATE_NIGHT_GREETINGS);
    }
  }

  // Streak mention (30% chance when streak > 1)
  if (streak > 1 && Math.random() < 0.3) {
    return pickRandom(STREAK_GREETINGS).replace('{streak}', String(streak));
  }

  return pickRandom(GENERIC_GREETINGS);
}

export function getPostSessionMessage(accuracy: number, mood?: string | null): string {
  if (mood === 'low' || mood === 'rough') {
    return pickRandom(POST_SESSION_MOOD_LOW);
  }
  if (accuracy >= 0.9) return pickRandom(POST_SESSION_PERFECT);
  if (accuracy >= 0.7) return pickRandom(POST_SESSION_GOOD);
  return pickRandom(POST_SESSION_OKAY);
}
