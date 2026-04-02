import { AccessibilityInfo, Platform } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Accessibility configuration for Section 10.
 *
 * Targets:
 * - VoiceOver/TalkBack: all interactive elements labeled
 * - Color blind modes: deut/prot/trit with shape/pattern secondary indicators
 * - High contrast: WCAG AA (4.5:1 text, 3:1 interactive)
 * - Text scales to 200% without layout break
 * - All tap targets 44x44pt minimum (48x48 in large mode)
 * - Games with fast tapping have relaxed timing option
 * - Drag gestures have tap-to-place alternative
 */

/** Check if system reduce motion is enabled */
export async function isSystemReduceMotionEnabled(): Promise<boolean> {
  return AccessibilityInfo.isReduceMotionEnabled();
}

/** Check if screen reader is active */
export async function isScreenReaderActive(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

/** Get minimum tap target size based on settings */
export function getMinTapTarget(): number {
  const { tapTargetSize } = useSettingsStore.getState();
  return tapTargetSize === 'large' ? 48 : 44;
}

/** Get timing multiplier for games (relaxed timing = 1.5x more time) */
export function getTimingMultiplier(): number {
  const { difficultyPref } = useSettingsStore.getState();
  return difficultyPref === 'easy' ? 1.5 : 1.0;
}

/** Color blind palette adjustments */
export interface ColorBlindPalette {
  red: string;
  green: string;
  blue: string;
  yellow: string;
  accent: string;
}

export function getColorBlindPalette(): ColorBlindPalette | null {
  const { colorBlindMode } = useSettingsStore.getState();

  switch (colorBlindMode) {
    case 'deuteranopia':
      return {
        red: '#CC6600',    // Orange replaces red
        green: '#0066CC',  // Blue replaces green
        blue: '#0066CC',
        yellow: '#FFCC00',
        accent: '#CC6600',
      };
    case 'protanopia':
      return {
        red: '#CC9900',    // Yellow-orange replaces red
        green: '#0077BB',  // Cyan-blue replaces green
        blue: '#0077BB',
        yellow: '#FFDD00',
        accent: '#CC9900',
      };
    case 'tritanopia':
      return {
        red: '#FF3366',    // Pink-red for red
        green: '#00CC99',  // Teal for green
        blue: '#FF6699',   // Pink replaces blue
        yellow: '#00CC99',
        accent: '#FF3366',
      };
    default:
      return null;
  }
}

/** Text size scale factors */
export function getTextScale(): number {
  const { textSize } = useSettingsStore.getState();
  switch (textSize) {
    case 'small': return 0.85;
    case 'medium': return 1.0;
    case 'large': return 1.2;
    case 'xlarge': return 1.4;
    default: return 1.0; // 'system' — defer to OS
  }
}

/** Should animations be reduced/disabled */
export function shouldReduceMotion(): boolean {
  const { reduceMotion, reduceAnimations } = useSettingsStore.getState();
  return reduceMotion || reduceAnimations;
}
