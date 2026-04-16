import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { tapLight, tapMedium, success as hapticSuccess, warning as hapticWarning } from '../../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../../components/ui/FloatingParticles';
import Kova from '../../components/kova/Kova';
import ParticleBurst from '../../components/onboarding/ParticleBurst';

const CIRCLE_SIZE = 100;
const TOTAL_ROUNDS = 8;
const SHOW_MS = 1200;

// Hoisted so ParticleBurst's React.memo isn't defeated by an inline array.
const BURST_COLORS = [C.green, C.t1];
const AMBIENT_PARTICLE_COLOR = 'rgba(110,207,154,0.1)';

interface MiniPulseProps {
  onComplete: (accuracy: number) => void;
}

type KovaReaction = 'idle' | 'happy' | 'flinch';

export default function MiniPulse({ onComplete }: MiniPulseProps) {
  const [round, setRound] = useState(0);
  const [isGreen, setIsGreen] = useState(true);
  const [tapped, setTapped] = useState(false);
  const [kovaReaction, setKovaReaction] = useState<KovaReaction>('idle');
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [warnTrigger, setWarnTrigger] = useState(0);

  const hitsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kovaResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const doneRef = useRef(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (kovaResetRef.current) clearTimeout(kovaResetRef.current);
    };
  }, []);

  useEffect(() => {
    if (doneRef.current) return;
    if (round >= TOTAL_ROUNDS) {
      doneRef.current = true;
      const accuracy = TOTAL_ROUNDS > 0 ? hitsRef.current / TOTAL_ROUNDS : 0;
      hapticSuccess();
      onComplete(accuracy);
      return;
    }
    const green = Math.random() > 0.35;
    setIsGreen(green);
    setTapped(false);

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      // Correctly ignored red = hit; missed green = no hit.
      if (!green) hitsRef.current += 1;
      setRound(r => r + 1);
    }, SHOW_MS);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [round, onComplete]);

  const triggerKovaReaction = (r: KovaReaction) => {
    setKovaReaction(r);
    if (kovaResetRef.current) clearTimeout(kovaResetRef.current);
    kovaResetRef.current = setTimeout(() => {
      if (mountedRef.current) setKovaReaction('idle');
    }, 450);
  };

  const scoreBump = useSharedValue(1);
  const shake = useSharedValue(0);

  const handleTap = () => {
    if (tapped) return;
    setTapped(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isGreen) {
      hitsRef.current += 1;
      tapMedium();
      setBurstTrigger(n => n + 1);
      triggerKovaReaction('happy');
      scoreBump.value = withSequence(
        withSpring(1.15, { damping: 10, stiffness: 220 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    } else {
      tapLight();
      hapticWarning();
      setWarnTrigger(n => n + 1);
      triggerKovaReaction('flinch');
      shake.value = withSequence(
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-2, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }

    tapTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setRound(r => r + 1);
    }, 200);
  };

  const circleScale = useSharedValue(1);
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));
  const scoreBumpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreBump.value }, { translateX: shake.value }],
  }));

  // Warning edge flash: fades in briefly when warnTrigger fires.
  const warnOpacity = useSharedValue(0);
  useEffect(() => {
    if (warnTrigger === 0) return;
    warnOpacity.value = withSequence(
      withTiming(0.35, { duration: 100 }),
      withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }),
    );
  }, [warnTrigger, warnOpacity]);
  const warnStyle = useAnimatedStyle(() => ({ opacity: warnOpacity.value }));

  const color = isGreen ? C.green : C.coral;
  const glowShadow = {
    shadowColor: color,
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  };

  // Kova emotion driven by reaction state.
  const kovaEmotion = kovaReaction === 'happy'
    ? 'excited'
    : kovaReaction === 'flinch'
      ? 'worried'
      : 'curious';
  const kovaWiggle = useSharedValue(0);
  const kovaScale = useSharedValue(1);
  useEffect(() => {
    if (kovaReaction === 'happy') {
      kovaWiggle.value = withSequence(
        withTiming(6, { duration: 80 }),
        withTiming(-6, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      );
    } else if (kovaReaction === 'flinch') {
      kovaWiggle.value = withSequence(
        withTiming(-2, { duration: 80 }),
        withTiming(0, { duration: 120 }),
      );
      kovaScale.value = withSequence(
        withSpring(0.92, { damping: 14, stiffness: 240 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    }
  }, [kovaReaction, kovaWiggle, kovaScale]);
  const kovaCornerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: kovaScale.value },
      { rotate: `${kovaWiggle.value}deg` },
    ],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg1, '#0A0E1A', C.bg1]} style={StyleSheet.absoluteFillObject} />
      <FloatingParticles count={3} color={AMBIENT_PARTICLE_COLOR} />

      {/* Screen-edge warning flash on wrong tap. */}
      <Animated.View style={[styles.edgeFlash, warnStyle]} pointerEvents="none">
        <LinearGradient
          colors={[`${C.coral}60`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.edgeFlashGradient}
        />
      </Animated.View>

      {/* Kova in top-right corner — small, watching, reacting. */}
      <Animated.View style={[styles.kovaCorner, kovaCornerStyle]}>
        <Kova stage={1} emotion={kovaEmotion} size={34} showSpeechBubble={false} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <Text style={styles.title}>Quick! Tap the green circles.</Text>
        <Text style={styles.subtitle}>Ignore the red ones.</Text>
      </Animated.View>

      <Animated.View style={[styles.dotsRow, scoreBumpStyle]}>
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < round && { backgroundColor: C.green, shadowColor: C.green, shadowOpacity: 0.6, shadowRadius: 4 },
              i === round && { backgroundColor: C.t1 },
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.circleArea}>
        {round < TOTAL_ROUNDS && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pressable
              onPress={handleTap}
              onPressIn={() => { circleScale.value = withSpring(0.92, { damping: 14, stiffness: 300 }); }}
              onPressOut={() => { circleScale.value = withSpring(1, { damping: 14, stiffness: 300 }); }}
            >
              <Animated.View
                style={[
                  styles.circle,
                  { backgroundColor: color },
                  glowShadow,
                  circleStyle,
                  tapped && { opacity: 0.4 },
                ]}
              />
            </Pressable>
          </Animated.View>
        )}
        {/* Burst emanates from circle center on correct green taps. */}
        <ParticleBurst
          trigger={burstTrigger}
          count={10}
          colors={BURST_COLORS}
          spread={90}
        />
      </View>

      <Text style={styles.hint}>This is how brain training feels.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 32,
  },
  edgeFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  edgeFlashGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  kovaCorner: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 36,
    height: 36,
  },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowOffset: { width: 0, height: 0 },
  },
  circleArea: {
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  hint: {
    fontFamily: fonts.kova,
    color: C.t3,
    fontSize: 16,
    textAlign: 'center',
  },
});
