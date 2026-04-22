import { useRef, useCallback } from 'react';
import {
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { tapLight, tapMedium, tapHeavy } from '../../../utils/haptics';
import { playKovaHappy, playKovaExcited, playKovaGiggle, playKovaWow } from '../../../utils/sound';

/**
 * Owns tap escalation feedback: the 4-branch haptic + sound + animation
 * reaction that gets louder the more the user taps. Escalation thresholds
 * (≥10 rocket, ≥5 dizzy, ≥3 spin, default bounce) and all sequences
 * are copied verbatim from Kova.tsx.
 *
 * Takes the shared values owned by useKovaAnimation so tap reactions layer
 * on top of autonomous animations without needing duplicate shared-value
 * instances.
 */
export function useKovaTapFeedback({
  bounce,
  scaleVal,
  wiggle,
}: {
  bounce: SharedValue<number>;
  scaleVal: SharedValue<number>;
  wiggle: SharedValue<number>;
}) {
  const tapCountRef = useRef(0);

  const handleTapAnimation = useCallback(() => {
    tapCountRef.current += 1;
    const taps = tapCountRef.current;

    // Escalating tap reactions
    if (taps >= 10) {
      // Rocket launch
      tapHeavy();
      playKovaWow();
      bounce.value = withSequence(
        withTiming(-80, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withDelay(200, withSpring(0, { damping: 6, stiffness: 100 })),
      );
      scaleVal.value = withSequence(
        withTiming(0.7, { duration: 150 }),
        withDelay(300, withSpring(1.1, { damping: 4 })),
        withSpring(1, { damping: 8 }),
      );
      tapCountRef.current = 0; // Reset cycle
    } else if (taps >= 5) {
      // Dizzy spin
      tapMedium();
      playKovaGiggle();
      wiggle.value = withSequence(
        withTiming(360, { duration: 600 }),
        withTiming(380, { duration: 100 }),
        withTiming(360, { duration: 200 }),
        withTiming(0, { duration: 10 }),
      );
      scaleVal.value = withSequence(
        withSpring(0.85, { damping: 4 }),
        withSpring(1.05, { damping: 5 }),
        withSpring(1, { damping: 8 }),
      );
    } else if (taps >= 3) {
      // Spin
      tapMedium();
      playKovaExcited();
      wiggle.value = withSequence(
        withTiming(360, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 10 }),
      );
      scaleVal.value = withSequence(
        withSpring(0.9, { damping: 5 }),
        withSpring(1.05, { damping: 6 }),
        withSpring(1, { damping: 8 }),
      );
    } else {
      // Normal bounce
      tapLight();
      playKovaHappy();
      scaleVal.value = withSequence(
        withSpring(0.88, { damping: 6 }),
        withSpring(1.08, { damping: 5 }),
        withSpring(1, { damping: 8 }),
      );
    }
  }, []);

  return { handleTapAnimation };
}
