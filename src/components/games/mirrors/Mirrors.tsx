import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  FadeIn, FadeOut, FadeInDown, useSharedValue, useAnimatedStyle,
  withSequence, withSpring, withTiming, withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tapMedium, success, error as hapticError, warning as hapticWarning } from '../../../utils/haptics';
import { playCorrect, playWrong, playRoundEnd } from '../../../utils/sound';
import { C } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { updateDifficulty, getDifficulty, mirrorsParams as mirrorsParamsEngine } from '../../../utils/difficultyEngine';
import { pickRandom, shuffle } from '../../../utils/arrayUtils';
import GameIntro from '../shared/GameIntro';

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
  short: string;
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
  { type: 'color', label: 'Match the COLOR', short: 'COLOR', getAnswer: (s) => s.colorName },
  { type: 'shape', label: 'Match the SHAPE', short: 'SHAPE', getAnswer: (s) => s.shape },
  { type: 'size', label: 'Match the SIZE', short: 'SIZE', getAnswer: (s) => s.size },
  { type: 'count', label: 'Match the COUNT', short: 'COUNT', getAnswer: (s) => String(s.count) },
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
        <View
          key={i}
          style={[
            styles.shapeBase,
            { shadowColor: stimulus.color },
            stimulus.shape === 'circle' && {
              width: s, height: s, borderRadius: s / 2, backgroundColor: stimulus.color,
            },
            stimulus.shape === 'square' && {
              width: s, height: s, borderRadius: 8, backgroundColor: stimulus.color,
            },
            stimulus.shape === 'diamond' && {
              width: s, height: s, borderRadius: 6, backgroundColor: stimulus.color, transform: [{ rotate: '45deg' }],
            },
            stimulus.shape === 'triangle' && {
              width: 0, height: 0, backgroundColor: 'transparent',
              borderLeftWidth: s / 2, borderRightWidth: s / 2, borderBottomWidth: s,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: stimulus.color,
              shadowOpacity: 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

// Float score
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
      { translateY: interpolate(rise.value, [0, 1], [0, -90]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.6, 1.2, 1]) },
    ],
  }));
  return (
    <Animated.Text style={[styles.floatScore, style]} pointerEvents="none">
      +{points}
    </Animated.Text>
  );
}

// Option button with press spring
function OptionButton({
  text, isCorrectAnswer, showResult, onPress, disabled,
}: {
  text: string;
  isCorrectAnswer: boolean;
  showResult: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  const press = useSharedValue(1);
  const handlePressIn = () => {
    press.value = withSpring(0.94, { damping: 12, stiffness: 240 });
  };
  const handlePressOut = () => {
    press.value = withSpring(1, { damping: 8, stiffness: 200 });
  };
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));
  return (
    <Animated.View style={[styles.optionWrap, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={text}
        style={[
          styles.optionBtn,
          showResult && isCorrectAnswer && styles.optionCorrect,
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={[
          styles.optionText,
          showResult && isCorrectAnswer && { color: C.green },
        ]}>{text}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function Mirrors({ onComplete, initialLevel = 1 }: MirrorsProps) {
  const diff = getDifficulty('mirrors', 0);
  const level = Math.max(initialLevel, diff.level);
  const params = useMemo(() => mirrorsParamsEngine(level), [level]);

  const activeRules = useMemo(() => RULES.slice(0, params.numRules), [params.numRules]);

  const [trial, setTrial] = useState(0);
  const [_introShown, _setIntroShown] = React.useState(false);
  const [rule, setRule] = useState<Rule>(activeRules[0]);
  const [stimulus, setStimulus] = useState<Stimulus>(generateStimulus());
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [ruleChanged, setRuleChanged] = useState(false);
  const [floatScores, setFloatScores] = useState<{ id: number; points: number }[]>([]);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const trialRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const floatIdRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();

  const ruleShake = useSharedValue(0);
  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);
  const switchFlash = useSharedValue(0);

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    pendingTimers.current.push(id);
    return id;
  }, []);

  const ruleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ruleShake.value }],
  }));

  const nextTrial = useCallback((currentTrial: number, currentRule: Rule) => {
    const newStim = generateStimulus();
    let nextRule = currentRule;

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
      switchFlash.value = withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 500 }),
      );
      hapticWarning();
      safeTimeout(() => setRuleChanged(false), 1400);
    }

    const correctAnswer = nextRule.getAnswer(newStim);
    const opts = generateOptions(nextRule, correctAnswer);

    setRule(nextRule);
    setStimulus(newStim);
    setOptions(opts);
    setFeedback(null);

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
      const pts = 100;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      updateDifficulty('mirrors', true);
      success();
      tapMedium();
      scorePulse.value = withSequence(
        withSpring(1.22, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );
      floatIdRef.current += 1;
      const fid = floatIdRef.current;
      setFloatScores(prev => [...prev, { id: fid, points: pts }]);
      safeTimeout(() => {
        setFloatScores(prev => prev.filter(f => f.id !== fid));
      }, 1200);
      playCorrect(); burstCorrect({ x: W / 2, y: 400 });
      setFeedback('correct');
    } else {
      updateDifficulty('mirrors', false);
      hapticError();
      rootShake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      playWrong(); burstWrong({ x: W / 2, y: 400 });
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

  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }],
  }));
  const switchFlashStyle = useAnimatedStyle(() => ({
    opacity: switchFlash.value * 0.25,
  }));

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      <LinearGradient
        colors={['#0F0B1A', '#0B0814', '#06040D']}
        style={StyleSheet.absoluteFillObject}
      />
      <FloatingParticles count={6} color="rgba(168,124,232,0.35)" />

      <Animated.View
        style={[styles.flashOverlay, switchFlashStyle, { backgroundColor: C.amber }]}
        pointerEvents="none"
      />

      <FeedbackBurst {...burstFeedback} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>TRIAL</Text>
          <Text style={styles.pillText}>{trial + 1}<Text style={styles.pillTextDim}>/{params.totalTrials}</Text></Text>
        </View>
        <Animated.View style={scorePulseStyle}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreLabel}>POINTS</Text>
        </Animated.View>
        <View style={{ width: 70 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <LinearGradient
          colors={['#A87CE8', '#7CB8E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.min(100, (trial / params.totalTrials) * 100)}%` }]}
        />
      </View>

      {/* Rule banner */}
      <Animated.View
        style={[
          styles.ruleBar,
          ruleAnimStyle,
          ruleChanged && styles.ruleBarChanged,
        ]}
      >
        <View style={styles.ruleStripe} />
        <Text style={styles.ruleLabel}>{ruleChanged ? 'RULE SWITCH' : 'CURRENT RULE'}</Text>
        <Text style={[styles.ruleText, ruleChanged && styles.ruleTextChanged]}>
          MATCH THE {rule.short}
        </Text>
        <View style={styles.ruleStripe} />
      </Animated.View>

      {/* Stimulus pedestal */}
      <View style={styles.stimulusArea}>
        <View style={styles.pedestal}>
          <ShapeDisplay stimulus={stimulus} displaySize={64} />
        </View>
        {floatScores.map(f => <FloatScore key={f.id} points={f.points} />)}
      </View>

      {/* Options grid */}
      <View style={styles.optionsGrid}>
        {options.map((opt, i) => {
          const correctAnswer = rule.getAnswer(stimulus);
          return (
            <OptionButton
              key={`${trial}-${i}`}
              text={opt}
              isCorrectAnswer={opt === correctAnswer}
              showResult={feedback !== null}
              onPress={() => handleAnswer(opt)}
              disabled={feedback !== null}
            />
          );
        })}
      </View>

      {/* Feedback */}
      <View style={styles.feedbackSlot}>
        {feedback === 'correct' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.correctFeedback}>✓ Correct</Animated.Text>
        )}
        {feedback === 'wrong' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.wrongFeedback}>Wrong rule?</Animated.Text>
        )}
        {feedback === 'timeout' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.wrongFeedback}>Too slow!</Animated.Text>
        )}
      </View>
      {!_introShown && <GameIntro name="Mirrors" subtitle="Follow the rule — adapt fast" accentColor={C.purple} onDone={() => _setIntroShown(true)} />}
    </Animated.View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06040D',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
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

  // Rule banner
  ruleBar: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(168,124,232,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(168,124,232,0.3)',
    marginBottom: 16,
    gap: 6,
  },
  ruleBarChanged: {
    borderColor: C.amber,
    backgroundColor: 'rgba(240,181,66,0.10)',
  },
  ruleStripe: {
    width: 80,
    height: 1,
    backgroundColor: 'rgba(168,124,232,0.4)',
  },
  ruleLabel: {
    color: C.t3,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  ruleText: {
    color: '#EDE9E0',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2.5,
    textShadowColor: 'rgba(168,124,232,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  ruleTextChanged: {
    color: C.amber,
    textShadowColor: 'rgba(240,181,66,0.6)',
  },

  // Stimulus pedestal
  stimulusArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pedestal: {
    paddingVertical: 32,
    paddingHorizontal: 28,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 200,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stimulusRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  shapeBase: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 6,
  },

  // Options
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  optionWrap: {
    minWidth: (W - 70) / 2,
  },
  optionBtn: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(168,124,232,0.25)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  optionCorrect: {
    borderColor: C.green,
    backgroundColor: 'rgba(125,211,168,0.18)',
  },
  optionText: {
    color: '#EDE9E0',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },

  feedbackSlot: {
    minHeight: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctFeedback: {
    color: C.green,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(125,211,168,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  wrongFeedback: {
    color: C.coral,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  floatScore: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    color: C.peach,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
