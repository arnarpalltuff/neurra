import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  FadeIn, FadeOut,
} from 'react-native-reanimated';
import { C } from '../../../constants/colors';
import { updateDifficulty, getDifficulty, signalNoiseParams } from '../../../utils/difficultyEngine';
import { pickRandom } from '../../../utils/arrayUtils';
import ProgressBar from '../../ui/ProgressBar';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';

const { width: W } = Dimensions.get('window');
const SCENE_SIZE = W - 40;

interface SignalNoiseProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

interface SceneShape {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
}

const PALETTE = [
  '#2D5A6B', '#3A6B5E', '#6B3A5E', '#5E6B3A', '#6B5A2D', '#3A5E6B',
  '#5E3A6B', '#6B2D5A', '#2D6B5A', '#5A6B2D', '#3A6B3A', '#6B3A3A',
];

function generateScene(count: number): SceneShape[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * (SCENE_SIZE - 80),
    y: 40 + Math.random() * (SCENE_SIZE - 80),
    r: 20 + Math.random() * 50,
    color: pickRandom(PALETTE),
    opacity: 0.3 + Math.random() * 0.5,
  }));
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
  onCompleteRef.current = onComplete;
  paramsRef.current = params;

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
      burstCorrect({ x: tapX, y: tapY });
    } else {
      setFeedback('wrong');
      streakRef.current = 0;
      setStreak(0);
      updateDifficulty('signal-noise', false);
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

  const progress = round / params.totalChanges;

  return (
    <View style={styles.container}>
      <FeedbackBurst {...burstFeedback} />
      <View style={styles.header}>
        <Text style={styles.roundText}>{round}/{params.totalChanges}</Text>
        <Text style={styles.scoreText}>{score}</Text>
        {streak > 2 && <Text style={styles.streakText}>{streak}× streak</Text>}
      </View>
      <ProgressBar value={round} max={params.totalChanges} style={{ marginBottom: 12 }} />

      <Pressable
        style={styles.scene}
        onPress={(e) => handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
      >
        {shapes.map(shape => (
          <View
            key={shape.id}
            style={[styles.shape, {
              left: shape.x - shape.r,
              top: shape.y - shape.r,
              width: shape.r * 2,
              height: shape.r * 2,
              borderRadius: shape.r,
              backgroundColor: shape.color,
              opacity: shape.opacity,
            }]}
          />
        ))}

        {feedback === 'correct' && changePos && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.ripple, { left: changePos.x - 30, top: changePos.y - 30 }]} />
        )}
        {feedback === 'missed' && changePos && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.missedIndicator, { left: changePos.x - 20, top: changePos.y - 20 }]}>
            <Text style={styles.missedX}>●</Text>
          </Animated.View>
        )}
      </Pressable>

      {feedback === 'correct' && <Text style={styles.correctText}>Found it!</Text>}
      {feedback === 'missed' && <Text style={styles.missedText}>Missed that one</Text>}
      {feedback === 'wrong' && <Text style={styles.wrongText}>Not there — look closer</Text>}
      {!feedback && <Text style={styles.hintText}>Tap where the change happened</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg2, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roundText: { color: C.t2, fontSize: 14, fontWeight: '600' },
  scoreText: { color: C.peach, fontSize: 18, fontWeight: '800' },
  streakText: { color: C.amber, fontSize: 14, fontWeight: '700' },
  scene: { width: SCENE_SIZE, height: SCENE_SIZE, backgroundColor: C.bg3, borderRadius: 24, overflow: 'hidden', position: 'relative', alignSelf: 'center', borderWidth: 1, borderColor: '#1F2A42' },
  shape: { position: 'absolute' },
  ripple: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: C.green },
  missedIndicator: { position: 'absolute', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  missedX: { color: C.coral, fontSize: 20, opacity: 0.8 },
  correctText: { color: C.green, fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  missedText: { color: C.coral, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  wrongText: { color: C.t3, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  hintText: { color: C.t3, fontSize: 13, textAlign: 'center', marginTop: 12 },
});
