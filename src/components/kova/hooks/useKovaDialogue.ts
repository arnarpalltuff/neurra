import { useState, useRef, useEffect, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { getDialogue, DialogueContext } from '../../../constants/dialoguePool';
import { getTimeOfDay } from '../../../utils/timeUtils';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { pickPersonalityLine } from '../../../constants/kovaPersonalityDialogue';

/**
 * Owns the speech-bubble lifecycle: dialogue picking (forceDialogue →
 * personality → time-of-day fallback → dedupe), visibility state, and the
 * fade-in / 2500ms-hold / fade-out animation. Caller invokes `showBubble()`
 * when a tap should produce a line; this hook handles everything else.
 *
 * All timings and dialogue-picking logic copied verbatim from Kova.tsx.
 */
export function useKovaDialogue({
  forceDialogue,
  dialogueContext,
}: {
  forceDialogue?: string;
  dialogueContext?: DialogueContext;
}) {
  const [bubble, setBubble] = useState<string | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const lastDialogue = useRef('');
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bubbleOpacity = useSharedValue(0);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, []);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [
      {
        scale: interpolate(bubbleOpacity.value, [0, 1], [0.85, 1]),
      },
    ],
  }));

  const showBubble = useCallback(() => {
    let line: string;
    if (forceDialogue) {
      line = forceDialogue;
    } else {
      const tod = getTimeOfDay();
      const ctx: DialogueContext =
        dialogueContext ??
        (tod === 'morning'
          ? 'tapMorning'
          : tod === 'lateNight'
          ? 'tapLateNight'
          : tod === 'evening'
          ? 'tapEvening'
          : 'tap');
      // 40% chance Kova speaks from her current personality pool. The
      // other 60% she falls back to the standard time-of-day dialogue.
      const personality = usePersonalityStore.getState().current();
      if (personality !== 'neutral' && Math.random() < 0.4) {
        line = pickPersonalityLine(personality);
      } else {
        line = getDialogue(ctx, true);
      }
      // Avoid repeating the last line
      if (line === lastDialogue.current) {
        line = getDialogue('tap');
      }
      lastDialogue.current = line;
    }

    setBubble(line);
    setBubbleVisible(true);
    bubbleOpacity.value = withTiming(1, { duration: 200 });

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => {
      bubbleOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setBubbleVisible)(false);
      });
    }, 2500);
  }, [forceDialogue, dialogueContext]);

  return { bubble, bubbleVisible, bubbleStyle, showBubble };
}
