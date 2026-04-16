import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
  withDelay, withSpring, FadeIn, FadeOut, Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tapLight } from '../../../utils/haptics';
import { playCorrect, playWrong, playRoundEnd } from '../../../utils/sound';
import NeuralMapOverlay from '../../ui/NeuralMapOverlay';
import { useNeuralMap } from '../../../hooks/useNeuralMap';
import { C } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { updateDifficulty, getDifficulty } from '../../../utils/difficultyEngine';
import GameIntro from '../shared/GameIntro';

const { width: W } = Dimensions.get('window');
const CIRCLE_SIZE = W * 0.55;

interface ZenFlowProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type Phase = 'breathing' | 'focus' | 'done';

// Slow-pulsing aura ring (decoration only)
function AuraRing({ size, delay }: { size: number; delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 1], [0.05, 0.18]),
    transform: [{ scale: interpolate(p.value, [0, 1], [0.95, 1.08]) }],
  }));
  return (
    <Animated.View
      style={[
        styles.auraRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

// Pulsing target orb
function TargetOrb({ x, y, onPress }: { x: number; y: number; onPress: () => void }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  return (
    <Animated.View style={[styles.targetWrap, { left: x, top: y }, style]}>
      <View style={styles.targetHalo} />
      <Pressable onPress={onPress} style={styles.targetHit}>
        <View style={styles.targetCore}>
          <LinearGradient
            colors={['#9CECE4', '#4ECDC4']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.targetHighlight} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function FloatScore({ x, y, points }: { x: number; y: number; points: number }) {
  const rise = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    rise.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    fade.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(350, withTiming(0, { duration: 500 })),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateY: interpolate(rise.value, [0, 1], [0, -50]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.6, 1.2, 1]) },
    ],
  }));
  return (
    <Animated.Text
      style={[styles.floatScore, { left: x - 20, top: y - 20 }, style]}
      pointerEvents="none"
    >
      +{points}
    </Animated.Text>
  );
}

export default function ZenFlow({ onComplete, initialLevel = 1 }: ZenFlowProps) {
  const diff = getDifficulty('zen-flow', 0);
  const level = Math.max(initialLevel, diff.level);

  const breathCycles = 3;
  const focusDuration = 30;

  const [phase, setPhase] = useState<Phase>('breathing');
  const [_introShown, _setIntroShown] = React.useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [breathLabel, setBreathLabel] = useState('Breathe in');
  const [focusTimer, setFocusTimer] = useState(focusDuration);
  const [score, setScore] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [targetVisible, setTargetVisible] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [floatScores, setFloatScores] = useState<{ id: number; x: number; y: number; points: number }[]>([]);

  const scoreRef = useRef(0);
  const tapRef = useRef(0);
  const missRef = useRef(0);
  const targetVisibleRef = useRef(false);
  const floatIdRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect } = useGameFeedback();
  const neural = useNeuralMap('zen-flow');

  const breathScale = useSharedValue(0.6);
  const breathOpacity = useSharedValue(0.4);
  const scorePulse = useSharedValue(1);

  const breathAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: breathOpacity.value,
  }));

  useEffect(() => {
    if (phase !== 'breathing') return;
    let cycle = 0;
    let cancelled = false;

    const runCycle = () => {
      if (cancelled || cycle >= breathCycles) {
        if (!cancelled) setPhase('focus');
        return;
      }

      setBreathLabel('Breathe in');
      breathScale.value = withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) });
      breathOpacity.value = withTiming(0.85, { duration: 4000 });
      tapLight();

      setTimeout(() => {
        if (cancelled) return;
        setBreathLabel('Hold');
        setTimeout(() => {
          if (cancelled) return;
          setBreathLabel('Breathe out');
          breathScale.value = withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) });
          breathOpacity.value = withTiming(0.45, { duration: 4000 });

          setTimeout(() => {
            if (cancelled) return;
            cycle++;
            setBreathCount(cycle);
            runCycle();
          }, 4000);
        }, 2000);
      }, 4000);
    };

    runCycle();

    return () => { cancelled = true; };
  }, [phase]);


  useEffect(() => {
    if (phase !== 'focus') return;
    let remaining = focusDuration;
    let cancelled = false;

    const countdown = setInterval(() => {
      remaining -= 1;
      setFocusTimer(remaining);
      if (remaining <= 0) {
        clearInterval(countdown);
        setPhase('done');
      }
    }, 1000);

    const spawnTarget = () => {
      if (cancelled) return;
      const fieldSize = W - 80;
      setTargetPos({
        x: 20 + Math.random() * (fieldSize - 60),
        y: 20 + Math.random() * (fieldSize * 0.55),
      });
      setTargetVisible(true);
      targetVisibleRef.current = true;

      setTimeout(() => {
        if (cancelled) return;
        if (targetVisibleRef.current) {
          missRef.current += 1;
          setMissCount(missRef.current);
          targetVisibleRef.current = false;
          setTargetVisible(false);
        }
        const delay = 800 + Math.random() * 1200;
        setTimeout(() => { if (!cancelled) spawnTarget(); }, delay);
      }, 2000);
    };

    setTimeout(() => { if (!cancelled) spawnTarget(); }, 1000);

    return () => {
      cancelled = true;
      clearInterval(countdown);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'done') return;
    const total = tapRef.current + missRef.current;
    const acc = total > 0 ? tapRef.current / total : 1;
    updateDifficulty('zen-flow', acc > 0.7);
    onComplete(scoreRef.current, acc);
  }, [phase, onComplete]);

  const handleTargetTap = useCallback(() => {
    if (!targetVisibleRef.current) return;
    targetVisibleRef.current = false;
    setTargetVisible(false);
    tapRef.current += 1;
    setTapCount(tapRef.current);
    const pts = 80;
    scoreRef.current += pts;
    setScore(scoreRef.current);
    tapLight();
    scorePulse.value = withSequence(
      withSpring(1.2, { damping: 6 }),
      withSpring(1, { damping: 10 }),
    );
    floatIdRef.current += 1;
    const fid = floatIdRef.current;
    setFloatScores(prev => [...prev, { id: fid, x: targetPos.x + 25, y: targetPos.y, points: pts }]);
    setTimeout(() => {
      setFloatScores(prev => prev.filter(f => f.id !== fid));
    }, 1200);
    playCorrect(); neural.onCorrectAnswer(); burstCorrect({ x: targetPos.x + 25, y: targetPos.y + 100 });
  }, [burstCorrect, targetPos]);

  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#06181E', '#04101A', '#020A12']}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(78,205,196,0.10)', 'rgba(0,0,0,0)']}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <FloatingParticles count={10} color="rgba(156,236,228,0.35)" />

      <FeedbackBurst {...burstFeedback} />

      <NeuralMapOverlay activeAreas={neural.activeAreas} pulseArea={neural.pulseArea} intensity={neural.intensity} />

      {/* ── Breathing phase ────────────────────────── */}
      {phase === 'breathing' && (
        <View style={styles.breathArea}>
          <Text style={styles.breathLabel}>{breathLabel}</Text>

          <View style={styles.breathOrbCenter}>
            <AuraRing size={CIRCLE_SIZE * 1.8} delay={0} />
            <AuraRing size={CIRCLE_SIZE * 1.5} delay={800} />
            <AuraRing size={CIRCLE_SIZE * 1.2} delay={1600} />

            <Animated.View style={[styles.breathCircle, breathAnimStyle]}>
              <LinearGradient
                colors={['rgba(156,236,228,0.4)', 'rgba(78,205,196,0.15)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.breathCore}>
                <LinearGradient
                  colors={['#9CECE4', '#4ECDC4']}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            </Animated.View>
          </View>

          <Text style={styles.breathCount}>{breathCount}<Text style={styles.breathCountDim}> / {breathCycles}</Text></Text>
          <Text style={styles.breathHint}>Follow the rhythm</Text>
        </View>
      )}

      {/* ── Focus phase ────────────────────────────── */}
      {phase === 'focus' && (
        <View style={styles.focusArea}>
          <View style={styles.header}>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>TIME</Text>
              <Text style={styles.pillText}>{focusTimer}<Text style={styles.pillTextDim}>s</Text></Text>
            </View>
            <Animated.View style={scorePulseStyle}>
              <Text style={styles.scoreText}>{score}</Text>
              <Text style={styles.scoreLabel}>POINTS</Text>
            </Animated.View>
            <View style={styles.statsPill}>
              <Text style={styles.statsText}>{tapCount}<Text style={styles.statsDim}>/{tapCount + missCount}</Text></Text>
              <Text style={styles.statsLabel}>CAUGHT</Text>
            </View>
          </View>

          <Text style={styles.focusLabel}>TAP THE GLOWING ORBS</Text>

          <View style={styles.focusFieldWrap}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <View style={styles.focusField}>
              <LinearGradient
                colors={['rgba(78,205,196,0.06)', 'rgba(0,0,0,0)']}
                style={StyleSheet.absoluteFillObject}
              />

              {targetVisible && (
                <TargetOrb x={targetPos.x} y={targetPos.y} onPress={handleTargetTap} />
              )}

              {floatScores.map(f => (
                <FloatScore key={f.id} x={f.x} y={f.y} points={f.points} />
              ))}
            </View>
          </View>
        </View>
      )}
      {!_introShown && <GameIntro name="Zen Flow" subtitle="Breathe · focus · restore" accentColor={C.blue} onDone={() => _setIntroShown(true)} />}
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020A12',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },

  // Breathing
  breathArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  breathLabel: {
    color: '#9CECE4',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(156,236,228,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  breathOrbCenter: {
    width: CIRCLE_SIZE * 2,
    height: CIRCLE_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  auraRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(156,236,228,0.4)',
  },
  breathCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(156,236,228,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 14,
  },
  breathCore: {
    width: '50%',
    height: '50%',
    borderRadius: 999,
    overflow: 'hidden',
    opacity: 0.65,
  },
  breathCount: {
    color: '#9CECE4',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  breathCountDim: {
    color: C.t3,
    fontWeight: '700',
  },
  breathHint: {
    color: C.t3,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Focus
  focusArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillLabel: {
    color: C.t3,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pillText: {
    color: C.t1,
    fontSize: 16,
    fontWeight: '900',
  },
  pillTextDim: {
    color: C.t3,
    fontWeight: '700',
  },
  scoreText: {
    color: C.peach,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(224,155,107,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  scoreLabel: {
    color: C.t3,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.4,
    marginTop: -1,
  },
  statsPill: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(78,205,196,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.35)',
  },
  statsText: {
    color: '#9CECE4',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  statsDim: {
    color: C.t3,
    fontWeight: '700',
  },
  statsLabel: {
    color: '#9CECE4',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  focusLabel: {
    color: C.t2,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },

  focusFieldWrap: {
    flex: 1,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(78,205,196,0.5)',
    zIndex: 1,
  },
  cornerTL: { top: -2, left: -2, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 },
  focusField: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.18)',
  },

  // Target
  targetWrap: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetHalo: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(156,236,228,0.18)',
  },
  targetHit: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
  },
  targetHighlight: {
    position: 'absolute',
    top: 8,
    left: 11,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  floatScore: {
    position: 'absolute',
    color: '#9CECE4',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(78,205,196,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
