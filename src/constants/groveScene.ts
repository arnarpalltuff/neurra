import { TimeOfDay } from '../utils/timeUtils';

/** Sky gradients for Kova's Grove (Phase N) — LinearGradient only */
export const GROVE_SKY: Record<TimeOfDay, [string, string, string]> = {
  morning: ['#2A1810', '#5C3D2A', '#C4A574'],
  afternoon: ['#1A2840', '#3D5A80', '#8FB8E8'],
  evening: ['#2A1528', '#6B3A50', '#E87850'],
  lateNight: ['#060818', '#0C1440', '#1A2060'],
};

export const KOVA_GROVE_LINES: string[] = [
  'This grove grows with every session you finish.',
  'The stream remembers how fast you’ve been training.',
  'Those crystals? Pure focus. Yours is looking sharp.',
  'I water the garden when you’re kind to yourself.',
  'Sometimes I sit here and think about your streak. No pressure.',
  'Each zone is a piece of how your brain’s been showing up.',
  'The mushrooms get weird when you’re creative. I love it.',
  'If it feels quiet, that’s okay — growth isn’t always loud.',
  'Tap around. Nothing here bites. Except maybe the metaphor.',
  'Thanks for coming back. The grove missed you.',
];
