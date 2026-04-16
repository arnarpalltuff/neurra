import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, withDelay, withSpring, Easing, FadeIn, FadeOut, FadeInDown,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Rect, Polygon, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { C } from '../../../constants/colors';
import { pulseParams, updateDifficulty, getDifficulty } from '../../../utils/difficultyEngine';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { tapMedium, success, error as hapticError, warning as hapticWarning } from '../../../utils/haptics';
import { playCorrect, playWrong, playRoundEnd } from '../../../utils/sound';
import NeuralMapOverlay from '../../ui/NeuralMapOverlay';
import { useNeuralMap } from '../../../hooks/useNeuralMap';
import GameIntro from '../shared/GameIntro';

const { width, height } = Dimensions.get('window');

type ShapeType = 'circle' | 'square' | 'triangle';
type ShapeColor = 'green' | 'red' | 'yellow';

interface PulseProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
  isOnboarding?: boolean;
}

const TOTAL_SHAPES = 30;
const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle'];

// ─────────────────────────────────────────────────────────────
// Expanding sonar ring — multiple concentric rings pulsing outward
// ─────────────────────────────────────────────────────────────
function SonarRing({
  color,
  delay = 0,
  intervalMs,
}: {
  color: string;
  delay?: number;
  intervalMs: number;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = 0;
    p.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: intervalMs * 1.8, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [intervalMs, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.2, 1], [0, 0.55, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(p.value, [0, 1], [0.6, 1.6]) }],
  }));

  return (
    <Animated.View
      style={[
        styles.sonarRing,
        { borderColor: color, shadowColor: color },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// ECG-style horizontal line in the background
// ─────────────────────────────────────────────────────────────
function HeartbeatLine() {
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 4500, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sweep.value, [0, 1], [-width * 0.5, width * 0.5]) }],
    opacity: interpolate(sweep.value, [0, 0.1, 0.9, 1], [0, 0.5, 0.5, 0]),
  }));
  return (
    <Animated.View style={[styles.heartbeat, style]} pointerEvents="none">
      <View style={[styles.heartbeatDot, { left: 0 }]} />
      <View style={[styles.heartbeatDot, { left: 18, backgroundColor: 'rgba(125,211,168,0.55)' }]} />
      <View style={[styles.heartbeatDot, { left: 36 }]} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Shape renderer using SVG with gradient fill
// ─────────────────────────────────────────────────────────────
function GameShape({ type, color }: { type: ShapeType; color: ShapeColor }) {
  const palette = useMemo(() => {
    if (color === 'green') return { light: '#A8F0C6', dark: '#4FB880', shadow: 'rgba(125,211,168,0.8)' };
    if (color === 'red') return { light: '#FFA0AC', dark: '#C94B5C', shadow: 'rgba(232,112,126,0.8)' };
    return { light: '#FFD98A', dark: '#C4893A', shadow: 'rgba(240,181,66,0.8)' };
  }, [color]);

  const gradId = `shape-${color}`;

  return (
    <View
      style={{
        shadowColor: palette.shadow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 28,
        elevation: 12,
      }}
    >
      <Svg width={120} height={120}>
        <Defs>
          <SvgGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={palette.light} stopOpacity="1" />
            <Stop offset="100%" stopColor={palette.dark} stopOpacity="1" />
          </SvgGradient>
        </Defs>
        {type === 'circle' && (
          <Circle cx={60} cy={60} r={52} fill={`url(#${gradId})`} />
        )}
        {type === 'square' && (
          <Rect x={10} y={10} width={100} height={100} rx={18} ry={18} fill={`url(#${gradId})`} />
        )}
        {type === 'triangle' && (
          <Polygon points="60,8 112,108 8,108" fill={`url(#${gradId})`} />
        )}
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Life orb — glowing circle that fades/cracks when lost
// ─────────────────────────────────────────────────────────────
function LifeOrb({ alive, index }: { alive: boolean; index: number }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (alive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 900 + index * 120, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 900 + index * 120, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(0.85, { duration: 300 });
    }
  }, [alive]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.lifeOrb, !alive && styles.lifeOrbDead, style]}>
      <View
        style={[
          styles.lifeOrbCore,
          {
            backgroundColor: alive ? '#E8707E' : 'rgba(232,112,126,0.15)',
            shadowColor: alive ? '#E8707E' : 'transparent',
          },
        ]}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Main game
// ─────────────────────────────────────────────────────────────
export default function Pulse({ onComplete, initialLevel = 1, isOnboarding = false }: PulseProps) {
  const [score, setScore] = useState(0);
  const [_introShown, _setIntroShown] = React.useState(false);
  const [currentShape, setCurrentShape] = useState<{ color: ShapeColor; type: ShapeType; id: number } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [rule, setRule] = useState<'tap_green' | 'tap_red'>('tap_green');
  const [ruleAnnounced, setRuleAnnounced] = useState(false);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [missed, setMissed] = useState(false);
  const [lives, setLives] = useState(3);
  const [floatScores, setFloatScores] = useState<{ id: number; points: number }[]>([]);

  const shapeIdRef = useRef(0);
  const livesRef = useRef(3);
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
  const floatIdRef = useRef(0);

  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const neural = useNeuralMap('pulse');

  const coreBeat = useSharedValue(1);
  const shapeScale = useSharedValue(0);
  const shapeOpacity = useSharedValue(0);
  const bgFlash = useSharedValue(0);
  const correctRing = useSharedValue(0);
  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);
  const switchFlash = useSharedValue(0);

  const diff = getDifficulty('pulse', 0);
  const params = pulseParams(Math.max(initialLevel, diff.level));
  const intervalMs = Math.round(60000 / params.bpm);
  const total = isOnboarding ? 12 : TOTAL_SHAPES;

  // Core rhythmic beat — drives the center dot
  useEffect(() => {
    coreBeat.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: intervalMs * 0.45, easing: Easing.out(Easing.sin) }),
        withTiming(1.0, { duration: intervalMs * 0.55, easing: Easing.in(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [intervalMs]);

  const nextShape = useCallback(() => {
    const id = ++shapeIdRef.current;
    countRef.current += 1;

    if (params.hasReverse && countRef.current > 0 && countRef.current % 8 === 0) {
      const newRule = ruleRef.current === 'tap_green' ? 'tap_red' : 'tap_green';
      ruleRef.current = newRule;
      setRule(newRule);
      setRuleAnnounced(true);
      switchFlash.value = withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 500 }),
      );
      hapticWarning();
      setTimeout(() => { if (!cancelledRef.current) setRuleAnnounced(false); }, 1400);
    }

    const rand = Math.random();
    const color: ShapeColor = rand < 0.70 ? 'green' : rand < 0.90 ? 'red' : 'yellow';
    const type = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];

    tappedRef.current = false;
    setMissed(false);
    setCurrentShape({ color, type, id });

    shapeScale.value = 0;
    shapeOpacity.value = 0;
    shapeScale.value = withSequence(
      withTiming(1.18, { duration: 140, easing: Easing.out(Easing.back(2.5)) }),
      withTiming(1, { duration: 100 }),
    );
    shapeOpacity.value = withTiming(1, { duration: 120 });

    if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    shapeTimeoutRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      shapeOpacity.value = withTiming(0, { duration: 150 });
      shapeScale.value = withTiming(0.7, { duration: 150 });

      if (!tappedRef.current) {
        const shouldTap = ruleRef.current === 'tap_green' ? color === 'green' : color === 'red';
        if (shouldTap) {
          setMissed(true);
          attemptsRef.current += 1;
          updateDifficulty('pulse', false);
          setPerfectStreak(0);
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            setCurrentShape(null);
            finishGame();
            return;
          }
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
      setFeedback('correct');
      floatIdRef.current += 1;
      const fid = floatIdRef.current;
      setFloatScores(prev => [...prev, { id: fid, points: pts }]);
      setTimeout(() => {
        if (!cancelledRef.current) {
          setFloatScores(prev => prev.filter(f => f.id !== fid));
        }
      }, 1200);
      correctRing.value = 0;
      correctRing.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      scorePulse.value = withSequence(
        withSpring(1.25, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );
      success();
      tapMedium();
      playCorrect(); neural.onCorrectAnswer(); burstCorrect({ x: width / 2, y: height / 2 });
      updateDifficulty('pulse', true);
    } else {
      setPerfectStreak(0);
      setFeedback('wrong');
      bgFlash.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 240 }),
      );
      rootShake.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      hapticError();
      playWrong(); neural.onWrongAnswer(); burstWrong({ x: width / 2, y: height / 2 });
      updateDifficulty('pulse', false);
      livesRef.current -= 1;
      setLives(livesRef.current);
      if (livesRef.current <= 0) {
        setTimeout(() => { if (!cancelledRef.current) finishGame(); }, 300);
      }
    }

    shapeScale.value = withSequence(
      withTiming(1.35, { duration: 80 }),
      withTiming(0, { duration: 170 }),
    );
    shapeOpacity.value = withTiming(0, { duration: 200 });

    setTimeout(() => {
      if (cancelledRef.current) return;
      setFeedback(null);
      setCurrentShape(null);
    }, 260);
  }, [currentShape, perfectStreak]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreBeat.value }],
  }));
  const shapeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shapeScale.value }],
    opacity: shapeOpacity.value,
  }));
  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgFlash.value * 0.22,
  }));
  const correctRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(correctRing.value, [0, 0.1, 1], [0, 0.9, 0]),
    transform: [{ scale: interpolate(correctRing.value, [0, 1], [0.6, 2.2]) }],
  }));
  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }],
  }));
  const switchFlashStyle = useAnimatedStyle(() => ({
    opacity: switchFlash.value * 0.35,
  }));

  const activeColor = ruleRef.current === 'tap_green' ? C.green : C.coral;
  const progress = countRef.current / total;
  const comboActive = perfectStreak >= 5;

  return (
    <Pressable onPress={handleTap} style={{ flex: 1 }}>
      <Animated.View style={[styles.container, rootStyle]}>
        {/* ── Background layers ──────────────────────── */}
        <LinearGradient
          colors={['#0A1220', '#07101C', '#050A14']}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={['rgba(107,168,224,0.08)', 'rgba(0,0,0,0)']}
          style={styles.topGlow}
          pointerEvents="none"
        />
        <FloatingParticles count={8} color="rgba(107,168,224,0.4)" />
        <HeartbeatLine />

        {/* Wrong-flash overlay */}
        <Animated.View style={[styles.flashOverlay, bgStyle]} pointerEvents="none" />
        {/* Switch-flash overlay */}
        <Animated.View
          style={[styles.flashOverlay, switchFlashStyle, { backgroundColor: C.amber }]}
          pointerEvents="none"
        />

        <FeedbackBurst {...burstFeedback} />

      <NeuralMapOverlay activeAreas={neural.activeAreas} pulseArea={neural.pulseArea} intensity={neural.intensity} />

        {/* ── Rule pill ──────────────────────────────── */}
        <View style={styles.rulePillWrap}>
          {ruleAnnounced ? (
            <Animated.View
              entering={FadeInDown.duration(180)}
              exiting={FadeOut.duration(220)}
              style={[styles.rulePill, { borderColor: C.amber, backgroundColor: 'rgba(240,181,66,0.15)' }]}
            >
              <Text style={[styles.rulePillLabel, { color: C.amber }]}>RULE SWITCH</Text>
              <Text style={[styles.rulePillText, { color: C.amber }]}>
                Now tap {ruleRef.current === 'tap_green' ? 'GREEN' : 'RED'}
              </Text>
            </Animated.View>
          ) : (
            <View
              style={[
                styles.rulePill,
                {
                  borderColor: activeColor,
                  backgroundColor: ruleRef.current === 'tap_green'
                    ? 'rgba(110,207,154,0.12)'
                    : 'rgba(232,112,126,0.12)',
                },
              ]}
            >
              <View style={[styles.rulePillDot, { backgroundColor: activeColor, shadowColor: activeColor }]} />
              <Text style={styles.rulePillLabel}>TAP</Text>
              <Text style={[styles.rulePillText, { color: activeColor }]}>
                {ruleRef.current === 'tap_green' ? 'GREEN' : 'RED'}
              </Text>
            </View>
          )}
        </View>

        {/* ── Stats row ──────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.livesRow}>
            {[0, 1, 2].map(i => (
              <LifeOrb key={i} alive={i < lives} index={i} />
            ))}
          </View>
          <Animated.View style={scorePulseStyle}>
            <Text style={styles.scoreText}>{score}</Text>
            <Text style={styles.scoreLabel}>SCORE</Text>
          </Animated.View>
          <View style={styles.comboSlot}>
            {comboActive && (
              <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.comboPill}>
                <Text style={styles.comboText}>{perfectStreak}×</Text>
                <Text style={styles.comboLabel}>COMBO</Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* ── Progress bar ───────────────────────────── */}
        <View style={styles.progressBar}>
          <LinearGradient
            colors={[activeColor, activeColor + '80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]}
          />
          <Text style={styles.progressCount}>{countRef.current} / {total}</Text>
        </View>

        {/* ── Center: sonar + shape ──────────────────── */}
        <View style={styles.center}>
          {/* Sonar rings (multi-layer, phased) */}
          <SonarRing color={activeColor} intervalMs={intervalMs} delay={0} />
          <SonarRing color={activeColor} intervalMs={intervalMs} delay={intervalMs * 0.4} />
          <SonarRing color={activeColor} intervalMs={intervalMs} delay={intervalMs * 0.8} />

          {/* Correct-tap ring burst */}
          <Animated.View
            style={[styles.correctBurstRing, { borderColor: C.green, shadowColor: C.green }, correctRingStyle]}
            pointerEvents="none"
          />

          {/* Core beating dot */}
          <Animated.View style={[styles.coreBeat, coreStyle, { shadowColor: activeColor }]}>
            <LinearGradient
              colors={[activeColor, '#0A1220']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Shape */}
          {currentShape && (
            <Animated.View style={[styles.shapeContainer, shapeStyle]}>
              <GameShape type={currentShape.type} color={currentShape.color} />
            </Animated.View>
          )}

          {/* Floating score texts */}
          {floatScores.map(f => (
            <FloatScore key={f.id} points={f.points} />
          ))}

          {feedback === 'correct' && (
            <Animated.Text entering={FadeIn.duration(120)} exiting={FadeOut.duration(220)} style={styles.correctCheck}>
              ✓
            </Animated.Text>
          )}
        </View>

        {/* ── Bottom hints ───────────────────────────── */}
        <View style={styles.bottomSlot}>
          {missed ? (
            <Animated.Text entering={FadeIn.duration(150)} exiting={FadeOut.duration(200)} style={styles.missedText}>
              Too slow!
            </Animated.Text>
          ) : (
            <Text style={styles.tapHint}>
              {lives === 3 ? 'Tap anywhere when you see the right color'
                : lives === 2 ? '2 lives left — stay sharp'
                : 'Last life — focus!'}
            </Text>
          )}
        </View>
      {!_introShown && <GameIntro name="Pulse" subtitle="Tap green · resist red" accentColor={C.blue} onDone={() => _setIntroShown(true)} />}
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Floating "+N" score text rising from center
// ─────────────────────────────────────────────────────────────
function FloatScore({ points }: { points: number }) {
  const rise = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    rise.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    fade.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(350, withTiming(0, { duration: 500 })),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateY: interpolate(rise.value, [0, 1], [0, -100]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.6, 1.2, 1]) },
    ],
  }));
  return (
    <Animated.Text style={[styles.floatScore, style]} pointerEvents="none">
      +{points}
    </Animated.Text>

  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#050A14',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  heartbeat: {
    position: 'absolute',
    top: '52%',
    left: 0,
    width: 60,
    height: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartbeatDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(107,168,224,0.45)',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.coral,
  },

  // Rule pill
  rulePillWrap: {
    alignItems: 'center',
    minHeight: 46,
    marginTop: 4,
  },
  rulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  rulePillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  rulePillLabel: {
    color: C.t3,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rulePillText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Stats row
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  livesRow: {
    flexDirection: 'row',
    gap: 7,
    width: 78,
  },
  lifeOrb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifeOrbDead: {
    opacity: 0.3,
  },
  lifeOrbCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  scoreText: {
    color: C.peach,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
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
  comboSlot: {
    width: 78,
    alignItems: 'flex-end',
  },
  comboPill: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(240,181,66,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.45)',
  },
  comboText: {
    color: C.amber,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  comboLabel: {
    color: C.amber,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // Progress
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressCount: {
    position: 'absolute',
    right: 8,
    top: -16,
    color: C.t3,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // Center
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  sonarRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  correctBurstRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  coreBeat: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 10,
  },
  shapeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctCheck: {
    position: 'absolute',
    fontSize: 50,
    color: C.green,
    fontWeight: '900',
    textShadowColor: 'rgba(125,211,168,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  floatScore: {
    position: 'absolute',
    color: C.peach,
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // Bottom
  bottomSlot: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  missedText: {
    color: C.coral,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tapHint: {
    color: C.t3,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
