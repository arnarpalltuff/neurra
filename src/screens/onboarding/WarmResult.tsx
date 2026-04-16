import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import Kova from '../../components/kova/Kova';
import { KovaEmotion } from '../../components/kova/KovaStates';
import Button from '../../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../../components/ui/FloatingParticles';
import ParticleBurst from '../../components/onboarding/ParticleBurst';
import { tapHeavy } from '../../utils/haptics';

interface WarmResultProps {
  accuracy: number;
  onNext: () => void;
}

function messageFor(pct: number): { text: string; emotion: KovaEmotion } {
  if (pct >= 90) return {
    text: `${pct}%? Your brain's already warmed up. Let's make it sharper.`,
    emotion: 'proud',
  };
  if (pct >= 70) return {
    text: `${pct}% on your first try? Sharp. Most people score lower out of the gate.`,
    emotion: 'proud',
  };
  if (pct >= 50) return {
    text: `Good start. ${pct}% is solid for a first run — we'll climb from here.`,
    emotion: 'happy',
  };
  return {
    text: `Hey, that's why we train. ${pct}% is your starting line, not your limit.`,
    emotion: 'encouraging',
  };
}

/**
 * Isolates the frequent `displayPct` state updates from the parent so Kova
 * and the surrounding layout don't reconcile on every count tick.
 */
const AnimatedPct = React.memo(function AnimatedPct({
  target,
  color,
}: {
  target: number;
  color: string;
}) {
  const [displayPct, setDisplayPct] = useState(0);
  const count = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    count.value = withDelay(
      300,
      withTiming(target, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
    pulse.value = withDelay(
      1500,
      withSequence(
        withSpring(1.12, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 160 }),
      ),
    );
    return () => {
      cancelAnimation(count);
      cancelAnimation(pulse);
    };
  }, [target, count, pulse]);

  useAnimatedReaction(
    () => Math.round(count.value),
    (current, previous) => {
      if (current !== previous) runOnJS(setDisplayPct)(current);
    },
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.Text style={[styles.scoreBig, { color }, style]}>
      {displayPct}%
    </Animated.Text>
  );
});

export default function WarmResult({ accuracy, onNext }: WarmResultProps) {
  const pct = Math.round(accuracy * 100);
  const { text: message, emotion } = messageFor(pct);

  const isHighTier = pct >= 70;
  const tierColor = isHighTier ? C.green : C.amber;

  const [burstTrigger, setBurstTrigger] = useState(0);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glowOpacity = useSharedValue(0);

  // Stable color arrays so `ParticleBurst`'s React.memo isn't defeated.
  const burstColors = useMemo(() => [tierColor, C.t1], [tierColor]);
  const particleColor = useMemo(() => `${tierColor}22`, [tierColor]);

  useEffect(() => {
    // Single JS-side timer: fire haptic + burst exactly when the count lands.
    burstTimerRef.current = setTimeout(() => {
      tapHeavy();
      setBurstTrigger(n => n + 1);
    }, 1500);

    // Glow bloom behind the number — runs entirely on the UI thread, auto-cancels.
    glowOpacity.value = withDelay(
      1500,
      withSequence(
        withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
        withDelay(200, withTiming(0, { duration: 900, easing: Easing.in(Easing.cubic) })),
      ),
    );

    return () => {
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      cancelAnimation(glowOpacity);
    };
  }, [glowOpacity]);

  const glowRingStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.6,
    transform: [{ scale: 0.8 + glowOpacity.value * 0.5 }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg1, '#0A0E1A', C.bg1]} style={StyleSheet.absoluteFillObject} />
      <FloatingParticles count={5} color={particleColor} />

      <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.kovaArea}>
        <Kova stage={1} emotion={emotion} size={120} showSpeechBubble={false} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.scoreArea}>
        <Animated.View style={[styles.scoreGlow, { backgroundColor: `${tierColor}33`, shadowColor: tierColor }, glowRingStyle]} />
        <ParticleBurst
          trigger={burstTrigger}
          count={isHighTier ? 14 : 10}
          colors={burstColors}
          spread={isHighTier ? 140 : 100}
          minSize={3}
          maxSize={7}
        />
        <AnimatedPct target={pct} color={tierColor} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.labelWrap}>
        <Text style={styles.scoreLabel}>accuracy</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.messageArea}>
        <View style={[styles.bubble, { borderColor: `${tierColor}33`, shadowColor: tierColor }]}>
          <Text style={styles.bubbleText}>{message}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1100).duration(400)} style={styles.btnArea}>
        <Button label="Let's go" onPress={onNext} size="lg" style={styles.btn} />
      </Animated.View>
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
    gap: 20,
  },
  kovaArea: {
    alignItems: 'center',
  },
  scoreArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 100,
  },
  scoreGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 10,
  },
  scoreBig: {
    fontFamily: fonts.bodyBold,
    fontSize: 64,
    letterSpacing: -2,
  },
  labelWrap: {
    alignItems: 'center',
    marginTop: -6,
  },
  scoreLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  messageArea: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  bubble: {
    backgroundColor: 'rgba(19,24,41,0.9)',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  bubbleText: {
    fontFamily: fonts.kova,
    color: C.t1,
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 28,
  },
  btnArea: {
    width: '100%',
    marginTop: 16,
  },
  btn: {
    width: '100%',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
