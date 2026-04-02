export type GameId =
  | 'ghost-kitchen'
  | 'pulse'
  | 'word-weave'
  | 'face-place'
  | 'signal-noise'
  | 'chain-reaction'
  | 'mind-drift'
  | 'rewind'
  | 'mirrors'
  | 'zen-flow';

export type BrainArea = 'memory' | 'focus' | 'speed' | 'flexibility' | 'creativity';

export interface GameConfig {
  id: GameId;
  name: string;
  description: string;
  brainArea: BrainArea;
  icon: string;
  color: string;
  maxLevel: number;
  realWorldFraming: string[];
  available: boolean;
}

export const gameConfigs: Record<GameId, GameConfig> = {
  'ghost-kitchen': {
    id: 'ghost-kitchen',
    name: 'Ghost Kitchen',
    description: 'Remember orders under pressure',
    brainArea: 'memory',
    icon: '🍳',
    color: '#E8A87C',
    maxLevel: 20,
    realWorldFraming: [
      "You just remembered a 5-item order under pressure. That's like remembering a whole coffee run for the office.",
      "Your working memory is sharper than most. You'd ace a coffee order for 6 people.",
      "Holding multiple things in mind while working? That's exactly what you just did.",
    ],
    available: true,
  },
  'pulse': {
    id: 'pulse',
    name: 'Pulse',
    description: 'Tap green, resist red',
    brainArea: 'focus',
    icon: '⭕',
    color: '#7CB8E8',
    maxLevel: 20,
    realWorldFraming: [
      "You resisted 23 impulses in a row. That's the same self-control that helps you not check your phone during a meeting.",
      "Your inhibitory control is strong. You'd make a great surgeon. Or at least a great texter who waits for the right moment.",
      "Resisting the urge to tap? That mental muscle helps in real life more than people realize.",
    ],
    available: true,
  },
  'word-weave': {
    id: 'word-weave',
    name: 'Word Weave',
    description: 'Form words from orbiting letters',
    brainArea: 'creativity',
    icon: '✨',
    color: '#7DD3A8',
    maxLevel: 20,
    realWorldFraming: [
      "You found 14 words in 60 seconds. Your verbal fluency would impress at any dinner party.",
      "Quick verbal thinking is a superpower. You've got it.",
      "Your brain finds patterns in language fast. That's rare.",
    ],
    available: true,
  },
  'face-place': {
    id: 'face-place',
    name: 'Face Place',
    description: 'Remember faces and names',
    brainArea: 'memory',
    icon: '👤',
    color: '#A87CE8',
    maxLevel: 20,
    realWorldFraming: [
      "You remembered 6 names and faces. Next networking event? You've got this.",
    ],
    available: false,
  },
  'signal-noise': {
    id: 'signal-noise',
    name: 'Signal & Noise',
    description: 'Spot the change in the scene',
    brainArea: 'focus',
    icon: '👁',
    color: '#4ECDC4',
    maxLevel: 20,
    realWorldFraming: [
      "You caught 8 out of 10 subtle changes. Your eye for detail is getting sharper.",
    ],
    available: false,
  },
  'chain-reaction': {
    id: 'chain-reaction',
    name: 'Chain Reaction',
    description: 'Tap color sequences fast',
    brainArea: 'speed',
    icon: '⚡',
    color: '#FBBF24',
    maxLevel: 20,
    realWorldFraming: [
      "You processed 12 decisions in 8 seconds. That's quick thinking.",
    ],
    available: false,
  },
  'mind-drift': {
    id: 'mind-drift',
    name: 'Mind Drift',
    description: 'Trace the path from memory',
    brainArea: 'memory',
    icon: '🗺',
    color: '#7DD3A8',
    maxLevel: 20,
    realWorldFraming: [
      "You traced a 9-step path from memory. That's the same skill that helps you navigate a new city.",
    ],
    available: false,
  },
  'rewind': {
    id: 'rewind',
    name: 'Rewind',
    description: 'Remember details from a scene',
    brainArea: 'memory',
    icon: '🎬',
    color: '#E87C8A',
    maxLevel: 20,
    realWorldFraming: [
      "You remembered 5 out of 5 details from a scene. You notice everything.",
    ],
    available: false,
  },
  'mirrors': {
    id: 'mirrors',
    name: 'Mirrors',
    description: 'Follow the rules, adapt fast',
    brainArea: 'flexibility',
    icon: '🔄',
    color: '#A87CE8',
    maxLevel: 20,
    realWorldFraming: [
      "You adapted to 6 rule changes without missing a beat. Mental flexibility is rare.",
    ],
    available: false,
  },
  'zen-flow': {
    id: 'zen-flow',
    name: 'Zen Flow',
    description: 'Breathe. Focus. Restore.',
    brainArea: 'focus',
    icon: '🌊',
    color: '#7CB8E8',
    maxLevel: 1,
    realWorldFraming: [
      "You held your focus for 48 seconds straight. Most people manage 8. Yours is getting stronger.",
    ],
    available: false,
  },
};

export const availableGames = Object.values(gameConfigs).filter(g => g.available);
