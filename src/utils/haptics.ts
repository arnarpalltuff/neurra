import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/settingsStore';

function isEnabled(): boolean {
  return useSettingsStore.getState().hapticsEnabled;
}

/** Light tap — UI selections, toggles, minor interactions */
export function tapLight(): void {
  if (!isEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap — button presses, game actions, errors */
export function tapMedium(): void {
  if (!isEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy tap — significant events, level ups */
export function tapHeavy(): void {
  if (!isEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Selection feedback — scrolling through options, letter selection */
export function selection(): void {
  if (!isEnabled()) return;
  Haptics.selectionAsync();
}

/** Success — session complete, achievement, purchase */
export function success(): void {
  if (!isEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning — streak at risk, subscription expiring */
export function warning(): void {
  if (!isEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Error — wrong answer, failed action */
export function error(): void {
  if (!isEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Game correct answer — light for correct, medium for wrong */
export function gameAnswer(correct: boolean): void {
  if (!isEnabled()) return;
  Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
}
