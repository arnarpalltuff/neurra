import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withSequence, withDelay, FadeIn, FadeOut, FadeInDown, FadeInUp, Easing,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../../constants/colors';
import { ghostKitchenParams, updateDifficulty, getDifficulty } from '../../../utils/difficultyEngine';
import { shuffle } from '../../../utils/arrayUtils';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { selection, success, error as hapticError, tapMedium } from '../../../utils/haptics';

const { width } = Dimensions.get('window');

const INGREDIENTS = [
  { id: 'tomato', emoji: '🍅', label: 'Tomato' },
  { id: 'bread', emoji: '🍞', label: 'Bread' },
  { id: 'cheese', emoji: '🧀', label: 'Cheese' },
  { id: 'lettuce', emoji: '🥬', label: 'Lettuce' },
  { id: 'pepper', emoji: '🫑', label: 'Pepper' },
  { id: 'onion', emoji: '🧅', label: 'Onion' },
  { id: 'mushroom', emoji: '🍄', label: 'Mushroom' },
  { id: 'egg', emoji: '🥚', label: 'Egg' },
  { id: 'avocado', emoji: '🥑', label: 'Avocado' },
  { id: 'carrot', emoji: '🥕', label: 'Carrot' },
  { id: 'potato', emoji: '🥔', label: 'Potato' },
  { id: 'corn', emoji: '🌽', label: 'Corn' },
];

interface GhostKitchenProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
  isOnboarding?: boolean;
}

type Phase = 'showing' | 'recall' | 'result';

// ─────────────────────────────────────────────────────────────
// Tray button — pressable card with spring scale
// ─────────────────────────────────────────────────────────────
function TrayButton({
  emoji, label, done, onPress,
}: {
  emoji: string;
  label: string;
  done: boolean;
  onPress: (x: number, y: number) => void;
}) {
  const press = useSharedValue(1);
  const handlePressIn = () => {
    press.value = withSpring(0.92, { damping: 12, stiffness: 240 });
  };
  const handlePressOut = () => {
    press.value = withSpring(1, { damping: 8, stiffness: 200 });
  };
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={(e) => onPress(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        disabled={done}
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.trayItem,
          done && styles.trayItemDone,
          pressed && !done && styles.trayItemPressed,
        ]}
      >
        <LinearGradient
          colors={done ? ['rgba(125,211,168,0.18)', 'rgba(125,211,168,0.05)'] : ['#1A1F2E', '#10131F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={[styles.ingredientEmoji, done && { opacity: 0.32 }]}>{emoji}</Text>
        <Text style={[styles.ingredientLabel, done && { opacity: 0.32 }]}>{label}</Text>
        {done && (
          <View style={styles.doneCheck}>
            <Text style={styles.doneCheckText}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Steam puff drifting upward in background
// ─────────────────────────────────────────────────────────────
function SteamPuff({ index }: { index: number }) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const left = useMemo(() => 20 + Math.random() * (width - 40), []);
  const dur = useMemo(() => 6000 + Math.random() * 4000, []);
  const delay = useMemo(() => index * 1500 + Math.random() * 2000, [index]);
  const size = useMemo(() => 80 + Math.random() * 60, []);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(-200, { duration: dur, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.08, { duration: dur * 0.3 }),
          withTiming(0.04, { duration: dur * 0.4 }),
          withTiming(0, { duration: dur * 0.3 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left,
          bottom: -50,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFE8B0',
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Float "+N" score text
// ─────────────────────────────────────────────────────────────
function FloatScore({ points }: { points: number }) {
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
      { translateY: interpolate(rise.value, [0, 1], [0, -80]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.6, 1.2, 1]) },
    ],
  }));
  return (
    <Animated.Text style={[styles.floatScore, style]} pointerEvents="none">
      +{points}
    </Animated.Text>
  );
}

export default function GhostKitchen({ onComplete, initialLevel = 1, isOnboarding = false }: GhostKitchenProps) {
  const [phase, setPhase] = useState<Phase>('showing');
  const [order, setOrder] = useState<typeof INGREDIENTS>([]);
  const [tray, setTray] = useState<typeof INGREDIENTS>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(isOnboarding ? 4 : 8);
  const [score, setScore] = useState(0);
  const [showTimer, setShowTimer] = useState(0);
  const [showTimerMax, setShowTimerMax] = useState(3);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [floatScores, setFloatScores] = useState<{ id: number; points: number }[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);
  const roundStartTime = useRef(Date.now());
  const scoreRef = useRef(0);
  const correctCountRef = useRef(0);
  const totalAttemptsRef = useRef(0);
  const floatIdRef = useRef(0);
  const { feedback, fireCorrect, fireWrong } = useGameFeedback();
  const lastTapPos = useRef({ x: width / 2, y: 300 });

  // Animation primitives
  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);
  const headerScale = useSharedValue(1);

  const generateRound = useCallback((currentRound: number) => {
    const lvl = Math.max(initialLevel, getDifficulty('ghost-kitchen').level);
    const p = ghostKitchenParams(lvl + currentRound * 0.3);
    const shuffled = shuffle(INGREDIENTS);
    const orderItems = shuffled.slice(0, p.numIngredients);
    const distractors = shuffled.slice(p.numIngredients, p.numIngredients + p.numDistractors);
    const trayItems = shuffle([...orderItems, ...distractors]);
    setOrder(orderItems);
    setTray(trayItems);
    setSelected([]);
    setPhase('showing');

    const maxSecs = Math.floor(p.displayTime / 1000);
    let remaining = maxSecs;
    setShowTimerMax(maxSecs);
    setShowTimer(remaining);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (cancelledRef.current) { clearInterval(timerRef.current!); return; }
      remaining -= 1;
      setShowTimer(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setPhase('recall');
      }
    }, 1000);
  }, [initialLevel]);

  useEffect(() => {
    cancelledRef.current = false;
    generateRound(round);
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleIngredientTap = (ingredientId: string, tapX?: number, tapY?: number) => {
    if (phase !== 'recall') return;
    const expectedIndex = selected.length;
    const expectedId = order[expectedIndex]?.id;
    const isCorrect = ingredientId === expectedId;

    const pos = { x: tapX ?? lastTapPos.current.x, y: tapY ?? lastTapPos.current.y };
    lastTapPos.current = pos;
    if (isCorrect) {
      fireCorrect(pos);
    } else {
      fireWrong(pos);
    }
    setLastCorrect(isCorrect);
    totalAttemptsRef.current += 1;

    updateDifficulty('ghost-kitchen', isCorrect);

    if (isCorrect) {
      const newSelected = [...selected, ingredientId];
      setSelected(newSelected);
      correctCountRef.current += 1;

      const newConsec = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsec);
      const mult = Math.min(1 + Math.floor(newConsec / 2) * 0.5, 3);
      setComboMultiplier(mult);

      const elapsed = (Date.now() - roundStartTime.current) / 1000;
      const speedBonus = Math.max(0, 50 - Math.floor(elapsed * 5));
      const points = Math.round((100 + speedBonus) * mult);
      scoreRef.current += points;
      setScore(scoreRef.current);

      success();
      tapMedium();

      // Score pulse + float text
      scorePulse.value = withSequence(
        withSpring(1.22, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );
      floatIdRef.current += 1;
      const fid = floatIdRef.current;
      setFloatScores(prev => [...prev, { id: fid, points }]);
      setTimeout(() => {
        if (!cancelledRef.current) {
          setFloatScores(prev => prev.filter(f => f.id !== fid));
        }
      }, 1200);

      if (newSelected.length === order.length) {
        // Round complete
        headerScale.value = withSequence(
          withSpring(1.08, { damping: 6 }),
          withSpring(1, { damping: 10 }),
        );
        setTimeout(() => {
          if (cancelledRef.current) return;
          if (round >= totalRounds) {
            const accuracy = totalAttemptsRef.current > 0 ? correctCountRef.current / totalAttemptsRef.current : 0;
            onComplete(scoreRef.current, accuracy);
          } else {
            setRound(prev => prev + 1);
            roundStartTime.current = Date.now();
            generateRound(round + 1);
          }
        }, 600);
      }
    } else {
      setConsecutiveCorrect(0);
      setComboMultiplier(prev => Math.max(1, prev - 0.5));
      hapticError();
      rootShake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }

    setTimeout(() => { if (!cancelledRef.current) setLastCorrect(null); }, 500);
  };

  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }],
  }));
  const headerScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const showProgress = showTimer / Math.max(1, showTimerMax);

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      {/* Background layers */}
      <LinearGradient
        colors={['#1A0E12', '#120A18', '#080510']}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(240,181,66,0.10)', 'rgba(0,0,0,0)']}
        style={styles.topGlow}
        pointerEvents="none"
      />
      {[0, 1, 2, 3].map(i => <SteamPuff key={i} index={i} />)}
      <FloatingParticles count={6} color="rgba(240,181,66,0.3)" />

      <FeedbackBurst {...feedback} />

      {/* ── Header ─────────────────────────────────── */}
      <Animated.View style={[styles.header, headerScaleStyle]}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>ORDER</Text>
          <Text style={styles.pillText}>{round}<Text style={styles.pillTextDim}>/{totalRounds}</Text></Text>
        </View>
        <Animated.View style={scorePulseStyle}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreLabel}>POINTS</Text>
        </Animated.View>
        <View style={styles.comboSlot}>
          {comboMultiplier > 1 && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.comboPill}>
              <Text style={styles.comboText}>{comboMultiplier}×</Text>
              <Text style={styles.comboLabel}>COMBO</Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* ── Phase: Showing ─────────────────────────── */}
      {phase === 'showing' && (
        <Animated.View
          key={`show-${round}`}
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(180)}
          style={styles.orderArea}
        >
          <View style={styles.ticketHeader}>
            <View style={styles.ticketStripe} />
            <Text style={styles.ticketTitle}>TICKET</Text>
            <Text style={styles.ticketSubtitle}>Memorize the order</Text>
            <View style={styles.ticketStripe} />
          </View>

          <View style={styles.orderRow}>
            {order.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(i * 90).duration(280)}
                style={styles.orderCard}
              >
                <LinearGradient
                  colors={['rgba(255,232,176,0.12)', 'rgba(255,232,176,0.04)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.orderCardNum}>{i + 1}</Text>
                <Text style={styles.orderCardEmoji}>{item.emoji}</Text>
                <Text style={styles.orderCardLabel}>{item.label}</Text>
              </Animated.View>
            ))}
          </View>

          <View style={styles.timerBarBig}>
            <LinearGradient
              colors={['#F0B542', '#E09B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.timerBarFill, { width: `${Math.max(0, showProgress * 100)}%` }]}
            />
          </View>
          <Text style={styles.timerBigText}>{showTimer}<Text style={styles.timerBigUnit}>s</Text></Text>
        </Animated.View>
      )}

      {/* ── Phase: Recall ──────────────────────────── */}
      {phase === 'recall' && (
        <Animated.View entering={FadeIn.duration(220)} style={styles.recallArea}>
          <Text style={styles.phaseLabel}>TAP IN ORDER</Text>

          <View style={styles.progressDots}>
            {order.map((item, i) => {
              const isFilled = i < selected.length;
              const isActive = i === selected.length;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.dotWrap,
                    isActive && styles.dotWrapActive,
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      isFilled && styles.dotFilled,
                      isActive && styles.dotActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dotNum,
                        (isFilled || isActive) && styles.dotNumOn,
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.trayGrid}>
            {tray.map((item) => {
              const isDone = selected.includes(item.id);
              return (
                <TrayButton
                  key={item.id}
                  emoji={item.emoji}
                  label={item.label}
                  done={isDone}
                  onPress={(x, y) => handleIngredientTap(item.id, x, y)}
                />
              );
            })}
          </View>

          {floatScores.map(f => (
            <FloatScore key={f.id} points={f.points} />
          ))}

          {lastCorrect === false && (
            <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.wrongText}>
              Not that one — try again
            </Animated.Text>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080510',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
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
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 32,
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
    width: 70,
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

  // Showing phase — ticket
  orderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  ticketHeader: {
    alignItems: 'center',
    gap: 6,
  },
  ticketStripe: {
    width: 80,
    height: 1,
    backgroundColor: 'rgba(240,181,66,0.4)',
  },
  ticketTitle: {
    color: C.amber,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 6,
  },
  ticketSubtitle: {
    color: C.t2,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  orderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: width - 40,
  },
  orderCard: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.3)',
    overflow: 'hidden',
    position: 'relative',
  },
  orderCardNum: {
    position: 'absolute',
    top: 4,
    left: 8,
    color: C.amber,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  orderCardEmoji: {
    fontSize: 36,
  },
  orderCardLabel: {
    color: '#FFE8B0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timerBarBig: {
    width: '70%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timerBigText: {
    color: C.amber,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 40,
    textShadowColor: 'rgba(240,181,66,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  timerBigUnit: {
    color: C.t3,
    fontSize: 16,
    fontWeight: '800',
  },

  // Recall phase
  recallArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    gap: 18,
  },
  phaseLabel: {
    color: C.t2,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dotWrap: {
    padding: 2,
    borderRadius: 999,
  },
  dotWrapActive: {},
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    backgroundColor: 'rgba(125,211,168,0.22)',
    borderColor: C.green,
  },
  dotActive: {
    borderColor: C.amber,
    backgroundColor: 'rgba(240,181,66,0.15)',
  },
  dotNum: {
    color: C.t3,
    fontSize: 11,
    fontWeight: '900',
  },
  dotNumOn: {
    color: C.t1,
  },

  trayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    maxWidth: width - 40,
  },
  trayItem: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  trayItemPressed: {
    borderColor: 'rgba(240,181,66,0.45)',
  },
  trayItemDone: {
    borderColor: C.green,
  },
  doneCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheckText: {
    color: '#08120A',
    fontSize: 10,
    fontWeight: '900',
  },
  ingredientEmoji: {
    fontSize: 32,
  },
  ingredientLabel: {
    color: C.t1,
    fontSize: 11,
    fontWeight: '700',
  },

  floatScore: {
    position: 'absolute',
    bottom: 200,
    alignSelf: 'center',
    color: C.peach,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  wrongText: {
    color: C.coral,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 8,
  },
});
