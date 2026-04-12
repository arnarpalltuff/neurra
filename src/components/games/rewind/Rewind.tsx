import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  FadeIn, FadeOut, FadeInDown, useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence, withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { updateDifficulty, getDifficulty, rewindParams as rewindParamsEngine } from '../../../utils/difficultyEngine';
import { shuffle, pickRandom } from '../../../utils/arrayUtils';
import { selection, success, error as hapticError, tapMedium } from '../../../utils/haptics';

const { width: W } = Dimensions.get('window');

interface RewindProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type Phase = 'study' | 'question' | 'feedback';

interface SceneItem {
  emoji: string;
  label: string;
  position: string;
  detail: string;
}

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

const SCENE_OBJECTS = [
  { emoji: '🏠', label: 'house' }, { emoji: '🌳', label: 'tree' },
  { emoji: '🚗', label: 'car' }, { emoji: '🐕', label: 'dog' },
  { emoji: '🐈', label: 'cat' }, { emoji: '☀️', label: 'sun' },
  { emoji: '🌙', label: 'moon' }, { emoji: '⭐', label: 'star' },
  { emoji: '🌸', label: 'flower' }, { emoji: '🦋', label: 'butterfly' },
  { emoji: '🎈', label: 'balloon' }, { emoji: '📚', label: 'books' },
  { emoji: '🎸', label: 'guitar' }, { emoji: '⏰', label: 'clock' },
  { emoji: '🎩', label: 'hat' }, { emoji: '🧸', label: 'teddy bear' },
  { emoji: '🍎', label: 'apple' }, { emoji: '🎪', label: 'tent' },
  { emoji: '🏔', label: 'mountain' }, { emoji: '🌈', label: 'rainbow' },
];

const COLORS_POOL = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const POSITIONS = ['left', 'center', 'right'] as const;

function buildScene(numItems: number): { items: SceneItem[]; questions: Question[] } {
  const pool = shuffle(SCENE_OBJECTS).slice(0, numItems);
  const items: SceneItem[] = pool.map((obj, i) => ({
    emoji: obj.emoji,
    label: obj.label,
    position: POSITIONS[i % 3],
    detail: pickRandom(COLORS_POOL),
  }));

  const questions: Question[] = [];

  const posItem = pickRandom(items);
  const wrongLabels = shuffle(SCENE_OBJECTS.filter(o => !pool.includes(o))).slice(0, 3).map(o => o.label);
  const opts1 = shuffle([posItem.label, ...wrongLabels]);
  questions.push({
    text: `What was on the ${posItem.position}?`,
    options: opts1,
    correctIndex: opts1.indexOf(posItem.label),
  });

  const colorItem = pickRandom(items);
  const wrongColors = shuffle(COLORS_POOL.filter(c => c !== colorItem.detail)).slice(0, 3);
  const opts2 = shuffle([colorItem.detail, ...wrongColors]);
  questions.push({
    text: `What color was the ${colorItem.label}?`,
    options: opts2,
    correctIndex: opts2.indexOf(colorItem.detail),
  });

  const wrongCounts = [numItems - 1, numItems + 1, numItems + 2].filter(n => n > 0).map(String);
  const opts3 = shuffle([String(numItems), ...wrongCounts.slice(0, 3)]);
  questions.push({
    text: 'How many items were in the scene?',
    options: opts3,
    correctIndex: opts3.indexOf(String(numItems)),
  });

  const wasPresent = Math.random() > 0.5;
  if (wasPresent) {
    const present = pickRandom(items);
    questions.push({
      text: `Was a ${present.label} in the scene?`,
      options: ['Yes', 'No'],
      correctIndex: 0,
    });
  } else {
    const absent = shuffle(SCENE_OBJECTS.filter(o => !pool.includes(o)))[0];
    questions.push({
      text: `Was a ${absent.label} in the scene?`,
      options: ['Yes', 'No'],
      correctIndex: 1,
    });
  }

  return { items, questions: shuffle(questions) };
}

const COLOR_MAP: Record<string, string> = {
  red: '#E87C8A', blue: '#7CB8E8', green: '#7DD3A8',
  yellow: '#FBBF24', purple: '#A87CE8', orange: '#E8A87C',
};

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
  text, isCorrectOpt, isSelected, lastCorrect, onPress, disabled,
}: {
  text: string;
  isCorrectOpt: boolean;
  isSelected: boolean;
  lastCorrect: boolean | null;
  onPress: () => void;
  disabled: boolean;
}) {
  const press = useSharedValue(1);
  const handlePressIn = () => {
    press.value = withSpring(0.96, { damping: 12, stiffness: 240 });
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
        accessibilityLabel={text}
        style={[
          styles.optionBtn,
          isSelected && isCorrectOpt && styles.optionCorrect,
          isSelected && !isCorrectOpt && lastCorrect === false && styles.optionWrong,
        ]}
      >
        <LinearGradient
          colors={['rgba(125,211,168,0.06)', 'rgba(125,211,168,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={[
          styles.optionText,
          isSelected && isCorrectOpt && { color: C.green },
        ]}>{text}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function Rewind({ onComplete, initialLevel = 1 }: RewindProps) {
  const diff = getDifficulty('rewind', 0);
  const level = Math.max(initialLevel, diff.level);
  const params = useMemo(() => rewindParamsEngine(level), [level]);

  const [phase, setPhase] = useState<Phase>('study');
  const [sceneItems, setSceneItems] = useState<SceneItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [sceneNum, setSceneNum] = useState(1);
  const [score, setScore] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [studyTimer, setStudyTimer] = useState(0);
  const [studyTimerMax, setStudyTimerMax] = useState(0);
  const [floatScores, setFloatScores] = useState<{ id: number; points: number }[]>([]);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const totalQRef = useRef(0);
  const sceneNumRef = useRef(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const floatIdRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    pendingTimers.current.push(id);
    return id;
  }, []);

  const startScene = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const { items, questions: qs } = buildScene(params.numItems);
    setSceneItems(items);
    setQuestions(qs.slice(0, params.numQuestions));
    setQIndex(0);
    setPhase('study');
    setLastCorrect(null);

    const maxSecs = Math.floor(params.studyTime / 1000);
    let remaining = maxSecs;
    setStudyTimerMax(maxSecs);
    setStudyTimer(remaining);
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setStudyTimer(remaining);
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase('question');
      }
    }, 1000);
  }, [params]);

  useEffect(() => {
    startScene();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      pendingTimers.current.forEach(clearTimeout);
    };
  }, []);

  const handleAnswer = useCallback((optionIndex: number) => {
    if (phase !== 'question') return;
    const q = questions[qIndex];
    if (!q) return;

    const isCorrect = optionIndex === q.correctIndex;
    totalQRef.current += 1;

    if (isCorrect) {
      correctRef.current += 1;
      const pts = 120;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      updateDifficulty('rewind', true);
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
      burstCorrect({ x: W / 2, y: 350 });
    } else {
      updateDifficulty('rewind', false);
      hapticError();
      rootShake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      burstWrong({ x: W / 2, y: 350 });
    }

    setLastCorrect(isCorrect);
    setPhase('feedback');

    safeTimeout(() => {
      setLastCorrect(null);
      const nextQ = qIndex + 1;
      if (nextQ < questions.length) {
        setQIndex(nextQ);
        setPhase('question');
      } else {
        sceneNumRef.current += 1;
        setSceneNum(sceneNumRef.current);
        if (sceneNumRef.current > params.totalScenes) {
          const acc = totalQRef.current > 0 ? correctRef.current / totalQRef.current : 0;
          onComplete(scoreRef.current, acc);
        } else {
          startScene();
        }
      }
    }, 800);
  }, [phase, questions, qIndex, params, startScene, onComplete, safeTimeout]);

  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }],
  }));

  const studyProgress = studyTimerMax > 0 ? studyTimer / studyTimerMax : 0;

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      <LinearGradient
        colors={['#0E0F1C', '#0A0B16', '#06080F']}
        style={StyleSheet.absoluteFillObject}
      />
      <FloatingParticles count={6} color="rgba(126,200,232,0.3)" />

      <FeedbackBurst {...burstFeedback} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>SCENE</Text>
          <Text style={styles.pillText}>{sceneNum}<Text style={styles.pillTextDim}>/{params.totalScenes}</Text></Text>
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
          colors={['#7CB8E8', '#A87CE8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.min(100, ((sceneNum - 1) / params.totalScenes) * 100)}%` }]}
        />
      </View>

      {/* Study phase */}
      {phase === 'study' && (
        <Animated.View entering={FadeIn.duration(220)} style={styles.sceneArea}>
          <Text style={styles.phaseLabel}>MEMORIZE THE SCENE</Text>

          {/* Scene snapshot frame */}
          <View style={styles.snapshot}>
            <View style={[styles.snapCorner, styles.snapCornerTL]} />
            <View style={[styles.snapCorner, styles.snapCornerTR]} />
            <View style={[styles.snapCorner, styles.snapCornerBL]} />
            <View style={[styles.snapCorner, styles.snapCornerBR]} />

            <View style={styles.sceneRow}>
              {POSITIONS.map(pos => (
                <View key={pos} style={styles.sceneCol}>
                  {sceneItems
                    .filter(item => item.position === pos)
                    .map((item, i) => (
                      <View
                        key={i}
                        style={[
                          styles.sceneItem,
                          {
                            borderColor: COLOR_MAP[item.detail] + '70',
                            backgroundColor: COLOR_MAP[item.detail] + '15',
                            shadowColor: COLOR_MAP[item.detail],
                          },
                        ]}
                      >
                        <Text style={styles.sceneEmoji}>{item.emoji}</Text>
                        <Text style={[styles.colorLabel, { color: COLOR_MAP[item.detail] }]}>
                          {item.detail}
                        </Text>
                      </View>
                    ))}
                  <Text style={styles.posLabel}>{pos}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.studyTimerWrap}>
            <View style={styles.studyTimerBar}>
              <LinearGradient
                colors={['#7CB8E8', '#A87CE8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.studyTimerFill, { width: `${Math.max(0, studyProgress * 100)}%` }]}
              />
            </View>
            <Text style={styles.studyTimerText}>{studyTimer}<Text style={styles.studyTimerUnit}>s</Text></Text>
          </View>
        </Animated.View>
      )}

      {/* Question phase */}
      {(phase === 'question' || phase === 'feedback') && questions[qIndex] && (
        <Animated.View entering={FadeIn.duration(220)} style={styles.questionArea}>
          <View style={styles.qNumPill}>
            <Text style={styles.qNumText}>Q{qIndex + 1} / {questions.length}</Text>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{questions[qIndex].text}</Text>
          </View>

          <View style={styles.optionsCol}>
            {questions[qIndex].options.map((opt, i) => {
              const isSelected = phase === 'feedback' && lastCorrect !== null;
              const isCorrectOpt = i === questions[qIndex].correctIndex;
              return (
                <OptionButton
                  key={i}
                  text={opt}
                  isCorrectOpt={isCorrectOpt}
                  isSelected={isSelected}
                  lastCorrect={lastCorrect}
                  onPress={() => handleAnswer(i)}
                  disabled={phase === 'feedback'}
                />
              );
            })}
          </View>

          {floatScores.map(f => <FloatScore key={f.id} points={f.points} />)}

          <View style={styles.feedbackSlot}>
            {lastCorrect === true && (
              <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.correctText}>✓ Correct</Animated.Text>
            )}
            {lastCorrect === false && (
              <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.wrongText}>Not quite</Animated.Text>
            )}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06080F',
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

  // Study area
  sceneArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  phaseLabel: {
    color: C.t2,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  snapshot: {
    width: W - 40,
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(126,200,232,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(126,200,232,0.2)',
    position: 'relative',
  },
  snapCorner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: 'rgba(126,200,232,0.55)',
  },
  snapCornerTL: { top: 4, left: 4, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  snapCornerTR: { top: 4, right: 4, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  snapCornerBL: { bottom: 4, left: 4, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  snapCornerBR: { bottom: 4, right: 4, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },

  sceneRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 8,
  },
  sceneCol: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  sceneItem: {
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    gap: 4,
    minWidth: 70,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  sceneEmoji: {
    fontSize: 36,
  },
  colorLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  posLabel: {
    color: C.t3,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  studyTimerWrap: {
    width: '70%',
    alignItems: 'center',
    gap: 6,
  },
  studyTimerBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  studyTimerFill: {
    height: '100%',
    borderRadius: 3,
  },
  studyTimerText: {
    color: '#A87CE8',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(168,124,232,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  studyTimerUnit: {
    color: C.t3,
    fontSize: 12,
    fontWeight: '800',
  },

  // Question area
  questionArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 4,
    width: '100%',
  },
  qNumPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(168,124,232,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,124,232,0.35)',
  },
  qNumText: {
    color: C.purple,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  questionCard: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(168,124,232,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(168,124,232,0.25)',
    alignItems: 'center',
  },
  questionText: {
    color: '#EDE9E0',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  optionsCol: {
    width: '100%',
    gap: 10,
  },
  optionBtn: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCorrect: {
    borderColor: C.green,
    backgroundColor: 'rgba(125,211,168,0.18)',
  },
  optionWrong: {
    borderColor: C.coral,
    backgroundColor: 'rgba(232,112,126,0.10)',
  },
  optionText: {
    color: C.t1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  feedbackSlot: {
    minHeight: 22,
    marginTop: 4,
  },
  correctText: {
    color: C.green,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(125,211,168,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  wrongText: {
    color: C.coral,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  floatScore: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    color: C.peach,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
