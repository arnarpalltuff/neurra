import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { C } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import { updateDifficulty, getDifficulty, splitFocusParams, isRelaxedMode } from '../../../utils/difficultyEngine';
import { shuffle } from '../../../utils/arrayUtils';

const { width: W } = Dimensions.get('window');

interface SplitFocusProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

// ── Color Match Task (top half) ──
type TaskColor = 'red' | 'blue' | 'green' | 'yellow';
const TASK_COLORS: Record<TaskColor, string> = {
  red: '#E87C8A', blue: '#7CB8E8', green: '#7DD3A8', yellow: '#FBBF24',
};
const COLOR_NAMES: TaskColor[] = ['red', 'blue', 'green', 'yellow'];

interface ColorPrompt {
  targetColor: TaskColor;
  options: TaskColor[];
  id: number;
}

// ── Number Tap Task (bottom half) ──
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

export default function SplitFocus({ onComplete, initialLevel = 1 }: SplitFocusProps) {
  const diff = getDifficulty('split-focus', 0);
  const level = Math.max(initialLevel, diff.level);
  const { numberCount, colorTimeMs } = splitFocusParams(level);
  const relaxed = isRelaxedMode();

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // Color task state
  const [colorPrompt, setColorPrompt] = useState<ColorPrompt>(() => generateColorPrompt(1));
  const [colorFeedback, setColorFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [colorDone, setColorDone] = useState(false);
  const colorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Number task state
  const [numbers, setNumbers] = useState<NumberCell[]>(() => generateNumberGrid(numberCount));
  const [nextExpected, setNextExpected] = useState(1);
  const [numberFeedback, setNumberFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [numberDone, setNumberDone] = useState(false);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const cancelledRef = useRef(false);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();

  const flashScale = useSharedValue(1);
  const flashStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flashScale.value }],
  }));

  // Auto-fail color task after timeout (not in relaxed mode)
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
        setTotalAttempts(a => a + 1);
        updateDifficulty('split-focus', false);
        setTimeout(() => { if (!cancelledRef.current) setColorFeedback(null); }, 400);
      }
    }, colorTimeMs);
    return () => {
      cancelledRef.current = true;
      if (colorTimerRef.current) clearTimeout(colorTimerRef.current);
    };
  }, [colorPrompt.id, colorDone, relaxed, colorTimeMs]);

  // Check round completion
  useEffect(() => {
    if (colorDone && numberDone) {
      const timer = setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const accuracy = attemptsRef.current > 0 ? correctRef.current / attemptsRef.current : 0.5;
          onComplete(scoreRef.current, Math.min(1, accuracy));
        } else {
          // Next round
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

  // ── Color tap handler ──
  const handleColorTap = useCallback((color: TaskColor) => {
    if (colorDone) return;
    if (colorTimerRef.current) clearTimeout(colorTimerRef.current);

    const isCorrect = color === colorPrompt.targetColor;
    const pos = { x: W / 2, y: 200 };
    isCorrect ? burstCorrect(pos) : burstWrong(pos);

    attemptsRef.current++;
    setTotalAttempts(a => a + 1);

    if (isCorrect) {
      correctRef.current++;
      setCorrectCount(c => c + 1);
      const points = 100;
      scoreRef.current += points;
      setScore(s => s + points);
      updateDifficulty('split-focus', true);
    } else {
      updateDifficulty('split-focus', false);
    }

    setColorFeedback(isCorrect ? 'correct' : 'wrong');
    setColorDone(true);
    setTimeout(() => { if (!cancelledRef.current) setColorFeedback(null); }, 400);
  }, [colorDone, colorPrompt]);

  // ── Number tap handler ──
  const handleNumberTap = useCallback((value: number) => {
    if (numberDone) return;

    const isCorrect = value === nextExpected;
    const pos = { x: W / 2, y: 450 };
    isCorrect ? burstCorrect(pos) : burstWrong(pos);

    attemptsRef.current++;
    setTotalAttempts(a => a + 1);

    if (isCorrect) {
      correctRef.current++;
      setCorrectCount(c => c + 1);
      const points = 50;
      scoreRef.current += points;
      setScore(s => s + points);
      updateDifficulty('split-focus', true);

      flashScale.value = withSequence(
        withTiming(1.1, { duration: 80 }),
        withTiming(1, { duration: 80 }),
      );

      setNumbers(prev => prev.map(n => n.value === value ? { ...n, tapped: true } : n));

      const nextVal = nextExpected + 1;
      // All numbers tapped when we've reached the total count
      if (nextVal > numbers.length) {
        setNumberDone(true);
      } else {
        setNextExpected(nextVal);
      }
    } else {
      updateDifficulty('split-focus', false);
      setNumberFeedback('wrong');
      setTimeout(() => { if (!cancelledRef.current) setNumberFeedback(null); }, 300);
    }
  }, [nextExpected, numberDone, numbers, flashScale]);

  return (
    <View style={styles.container}>
      <FeedbackBurst {...burstFeedback} />
      <View style={styles.header}>
        <Text style={styles.roundText}>Round {round}/{TOTAL_ROUNDS}</Text>
        <Text style={styles.scoreText}>{score} pts</Text>
      </View>

      {/* Top: Color Match */}
      <View style={styles.topTask}>
        <Text style={styles.taskLabel}>Tap the matching color</Text>
        <View style={[styles.targetSwatch, { backgroundColor: TASK_COLORS[colorPrompt.targetColor] }]}>
          {colorDone && (
            <Animated.Text entering={FadeIn} style={styles.checkMark}>
              {colorFeedback === 'correct' ? '✓' : '✗'}
            </Animated.Text>
          )}
        </View>
        <View style={styles.colorOptions}>
          {colorPrompt.options.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorBtn,
                { backgroundColor: TASK_COLORS[c] },
                colorDone && styles.colorBtnDisabled,
              ]}
              onPress={() => handleColorTap(c)}
              disabled={colorDone}
              activeOpacity={0.7}
            />
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.taskDivider}>
        <View style={styles.taskDividerLine} />
        <Text style={styles.taskDividerText}>SPLIT</Text>
        <View style={styles.taskDividerLine} />
      </View>

      {/* Bottom: Number Sequence */}
      <View style={styles.bottomTask}>
        <Text style={styles.taskLabel}>
          Tap numbers in order: {nextExpected}
        </Text>
        <Animated.View style={[styles.numberGrid, flashStyle]}>
          {numbers.map((n) => (
            <TouchableOpacity
              key={n.value}
              style={[
                styles.numberCell,
                { left: n.x - 24, top: n.y - 24 },
                n.tapped && styles.numberCellTapped,
              ]}
              onPress={() => handleNumberTap(n.value)}
              disabled={n.tapped || numberDone}
              activeOpacity={0.7}
            >
              <Text style={[styles.numberText, n.tapped && styles.numberTextTapped]}>
                {n.tapped ? '✓' : n.value}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      {/* Round completion indicator */}
      {colorDone && numberDone && (
        <Animated.View entering={FadeIn} style={styles.roundComplete}>
          <Text style={styles.roundCompleteText}>
            {round >= TOTAL_ROUNDS ? 'Complete!' : 'Next round...'}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg2, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundText: { color: C.t3, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  scoreText: { color: C.peach, fontSize: 16, fontWeight: '800' },

  // Top task
  topTask: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  taskLabel: { color: C.t2, fontSize: 13, fontWeight: '600' },
  targetSwatch: {
    width: 80, height: 80, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#1F2A42',
  },
  checkMark: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  colorOptions: { flexDirection: 'row', gap: 16 },
  colorBtn: {
    width: 56, height: 56, borderRadius: 16,
    borderWidth: 2, borderColor: '#1F2A42',
  },
  colorBtnDisabled: { opacity: 0.4 },

  // Divider
  taskDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8,
  },
  taskDividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  taskDividerText: {
    color: C.coral, fontSize: 11, fontWeight: '800', letterSpacing: 2,
  },

  // Bottom task
  bottomTask: { flex: 1.2, gap: 8 },
  numberGrid: { flex: 1, position: 'relative' },
  numberCell: {
    position: 'absolute',
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.bg4,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.blue + '60',
  },
  numberCellTapped: {
    backgroundColor: C.green + '30',
    borderColor: C.green,
  },
  numberText: { color: C.t1, fontSize: 18, fontWeight: '800' },
  numberTextTapped: { color: C.green, fontSize: 16 },

  // Round complete
  roundComplete: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: C.bg4,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20,
  },
  roundCompleteText: { color: C.green, fontSize: 14, fontWeight: '700' },
});
