import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import { updateDifficulty, getDifficulty, rewindParams as rewindParamsEngine } from '../../../utils/difficultyEngine';
import { shuffle, pickRandom } from '../../../utils/arrayUtils';
import ProgressBar from '../../ui/ProgressBar';

const { width: W } = Dimensions.get('window');

interface RewindProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type Phase = 'study' | 'question' | 'feedback';

interface SceneItem {
  emoji: string;
  label: string;
  position: string; // 'left' | 'center' | 'right'
  detail: string;   // a distinguishing attribute
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

  // Q: What was on the [position]?
  const posItem = pickRandom(items);
  const wrongLabels = shuffle(SCENE_OBJECTS.filter(o => !pool.includes(o))).slice(0, 3).map(o => o.label);
  const opts1 = shuffle([posItem.label, ...wrongLabels]);
  questions.push({
    text: `What was on the ${posItem.position}?`,
    options: opts1,
    correctIndex: opts1.indexOf(posItem.label),
  });

  // Q: What color was the [item]?
  const colorItem = pickRandom(items);
  const wrongColors = shuffle(COLORS_POOL.filter(c => c !== colorItem.detail)).slice(0, 3);
  const opts2 = shuffle([colorItem.detail, ...wrongColors]);
  questions.push({
    text: `What color was the ${colorItem.label}?`,
    options: opts2,
    correctIndex: opts2.indexOf(colorItem.detail),
  });

  // Q: How many items were in the scene?
  const wrongCounts = [numItems - 1, numItems + 1, numItems + 2].filter(n => n > 0).map(String);
  const opts3 = shuffle([String(numItems), ...wrongCounts.slice(0, 3)]);
  questions.push({
    text: 'How many items were in the scene?',
    options: opts3,
    correctIndex: opts3.indexOf(String(numItems)),
  });

  // Q: Was [item] in the scene?
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
  const [correctCount, setCorrectCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [studyTimer, setStudyTimer] = useState(0);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const totalQRef = useRef(0);
  const sceneNumRef = useRef(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

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
    setTotalQuestions(totalQRef.current);

    if (isCorrect) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
      const pts = 120;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      updateDifficulty('rewind', true);
      burstCorrect({ x: W / 2, y: 350 });
    } else {
      updateDifficulty('rewind', false);
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

  return (
    <View style={styles.container}>
      <FeedbackBurst {...burstFeedback} />
      <View style={styles.header}>
        <Text style={styles.roundText}>Scene {sceneNum}/{params.totalScenes}</Text>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
      <ProgressBar value={sceneNum - 1} max={params.totalScenes} style={{ marginBottom: 12 }} />

      {phase === 'study' && (
        <Animated.View entering={FadeIn} style={styles.sceneArea}>
          <Text style={styles.phaseLabel}>Memorize the scene</Text>
          <View style={styles.sceneRow}>
            {POSITIONS.map(pos => (
              <View key={pos} style={styles.sceneCol}>
                {sceneItems
                  .filter(item => item.position === pos)
                  .map((item, i) => (
                    <View key={i} style={[styles.sceneItem, { borderColor: COLOR_MAP[item.detail] || colors.border }]}>
                      <Text style={styles.sceneEmoji}>{item.emoji}</Text>
                      <View style={[styles.colorDot, { backgroundColor: COLOR_MAP[item.detail] }]} />
                    </View>
                  ))}
                <Text style={styles.posLabel}>{pos}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.timerText}>{studyTimer}s</Text>
        </Animated.View>
      )}

      {(phase === 'question' || phase === 'feedback') && questions[qIndex] && (
        <Animated.View entering={FadeIn} style={styles.questionArea}>
          <Text style={styles.questionNum}>Q{qIndex + 1}/{questions.length}</Text>
          <Text style={styles.questionText}>{questions[qIndex].text}</Text>
          <View style={styles.optionsCol}>
            {questions[qIndex].options.map((opt, i) => {
              const isSelected = phase === 'feedback' && lastCorrect !== null;
              const isCorrectOpt = i === questions[qIndex].correctIndex;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.optionBtn,
                    isSelected && isCorrectOpt && styles.optionCorrect,
                    isSelected && !isCorrectOpt && lastCorrect === false && styles.optionWrong,
                  ]}
                  onPress={() => handleAnswer(i)}
                  disabled={phase === 'feedback'}
                  accessibilityLabel={opt}
                >
                  <Text style={[
                    styles.optionText,
                    isSelected && isCorrectOpt && { color: colors.growth },
                  ]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {lastCorrect === true && <Text style={styles.correctText}>Correct!</Text>}
          {lastCorrect === false && <Text style={styles.wrongText}>Not quite</Text>}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roundText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  scoreText: { color: colors.warm, fontSize: 18, fontWeight: '800' },
  sceneArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  phaseLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  sceneRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', gap: 8 },
  sceneCol: { alignItems: 'center', flex: 1, gap: 8 },
  sceneItem: { alignItems: 'center', backgroundColor: colors.bgElevated, borderRadius: 16, padding: 12, borderWidth: 2, gap: 4 },
  sceneEmoji: { fontSize: 36 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  posLabel: { color: colors.textTertiary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  timerText: { color: colors.textTertiary, fontSize: 16, fontWeight: '600' },
  questionArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  questionNum: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
  questionText: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center', paddingHorizontal: 10 },
  optionsCol: { width: '100%', gap: 10 },
  optionBtn: { backgroundColor: colors.bgElevated, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  optionCorrect: { borderColor: colors.growth, backgroundColor: colors.growthDim },
  optionWrong: { borderColor: colors.coral, opacity: 0.6 },
  optionText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  correctText: { color: colors.growth, fontSize: 16, fontWeight: '700' },
  wrongText: { color: colors.coral, fontSize: 14, fontWeight: '600' },
});
