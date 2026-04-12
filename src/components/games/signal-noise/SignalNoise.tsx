import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withSequence, withDelay, FadeIn, FadeOut, Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../../constants/colors';
import { updateDifficulty, getDifficulty, signalNoiseParams } from '../../../utils/difficultyEngine';
import { pickRandom } from '../../../utils/arrayUtils';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { selection, success, error as hapticError, tapMedium } from '../../../utils/haptics';

const { width: W } = Dimensions.get('window');
const SCENE_SIZE = W - 40;

interface SignalNoiseProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type ShapeType = 'circle' | 'square' | 'rounded';

interface SceneShape {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
  shapeType: ShapeType;
}

const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'rounded'];

const PALETTE = [
  '#4A90D9', '#D94A6B', '#5CC99A', '#D9A84A', '#9A5CC9', '#C95C5C',
  '#5CAAC9', '#D96BA8', '#6BD96B', '#C9985C', '#7A6BD9', '#D9C95C',
];

function generateScene(count: number): SceneShape[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * (SCENE_SIZE - 80),
    y: 40 + Math.random() * (SCENE_SIZE - 80),
    r: 24 + Math.random() * 44,
    color: pickRandom(PALETTE),
    opacity: 0.5 + Math.random() * 0.4,
    shapeType: pickRandom(SHAPE_TYPES),
  }));
}

// ─────────────────────────────────────────────────────────────
// Scanning reticle that orbits the scene while watching
// ─────────────────────────────────────────────────────────────
function ScanReticle() {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360}deg` }],
  }));
  return (
    <Animated.View style={[styles.scanReticle, style]} pointerEvents="none">
      <View style={styles.scanLine} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Float score text rising from a position
// ─────────────────────────────────────────────────────────────
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
      { translateY: interpolate(rise.value, [0, 1], [0, -60]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.6, 1.2, 1]) },
    ],
  }));
  return (
    <Animated.Text
      style={[styles.floatScore, { left: x - 30, top: y - 20 }, style]}
      pointerEvents="none"
    >
      +{points}
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────────────────────
// Pulsing missed indicator
// ─────────────────────────────────────────────────────────────
function MissedPulse({ x, y }: { x: number; y: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
      -1,
      false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.2, 1], [0, 0.8, 0]),
    transform: [{ scale: interpolate(p.value, [0, 1], [0.6, 2]) }],
  }));
  return (
    <Animated.View
      style={[
        styles.missedPulse,
        { left: x - 30, top: y - 30 },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

export default function SignalNoise({ onComplete, initialLevel = 1 }: SignalNoiseProps) {
  const diff = getDifficulty('signal-noise', 0);
  const level = Math.max(initialLevel, diff.level);
  const params = useMemo(() => signalNoiseParams(level), [level]);

  const [shapes, setShapes] = useState<SceneShape[]>([]);
  const [changePos, setChangePos] = useState<{ x: number; y: number } | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'missed' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [floatScores, setFloatScores] = useState<{ id: number; x: number; y: number; points: number }[]>([]);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const roundRef = useRef(0);
  const streakRef = useRef(0);
  const waitingRef = useRef(false);
  const changePosRef = useRef<{ x: number; y: number } | null>(null);
  const shapesRef = useRef<SceneShape[]>([]);
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const paramsRef = useRef(params);
  const floatIdRef = useRef(0);
  onCompleteRef.current = onComplete;
  paramsRef.current = params;

  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);

  useEffect(() => {
    const initial = generateScene(params.numShapes);
    setShapes(initial);
    shapesRef.current = initial;
  }, [params.numShapes]);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  const scheduleChange = useCallback(() => {
    if (cancelledRef.current) return;
    const p = paramsRef.current;
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      if (roundRef.current >= p.totalChanges) {
        const acc = p.totalChanges > 0 ? correctRef.current / p.totalChanges : 1;
        onCompleteRef.current(scoreRef.current, acc);
        return;
      }

      const currentShapes = shapesRef.current;
      const targetIdx = Math.floor(Math.random() * currentShapes.length);
      const target = currentShapes[targetIdx];
      const newColor = pickRandom(PALETTE.filter(c => c !== target.color));

      const updated = currentShapes.map((s, i) =>
        i === targetIdx ? { ...s, color: newColor, opacity: Math.min(0.9, s.opacity + 0.1 - p.subtlety * 0.1) } : s
      );
      if (cancelledRef.current) return;
      setShapes(updated);
      shapesRef.current = updated;

      const pos = { x: target.x, y: target.y };
      setChangePos(pos);
      changePosRef.current = pos;
      waitingRef.current = true;
      roundRef.current += 1;
      setRound(roundRef.current);

      tapTimerRef.current = setTimeout(() => {
        if (cancelledRef.current) return;
        if (waitingRef.current) {
          waitingRef.current = false;
          setFeedback('missed');
          streakRef.current = 0;
          setStreak(0);
          updateDifficulty('signal-noise', false);
          hapticError();
          feedbackTimerRef.current = setTimeout(() => {
            if (cancelledRef.current) return;
            setFeedback(null);
            scheduleChange();
          }, 800);
        }
      }, 2500);
    }, p.changeInterval);
  }, []);

  const scenReady = shapes.length > 0;
  useEffect(() => {
    if (!scenReady) return;
    cancelledRef.current = false;
    const initial = setTimeout(() => scheduleChange(), 1500);
    return () => {
      cancelledRef.current = true;
      clearTimeout(initial);
      clearAllTimers();
    };
  }, [scenReady, scheduleChange, clearAllTimers]);

  const handleTap = useCallback((tapX: number, tapY: number) => {
    if (cancelledRef.current) return;
    if (!waitingRef.current || !changePosRef.current) return;
    waitingRef.current = false;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    const pos = changePosRef.current;
    const dist = Math.sqrt((tapX - pos.x) ** 2 + (tapY - pos.y) ** 2);
    const isClose = dist < 80;
    const p = paramsRef.current;

    if (isClose) {
      correctRef.current += 1;
      streakRef.current += 1;
      setStreak(streakRef.current);
      const precisionBonus = dist < 30 ? 40 : 0;
      const speedBonus = 30;
      const mult = 1 + streakRef.current * 0.25;
      const pts = Math.round((100 + precisionBonus + speedBonus) * mult);
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setFeedback('correct');
      updateDifficulty('signal-noise', true);
      success();
      tapMedium();
      scorePulse.value = withSequence(
        withSpring(1.22, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );
      floatIdRef.current += 1;
      const fid = floatIdRef.current;
      setFloatScores(prev => [...prev, { id: fid, x: tapX, y: tapY, points: pts }]);
      setTimeout(() => {
        if (!cancelledRef.current) {
          setFloatScores(prev => prev.filter(f => f.id !== fid));
        }
      }, 1200);
      burstCorrect({ x: tapX, y: tapY });
    } else {
      setFeedback('wrong');
      streakRef.current = 0;
      setStreak(0);
      updateDifficulty('signal-noise', false);
      hapticError();
      rootShake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      burstWrong({ x: tapX, y: tapY });
    }

    feedbackTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setFeedback(null);
      setChangePos(null);
      changePosRef.current = null;
      if (roundRef.current < p.totalChanges) {
        scheduleChange();
      } else {
        const acc = p.totalChanges > 0 ? correctRef.current / p.totalChanges : 1;
        onCompleteRef.current(scoreRef.current, acc);
      }
    }, 600);
  }, [scheduleChange]);

  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }],
  }));

  const isWatching = waitingRef.current && !feedback;
  const progress = round / params.totalChanges;

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      <LinearGradient
        colors={['#0A101C', '#070C16', '#040810']}
        style={StyleSheet.absoluteFillObject}
      />
      <FloatingParticles count={6} color="rgba(107,168,224,0.3)" />

      <FeedbackBurst {...burstFeedback} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>SCAN</Text>
          <Text style={styles.pillText}>{round}<Text style={styles.pillTextDim}>/{params.totalChanges}</Text></Text>
        </View>
        <Animated.View style={scorePulseStyle}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreLabel}>POINTS</Text>
        </Animated.View>
        <View style={styles.streakSlot}>
          {streak > 2 && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.streakPill}>
              <Text style={styles.streakText}>{streak}×</Text>
              <Text style={styles.streakLabel}>STREAK</Text>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <LinearGradient
          colors={['#5CAAC9', '#4A90D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]}
        />
      </View>

      {/* Scene */}
      <View style={styles.sceneFrame}>
        {/* Corner brackets — surveillance scope feel */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        <Pressable
          style={styles.scene}
          onPress={(e) => handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        >
          <LinearGradient
            colors={['#10141F', '#0A0E18']}
            style={StyleSheet.absoluteFillObject}
          />

          {isWatching && <ScanReticle />}

          {shapes.map(shape => {
            const borderR = shape.shapeType === 'circle' ? shape.r
              : shape.shapeType === 'rounded' ? shape.r * 0.3
              : 4;
            return (
              <View
                key={shape.id}
                style={[styles.shape, {
                  left: shape.x - shape.r,
                  top: shape.y - shape.r,
                  width: shape.r * 2,
                  height: shape.r * 2,
                  borderRadius: borderR,
                  backgroundColor: shape.color,
                  opacity: shape.opacity,
                  shadowColor: shape.color,
                }]}
              />
            );
          })}

          {feedback === 'correct' && changePos && (
            <Animated.View
              entering={FadeIn.duration(120)}
              exiting={FadeOut.duration(220)}
              style={[styles.correctRipple, { left: changePos.x - 40, top: changePos.y - 40 }]}
            />
          )}

          {feedback === 'missed' && changePos && (
            <MissedPulse x={changePos.x} y={changePos.y} />
          )}

          {floatScores.map(f => (
            <FloatScore key={f.id} x={f.x} y={f.y} points={f.points} />
          ))}
        </Pressable>
      </View>

      {/* Bottom hint */}
      <View style={styles.bottomSlot}>
        {feedback === 'correct' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.correctText}>
            ✦ Sharp eye
          </Animated.Text>
        )}
        {feedback === 'missed' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.missedText}>
            Too slow — it changed there
          </Animated.Text>
        )}
        {feedback === 'wrong' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.wrongText}>
            Close, but not it
          </Animated.Text>
        )}
        {!feedback && round === 0 && (
          <Text style={styles.hintText}>Watch the shapes. Something will change…</Text>
        )}
        {!feedback && round > 0 && (
          <Text style={styles.hintText}>Stay focused. Spot the next change.</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040810',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
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
    gap: 6,
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
  streakSlot: {
    width: 76,
    alignItems: 'flex-end',
  },
  streakPill: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(240,181,66,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.45)',
  },
  streakText: {
    color: C.amber,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  streakLabel: {
    color: C.amber,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Scene frame with corner brackets
  sceneFrame: {
    width: SCENE_SIZE,
    height: SCENE_SIZE,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: 'rgba(107,168,224,0.6)',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 6,
  },
  scene: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(107,168,224,0.18)',
  },
  shape: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  scanReticle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: SCENE_SIZE - 40,
    height: SCENE_SIZE - 40,
    marginLeft: -(SCENE_SIZE - 40) / 2,
    marginTop: -(SCENE_SIZE - 40) / 2,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 1,
    height: '50%',
    backgroundColor: 'rgba(107,168,224,0.3)',
  },
  correctRipple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  missedPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: C.coral,
  },
  floatScore: {
    position: 'absolute',
    color: C.peach,
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  bottomSlot: {
    minHeight: 28,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctText: {
    color: C.green,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(125,211,168,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  missedText: {
    color: C.coral,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  wrongText: {
    color: C.t3,
    fontSize: 13,
    fontWeight: '700',
  },
  hintText: {
    color: C.t3,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
