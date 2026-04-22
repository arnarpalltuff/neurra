import { useEffect, useRef, useState } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { KovaEmotion } from '../KovaStates';

/**
 * Owns all autonomous animation lifecycle for Kova: idle float, breathing,
 * glow pulsing, blink cycle, random idle actions, and emotion-based
 * reactions. The bounce/scaleVal/wiggle shared values are returned so the
 * tap-feedback hook can layer its own writes on top.
 *
 * Animation timings and sequences are copied verbatim from the monolithic
 * Kova.tsx — no changes to any duration, easing, damping, or stiffness.
 */
export function useKovaAnimation({ emotion }: { emotion: KovaEmotion }) {
  const [blinking, setBlinking] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values
  const floatY = useSharedValue(0);
  const scaleVal = useSharedValue(1);
  const breathScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const glowScale = useSharedValue(1);
  const wiggle = useSharedValue(0);
  const bounce = useSharedValue(0);
  const lookX = useSharedValue(0);

  // Idle float animation
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  // Breathing animation — randomized per cycle so Kova never breathes at
  // exactly the same speed twice. Robots breathe at 3.000s; living things
  // breathe at 2.8, 3.1, 2.9... That tiny variance is what makes her feel alive.
  useEffect(() => {
    let cancelled = false;
    const breathe = () => {
      if (cancelled) return;
      const inDur = 2600 + Math.random() * 600;
      const outDur = 2600 + Math.random() * 600;
      breathScale.value = withSequence(
        withTiming(1.03, { duration: inDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: outDur, easing: Easing.inOut(Easing.sin) }, (finished) => {
          if (finished) runOnJS(breathe)();
        }),
      );
    };
    breathe();
    return () => { cancelled = true; };
  }, []);

  // Blink animation (random interval 2-6s)
  useEffect(() => {
    let cancelled = false;
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 4000;
      blinkTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        setTimeout(() => {
          if (!cancelled) setBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };
    scheduleBlink();
    return () => {
      cancelled = true;
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // Random idle actions (every 8-15s)
  useEffect(() => {
    let cancelled = false;
    const actions = [
      // Look left, then right, then center
      () => {
        lookX.value = withSequence(
          withTiming(-8, { duration: 400 }),
          withDelay(800, withTiming(8, { duration: 400 })),
          withDelay(800, withTiming(0, { duration: 300 })),
        );
      },
      // Little bounce
      () => {
        bounce.value = withSequence(
          withSpring(-10, { damping: 4 }),
          withSpring(0, { damping: 8 }),
        );
      },
      // Quick wiggle (dance)
      () => {
        wiggle.value = withSequence(
          withTiming(-6, { duration: 120 }),
          withTiming(6, { duration: 120 }),
          withTiming(-4, { duration: 120 }),
          withTiming(4, { duration: 120 }),
          withTiming(-2, { duration: 120 }),
          withTiming(0, { duration: 120 }),
        );
      },
      // Wave (tilt back and forth)
      () => {
        wiggle.value = withSequence(
          withTiming(10, { duration: 200 }),
          withTiming(-10, { duration: 200 }),
          withTiming(10, { duration: 200 }),
          withTiming(0, { duration: 200 }),
        );
      },
    ];

    const scheduleAction = () => {
      const delay = 8000 + Math.random() * 7000;
      idleTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        const action = actions[Math.floor(Math.random() * actions.length)];
        action();
        scheduleAction();
      }, delay);
    };
    scheduleAction();
    return () => {
      cancelled = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Emotion-based animations
  useEffect(() => {
    switch (emotion) {
      case 'happy':
      case 'relieved':
        bounce.value = withSequence(
          withSpring(-15, { damping: 4 }),
          withSpring(0, { damping: 8 }),
          withSpring(-8, { damping: 6 }),
          withSpring(0, { damping: 10 })
        );
        break;
      case 'proud':
      case 'celebrating':
      case 'excited':
        bounce.value = withSequence(
          withSpring(-20, { damping: 3 }),
          withSpring(0, { damping: 5 }),
          withSpring(-14, { damping: 5 }),
          withSpring(0, { damping: 8 })
        );
        scaleVal.value = withSequence(
          withSpring(1.15, { damping: 4 }),
          withSpring(1, { damping: 8 })
        );
        break;
      case 'encouraging':
        wiggle.value = withSequence(
          withTiming(-8, { duration: 150 }),
          withTiming(8, { duration: 150 }),
          withTiming(-6, { duration: 150 }),
          withTiming(6, { duration: 150 }),
          withTiming(0, { duration: 150 })
        );
        break;
      case 'wilted':
      case 'worried':
        scaleVal.value = withTiming(0.92, { duration: 500 });
        break;
      default:
        scaleVal.value = withTiming(1, { duration: 300 });
        bounce.value = withTiming(0, { duration: 300 });
        wiggle.value = withTiming(0, { duration: 300 });
    }
  }, [emotion]);

  const kovaStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value + bounce.value },
      { translateX: lookX.value },
      { scale: scaleVal.value * breathScale.value },
      { rotate: `${wiggle.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return { bounce, scaleVal, wiggle, kovaStyle, glowStyle, blinking };
}
