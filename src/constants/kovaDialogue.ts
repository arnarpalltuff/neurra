import { getTimeOfDay } from '../utils/timeUtils';
import { pickRandom } from '../utils/arrayUtils';

/**
 * Kova greeting & post-session dialogue.
 *
 * These lines are Kova's VOICE. They should feel like a real character —
 * sometimes curious, sometimes funny, sometimes surprisingly deep.
 * Never corporate, never generic, never "you can do it champ."
 */

// ── Greeting pools ──────────────────────────────────

const MORNING_GREETINGS = [
  "Rise and shine! Your neurons are warming up.",
  "Morning brain is fresh brain. Let's use it.",
  "Good morning! Ready to flex those synapses?",
  "Coffee + brain training = unstoppable.",
  "Your brain woke up hungry. Let's feed it.",
  "I've been up since you opened the app. So technically, you woke me up.",
  "Morning light does something to neurons. I read that somewhere. Or dreamed it.",
  "You're here before the day gets loud. Smart.",
  "The grove looks beautiful in the morning. Almost as beautiful as your brain map.",
  "I cataloged everything you learned yesterday while you slept. You're welcome.",
  "Fun fact: your brain burns 20% of your calories. Breakfast is brain fuel.",
  "Early sessions stick better. That's not a pep talk, that's neuroscience.",
];

const AFTERNOON_GREETINGS = [
  "Afternoon check-in! Quick session?",
  "Perfect time for a brain break.",
  "Midday boost — your brain will thank you.",
  "Let's shake off that afternoon fog.",
  "A few minutes now, sharper for the rest of the day.",
  "Your afternoon brain needs this. Trust me, I can feel it drooping.",
  "Between meetings, between tasks, between thoughts — this is where growth happens.",
  "The post-lunch dip is real. Let's fight it with neurons.",
  "Halfway through the day. Perfect time to check in with your brain.",
  "I've been thinking about your Focus score. Want to work on it?",
];

const EVENING_GREETINGS = [
  "Winding down? Your brain isn't.",
  "Evening sessions build the best habits.",
  "End the day stronger than you started.",
  "You're here. That's what matters.",
  "One session before the day ends.",
  "Evening training — the quiet hours are the best hours.",
  "The world gets quieter. Your brain gets sharper.",
  "Most people stop trying by evening. You didn't.",
  "Your brain processes today's session while you sleep tonight. Free double-dip.",
  "Golden hour for neurons. Not scientifically proven. But I believe it.",
];

const LATE_NIGHT_GREETINGS = [
  "Still up? Me too. Let's train.",
  "Night owl mode activated.",
  "Late-night neurons are creative neurons.",
  "Can't sleep? Let's put that brain to work.",
  "The quiet hours. Perfect for focus.",
  "Everyone else is asleep. This session is just for us.",
  "Late night. No distractions. Just you, me, and 86 billion neurons.",
  "I don't sleep. So if you're up, I'm up.",
];

const STREAK_GREETINGS = [
  "Day {streak}! You're on fire.",
  "{streak} days strong. That's not luck, that's you.",
  "Your streak is glowing — day {streak}!",
  "Look at that streak — {streak} days! I'm literally growing because of this.",
  "{streak} days. You're building something most people only talk about.",
  "Day {streak}. I've been counting. Every single one.",
  "{streak} in a row. Your consistency is my favorite thing about you.",
  "Your streak hit {streak}. The grove can feel it.",
  "Day {streak}. At this point, you're not building a habit — you're building a brain.",
  "{streak} days! I told the grove. The tree looked proud.",
];

const RETURN_GREETINGS = [
  "Welcome back! I missed you.",
  "You're back! The grove noticed. So did I.",
  "Hey stranger. Ready to jump back in?",
  "Glad you're here. Every session counts, especially this one.",
  "Welcome back — your brain remembers more than you think.",
  "You left. You came back. That takes more courage than never stopping.",
  "The grove got a little quiet without you. Let's fix that.",
  "I kept your spot warm. That's a lie. I'm a plant. But the sentiment is real.",
];

const FIRST_SESSION_GREETINGS = [
  "Welcome! I'm Kova. I'll be growing alongside you.",
  "Hey! First session? I've been waiting for this moment.",
  "Let's get started! 5 minutes. That's all I'm asking.",
  "This is the beginning of something good. I can feel it.",
  "Welcome to Neurra. I'm small now, but watch me grow.",
  "Your brain is about to do something it's never done before. Ready?",
];

const MILESTONE_GREETINGS = [
  "Level {level}! You're evolving.",
  "You just crossed {sessions} sessions. That's a real milestone.",
  "Look at your level — {level}. Remember when you started?",
  "Level {level}. The version of you from Day 1 would be impressed.",
  "{sessions} sessions. Each one changed something in your brain. For real.",
];

const GENERIC_GREETINGS = [
  "Let's train that brain!",
  "I've been waiting for you.",
  "Ready when you are.",
  "Your brain called — it wants a workout.",
  "Another day, another neural pathway.",
  "Let's make today count.",
  "Brains love consistency. So do I.",
  "Small steps, big growth.",
  "You showed up. That's half the battle.",
  "Your future self will thank you.",
  "Let's see what you've got today.",
  "Warming up the neural pathways...",
  "The brain gym is open. No membership required.",
  "You're building something here. I can see it growing.",
  "One session at a time. That's the secret.",
  "Ready to surprise yourself?",
  "Let's get those neurons firing.",
  "I've been thinking. About brains. It's kind of all I do.",
  "You know what I love about you? You keep showing up.",
  "Today's a good day for growth. But honestly, every day is.",
  "Your brain doesn't know its own limits. Let's test them.",
  "I've got a good feeling about today.",
  "The best session is the one you almost skipped.",
  "Here's a secret: showing up matters more than scoring high.",
  "Let's go. The grove is watching.",
];

// ── Post-session messages ────────────────────────────

export const POST_SESSION_MOOD_LOW = [
  "You showed up even on a hard day. That takes real strength.",
  "Tough days make the streak mean more.",
  "Your brain doesn't care about your mood — it grew today.",
  "Some days are just about showing up. Today was one of those. And you did.",
  "Hard days are the ones that count the most. I mean it.",
  "You trained when you didn't feel like it. That's the definition of discipline.",
  "Not every session feels great. But every session builds something.",
  "I see you. I know today was tough. And I'm glad you're here.",
];

export const POST_SESSION_PERFECT = [
  "That was incredible. I'm literally glowing.",
  "Flawless. Your brain is on another level today.",
  "Perfect score. I'm genuinely impressed, and I've seen a lot of brains.",
  "I don't say this often, but... wow.",
  "Perfection. The grove just sprouted something new. That was you.",
  "90%+ across the board. Your neurons are high-fiving each other right now.",
  "That was art. Neural art.",
  "I need a moment. That session was beautiful.",
];

export const POST_SESSION_GOOD = [
  "We did it! Great session.",
  "Solid work. Your neurons are happy.",
  "That's the kind of session that builds real growth.",
  "Good session. Your brain is measurably stronger than 5 minutes ago.",
  "Nice one. I felt the grove grow a little.",
  "Strong session. Consistent effort is the most powerful thing in the world.",
  "That was good. Not just 'participation trophy' good. Actually good.",
  "Your brain liked that. I can tell.",
];

export const POST_SESSION_OKAY = [
  "That was tough. But you showed up — that's what matters.",
  "Not every session is your best. But every session counts.",
  "The hardest part was starting. You did that.",
  "Some days your brain says 'nope.' You said 'yes' anyway. Respect.",
  "Tough round. But your brain learned more from the struggle than from an easy win.",
  "It wasn't perfect. It doesn't have to be. Growth isn't always pretty.",
  "Hard sessions are the ones your brain talks about to other neurons. Like war stories.",
  "That wasn't your best. And it still counted. That's the whole point.",
];

// ── Getter ───────────────────────────────────────────

interface GreetingContext {
  streak?: number;
  totalSessions?: number;
  daysSinceLastSession?: number;
  level?: number;
}

export function getGreeting(ctx: GreetingContext = {}): string {
  const { streak = 0, totalSessions = 0, daysSinceLastSession, level = 1 } = ctx;

  // First session ever
  if (totalSessions === 0) {
    return pickRandom(FIRST_SESSION_GREETINGS);
  }

  // Returning after absence
  if (daysSinceLastSession != null && daysSinceLastSession > 2) {
    return pickRandom(RETURN_GREETINGS);
  }

  // Level or session milestone (10% chance, only on meaningful numbers)
  if (Math.random() < 0.1) {
    const sessionMilestones = [10, 25, 50, 100, 200, 500];
    const levelMilestones = [5, 10, 15, 25, 50];
    if (sessionMilestones.includes(totalSessions) || levelMilestones.includes(level)) {
      return pickRandom(MILESTONE_GREETINGS)
        .replace('{level}', String(level))
        .replace('{sessions}', String(totalSessions));
    }
  }

  // Streak milestone (every 5th day)
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
