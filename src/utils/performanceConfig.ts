import { Platform } from 'react-native';

/**
 * Performance configuration for device tier optimization.
 *
 * Section 9: Performance targets
 * - Cold start: <2s
 * - Game load: <800ms
 * - Frame rate games: 60fps
 * - Frame rate grove: 50fps min, 60fps target
 * - Memory gameplay: <200MB
 * - Memory grove: <250MB
 * - Battery 5-min session: <2%
 * - Bundle size: <80MB
 * - AsyncStorage read: <50ms
 * - Screen transitions: <300ms at 60fps
 */

export interface DeviceTier {
  tier: 'low' | 'mid' | 'high';
  maxParticles: number;
  groveLayers: number;
  maxDecorations: number;
  kovaAnimationDetail: 'simple' | 'full';
  assetResolution: 'low' | 'standard' | 'high';
  enableDepthOfField: boolean;
  enableMotionBlur: boolean;
}

/** Detect device tier based on available RAM and platform */
export function getDeviceTier(): DeviceTier {
  // In production, use react-native-device-info to check RAM
  // For now, default to mid-tier
  const isIOS = Platform.OS === 'ios';

  // Mid-tier default (covers most devices)
  return {
    tier: 'mid',
    maxParticles: 50,
    groveLayers: 7,
    maxDecorations: 20,
    kovaAnimationDetail: 'full',
    assetResolution: 'standard',
    enableDepthOfField: false,
    enableMotionBlur: false,
  };
}

/** Low-end override */
export const LOW_END_CONFIG: DeviceTier = {
  tier: 'low',
  maxParticles: 25,
  groveLayers: 2,
  maxDecorations: 10,
  kovaAnimationDetail: 'simple',
  assetResolution: 'low',
  enableDepthOfField: false,
  enableMotionBlur: false,
};

/** High-end override */
export const HIGH_END_CONFIG: DeviceTier = {
  tier: 'high',
  maxParticles: 50,
  groveLayers: 7,
  maxDecorations: 20,
  kovaAnimationDetail: 'full',
  assetResolution: 'high',
  enableDepthOfField: true,
  enableMotionBlur: true,
};

/** Network config */
export const NETWORK_CONFIG = {
  apiTimeout: 10_000,      // 10s
  maxRetries: 3,
  retryBackoff: [1000, 3000, 8000], // exponential backoff
  syncBatchSize: 50,
  subscriptionCacheHours: 24,
} as const;

/** Ad SDK deferred init — don't block home screen */
export const AD_INIT_DELAY_MS = 3000;
