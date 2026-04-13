import { BrainArea } from './gameConfigs';

/**
 * Kova personality system.
 *
 * Kova develops a personality based on which brain area the user trains
 * MOST over the last 30 days. Each personality has 10 dialogue lines that
 * leak into the regular dialogue pool, biasing Kova's voice toward the
 * user's training pattern.
 *
 * Recalculated weekly. Stored in `personalityStore`.
 */

export type KovaPersonality =
  | 'librarian'    // memory-dominant
  | 'monk'         // focus-dominant
  | 'spark'        // speed-dominant
  | 'shapeshifter' // flexibility-dominant
  | 'dreamer'      // creativity-dominant
  | 'neutral';     // not enough data / balanced

export const PERSONALITY_LABELS: Record<KovaPersonality, string> = {
  librarian: 'The Librarian',
  monk: 'The Monk',
  spark: 'The Spark',
  shapeshifter: 'The Shapeshifter',
  dreamer: 'The Dreamer',
  neutral: 'Kova',
};

/** Map a brain area to its personality. */
export function personalityForArea(area: BrainArea): KovaPersonality {
  switch (area) {
    case 'memory': return 'librarian';
    case 'focus': return 'monk';
    case 'speed': return 'spark';
    case 'flexibility': return 'shapeshifter';
    case 'creativity': return 'dreamer';
  }
}

/** 10 unique lines per personality. */
export const PERSONALITY_LINES: Record<KovaPersonality, string[]> = {
  librarian: [
    "I remember when you couldn't get past 4 items. Look at you now.",
    "Memory is a library. You've been adding shelves.",
    "I keep notes in my leaves. Yours are growing thicker.",
    "Some things you remember. Some things remember you.",
    "You're filing things away faster these days.",
    "Your hippocampus called. It says hi.",
    "Names, faces, lists — you're collecting them.",
    "Old me would forget what I was about to say. New me has you.",
    "Did I mention you're getting sharper? I might have. I forget.",
    "Memory is a muscle. We just lifted.",
  ],
  monk: [
    "Breathe. You're exactly where you need to be.",
    "The noise out there is loud. You held your ground.",
    "Stillness is a skill. You're getting good at it.",
    "Focus isn't doing more — it's doing one thing fully.",
    "Notice how quiet it just got? That was you.",
    "I felt your attention land. Heavy and warm.",
    "We didn't rush that one. We arrived.",
    "Distraction is a wave. You stayed dry.",
    "Some sessions teach you to do. This one taught you to be.",
    "The grove is quieter when you're here. I like that.",
  ],
  spark: [
    "GOGOGO let's beat yesterday's time!",
    "You're moving like you mean it today.",
    "Fast brain, sharp brain. Yours is buzzing.",
    "I felt that combo in my roots.",
    "Half a second faster than last time. I clocked it.",
    "Your reflexes just leveled up. Did you feel it?",
    "Quick. Quick. Quick. I love this energy.",
    "You're a coiled spring today. Aim it well.",
    "Speed is a kind of joy. You're full of it.",
    "I'd race you, but I have roots. You'd win.",
  ],
  shapeshifter: [
    "Nothing stays the same. That's what makes it fun.",
    "You switched gears so fast my leaves rustled.",
    "Adaptation is your superpower. Don't lose it.",
    "Rules changed mid-game and you didn't blink.",
    "Flexible minds bend. Brittle ones break.",
    "Today's brain isn't yesterday's brain. That's a feature.",
    "I love watching you pivot. It's like dance.",
    "Curveballs make better thinkers. You took three.",
    "The grove's wind keeps changing. So do you.",
    "When the pattern shifts, you shift with it. Well done.",
  ],
  dreamer: [
    "What if words could bloom into actual flowers?",
    "I had a dream you taught the trees to whisper.",
    "Your imagination is doing strange and lovely work today.",
    "I think you just invented something. Even if you don't notice.",
    "The grove looks different through your eyes.",
    "Some brains solve. Yours wonders.",
    "I felt that idea before you finished it.",
    "Make-believe is just rehearsal for the real thing.",
    "You see connections nobody told you to look for.",
    "Whatever you're dreaming up — keep going.",
  ],
  neutral: [
    "Nice work. The grove is buzzing today.",
    "You showed up. That's the whole game.",
    "I felt that one in my leaves.",
    "We're getting somewhere, you and me.",
    "Solid session. I'm proud of you.",
    "Tomorrow's brain is going to thank today's brain.",
    "Look at us, doing the thing.",
    "You're growing. I can see it from here.",
    "Every session adds a little more to the pile.",
    "I think my roots just deepened. So did yours.",
  ],
};

/** Pick a random line for the given personality. */
export function pickPersonalityLine(personality: KovaPersonality): string {
  const pool = PERSONALITY_LINES[personality] ?? PERSONALITY_LINES.neutral;
  return pool[Math.floor(Math.random() * pool.length)];
}
