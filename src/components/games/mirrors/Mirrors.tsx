import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { tapMedium } from '../../../utils/haptics';
import { C } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import { updateDifficulty, getDifficulty, mirrorsParams as mirrorsParamsEngine } from '../../../utils/difficultyEngine';
import { pickRandom, shuffle } from '../../../utils/arrayUtils';
import ProgressBar from '../../ui/ProgressBar';

const { width: W } = Dimensions.get('window');

interface MirrorsProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type RuleType = 'color' | 'shape' | 'size' | 'count';

interface Stimulus {
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
  color: string;
  colorName: string;
  size: 'small' | 'large';
  count: 1 | 2 | 3;
}

interface Rule {
  type: RuleType;
  label: string;
  getAnswer: (s: Stimulus) => string;
}

const SHAPE_COLORS = [
  { name: 'red', hex: '#E87C8A' },
  { name: 'blue', hex: '#7CB8E8' },
  { name: 'green', hex: '#7DD3A8' },
  { name: 'yellow', hex: '#FBBF24' },
  { name: 'purple', hex: '#A87CE8' },
];

const SHAPES: Stimulus['shape'][] = ['circle', 'square', 'triangle', 'diamond'];
const SIZES: Stimulus['size'][] = ['small', 'large'];

const RULES: Rule[] = [
  { type: 'color', label: 'Match the COLOR', getAnswer: (s) => s.colorName },
  { type: 'shape', label: 'Match the SHAPE', getAnswer: (s) => s.shape },
  { type: 'size', label: 'Match the SIZE', getAnswer: (s) => s.size },
  { type: 'count', label: 'Match the COUNT', getAnswer: (s) => String(s.count) },
];

function generateStimulus(): Stimulus {
  const c = pickRandom(SHAPE_COLORS);
  return {
    shape: pickRandom(SHAPES),
    color: c.hex,
    colorName: c.name,
    size: pickRandom(SIZES),
    count: pickRandom([1, 2, 3]) as 1 | 2 | 3,
  };
}

function generateOptions(rule: Rule, correct: string): string[] {
  let pool: string[];
  switch (rule.type) {
    case 'color': pool = SHAPE_COLORS.map(c => c.name); break;
    case 'shape': pool = [...SHAPES]; break;
    case 'size': pool = [...SIZES]; break;
    case 'count': pool = ['1', '2', '3']; break;
  }
  const wrong = shuffle(pool.filter(o => o !== correct)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

function ShapeDisplay({ stimulus, displaySize }: { stimulus: Stimulus; displaySize: number }) {
  const items = Array.from({ length: stimulus.count });
  const s = stimulus.size === 'large' ? displaySize : displaySize * 0.6;

  return (
    <View style={styles.stimulusRow}>
      {items.map((_, i) => (
        <View key={i} style={[
          styles.shapeBase,
          { width: s, height: s },
          stimulus.shape === 'circle' && { borderRadius: s / 2, backgroundColor: stimulus.color },
          stimulus.shape === 'square' && { borderRadius: 6, backgroundColor: stimulus.color },
          stimulus.shape === 'diamond' && { borderRadius: 6, backgroundColor: stimulus.color, transform: [{ rotate: '45deg' }] },
          stimulus.shape === 'triangle' && {
            width: 0, height: 0, backgroundColor: 'transparent',
            borderLeftWidth: s / 2, borderRightWidth: s / 2, borderBottomWidth: s,
            borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: stimulus.color,
          },
        ]} />
      ))}
    </View>
  );
}

export default function Mirrors({ onComplete, initialLevel = 1 }: MirrorsProps) {
  const diff = getDifficulty('mirrors', 0);
  const level = Math.max(initialLevel, diff.level);
  const params = useMemo(() => mirrorsParamsEngine(level), [level]);

  const activeRules = useMemo(() => RULES.slice(0, params.numRules), [params.numRules]);

  const [trial, setTrial] = useState(0);
  const [rule, setRule] = useState<Rule>(activeRules[0]);
  const [stimulus, setStimulus] = useState<Stimulus>(generateStimulus());
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [ruleChanged, setRuleChanged] = useState(false);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const trialRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    pendingTimers.current.push(id);
    return id;
  }, []);

  const ruleShake = useSharedValue(0);
  const ruleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ruleShake.value }],
  }));

  const nextTrial = useCallback((currentTrial: number, currentRule: Rule) => {
    const newStim = generateStimulus();
    let nextRule = currentRule;

    // Switch rule?
    if (currentTrial > 0 && currentTrial % params.switchEvery === 0) {
      const others = activeRules.filter(r => r.type !== currentRule.type);
      nextRule = pickRandom(others);
      setRuleChanged(true);
      ruleShake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      safeTimeout(() => setRuleChanged(false), 1200);
    }

    const correctAnswer = nextRule.getAnswer(newStim);
    const opts = generateOptions(nextRule, correctAnswer);

    setRule(nextRule);
    setStimulus(newStim);
    setOptions(opts);
    setFeedback(null);

    // Time limit
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFeedback('timeout');
      updateDifficulty('mirrors', false);
      tapMedium();
      safeTimeout(() => {
        trialRef.current += 1;
        setTrial(trialRef.current);
        if (trialRef.current >= params.totalTrials) {
          const acc = params.totalTrials > 0 ? correctRef.current / params.totalTrials : 0;
          onComplete(scoreRef.current, acc);
        } else {
          nextTrial(trialRef.current, nextRule);
        }
      }, 600);
    }, params.timeLimit);
  }, [params, activeRules, ruleShake, onComplete, safeTimeout]);

  useEffect(() => {
    nextTrial(0, activeRules[0]);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      pendingTimers.current.forEach(clearTimeout);
    };
  }, []);

  const handleAnswer = useCallback((answer: string) => {
    if (feedback) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    const correctAnswer = rule.getAnswer(stimulus);
    const isCorrect = answer === correctAnswer;

    if (isCorrect) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
      const pts = 100;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      updateDifficulty('mirrors', true);
      burstCorrect({ x: W / 2, y: 400 });
      setFeedback('correct');
    } else {
      updateDifficulty('mirrors', false);
      burstWrong({ x: W / 2, y: 400 });
      setFeedback('wrong');
    }

    safeTimeout(() => {
      trialRef.current += 1;
      setTrial(trialRef.current);
      if (trialRef.current >= params.totalTrials) {
        const acc = params.totalTrials > 0 ? correctRef.current / params.totalTrials : 0;
        onComplete(scoreRef.current, acc);
      } else {
        nextTrial(trialRef.current, rule);
      }
    }, 500);
  }, [feedback, rule, stimulus, params, nextTrial, onComplete, safeTimeout]);

  return (
    <View style={styles.container}>
      <FeedbackBurst {...burstFeedback} />
      <View style={styles.header}>
        <Text style={styles.trialText}>{trial + 1}/{params.totalTrials}</Text>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
      <ProgressBar value={trial} max={params.totalTrials} style={{ marginBottom: 16 }} />

      <Animated.View style={[styles.ruleBar, ruleAnimStyle, ruleChanged && styles.ruleBarChanged]}>
        <Text style={[styles.ruleText, ruleChanged && styles.ruleTextChanged]}>
          {rule.label}
        </Text>
      </Animated.View>

      <View style={styles.stimulusArea}>
        <ShapeDisplay stimulus={stimulus} displaySize={60} />
      </View>

      <View style={styles.optionsGrid}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={`${trial}-${i}`}
            style={[
              styles.optionBtn,
              feedback === 'correct' && opt === rule.getAnswer(stimulus) && styles.optionCorrect,
              feedback === 'wrong' && opt === rule.getAnswer(stimulus) && styles.optionCorrect,
            ]}
            onPress={() => handleAnswer(opt)}
            disabled={feedback !== null}
            accessibilityLabel={opt}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {feedback === 'correct' && <Text style={styles.correctFeedback}>Correct!</Text>}
      {feedback === 'wrong' && <Text style={styles.wrongFeedback}>Wrong rule?</Text>}
      {feedback === 'timeout' && <Text style={styles.wrongFeedback}>Too slow!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg2, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  trialText: { color: C.t2, fontSize: 14, fontWeight: '600' },
  scoreText: { color: C.peach, fontSize: 18, fontWeight: '800' },
  ruleBar: { backgroundColor: C.bg4, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#1F2A42' },
  ruleBarChanged: { borderColor: C.amber, backgroundColor: '#FBBF2415' },
  ruleText: { color: C.t1, fontSize: 16, fontWeight: '700' },
  ruleTextChanged: { color: C.amber },
  stimulusArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stimulusRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  shapeBase: { },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  optionBtn: { backgroundColor: C.bg4, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, borderWidth: 1, borderColor: '#1F2A42', minWidth: (W - 70) / 2 },
  optionCorrect: { borderColor: C.green, backgroundColor: 'rgba(110,207,154,0.19)' },
  optionText: { color: C.t1, fontSize: 15, fontWeight: '600', textAlign: 'center', textTransform: 'capitalize' },
  correctFeedback: { color: C.green, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  wrongFeedback: { color: C.coral, fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
});
