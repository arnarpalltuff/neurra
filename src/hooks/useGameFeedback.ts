import { useRef, useCallback, useState, useMemo } from 'react';
import { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { tapLight, tapMedium, tapHeavy, success as hapticSuccess, warning as hapticWarning } from '../utils/haptics';
import { playCorrectCombo, playWrong } from '../utils/sound';
import type { FeedbackType } from '../components/ui/FeedbackBurst';

interface FeedbackState {
  type: FeedbackType;
  combo: number;
  position: { x: number; y: number };
  trigger: number;
  /** Mystery orb visible? (5% chance on correct) */
  mysteryOrbVisible: boolean;
  mysteryOrbPosition: { x: number; y: number };
  onDismissOrb: () => void;
}

/**
 * Hook for managing combo-aware game feedback.
 *
 * Returns the current feedback state (spread into <FeedbackBurst />)
 * and functions to fire correct/wrong feedback with position.
 *
 * Handles haptics, sound, combo tracking, and mystery orb spawning.
 */
export function useGameFeedback() {
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const [baseFeedback, setBaseFeedback] = useState({
    type: 'correct' as FeedbackType,
    combo: 0,
    position: { x: 0, y: 0 },
    trigger: 0,
  });
  const [orbVisible, setOrbVisible] = useState(false);
  const [orbPosition, setOrbPosition] = useState({ x: 0, y: 0 });
  const comboRef = useRef(0);
  const triggerRef = useRef(0);

  const dismissOrb = useCallback(() => {
    setOrbVisible(false);
  }, []);

  const fireCorrect = useCallback((position: { x: number; y: number }) => {
    comboRef.current += 1;
    triggerRef.current += 1;
    const combo = comboRef.current;

    // Haptics — escalate with combo
    if (combo >= 10) {
      hapticSuccess();
    } else if (combo >= 5) {
      tapHeavy();
    } else if (combo >= 3) {
      tapMedium();
    } else {
      tapLight();
    }

    // Sound — combo-aware chime escalation
    playCorrectCombo(combo);

    setBaseFeedback({
      type: 'correct',
      combo,
      position,
      trigger: triggerRef.current,
    });

    // 5% chance to spawn a mystery orb
    if (Math.random() < 0.05) {
      setOrbVisible(true);
      setOrbPosition(position);
    }
  }, []);

  const fireWrong = useCallback((position: { x: number; y: number }) => {
    comboRef.current = 0;
    triggerRef.current += 1;

    hapticWarning();
    playWrong();

    // Shake: -4, 4, -4, 0 over 200ms
    shakeX.value = withSequence(
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );

    setBaseFeedback({
      type: 'wrong',
      combo: 0,
      position,
      trigger: triggerRef.current,
    });
  }, []);

  const resetCombo = useCallback(() => {
    comboRef.current = 0;
  }, []);

  const feedback: FeedbackState = useMemo(() => ({
    ...baseFeedback,
    mysteryOrbVisible: orbVisible,
    mysteryOrbPosition: orbPosition,
    onDismissOrb: dismissOrb,
  }), [baseFeedback, orbVisible, orbPosition, dismissOrb]);

  return {
    feedback,
    combo: comboRef.current,
    fireCorrect,
    fireWrong,
    resetCombo,
    shakeStyle,
  } as const;
}
