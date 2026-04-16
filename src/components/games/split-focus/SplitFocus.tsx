import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  FadeIn, FadeOut, useSharedValue, useAnimatedStyle,
  withSpring, withSequence, withTiming, withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { updateDifficulty, getDifficulty, splitFocusParams, isRelaxedMode } from '../../../utils/difficultyEngine';
import { shuffle } from '../../../utils/arrayUtils';
import { selection, success, error as hapticError, tapMedium } from '../../../utils/haptics';
import { playCorrect, playWrong, playRoundEnd } from '../../../utils/sound';
import NeuralMapOverlay from '../../ui/NeuralMapOverlay';
import { useNeuralMap } from '../../../hooks/useNeuralMap';
import GameIntro from '../shared/GameIntro';

const { width: W } = Dimensions.get('window');

interface SplitFocusProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type TaskColor = 'red' | 'blue' | 'green' | 'yellow';
const TASK_COLORS: Record<TaskColor, string> = {
  red: '#E87C8A', blue: '#7CB8E8', green: '#7DD3A8', yellow: '#FBBF24',
};
const TASK_COLORS_LIGHT: Record<TaskColor, string> = {
  red: '#FFC2CB', blue: '#C2DEFF', green: '#B7F0CE', yellow: '#FFE08A',
};
const COLOR_NAMES: TaskColor[] = ['red', 'blue', 'green', 'yellow'];

interface ColorPrompt {
  targetColor: TaskColor;
  options: TaskColor[];
  id: number;
}

interface NumberCell {
  value: number;
  x: number;
  y: number;
  tapped: boolean;
}

function generateColorPrompt(id: number): ColorPrompt {
  const target = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  const others = shuffle(COLOR_NAMES.filter(c => c !== target)).slice(0, 2);
  const options = shuffle([target, ...others]);
  return { targetColor: target, options, id };
}

function generateNumberGrid(count: number): NumberCell[] {
  const gridW = W - 60;
  const gridH = 180;
  const cols = Math.min(count, 4);
  const rows = Math.ceil(count / cols);
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  const numbers = Array.from({ length: count }, (_, i) => i + 1);
  const shuffled = shuffle(numbers);

  return shuffled.map((value, i) => ({
    value,
    x: (i % cols) * cellW + cellW / 2,
    y: Math.floor(i / cols) * cellH + cellH / 2,
    tapped: false,
  }));
}

const TOTAL_ROUNDS = 8;

// Float score
function FloatScore({ x, y, points, color }: { x: number; y: number; points: number; color: string }) {
  const rise = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    rise.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    fade.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(300, withTiming(0, { duration: 450 })),
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
      style={[styles.floatScore, { left: x - 20, top: y - 20, color }, style]}
      pointerEvents="none"
    >
      +{points}
    </Animated.Text>
  );
}

// Color button with press spring
function ColorButton({
  color, disabled, onPress,
}: {
  color: TaskColor;
  disabled: boolean;
  onPress: () => void;
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
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.colorBtn,
          {
            backgroundColor: TASK_COLORS[color],
            shadowColor: TASK_COLORS[color],
          },
          disabled && styles.colorBtnDisabled,
        ]}
      >
        <View style={[styles.colorBtnHighlight, { backgroundColor: TASK_COLORS_LIGHT[color] }]} />
      </Pressable>
    </Animated.View>
  );
}

export default function SplitFocus({ onComplete, initialLevel = 1 }: SplitFocusProps) {
  const diff = getDifficulty('split-focus', 0);
  const level = Math.max(initialLevel, diff.level);
  const { numberCount, colorTimeMs } = splitFocusParams(level);
  const relaxed = isRelaxedMode();

  const [round, setRound] = useState(1);
  const [_introShown, _setIntroShown] = React.useState(false);
  const [score, setScore] = useState(0);

  const [colorPrompt, setColorPrompt] = useState<ColorPrompt>(() => generateColorPrompt(1));
  const [colorFeedback, setColorFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [colorDone, setColorDone] = useState(false);
  const colorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [numbers, setNumbers] = useState<NumberCell[]>(() => generateNumberGrid(numberCount));
  const [nextExpected, setNextExpected] = useState(1);
  const [numberFeedback, setNumberFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [numberDone, setNumberDone] = useState(false);

  const [floatScores, setFloatScores] = useState<{ id: number; x: number; y: number; points: number; color: string }[]>([]);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const cancelledRef = useRef(false);
  const floatIdRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const neural = useNeuralMap('split-focus');

  const flashScale = useSharedValue(1);
  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);

  const flashStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flashScale.value }],
  }));
  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }],
  }));

  useEffect(() => {
    cancelledRef.current = false;
    if (colorDone) return;
    if (relaxed) return;
    colorTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      if (!colorDone) {
        setColorFeedback('wrong');
        setColorDone(true);
        attemptsRef.current++;
        updateDifficulty('split-focus', false);
        setTimeout(() => { if (!cancelledRef.current) setColorFeedback(null); }, 400);
      }
    }, colorTimeMs);

    return () => {
      cancelledRef.current = true;

      if (colorTimerRef.current) clearTimeout(colorTimerRef.current);
    };
  }, [colorPrompt.id, colorDone, relaxed, colorTimeMs]);

  useEffect(() => {
    if (colorDone && numberDone) {
      const timer = setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const accuracy = attemptsRef.current > 0 ? correctRef.current / attemptsRef.current : 0.5;
          onComplete(scoreRef.current, Math.min(1, accuracy));
        } else {
          const nextRound = round + 1;
          const nextCount = Math.min(4 + Math.floor((level + nextRound * 0.3) / 3), 9);
          setRound(nextRound);
          setColorPrompt(generateColorPrompt(nextRound));
          setColorDone(false);
          setColorFeedback(null);
          setNumbers(generateNumberGrid(nextCount));
          setNextExpected(1);
          setNumberDone(false);
          setNumberFeedback(null);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [colorDone, numberDone, round, level, onComplete]);

  const fireFloat = useCallback((x: number, y: number, points: number, color: string) => {
    floatIdRef.current += 1;
    const fid = floatIdRef.current;
    setFloatScores(prev => [...prev, { id: fid, x, y, points, color }]);
    setTimeout(() => {
      if (!cancelledRef.current) {
        setFloatScores(prev => prev.filter(f => f.id !== fid));
      }
    }, 1000);
  }, []);

  const handleColorTap = useCallback((color: TaskColor) => {
    if (colorDone) return;
    if (colorTimerRef.current) clearTimeout(colorTimerRef.current);

    const isCorrect = color === colorPrompt.targetColor;
    const pos = { x: W / 2, y: 200 };
    if (isCorrect) { playCorrect(); neural.onCorrectAnswer(); burstCorrect(pos); } else { playWrong(); neural.onWrongAnswer(); burstWrong(pos); }

    attemptsRef.current++;

    if (isCorrect) {
      correctRef.current++;
      const points = 100;
      scoreRef.current += points;
      setScore(s => s + points);
      updateDifficulty('split-focus', true);
      success();
      tapMedium();
      scorePulse.value = withSequence(
        withSpring(1.2, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );
      fireFloat(pos.x, pos.y, points, TASK_COLORS[color]);
    } else {
      updateDifficulty('split-focus', false);
      hapticError();
      rootShake.value = withSequence(
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-2, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }

    setColorFeedback(isCorrect ? 'correct' : 'wrong');
    setColorDone(true);
    setTimeout(() => { if (!cancelledRef.current) setColorFeedback(null); }, 400);
  }, [colorDone, colorPrompt, fireFloat]);

  const handleNumberTap = useCallback((value: number, x: number, y: number) => {
    if (numberDone) return;

    const isCorrect = value === nextExpected;
    const pos = { x, y };
    if (isCorrect) { playCorrect(); neural.onCorrectAnswer(); burstCorrect(pos); } else { playWrong(); neural.onWrongAnswer(); burstWrong(pos); }

    attemptsRef.current++;

    if (isCorrect) {
      correctRef.current++;
      const points = 50;
      scoreRef.current += points;
      setScore(s => s + points);
      updateDifficulty('split-focus', true);
      tapMedium();
      scorePulse.value = withSequence(
        withSpring(1.15, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );
      fireFloat(x, y, points, '#7CB8E8');

      flashScale.value = withSequence(
        withTiming(1.05, { duration: 80 }),
        withTiming(1, { duration: 80 }),
      );

      setNumbers(prev => prev.map(n => n.value === value ? { ...n, tapped: true } : n));

      const nextVal = nextExpected + 1;
      if (nextVal > numbers.length) {
        setNumberDone(true);
      } else {
        setNextExpected(nextVal);
      }
    } else {
      updateDifficulty('split-focus', false);
      hapticError();
      setNumberFeedback('wrong');
      setTimeout(() => { if (!cancelledRef.current) setNumberFeedback(null); }, 300);
    }
  }, [nextExpected, numberDone, numbers, flashScale, fireFloat]);

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      {/* Two-tone background — warm top, cool bottom */}
      <LinearGradient
        colors={['#1A0E1C', '#0E0814']}
        style={[StyleSheet.absoluteFillObject, { bottom: '52%' }]}
      />
      <LinearGradient
        colors={['#080E1C', '#040810']}
        style={[StyleSheet.absoluteFillObject, { top: '48%' }]}
      />
      <FloatingParticles count={6} color="rgba(168,124,232,0.25)" />

      <FeedbackBurst {...burstFeedback} />

      <NeuralMapOverlay activeAreas={neural.activeAreas} pulseArea={neural.pulseArea} intensity={neural.intensity} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>ROUND</Text>
          <Text style={styles.pillText}>{round}<Text style={styles.pillTextDim}>/{TOTAL_ROUNDS}</Text></Text>
        </View>
        <Animated.View style={scorePulseStyle}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreLabel}>POINTS</Text>
        </Animated.View>
        <View style={{ width: 70 }} />
      </View>

      {/* ── Top: Color Match ────────────────────── */}
      <View style={styles.topTask}>
        <Text style={styles.taskLabel}>COLOR MATCH</Text>

        <View style={[styles.targetSwatch, { borderColor: TASK_COLORS[colorPrompt.targetColor] }]}>
          <LinearGradient
            colors={[TASK_COLORS_LIGHT[colorPrompt.targetColor], TASK_COLORS[colorPrompt.targetColor]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {colorDone && (
            <Animated.Text entering={FadeIn.duration(120)} style={styles.checkMark}>
              {colorFeedback === 'correct' ? '✓' : '✗'}
            </Animated.Text>
          )}
        </View>

        <View style={styles.colorOptions}>
          {colorPrompt.options.map((c) => (
            <ColorButton
              key={c}
              color={c}
              disabled={colorDone}
              onPress={() => handleColorTap(c)}
            />
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.taskDivider}>
        <View style={styles.taskDividerLine} />
        <View style={styles.taskDividerBadge}>
          <Text style={styles.taskDividerText}>DUAL TASK</Text>
        </View>
        <View style={styles.taskDividerLine} />
      </View>

      {/* ── Bottom: Number Sequence ─────────────── */}
      <View style={styles.bottomTask}>
        <View style={styles.bottomLabelRow}>
          <Text style={styles.taskLabel}>SEQUENCE</Text>
          <View style={styles.nextPill}>
            <Text style={styles.nextPillLabel}>NEXT</Text>
            <Text style={styles.nextPillNum}>{nextExpected}</Text>
          </View>
        </View>

        <Animated.View style={[styles.numberGrid, flashStyle]}>
          {numbers.map((n) => {
            const isNext = !n.tapped && n.value === nextExpected;
            return (
              <Pressable
                key={n.value}
                style={[
                  styles.numberCell,
                  { left: n.x - 28, top: n.y - 28 },
                  n.tapped && styles.numberCellTapped,
                  isNext && styles.numberCellNext,
                ]}
                onPress={() => handleNumberTap(n.value, n.x, n.y)}
                disabled={n.tapped || numberDone}
                accessibilityLabel={`Number ${n.value}`}
              >
                <LinearGradient
                  colors={
                    n.tapped ? ['rgba(125,211,168,0.20)', 'rgba(125,211,168,0.05)']
                      : isNext ? ['rgba(126,200,232,0.30)', 'rgba(126,200,232,0.10)']
                      : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={[
                  styles.numberText,
                  n.tapped && styles.numberTextTapped,
                  isNext && styles.numberTextNext,
                ]}>
                  {n.tapped ? '✓' : n.value}
                </Text>
              </Pressable>
            );
          })}
          {floatScores.map(f => (
            <FloatScore key={f.id} x={f.x} y={f.y - 100} points={f.points} color={f.color} />
          ))}
        </Animated.View>
      </View>

      {colorDone && numberDone && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.roundComplete}>
          <Text style={styles.roundCompleteText}>
            {round >= TOTAL_ROUNDS ? '✓ Complete' : 'Next round…'}
          </Text>
        </Animated.View>
      )}
      {!_introShown && <GameIntro name="Split Focus" subtitle="Two tasks · one brain" accentColor={C.purple} onDone={() => _setIntroShown(true)} />}
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

  taskLabel: {
    color: C.t3,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  // Top
  topTask: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  targetSwatch: {
    width: 88,
    height: 88,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
  checkMark: {
    color: '#FFF',
    fontSize: 38,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  colorBtn: {
    width: 60,
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  colorBtnHighlight: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.6,
  },
  colorBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0.2,
  },

  // Divider
  taskDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  taskDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  taskDividerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(232,112,126,0.4)',
    backgroundColor: 'rgba(232,112,126,0.10)',
  },
  taskDividerText: {
    color: C.coral,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  // Bottom
  bottomTask: {
    flex: 1.2,
    gap: 10,
  },
  bottomLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(126,200,232,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(126,200,232,0.4)',
  },
  nextPillLabel: {
    color: '#7CB8E8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  nextPillNum: {
    color: '#C2DEFF',
    fontSize: 14,
    fontWeight: '900',
  },
  numberGrid: {
    flex: 1,
    position: 'relative',
  },
  numberCell: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(126,200,232,0.25)',
    overflow: 'hidden',
  },
  numberCellNext: {
    borderColor: '#7CB8E8',
    borderWidth: 2,
    shadowColor: '#7CB8E8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 6,
  },
  numberCellTapped: {
    borderColor: C.green,
  },
  numberText: {
    color: C.t1,
    fontSize: 19,
    fontWeight: '900',
  },
  numberTextNext: {
    color: '#C2DEFF',
    textShadowColor: 'rgba(126,200,232,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  numberTextTapped: {
    color: C.green,
    fontSize: 18,
  },

  floatScore: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  roundComplete: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(125,211,168,0.15)',
    borderWidth: 1,
    borderColor: C.green,
  },
  roundCompleteText: {
    color: C.green,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
