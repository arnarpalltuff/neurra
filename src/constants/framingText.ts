import { GameId } from './gameConfigs';
import { pickRandom } from '../utils/arrayUtils';

/**
 * Extended framing text pools with {placeholder} templates.
 * Use getFramingText() to get a filled-in string.
 */

const FRAMING_POOLS: Partial<Record<GameId, string[]>> = {
  'ghost-kitchen': [
    "You just remembered a {score}-item order under pressure. That's like remembering a whole coffee run for the office.",
    "Your working memory is sharper than most. You'd ace a coffee order for 6 people.",
    "Holding multiple things in mind while working? That's exactly what you just did.",
    "Waiters train for years to do what you just did. Nice.",
    "Your brain juggled {score} things at once. That's real multitasking.",
  ],
  'pulse': [
    "You resisted {score} impulses in a row. That's the self-control that helps you not check your phone during a meeting.",
    "Your inhibitory control is getting stronger with every session.",
    "Resisting the urge to tap? That mental muscle helps in real life more than people realize.",
    "Focus under pressure — that's what you just trained.",
    "Quick decisions, zero panic. Your reaction time is improving.",
  ],
  'word-weave': [
    "You found {score} words in 60 seconds. Your verbal fluency would impress at any dinner party.",
    "Quick verbal thinking is a superpower. You've got it.",
    "Your brain finds patterns in language fast. That's rare.",
    "Writers, speakers, thinkers — they all rely on what you just practiced.",
    "{score} words pulled from thin air. Your language centers are firing.",
  ],
  'face-place': [
    "You remembered {score} names and faces. Next networking event? You've got this.",
    "Recognizing faces is one of the brain's most complex tasks. You nailed it.",
    "The ability to put names to faces? That's social intelligence at work.",
  ],
  'signal-noise': [
    "You caught {score} out of 10 subtle changes. Your eye for detail is getting sharper.",
    "Spotting what's different in a sea of sameness — your attention is dialed in.",
    "Detail detection is a rare skill. Yours is improving.",
  ],
  'chain-reaction': [
    "You processed {score} decisions in seconds. That's quick thinking.",
    "Your processing speed is what helps you react in the real world.",
    "Fast decisions under pressure — that's exactly what you trained.",
  ],
  'mind-drift': [
    "You traced a {score}-step path from memory. That's the same skill that helps you navigate a new city.",
    "Spatial memory is underrated. Yours is getting stronger.",
    "Remembering routes, layouts, where you put things — all spatial memory.",
  ],
  'rewind': [
    "You remembered {score} out of {total} details from a scene. You notice everything.",
    "Observation is a skill. You just leveled yours up.",
    "The details others miss? You caught them.",
  ],
  'mirrors': [
    "You adapted to {score} rule changes without missing a beat. Mental flexibility is rare.",
    "Switching between rules on the fly — that's cognitive flexibility at its finest.",
    "Life throws curveballs. You just practiced catching them.",
  ],
  'zen-flow': [
    "You held your focus for {score} seconds straight. Most people manage 8. Yours is getting stronger.",
    "Sustained attention is the foundation of deep work. You're building it.",
    "In a world of distractions, your focus is your superpower.",
  ],
  'split-focus': [
    "You just juggled two tasks simultaneously. That's real-world multitasking at its finest.",
    "Divided attention is one of the hardest cognitive skills. You're getting better at it.",
    "Handling multiple demands at once? That's a skill that transfers to everything.",
  ],
};

// Generic fallbacks
const GENERIC_FRAMING = [
  "Great work! Your brain is getting stronger.",
  "Every session builds new connections.",
  "You're training the skills that matter most.",
  "Consistency is the real superpower. You've got it.",
];

interface FramingContext {
  gameId: GameId;
  score?: number;
  accuracy?: number;
  total?: number;
}

export function getFramingText(ctx: FramingContext): string {
  const pool = FRAMING_POOLS[ctx.gameId];
  const template = pool ? pickRandom(pool) : pickRandom(GENERIC_FRAMING);

  return template
    .replace(/\{score\}/g, String(ctx.score ?? 0))
    .replace(/\{total\}/g, String(ctx.total ?? 0));
}
