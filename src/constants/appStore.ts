/**
 * App Store listing content — Section 11.
 *
 * These constants define the app store listing metadata.
 * Used for consistency across platforms and in-app references.
 */

export const APP_STORE_LISTING = {
  name: 'Neurra — Brain Training',
  subtitle: 'Sharper days start here.',
  description: [
    'Train your brain in 5 minutes a day with Neurra — beautiful games that actually feel fun. Watch your companion Kova grow as your mind gets sharper. No fake science. No hidden fees.',
    '',
    'WHAT YOU GET',
    '• 10 brain training games across memory, focus, speed, flexibility, and creativity',
    '• Adaptive difficulty that grows with you — always in your challenge zone',
    '• Kova, a companion that evolves with your progress through 7 stages',
    "• Kova's Grove — a living, growing world that reflects everything you've accomplished",
    '• Real-world framing that helps you notice improvements in daily life',
    '• Weekly brain reports with personalized insights',
    '• Streaks, leagues, and friends to keep you motivated',
    '',
    'WHY NEURRA IS DIFFERENT',
    '• No fake claims. We tell you exactly what brain training can and can\'t do.',
    '• No hidden paywalls. Free users get a full daily session forever.',
    '• Beautiful design that makes brain training feel like a treat, not a chore.',
    '• Built on peer-reviewed cognitive science principles.',
    '',
    'NEURRA PRO (optional)',
    '• Unlimited sessions',
    '• Zero ads',
    '• Full brain map history',
    '• Exclusive Kova outfits and grove themes',
    '• 500 bonus coins per month',
    '',
    'Download Neurra and start your brain training journey today.',
  ].join('\n'),
  keywords: [
    'brain training', 'brain games', 'memory', 'focus', 'attention',
    'cognitive', 'brain workout', 'mental fitness', 'brain exercise',
    'mind games', 'brain trainer', 'puzzle',
  ],
  category: 'Health & Fitness',
  secondaryCategory: 'Education',
  supportEmail: 'support@neurra.app',
  websiteUrl: 'https://neurra.app',
  privacyPolicyUrl: 'https://neurra.app/privacy',
  termsUrl: 'https://neurra.app/terms',
} as const;

/** Screenshot descriptions for App Store listing */
export const SCREENSHOTS = [
  { index: 1, description: 'Home screen with Kova greeting', scene: 'home' },
  { index: 2, description: 'A game in action (Ghost Kitchen)', scene: 'game' },
  { index: 3, description: 'Session summary with real-world framing', scene: 'summary' },
  { index: 4, description: 'Brain Map with 5 petals', scene: 'brainmap' },
  { index: 5, description: 'Kova\'s Grove fully grown', scene: 'grove' },
  { index: 6, description: 'Pricing with "No hidden fees"', scene: 'pricing' },
] as const;

/** App version — single source of truth */
export const APP_VERSION = '1.0.0';
export const BUILD_NUMBER = '1';
