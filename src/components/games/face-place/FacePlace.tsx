import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, FadeIn, FadeOut, SlideInRight,
} from 'react-native-reanimated';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import { Svg, Circle, Ellipse, Rect, Path, G, Text as SvgText } from 'react-native-svg';
import { C } from '../../../constants/colors';
import { updateDifficulty, getDifficulty, facePlaceParams } from '../../../utils/difficultyEngine';
import { shuffle, pickRandom } from '../../../utils/arrayUtils';

const { width } = Dimensions.get('window');

// Illustrated face data — distinct features for memorability
const FACE_POOL = [
  { id: 'a', name: 'Maya', hair: '#2D1B0E', skin: '#D4A574', feature: 'glasses', accent: '#E87C8A' },
  { id: 'b', name: 'Sam', hair: '#FFD700', skin: '#F5D0B0', feature: 'hat', accent: '#7CB8E8' },
  { id: 'c', name: 'Jordan', hair: '#1A1A2E', skin: '#8D5524', feature: 'scarf', accent: '#FF6B35' },
  { id: 'd', name: 'Alex', hair: '#C04000', skin: '#F0C8A0', feature: 'earrings', accent: '#A87CE8' },
  { id: 'e', name: 'Reese', hair: '#4A2728', skin: '#A0785A', feature: 'beard', accent: '#4ECDC4' },
  { id: 'f', name: 'Quinn', hair: '#E8C8A0', skin: '#FFE0C0', feature: 'freckles', accent: '#FBBF24' },
  { id: 'g', name: 'Morgan', hair: '#6B3A2A', skin: '#C68642', feature: 'headband', accent: '#7DD3A8' },
  { id: 'h', name: 'Casey', hair: '#1C1C1C', skin: '#FFDBAC', feature: 'smile', accent: '#E87C8A' },
  { id: 'i', name: 'Riley', hair: '#A52A2A', skin: '#D4A574', feature: 'bowtie', accent: '#A87CE8' },
  { id: 'j', name: 'Drew', hair: '#808080', skin: '#F5D0B0', feature: 'monocle', accent: '#FBBF24' },
  { id: 'k', name: 'Sage', hair: '#2E8B57', skin: '#8D5524', feature: 'beret', accent: '#7CB8E8' },
  { id: 'l', name: 'Blair', hair: '#191970', skin: '#C68642', feature: 'necklace', accent: '#FF6B35' },
];

const DISTRACTOR_NAMES = [
  'Maria', 'Sasha', 'Jaden', 'Alexa', 'Reed', 'Quincy', 'Marley', 'Cassidy',
  'Robin', 'Devon', 'Sierra', 'Blake', 'Kai', 'Taylor', 'Avery', 'Charlie',
];

interface FacePlaceProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
  isOnboarding?: boolean;
}

type Phase = 'study' | 'recall' | 'feedback';

interface FaceItem {
  id: string;
  name: string;
  hair: string;
  skin: string;
  feature: string;
  accent: string;
}

function IllustratedFace({ face, size = 80, showName = false, correct, wrong }: {
  face: FaceItem; size?: number; showName?: boolean; correct?: boolean; wrong?: boolean;
}) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const headR = s * 0.35;
  const borderColor = correct ? C.green : wrong ? C.coral : '#1F2A42';

  return (
    <View style={[styles.faceContainer, { width: s, height: s + (showName ? 24 : 0), borderColor }]}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        {/* Hair background */}
        <Circle cx={cx} cy={cy - headR * 0.1} r={headR + 4} fill={face.hair} />
        {/* Head */}
        <Circle cx={cx} cy={cy} r={headR} fill={face.skin} />
        {/* Eyes */}
        <Circle cx={cx - headR * 0.28} cy={cy - headR * 0.08} r={headR * 0.1} fill="#2D1B0E" />
        <Circle cx={cx + headR * 0.28} cy={cy - headR * 0.08} r={headR * 0.1} fill="#2D1B0E" />
        <Circle cx={cx - headR * 0.24} cy={cy - headR * 0.12} r={headR * 0.04} fill="#FFF" opacity={0.8} />
        <Circle cx={cx + headR * 0.32} cy={cy - headR * 0.12} r={headR * 0.04} fill="#FFF" opacity={0.8} />
        {/* Smile */}
        <Path
          d={`M${cx - headR * 0.2} ${cy + headR * 0.25} Q${cx} ${cy + headR * 0.42} ${cx + headR * 0.2} ${cy + headR * 0.25}`}
          stroke="#2D1B0E" strokeWidth={1.5} fill="none" strokeLinecap="round"
        />
        {/* Feature */}
        {face.feature === 'glasses' && (
          <>
            <Circle cx={cx - headR * 0.28} cy={cy - headR * 0.08} r={headR * 0.18} stroke={face.accent} strokeWidth={1.5} fill="none" />
            <Circle cx={cx + headR * 0.28} cy={cy - headR * 0.08} r={headR * 0.18} stroke={face.accent} strokeWidth={1.5} fill="none" />
            <Path d={`M${cx - headR * 0.1} ${cy - headR * 0.08} L${cx + headR * 0.1} ${cy - headR * 0.08}`} stroke={face.accent} strokeWidth={1} />
          </>
        )}
        {face.feature === 'hat' && (
          <Rect x={cx - headR * 0.8} y={cy - headR * 1.15} width={headR * 1.6} height={headR * 0.5} rx={headR * 0.15} fill={face.accent} />
        )}
        {face.feature === 'scarf' && (
          <Rect x={cx - headR * 0.5} y={cy + headR * 0.6} width={headR * 1.0} height={headR * 0.3} rx={4} fill={face.accent} />
        )}
        {face.feature === 'earrings' && (
          <>
            <Circle cx={cx - headR * 0.75} cy={cy + headR * 0.2} r={headR * 0.08} fill={face.accent} />
            <Circle cx={cx + headR * 0.75} cy={cy + headR * 0.2} r={headR * 0.08} fill={face.accent} />
          </>
        )}
        {face.feature === 'beard' && (
          <Ellipse cx={cx} cy={cy + headR * 0.45} rx={headR * 0.35} ry={headR * 0.25} fill={face.hair} opacity={0.8} />
        )}
        {face.feature === 'freckles' && (
          <>
            <Circle cx={cx - headR * 0.15} cy={cy + headR * 0.05} r={2} fill="#B87333" opacity={0.6} />
            <Circle cx={cx + headR * 0.1} cy={cy + headR * 0.08} r={2} fill="#B87333" opacity={0.6} />
            <Circle cx={cx - headR * 0.05} cy={cy + headR * 0.15} r={2} fill="#B87333" opacity={0.6} />
            <Circle cx={cx + headR * 0.18} cy={cy + headR * 0.02} r={2} fill="#B87333" opacity={0.6} />
          </>
        )}
        {face.feature === 'headband' && (
          <Rect x={cx - headR * 0.7} y={cy - headR * 0.55} width={headR * 1.4} height={headR * 0.18} rx={3} fill={face.accent} />
        )}
        {face.feature === 'bowtie' && (
          <>
            <Path d={`M${cx} ${cy + headR * 0.65} L${cx - headR * 0.2} ${cy + headR * 0.5} L${cx} ${cy + headR * 0.75} Z`} fill={face.accent} />
            <Path d={`M${cx} ${cy + headR * 0.65} L${cx + headR * 0.2} ${cy + headR * 0.5} L${cx} ${cy + headR * 0.75} Z`} fill={face.accent} />
          </>
        )}
        {face.feature === 'monocle' && (
          <Circle cx={cx + headR * 0.28} cy={cy - headR * 0.08} r={headR * 0.2} stroke={face.accent} strokeWidth={2} fill="none" />
        )}
        {face.feature === 'beret' && (
          <Ellipse cx={cx + headR * 0.1} cy={cy - headR * 0.7} rx={headR * 0.6} ry={headR * 0.25} fill={face.accent} />
        )}
        {face.feature === 'necklace' && (
          <Path
            d={`M${cx - headR * 0.3} ${cy + headR * 0.55} Q${cx} ${cy + headR * 0.75} ${cx + headR * 0.3} ${cy + headR * 0.55}`}
            stroke={face.accent} strokeWidth={2} fill="none" strokeLinecap="round"
          />
        )}
      </Svg>
      {showName && <Text style={styles.faceName}>{face.name}</Text>}
    </View>
  );
}

export default function FacePlace({ onComplete, initialLevel = 1 }: FacePlaceProps) {
  const diff = getDifficulty('face-place', 0);
  const level = Math.max(initialLevel, diff.level);
  const params = useMemo(() => facePlaceParams(level), [level]);

  const [phase, setPhase] = useState<Phase>('study');
  const [faces, setFaces] = useState<FaceItem[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [recallOrder, setRecallOrder] = useState<FaceItem[]>([]);
  const [recallIndex, setRecallIndex] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string } | null>(null);
  const [typedName, setTypedName] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const scoreRef = useRef(0);
  const correctCountRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();

  // Init faces
  useEffect(() => {
    cancelledRef.current = false;
    const selected = shuffle(FACE_POOL).slice(0, params.numFaces);
    setFaces(selected);
    setRecallOrder(shuffle([...selected]));
    startTimeRef.current = Date.now();
    return () => { cancelledRef.current = true; };
  }, [params.numFaces]);

  // Auto-advance study phase
  useEffect(() => {
    if (phase !== 'study' || faces.length === 0) return;
    timerRef.current = setTimeout(() => {
      if (studyIndex + 1 < faces.length) {
        setStudyIndex(i => i + 1);
      } else {
        startRecallPhase();
      }
    }, params.displayTime);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, studyIndex, faces, params.displayTime]);

  const skipStudy = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (studyIndex + 1 < faces.length) {
      setStudyIndex(i => i + 1);
    } else {
      startRecallPhase();
    }
  }, [studyIndex, faces]);

  const startRecallPhase = useCallback(() => {
    setPhase('recall');
    setRecallIndex(0);
    generateChoices(0);
  }, []);

  const generateChoices = useCallback((idx: number) => {
    if (!recallOrder[idx]) return;
    const correct = recallOrder[idx].name;
    const others = shuffle(
      [...faces.filter(f => f.name !== correct).map(f => f.name), ...shuffle(DISTRACTOR_NAMES)]
    ).slice(0, params.numChoices - 1);
    setChoices(shuffle([correct, ...others]));
    startTimeRef.current = Date.now();
  }, [recallOrder, faces, params.numChoices]);

  useEffect(() => {
    if (phase === 'recall') generateChoices(recallIndex);
  }, [recallIndex, phase]);

  const handleAnswer = useCallback((answer: string) => {
    const currentFace = recallOrder[recallIndex];
    if (!currentFace) return;
    const isCorrect = answer.toLowerCase().trim() === currentFace.name.toLowerCase();
    const elapsed = (Date.now() - startTimeRef.current) / 1000;

    setTotalAttempts(t => t + 1);
    updateDifficulty('face-place', isCorrect);

    if (isCorrect) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
      const speedBonus = elapsed < 2 ? 60 : 0;
      const pts = 120 + speedBonus;
      scoreRef.current += pts;
      setScore(s => s + pts);
      burstCorrect({ x: width / 2, y: 300 });
    } else {
      burstWrong({ x: width / 2, y: 300 });
    }

    setFeedback({ correct: isCorrect, answer: currentFace.name });
    setTypedName('');

    if (answerTimerRef.current) clearTimeout(answerTimerRef.current);
    answerTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setFeedback(null);
      if (recallIndex + 1 < recallOrder.length) {
        setRecallIndex(i => i + 1);
      } else {
        const sweepBonus = correctCountRef.current === faces.length ? 200 : 0;
        scoreRef.current += sweepBonus;
        const finalAcc = correctCountRef.current / faces.length;
        onComplete(scoreRef.current, finalAcc);
      }
    }, 1200);
  }, [recallIndex, recallOrder, faces, onComplete]);

  const currentStudyFace = faces[studyIndex];
  const currentRecallFace = recallOrder[recallIndex];

  return (
    <View style={styles.container}>
      <FeedbackBurst {...burstFeedback} />
      <View style={styles.header}>
        <Text style={styles.phaseText}>{phase === 'study' ? 'Study' : 'Recall'}</Text>
        <Text style={styles.scoreText}>{score} pts</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {faces.map((_, i) => (
          <View key={i} style={[
            styles.pip,
            phase === 'study' && i <= studyIndex && styles.pipActive,
            phase === 'recall' && i < recallIndex && styles.pipDone,
            phase === 'recall' && i === recallIndex && styles.pipActive,
          ]} />
        ))}
      </View>

      {/* Study phase */}
      {phase === 'study' && currentStudyFace && (
        <Animated.View entering={SlideInRight.duration(300)} key={currentStudyFace.id} style={styles.studyArea}>
          <Text style={styles.studyLabel}>Remember this face</Text>
          <IllustratedFace face={currentStudyFace} size={140} showName />
          <Text style={styles.nameDisplay}>{currentStudyFace.name}</Text>
          <TouchableOpacity onPress={skipStudy} style={styles.skipBtn}>
            <Text style={styles.skipText}>Got it →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Recall phase */}
      {phase === 'recall' && currentRecallFace && (
        <Animated.View entering={FadeIn} key={`recall-${recallIndex}`} style={styles.recallArea}>
          <Text style={styles.recallLabel}>Who is this?</Text>
          <IllustratedFace
            face={currentRecallFace}
            size={130}
            correct={feedback?.correct === true}
            wrong={feedback?.correct === false}
          />

          {feedback && (
            <Animated.View entering={FadeIn} style={styles.feedbackRow}>
              <Text style={[styles.feedbackText, feedback.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
                {feedback.correct ? '✓ Correct!' : `✗ It was ${feedback.answer}`}
              </Text>
            </Animated.View>
          )}

          {!feedback && params.recallType === 'choice' && (
            <View style={styles.choiceGrid}>
              {choices.map(name => (
                <TouchableOpacity
                  key={name}
                  style={styles.choiceBtn}
                  onPress={() => handleAnswer(name)}
                  accessibilityLabel={name}
                >
                  <Text style={styles.choiceText}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!feedback && params.recallType === 'type' && (
            <View style={styles.typeArea}>
              <Text style={styles.hintText}>First letter: {currentRecallFace.name[0]}</Text>
              <TextInput
                style={styles.typeInput}
                value={typedName}
                onChangeText={setTypedName}
                placeholder="Type the name"
                placeholderTextColor={C.t3}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={() => handleAnswer(typedName)}
              />
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg2, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  phaseText: { color: C.t2, fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  scoreText: { color: C.peach, fontSize: 18, fontWeight: '800' },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 20, justifyContent: 'center' },
  pip: { width: 20, height: 5, borderRadius: 2.5, backgroundColor: C.bg4 },
  pipActive: { backgroundColor: C.purple, opacity: 0.7 },
  pipDone: { backgroundColor: C.purple },
  studyArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  studyLabel: { color: C.t3, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  nameDisplay: { color: C.t1, fontSize: 28, fontWeight: '800' },
  skipBtn: { backgroundColor: C.bg4, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: '#1F2A42' },
  skipText: { color: C.t2, fontSize: 14, fontWeight: '700' },
  recallArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  recallLabel: { color: C.t3, fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  feedbackRow: { height: 30, justifyContent: 'center' },
  feedbackText: { fontSize: 16, fontWeight: '800' },
  feedbackCorrect: { color: C.green },
  feedbackWrong: { color: C.coral },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: width - 40, marginTop: 8 },
  choiceBtn: { backgroundColor: C.bg4, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: '#1F2A42', minWidth: (width - 80) / 2 - 5, alignItems: 'center' },
  choiceText: { color: C.t1, fontSize: 16, fontWeight: '700' },
  typeArea: { gap: 10, width: '100%', alignItems: 'center' },
  hintText: { color: C.t3, fontSize: 13, fontWeight: '600' },
  typeInput: { backgroundColor: C.bg4, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, color: C.t1, fontSize: 20, fontWeight: '700', borderWidth: 2, borderColor: '#1F2A42', textAlign: 'center', width: '80%' },
  faceContainer: { alignItems: 'center', borderRadius: 20, borderWidth: 2, borderColor: '#1F2A42', overflow: 'hidden', backgroundColor: C.bg3, padding: 6 },
  faceName: { color: C.t1, fontSize: 12, fontWeight: '700', marginTop: 2 },
});
