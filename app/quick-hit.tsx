import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn, FadeInDown,
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
  withTiming, withDelay, withRepeat, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { C } from '../src/constants/colors';
import { fonts } from '../src/constants/typography';
import { space, radii } from '../src/constants/design';
import { gameConfigs, GameId } from '../src/constants/gameConfigs';
import { useProgressStore } from '../src/stores/progressStore';
import { useEnergyStore } from '../src/stores/energyStore';
import Pulse from '../src/components/games/pulse/Pulse';
import GhostKitchen from '../src/components/games/ghost-kitchen/GhostKitchen';
import WordWeave from '../src/components/games/word-weave/WordWeave';
import FloatingParticles from '../src/components/ui/FloatingParticles';
import ErrorBoundary from '../src/components/ui/ErrorBoundary';
import { success, tapMedium, tapHeavy } from '../src/utils/haptics';

const QUICK_HIT_GAMES: GameId[] = ['pulse', 'ghost-kitchen', 'word-weave'];

type Phase = 'playing' | 'done';

function pickGame(): GameId {
  return QUICK_HIT_GAMES[Math.floor(Math.random() * QUICK_HIT_GAMES.length)];
}

function CountUp({ target, delay, style: s }: { target: number; delay: number; style: any }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const id = setInterval(() => {
        const t = Math.min(1, (Date.now() - startTime) / 800);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(target * eased));
        if (t >= 1) clearInterval(id);
      }, 24);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return <Text style={s}>{display}</Text>;
}

export default function QuickHitScreen() {
  const gameId = useMemo(() => pickGame(), []);
  const config = gameConfigs[gameId];
  const [phase, setPhase] = useState<Phase>('playing');
  const [finalScore, setFinalScore] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const boltGlow = useSharedValue(0);
  const scoreScale = useSharedValue(0);

  const consumedRef = useRef(false);
  useEffect(() => {
    if (consumedRef.current) return;
    consumedRef.current = true;
    const ok = useEnergyStore.getState().tryConsumeQuickHit();
    if (!ok) router.replace('/(tabs)');
  }, []);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const handleGameComplete = (score: number, accuracy: number) => {
    setFinalScore(score);
    setFinalAccuracy(accuracy);
    const xp = Math.round(15 + accuracy * 10);
    setXpAwarded(xp);
    useProgressStore.getState().addXP(xp);
    setPhase('done');

    tapHeavy();
    setTimeout(() => { tapMedium(); }, 100);
    setTimeout(() => { success(); }, 400);

    boltGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
    scoreScale.value = withDelay(200, withSequence(
      withSpring(1.15, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 10 }),
    ));

    dismissTimerRef.current = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2800);
  };

  const handleClose = () => {
    router.replace('/(tabs)');
  };

  const boltStyle = useAnimatedStyle(() => ({
    textShadowRadius: 20 + boltGlow.value * 30,
    transform: [{ scale: 1 + boltGlow.value * 0.1 }],
  }));
  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  if (!config) {
    router.replace('/(tabs)');
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[C.bg1, '#0A0E1A', C.bg1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.hud} pointerEvents="box-none">
        <Text style={styles.hudLabel}>QUICK HIT · {config.name.toUpperCase()}</Text>
        {phase === 'playing' && (
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      {phase === 'playing' && (
        <View style={styles.gameArea}>
          <ErrorBoundary
            fallback={
              <View style={styles.errorFallback}>
                <Text style={styles.errorText}>Quick Hit hit a snag.</Text>
                <Pressable style={styles.errorBtn} onPress={handleClose}>
                  <Text style={styles.errorBtnText}>Back</Text>
                </Pressable>
              </View>
            }
          >
            {gameId === 'pulse' && <Pulse onComplete={handleGameComplete} initialLevel={1} />}
            {gameId === 'ghost-kitchen' && <GhostKitchen onComplete={handleGameComplete} initialLevel={1} />}
            {gameId === 'word-weave' && <WordWeave onComplete={handleGameComplete} initialLevel={1} />}
          </ErrorBoundary>
        </View>
      )}

      {phase === 'done' && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.doneScreen}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <FloatingParticles count={10} color="rgba(240,181,66,0.25)" />

          <Animated.Text entering={FadeInDown.delay(50).duration(400)} style={[styles.doneEmoji, boltStyle]}>
            ⚡
          </Animated.Text>

          <Animated.View style={scoreStyle}>
            <CountUp target={finalScore} delay={100} style={styles.doneScore} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.doneStatsRow}>
            <View style={styles.doneStat}>
              <Text style={[styles.doneStatValue, {
                color: finalAccuracy >= 0.8 ? C.green : finalAccuracy >= 0.5 ? C.amber : C.coral,
              }]}>
                {Math.round(finalAccuracy * 100)}%
              </Text>
              <Text style={styles.doneStatLabel}>ACCURACY</Text>
            </View>
            <View style={styles.doneStatDivider} />
            <View style={styles.doneStat}>
              <Text style={[styles.doneStatValue, { color: C.amber }]}>+{xpAwarded}</Text>
              <Text style={styles.doneStatLabel}>XP EARNED</Text>
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={styles.doneMessage}>
            {finalAccuracy >= 0.8 ? 'Lightning reflexes!' :
             finalAccuracy >= 0.5 ? 'Quick and focused.' :
             'Every rep counts.'}
          </Animated.Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg1,
  },
  hud: {
    position: 'absolute',
    top: 14,
    left: 24,
    right: 24,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudLabel: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 11,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(240,181,66,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  closeBtnText: {
    color: C.t2,
    fontSize: 14,
  },
  gameArea: { flex: 1 },

  doneScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
  },
  doneEmoji: {
    fontSize: 72,
    marginBottom: space.sm,
    textShadowColor: 'rgba(240,181,66,0.8)',
    textShadowOffset: { width: 0, height: 0 },
  },
  doneScore: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 72,
    letterSpacing: -3,
    textShadowColor: 'rgba(240,181,66,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  doneStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: space.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.2)',
    shadowColor: '#F0B542',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  doneStat: {
    alignItems: 'center',
  },
  doneStatValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  doneStatLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: C.t4,
    letterSpacing: 1,
    marginTop: 2,
  },
  doneStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  doneMessage: {
    fontFamily: fonts.kova,
    color: C.t2,
    fontSize: 18,
    textAlign: 'center',
    marginTop: space.md,
  },

  errorFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
  },
  errorText: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 16,
  },
  errorBtn: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  errorBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.coral,
    fontSize: 14,
  },
});
