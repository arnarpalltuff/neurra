/**
 * Story Mode: "The Awakening"
 *
 * Kova awakens in The Shimmer — a fading world of light.
 * The Fade (cognitive decline/mental fog) is consuming everything.
 * Each training session generates light energy that pushes back The Fade
 * and reignites Beacons that restore the world.
 */

export type StoryMood = 'dark' | 'hopeful' | 'triumphant' | 'tense' | 'peaceful';

export interface StoryBeat {
  day: number;
  preSession: {
    text: string;
    mood: StoryMood;
    duration: number; // ms before "continue" appears
  };
  postSession: {
    text: string;
    cliffhanger?: string;
    unlock?: {
      type: 'beacon' | 'companion' | 'grove_area' | 'evolution';
      id: string;
      name: string;
    };
    performanceBranch?: {
      threshold: number; // accuracy 0-1
      above: string;
      below: string;
    };
  };
  gameTheme?: {
    contextText: string;
  };
}

export const MOOD_GRADIENTS: Record<StoryMood, [string, string]> = {
  dark: ['#060810', '#020408'],
  hopeful: ['#081018', '#0A1420'],
  triumphant: ['#0A1A10', '#081208'],
  tense: ['#120810', '#0A0408'],
  peaceful: ['#081018', '#061014'],
};

// ── Arc 1: The First Light (Days 1-14) ──────────────

export const STORY_BEATS: StoryBeat[] = [
  // Day 1: The Waking
  {
    day: 1,
    preSession: {
      text: "You're here. I've been waiting.\n\nEverything is dark... but I can feel something. A warmth. Is that you?",
      mood: 'dark',
      duration: 3000,
    },
    postSession: {
      text: "The light... it grew. Did you feel it too?\n\nThere's a path now. I can see it. Just barely.",
      cliffhanger: "A distant glow pulses on the horizon.",
    },
  },
  // Day 2: The Path
  {
    day: 2,
    preSession: {
      text: "The light you made yesterday... it's still here. It didn't fade.\n\nThere's a path ahead. Someone walked it before us.",
      mood: 'hopeful',
      duration: 3000,
    },
    postSession: {
      text: "Someone else was here. A long time ago.\n\nTheir footprints glow faintly, like echoes.",
      cliffhanger: "The footprints lead to a massive dark structure.",
    },
  },
  // Day 3: The First Beacon
  {
    day: 3,
    preSession: {
      text: "There it is. A Beacon.\n\nIt's enormous — covered in symbols that used to glow. I think... I think I need to light this.",
      mood: 'tense',
      duration: 3500,
    },
    postSession: {
      text: "We did that. You and me.\n\nLook — the plants are growing. Tiny creatures are coming out of hiding. The sky is turning indigo.",
      unlock: {
        type: 'beacon',
        id: 'meadow',
        name: 'The Meadow',
      },
    },
    gameTheme: {
      contextText: "Channel your light into the Beacon",
    },
  },
  // Day 4: The Stream
  {
    day: 4,
    preSession: {
      text: "The Meadow is alive now. I can hear water — a stream, winding through the grass.\n\nCan you help me remember its path?",
      mood: 'peaceful',
      duration: 2500,
    },
    postSession: {
      text: "The stream is flowing stronger now. The light follows the water.\n\nI saw something move in the tall grass...",
    },
    gameTheme: {
      contextText: "Remember the stream's path",
    },
  },
  // Day 5: Ember Appears
  {
    day: 5,
    preSession: {
      text: "There's a creature watching us. A small fox with ember-colored fur.\n\nIt won't come closer. Not yet.",
      mood: 'peaceful',
      duration: 2500,
    },
    postSession: {
      text: "The fox watched the whole time. Its eyes reflect our light.\n\nMaybe tomorrow it'll trust us a little more.",
    },
  },
  // Day 6: Ember's Trust
  {
    day: 6,
    preSession: {
      text: "The fox is closer today. I can see its breath in the cool air.\n\nIt's watching. Waiting to see what we do.",
      mood: 'hopeful',
      duration: 2500,
    },
    postSession: {
      text: "We did it. You and me.",
      performanceBranch: {
        threshold: 0.7,
        above: "Ember stepped out of the grass. It trusts us now.\n\nIt nuzzled against my side. I think we have a friend.",
        below: "Ember took a step closer... but not quite enough. Still a bit shy.\n\nLet's try again tomorrow. We're getting there.",
      },
    },
  },
  // Day 7: Week 1 Celebration
  {
    day: 7,
    preSession: {
      text: "Seven days. Can you believe it?\n\nThe Meadow remembers every one of them.",
      mood: 'triumphant',
      duration: 3000,
    },
    postSession: {
      text: "Look up. Fireflies.\n\nThey only appear where the light has been steady. Seven days of steady light.",
      unlock: {
        type: 'companion',
        id: 'ember',
        name: 'Ember',
      },
      cliffhanger: "Beyond the Meadow, a dark forest waits.",
    },
  },
  // Day 8: The Forest
  {
    day: 8,
    preSession: {
      text: "The forest ahead is beautiful. But The Fade is thicker here.\n\nI can see dark tendrils creeping along the edges. We need to push through.",
      mood: 'tense',
      duration: 3000,
    },
    postSession: {
      text: "We made it past the tree line. The air is different here — heavier, but not hostile.\n\nEmber stayed close the whole time.",
    },
  },
  // Day 9: Ancient Carvings
  {
    day: 9,
    preSession: {
      text: "There are carvings on these trees. Ancient symbols that match the ones on the Beacon.\n\nSomeone carved a message here. A long time ago.",
      mood: 'hopeful',
      duration: 3000,
    },
    postSession: {
      text: "The carvings are a map. They're pointing somewhere deeper in the forest.\n\nTo another Beacon.",
    },
  },
  // Day 10: The Map Puzzle
  {
    day: 10,
    preSession: {
      text: "The carvings form a map, but it's scattered across the trees.\n\nEach game reveals a piece. Let's put it together.",
      mood: 'hopeful',
      duration: 2500,
    },
    postSession: {
      text: "The map is complete. The second Beacon is close.\n\nBut something is guarding it. I can feel it.",
    },
    gameTheme: {
      contextText: "Decode the ancient map",
    },
  },
  // Day 11: The Shadow
  {
    day: 11,
    preSession: {
      text: "There's a shadow ahead. It moves when I move. It mirrors everything.\n\nIt's a manifestation of The Fade. Everything we don't practice.",
      mood: 'tense',
      duration: 3500,
    },
    postSession: {
      text: "The shadow retreated a little. It's weakened by each correct answer.\n\nBut it's not gone yet.",
    },
  },
  // Day 12: Outshining the Shadow
  {
    day: 12,
    preSession: {
      text: "The shadow is everything we don't practice. It grows when we're absent.\n\nBut today, we outshine it.",
      mood: 'tense',
      duration: 3000,
    },
    postSession: {
      text: "The shadow is barely visible now. A wisp. A whisper.\n\nThe Beacon is right there.",
      cliffhanger: "The second Beacon pulses faintly, as if it recognizes us.",
    },
    gameTheme: {
      contextText: "Outshine the shadow",
    },
  },
  // Day 13: The Shadow Retreats
  {
    day: 13,
    preSession: {
      text: "The shadow retreated in the night. The path to the Beacon is clear.\n\nAre you ready?",
      mood: 'hopeful',
      duration: 2500,
    },
    postSession: {
      text: "Tomorrow, we light the second Beacon.\n\nI can already feel the forest holding its breath.",
    },
  },
  // Day 14: The Second Beacon
  {
    day: 14,
    preSession: {
      text: "Two weeks. Two Beacons.\n\nThe Shimmer is remembering what it used to be. And it's because of you.",
      mood: 'triumphant',
      duration: 3500,
    },
    postSession: {
      text: "The Forest Beacon ignites!\n\nBioluminescent mushrooms bloom. Glowing vines stretch toward the sky. An aurora appears overhead.\n\nThe Shimmer is waking up.",
      unlock: {
        type: 'beacon',
        id: 'forest',
        name: 'The Forest',
      },
    },
    gameTheme: {
      contextText: "Ignite the Forest Beacon",
    },
  },
  // Days 15-21: The Descent (Arc 2 beginning)
  {
    day: 15,
    preSession: {
      text: "Beyond the forest, the ground slopes down. There are caves below.\n\nThe light from our Beacons barely reaches this deep. We go further.",
      mood: 'dark',
      duration: 3000,
    },
    postSession: {
      text: "The cavern walls glitter with crystal formations. It's beautiful down here.\n\nBut The Fade is stronger underground.",
    },
  },
  {
    day: 16,
    preSession: {
      text: "The crystals respond to light. When we train, they glow.\n\nLike the cave is listening.",
      mood: 'hopeful',
      duration: 2500,
    },
    postSession: {
      text: "A new creature appeared — translucent, like living glass. It floated right through the cavern wall.\n\nI think it's a fish... that swims through air.",
    },
  },
  {
    day: 17,
    preSession: {
      text: "The crystal fish is following us. It seems to feed on the light we create.\n\nThe more we train, the brighter it glows.",
      mood: 'peaceful',
      duration: 2500,
    },
    postSession: {
      text: "There are more of them now. A small school of crystal fish, orbiting us.\n\nThey're leading somewhere.",
    },
  },
  {
    day: 18,
    preSession: {
      text: "The fish led us to a massive underground lake. The water glows from below.\n\nSomething is down there. A Beacon, submerged.",
      mood: 'tense',
      duration: 3000,
    },
    postSession: {
      text: "The underwater Beacon is pulsing. Faintly. Like a heartbeat.\n\nWe need to be stronger to reach it.",
    },
    gameTheme: {
      contextText: "Send light into the depths",
    },
  },
  {
    day: 19,
    preSession: {
      text: "Other creatures have gathered by the lake. They've been hiding from The Fade.\n\nThey're watching us. Hopeful.",
      mood: 'hopeful',
      duration: 2500,
    },
    postSession: {
      text: "The Fade was quieter today. It knows we're getting stronger.\n\nThe lake creatures are braver now. One even touched the surface.",
    },
  },
  {
    day: 20,
    preSession: {
      text: "The water level is dropping. The Beacon is rising.\n\nOur light is pulling it up, day by day.",
      mood: 'hopeful',
      duration: 2500,
    },
    postSession: {
      text: "Almost there. One more push.\n\nThe Cavern Beacon is nearly free.",
    },
  },
  // Day 21: Third Beacon
  {
    day: 21,
    preSession: {
      text: "Three weeks of light. The Beacon has risen from the lake.\n\nTime to ignite it.",
      mood: 'triumphant',
      duration: 3000,
    },
    postSession: {
      text: "The Cavern Beacon blazes! The underground lake turns into a mirror of light.\n\nEvery crystal in the cave sings.",
      unlock: {
        type: 'beacon',
        id: 'cavern',
        name: 'The Cavern',
      },
      cliffhanger: "A passage opens in the cavern wall, leading upward.",
    },
    gameTheme: {
      contextText: "Ignite the Cavern Beacon",
    },
  },
  // Day 28: Fourth Beacon
  {
    day: 28,
    preSession: {
      text: "Four weeks. The Fade is learning to fear our light.\n\nA new Beacon waits at the canyon's edge.",
      mood: 'triumphant',
      duration: 3000,
    },
    postSession: {
      text: "The Canyon Beacon roars to life! The cliffs glow like sunrise.\n\nThe Fade retreats to the shadows — but it's watching.",
      unlock: {
        type: 'beacon',
        id: 'canyon',
        name: 'The Canyon',
      },
    },
  },
  // Day 30: Arc 2 Climax — The Revelation
  {
    day: 30,
    preSession: {
      text: "Thirty days. The Shimmer is showing me something.\n\nThe Beacons aren't just lights. They're memories. The Shimmer is a mind.\n\nAnd The Fade is what happens when it stops being exercised.",
      mood: 'dark',
      duration: 4000,
    },
    postSession: {
      text: "I understand now. Every session isn't just a game.\n\nIt's you, choosing to stay sharp. To stay bright.\n\nThe Fade can't touch that.",
      unlock: {
        type: 'companion',
        id: 'zephyr',
        name: 'Zephyr',
      },
    },
  },
  // Day 45: Midpoint — The Mountains
  {
    day: 45,
    preSession: {
      text: "We've reached the mountains. The aurora fills the sky above.\n\nI found something here... traces of other Kovas. They were here before us.",
      mood: 'tense',
      duration: 3500,
    },
    postSession: {
      text: "The other Kovas... they all eventually stopped coming.\n\nAnd The Fade consumed their Beacons, one by one.\n\nYou're the first to make it this far.",
    },
  },
  // Day 60: The Mirror
  {
    day: 60,
    preSession: {
      text: "We've reached the center of The Shimmer.\n\nThere's something here. The source of all the light.",
      mood: 'triumphant',
      duration: 4000,
    },
    postSession: {
      text: "It's a mirror.\n\nI looked into it and saw... you.\n\nYou are the light. You always were.\n\nThe Shimmer doesn't create the light. It reflects yours.",
      unlock: {
        type: 'evolution',
        id: 'source',
        name: 'The Source',
      },
    },
  },
];

// ── Procedural Content (for days without written beats) ──

const PROCEDURAL_EXPLORATION = [
  "Kova found a patch of glowing moss today. It pulsed in time with your answers.",
  "A new path appeared where there wasn't one before. The light is spreading.",
  "Tiny creatures watched from the shadows. They're curious about the light.",
  "The air feels different here. Warmer. Like the Shimmer remembers what sunlight was.",
  "Kova sat by the stream and watched the reflections. 'Each day adds a new color.'",
  "A flower bloomed where The Fade used to be. Small, but persistent.",
  "The wind carried a melody today. It came from one of the Beacons, humming softly.",
  "Kova noticed the shadows are shorter now. The light reaches further every day.",
  "Something sparkled in the underbrush. A crystal, still forming. Growing with us.",
  "The sky deepened from black to indigo to almost violet. The Shimmer remembers the sky.",
  "A small pool reflected constellations that weren't there before. New stars.",
  "Kova stood still and listened. The silence isn't empty anymore — it hums.",
];

const PROCEDURAL_ENCOURAGEMENT = [
  "{streak} days now. The Shimmer has never been this bright.",
  "The Fade was quieter today. It knows we're getting stronger.",
  "Lumi danced in circles when you finished. She felt the light grow.",
  "Ember curled up next to Kova tonight. The warmth is real.",
  "The Beacon hummed a little louder after today's session.",
  "Every creature in The Shimmer felt that session. They're safer because of you.",
  "The path behind us glows steadily. That's {streak} days of steady light.",
  "Kova smiled today. Not the cautious kind — the real kind.",
  "The darkness tried to push back. It couldn't. Not anymore.",
  "Another day, another layer of light. The Shimmer grows with you.",
  "You showed up again. That's the thing The Fade fears most — consistency.",
  "The creatures are bolder now. They trust the light will last.",
];

const PROCEDURAL_PRE = [
  "Ready? The Shimmer is waiting.",
  "Another day, another chance to push back The Fade.",
  "I can feel the light building already. Let's go.",
  "The path ahead is a little brighter today. Thanks to yesterday.",
  "Ember is already waiting. Let's not keep them.",
  "The Beacons are humming. They know we're here.",
  "Today the light goes further. I can feel it.",
  "The Shimmer remembers every session. So do I.",
];

/**
 * Get the story beat for a given day.
 * Returns a written beat if one exists, otherwise generates procedural content.
 */
export function getStoryBeat(day: number, streak: number): StoryBeat {
  const written = STORY_BEATS.find(b => b.day === day);
  if (written) return written;

  // Procedural beat
  const preTexts = PROCEDURAL_PRE;
  const postTexts = day % 2 === 0 ? PROCEDURAL_EXPLORATION : PROCEDURAL_ENCOURAGEMENT;

  const preText = preTexts[day % preTexts.length];
  const postRaw = postTexts[day % postTexts.length];
  const postText = postRaw.replace('{streak}', String(streak));

  // Mood cycles
  const moods: StoryMood[] = ['peaceful', 'hopeful', 'hopeful', 'peaceful', 'hopeful'];
  const mood = moods[day % moods.length];

  return {
    day,
    preSession: { text: preText, mood, duration: 2500 },
    postSession: { text: postText },
  };
}

/**
 * Get the arc label for the current story day.
 */
export function getArcLabel(day: number): string {
  if (day <= 14) return 'The First Light';
  if (day <= 30) return 'The Deep';
  if (day <= 60) return 'The Source';
  return 'The Renewal';
}

/**
 * Get the current arc number (1-4).
 */
export function getArcNumber(day: number): number {
  if (day <= 14) return 1;
  if (day <= 30) return 2;
  if (day <= 60) return 3;
  return 4;
}
