import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, Easing, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { C } from '../../../constants/colors';
import { pulseParams, updateDifficulty, getDifficulty } from '../../../utils/difficultyEngine';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';

const { width, height } = Dimensions.get('window');

type ShapeType = 'circle' | 'square' | 'triangle';
type ShapeColor = 'green' | 'red' | 'yellow';

interface PulseProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
  isOnboarding?: boolean;
}

const TOTAL_SHAPES = 24;
const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle'];

export default function Pulse({ onComplete, initialLevel = 1, isOnboarding = false }: PulseProps) {
  const [score, setScore] = useState(0);
  const [shapeCount, setShapeCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [currentShape, setCurrentShape] = useState<{ color: ShapeColor; type: ShapeType; id: number } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [rule, setRule] = useState<'tap_green' | 'tap_red'>('tap_green');
  const [ruleAnnounced, setRuleAnnounced] = useState(false);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [prevShapeColor, setPrevShapeColor] = useState<ShapeColor | null>(null);
  const [missed, setMissed] = useState(false);

  const shapeIdRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const tappedRef = useRef(false);
  const countRef = useRef(0);
  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const scoreRef = useRef(0);
  const ruleRef = useRef<'tap_green' | 'tap_red'>('tap_green');

  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);
  const shapeScale = useSharedValue(0);
  const shapeOpacity = useSharedValue(0);
  const bgFlash = useSharedValue(0);

  const diff = getDifficulty('pulse', 0);
  const params = pulseParams(Math.max(initialLevel, diff.level));
  const intervalMs = Math.round(60000 / params.bpm);
  const total = isOnboarding ? 12 : TOTAL_SHAPES;

  // Background pulse
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: intervalMs * 0.45, easing: Easing.out(Easing.sin) }),
        withTiming(1.0, { duration: intervalMs * 0.45, easing: Easing.in(Easing.sin) })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: intervalMs * 0.45 }),
        withTiming(0.18, { duration: intervalMs * 0.45 })
      ),
      -1,
      false
    );
  }, [intervalMs]);

  const nextShape = useCallback(() => {
    const id = ++shapeIdRef.current;
    countRef.current += 1;

    // Change rule occasionally
    if (params.hasReverse && countRef.current > 0 && countRef.current % 8 === 0) {
      const newRule = ruleRef.current === 'tap_green' ? 'tap_red' : 'tap_green';
      ruleRef.current = newRule;
      setRule(newRule);
      setRuleAnnounced(true);
      setTimeout(() => { if (!cancelledRef.current) setRuleAnnounced(false); }, 1200);
    }

    // Pick color
    const rand = Math.random();
    const color: ShapeColor = rand < 0.55 ? 'green' : rand < 0.85 ? 'red' : 'yellow';
    const type = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];

    tappedRef.current = false;
    setMissed(false);
    setPrevShapeColor(color);
    setCurrentShape({ color, type, id });

    // Animate in
    shapeScale.value = withSequence(
      withTiming(1.15, { duration: 120, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 80 })
    );
    shapeOpacity.value = withTiming(1, { duration: 100 });

    // Animate out after interval
    if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    shapeTimeoutRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      shapeOpacity.value = withTiming(0, { duration: 150 });
      shapeScale.value = withTiming(0.7, { duration: 150 });

      // If green and not tapped: miss (if rule is tap_green)
      if (!tappedRef.current) {
        const shouldTap = ruleRef.current === 'tap_green' ? color === 'green' : color === 'red';
        if (shouldTap) {
          setMissed(true);
          attemptsRef.current += 1;
          updateDifficulty('pulse', false);
          setPerfectStreak(0);
        }
      }

      setCurrentShape(null);

      if (countRef.current >= total) {
        finishGame();
      }
    }, intervalMs * 0.75);
  }, [params, intervalMs, total]);

  const finishGame = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    const accuracy = attemptsRef.current > 0 ? correctRef.current / attemptsRef.current : 1;
    onCompleteRef.current(scoreRef.current, accuracy);
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    const delay = 800;
    const start = setTimeout(() => {
      nextShape();
      intervalRef.current = setInterval(() => {
        if (!cancelledRef.current) nextShape();
      }, intervalMs);
    }, delay);

    return () => {
      cancelledRef.current = true;
      clearTimeout(start);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    };
  }, []);

  const handleTap = useCallback(() => {
    if (!currentShape || tappedRef.current) return;
    tappedRef.current = true;

    const { color } = currentShape;
    const shouldTap = ruleRef.current === 'tap_green' ? color === 'green' : color === 'red';
    attemptsRef.current += 1;

    if (shouldTap) {
      correctRef.current += 1;
      const newStreak = perfectStreak + 1;
      setPerfectStreak(newStreak);
      const pts = 50 + (newStreak % 10 === 0 ? 200 : 0);
      scoreRef.current += pts;
      setScore(s => s + pts);
      setCorrectCount(c => c + 1);
      setFeedback('correct');
      burstCorrect({ x: width / 2, y: height / 2 });
      updateDifficulty('pulse', true);
    } else {
      setPerfectStreak(0);
      setFeedback('wrong');
      bgFlash.value = withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 200 }));
      burstWrong({ x: width / 2, y: height / 2 });
      updateDifficulty('pulse', false);
    }

    shapeScale.value = withSequence(
      withTiming(1.3, { duration: 80 }),
      withTiming(0, { duration: 150 })
    );
    shapeOpacity.value = withTiming(0, { duration: 200 });

    setTimeout(() => {
      if (cancelledRef.current) return;
      setFeedback(null);
      setCurrentShape(null);
    }, 250);
  }, [currentShape, perfectStreak]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const shapeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shapeScale.value }],
    opacity: shapeOpacity.value,
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgFlash.value * 0.15,
  }));

  const getShapeColor = (color: ShapeColor) => {
    if (color === 'green') return C.green;
    if (color === 'red') return C.coral;
    return C.amber;
  };

  const progress = countRef.current / total;

  return (
    <TouchableWithoutFeedback onPress={handleTap} accessible={false}>
      <View style={styles.container}>
        <FeedbackBurst {...burstFeedback} />
        <Animated.View style={[styles.flashOverlay, bgStyle]} pointerEvents="none" />

        {/* Rule display */}
        <View style={styles.ruleContainer}>
          {ruleAnnounced ? (
            <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.ruleChange}>
              SWITCH!
            </Animated.Text>
          ) : (
            <Text style={styles.ruleText}>
              Tap{' '}
              <Text style={{ color: ruleRef.current === 'tap_green' ? C.green : C.coral, fontWeight: '800' }}>
                {ruleRef.current === 'tap_green' ? 'GREEN' : 'RED'}
              </Text>
              {' '}shapes
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.scoreText}>{score}</Text>
          {perfectStreak > 4 && (
            <Text style={styles.streakText}>{perfectStreak} streak!</Text>
          )}
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Center pulse ring */}
        <View style={styles.center}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />

          {/* Shape */}
          {currentShape && (
            <Animated.View style={[styles.shapeContainer, shapeStyle]}>
              <View
                style={[
                  styles.shape,
                  currentShape.type === 'circle' && styles.circle,
                  currentShape.type === 'square' && styles.square,
                  {
                    backgroundColor: getShapeColor(currentShape.color),
                    shadowColor: getShapeColor(currentShape.color),
                  },
                ]}
              />
            </Animated.View>
          )}

          {feedback === 'correct' && (
            <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.correctFeedback}>✓</Animated.Text>
          )}
        </View>

        {missed && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.missedText}>
            Missed one!
          </Animated.Text>
        )}

        <Text style={styles.tapHint}>Tap the screen</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg2,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.coral,
  },
  ruleContainer: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
  },
  ruleText: {
    color: C.t2,
    fontSize: 16,
    fontWeight: '600',
  },
  ruleChange: {
    color: C.amber,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreText: {
    color: C.peach,
    fontSize: 28,
    fontWeight: '800',
  },
  streakText: {
    color: C.amber,
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: C.bg4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.green,
    borderRadius: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  pulseRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: C.green,
    position: 'absolute',
  },
  shapeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shape: {
    width: 72,
    height: 72,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  circle: {
    borderRadius: 36,
  },
  square: {
    borderRadius: 12,
  },
  correctFeedback: {
    position: 'absolute',
    fontSize: 36,
    color: C.green,
    fontWeight: '900',
  },
  missedText: {
    color: C.coral,
    fontSize: 14,
    fontWeight: '600',
  },
  tapHint: {
    color: C.t3,
    fontSize: 13,
    fontWeight: '500',
  },
});
