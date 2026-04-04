import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, FadeIn, FadeOut, SlideInDown,
} from 'react-native-reanimated';
import { colors } from '../../../constants/colors';
import { ghostKitchenParams, updateDifficulty, getDifficulty } from '../../../utils/difficultyEngine';
import { shuffle } from '../../../utils/arrayUtils';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';

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


export default function GhostKitchen({ onComplete, initialLevel = 1, isOnboarding = false }: GhostKitchenProps) {
  const [phase, setPhase] = useState<Phase>('showing');
  const [order, setOrder] = useState<typeof INGREDIENTS>([]);
  const [tray, setTray] = useState<typeof INGREDIENTS>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(isOnboarding ? 4 : 8);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showTimer, setShowTimer] = useState(0);
  const [showTimerMax, setShowTimerMax] = useState(3);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);
  const roundStartTime = useRef(Date.now());
  const { feedback, fireCorrect, fireWrong } = useGameFeedback();
  const lastTapPos = useRef({ x: width / 2, y: 300 });

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

    // Timer countdown for showing phase
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
    setTotalAttempts(prev => prev + 1);

    const diff = updateDifficulty('ghost-kitchen', isCorrect);

    if (isCorrect) {
      const newSelected = [...selected, ingredientId];
      setSelected(newSelected);
      setCorrectCount(prev => prev + 1);

      const newConsec = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsec);
      const mult = Math.min(1 + Math.floor(newConsec / 2) * 0.5, 3);
      setComboMultiplier(mult);

      // Points: 100 base + speed bonus + combo
      const elapsed = (Date.now() - roundStartTime.current) / 1000;
      const speedBonus = Math.max(0, 50 - Math.floor(elapsed * 5));
      const points = Math.round((100 + speedBonus) * mult);
      setScore(prev => prev + points);

      if (newSelected.length === order.length) {
        // Round complete
        setTimeout(() => {
          if (cancelledRef.current) return;
          if (round >= totalRounds) {
            const accuracy = (correctCount + 1) / (totalAttempts + 1);
            onComplete(score + points, accuracy);
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
    }

    setTimeout(() => { if (!cancelledRef.current) setLastCorrect(null); }, 500);
  };

  return (
    <View style={styles.container}>
      <FeedbackBurst {...feedback} />
      <View style={styles.header}>
        <Text style={styles.roundText}>Order {round}/{totalRounds}</Text>
        <Text style={styles.scoreText}>{score} pts</Text>
        {comboMultiplier > 1 && (
          <Text style={styles.comboText}>{comboMultiplier}×</Text>
        )}
      </View>

      {/* Phase: Showing */}
      {phase === 'showing' && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.orderArea}>
          <Text style={styles.phaseLabel}>Memorize the order</Text>
          <View style={styles.orderRow}>
            {order.map((item, i) => (
              <Animated.View key={item.id} entering={FadeIn.delay(i * 100)} style={styles.orderItem}>
                <Text style={styles.ingredientEmoji}>{item.emoji}</Text>
                <Text style={styles.ingredientLabel}>{item.label}</Text>
              </Animated.View>
            ))}
          </View>
          <View style={styles.timerBar}>
            <View style={[styles.timerFill, { width: `${(showTimer / showTimerMax) * 100}%` }]} />
          </View>
          <Text style={styles.timerText}>{showTimer}s</Text>
        </Animated.View>
      )}

      {/* Phase: Recall */}
      {phase === 'recall' && (
        <Animated.View entering={FadeIn} style={styles.recallArea}>
          <Text style={styles.phaseLabel}>Tap in order</Text>
          <View style={styles.progressDots}>
            {order.map((item, i) => (
              <View
                key={item.id}
                style={[
                  styles.dot,
                  i < selected.length && styles.dotFilled,
                  i === selected.length && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <View style={styles.trayGrid}>
            {tray.map((item) => {
              const isDone = selected.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.trayItem, isDone && styles.trayItemDone]}
                  onPress={(e) => handleIngredientTap(item.id, e.nativeEvent.pageX, e.nativeEvent.pageY)}
                  disabled={isDone}
                  accessibilityLabel={item.label}
                >
                  <Text style={[styles.ingredientEmoji, isDone && { opacity: 0.3 }]}>{item.emoji}</Text>
                  <Text style={[styles.ingredientLabel, isDone && { opacity: 0.3 }]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {lastCorrect === false && (
            <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.wrongText}>
              Not quite — keep going!
            </Animated.Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  roundText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  scoreText: {
    color: colors.warm,
    fontSize: 18,
    fontWeight: '800',
  },
  comboText: {
    color: colors.streak,
    fontSize: 16,
    fontWeight: '800',
  },
  orderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  phaseLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  orderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  orderItem: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    minWidth: 70,
  },
  ingredientEmoji: {
    fontSize: 32,
  },
  ingredientLabel: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  timerBar: {
    width: '80%',
    height: 4,
    backgroundColor: colors.bgTertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: colors.growth,
    borderRadius: 2,
  },
  timerText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  recallArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotFilled: {
    backgroundColor: colors.growth,
    borderColor: colors.growth,
  },
  dotActive: {
    backgroundColor: colors.transparent,
    borderColor: colors.growth,
    borderWidth: 2,
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
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    minWidth: 75,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trayItemDone: {
    borderColor: colors.growth,
    backgroundColor: colors.growthDim,
  },
  wrongText: {
    color: colors.coral,
    fontSize: 14,
    fontWeight: '600',
  },
});
