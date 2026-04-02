import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
  FadeIn, FadeOut, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../constants/colors';
import { updateDifficulty, getDifficulty } from '../../../utils/difficultyEngine';

const { width: W } = Dimensions.get('window');
const CIRCLE_SIZE = W * 0.55;

interface ZenFlowProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type Phase = 'breathing' | 'focus' | 'done';

export default function ZenFlow({ onComplete, initialLevel = 1 }: ZenFlowProps) {
  const diff = getDifficulty('zen-flow', 0);
  const level = Math.max(initialLevel, diff.level);

  const breathCycles = 3;
  const focusDuration = 30; // seconds of sustained focus tapping

  const [phase, setPhase] = useState<Phase>('breathing');
  const [breathCount, setBreathCount] = useState(0);
  const [breathLabel, setBreathLabel] = useState('Breathe in');
  const [focusTimer, setFocusTimer] = useState(focusDuration);
  const [score, setScore] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [targetVisible, setTargetVisible] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  const scoreRef = useRef(0);
  const tapRef = useRef(0);
  const missRef = useRef(0);
  const targetVisibleRef = useRef(false);

  const breathScale = useSharedValue(0.6);
  const breathOpacity = useSharedValue(0.4);

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

      // Inhale
      setBreathLabel('Breathe in');
      breathScale.value = withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) });
      breathOpacity.value = withTiming(0.8, { duration: 4000 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setTimeout(() => {
        if (cancelled) return;
        // Hold
        setBreathLabel('Hold');
        setTimeout(() => {
          if (cancelled) return;
          // Exhale
          setBreathLabel('Breathe out');
          breathScale.value = withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) });
          breathOpacity.value = withTiming(0.4, { duration: 4000 });

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

  // Focus phase — targets appear, user taps them
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
        x: 20 + Math.random() * (fieldSize - 40),
        y: 20 + Math.random() * (fieldSize * 0.6),
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <View style={styles.container}>
      {phase === 'breathing' && (
        <View style={styles.breathArea}>
          <Text style={styles.breathLabel}>{breathLabel}</Text>
          <Animated.View style={[styles.breathCircle, breathAnimStyle]} />
          <Text style={styles.breathCount}>{breathCount}/{breathCycles}</Text>
        </View>
      )}

      {phase === 'focus' && (
        <View style={styles.focusArea}>
          <View style={styles.header}>
            <Text style={styles.timerText}>{focusTimer}s</Text>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
          <Text style={styles.focusLabel}>Tap the glowing orbs</Text>
          <View style={styles.focusField}>
            {targetVisible && (
              <Pressable
                onPress={handleTargetTap}
                style={[styles.target, { left: targetPos.x, top: targetPos.y }]}
              >
                <Animated.View entering={FadeIn.duration(200)} style={styles.targetInner} />
              </Pressable>
            )}
          </View>
          <Text style={styles.statsText}>
            Caught: {tapCount} | Missed: {missCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: 20 },
  breathArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  breathLabel: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: 1 },
  breathCircle: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.sky, borderWidth: 2, borderColor: colors.sky,
  },
  breathCount: { color: colors.textTertiary, fontSize: 14, fontWeight: '600' },
  focusArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timerText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  scoreText: { color: colors.warm, fontSize: 18, fontWeight: '800' },
  focusLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  focusField: {
    flex: 1, backgroundColor: colors.bgSecondary, borderRadius: 24,
    overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: colors.border,
  },
  target: { position: 'absolute', width: 50, height: 50 },
  targetInner: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: colors.growth, shadowColor: colors.growth,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 16, elevation: 6,
  },
  statsText: { color: colors.textTertiary, fontSize: 13, textAlign: 'center', marginTop: 12 },
});
