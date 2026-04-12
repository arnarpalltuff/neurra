import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence,
  withDelay, FadeIn, FadeOut, FadeInDown, SlideInRight, Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { Svg, Circle, Ellipse, Rect, Path } from 'react-native-svg';
import { C } from '../../../constants/colors';
import { updateDifficulty, getDifficulty, facePlaceParams } from '../../../utils/difficultyEngine';
import { shuffle } from '../../../utils/arrayUtils';
import { selection, success, error as hapticError, tapMedium } from '../../../utils/haptics';

const { width } = Dimensions.get('window');

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

// Illustrated face — unchanged from original, just kept as-is
function IllustratedFace({ face, size = 80, showName = false, correct, wrong }: {
  face: FaceItem; size?: number; showName?: boolean; correct?: boolean; wrong?: boolean;
}) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const headR = s * 0.35;
  const borderColor = correct ? C.green : wrong ? C.coral : 'rgba(155,114,224,0.35)';

  return (
    <View style={[styles.faceContainer, { width: s, height: s + (showName ? 24 : 0), borderColor }]}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Circle cx={cx} cy={cy - headR * 0.1} r={headR + 4} fill={face.hair} />
        <Circle cx={cx} cy={cy} r={headR} fill={face.skin} />
        <Circle cx={cx - headR * 0.28} cy={cy - headR * 0.08} r={headR * 0.1} fill="#2D1B0E" />
        <Circle cx={cx + headR * 0.28} cy={cy - headR * 0.08} r={headR * 0.1} fill="#2D1B0E" />
        <Circle cx={cx - headR * 0.24} cy={cy - headR * 0.12} r={headR * 0.04} fill="#FFF" opacity={0.8} />
        <Circle cx={cx + headR * 0.32} cy={cy - headR * 0.12} r={headR * 0.04} fill="#FFF" opacity={0.8} />
        <Path
          d={`M${cx - headR * 0.2} ${cy + headR * 0.25} Q${cx} ${cy + headR * 0.42} ${cx + headR * 0.2} ${cy + headR * 0.25}`}
          stroke="#2D1B0E" strokeWidth={1.5} fill="none" strokeLinecap="round"
        />
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

// Choice button with press spring
function ChoiceButton({ name, onPress }: { name: string; onPress: () => void }) {
  const press = useSharedValue(1);
  const handlePressIn = () => {
    press.value = withSpring(0.93, { damping: 12, stiffness: 240 });
  };
  const handlePressOut = () => {
    press.value = withSpring(1, { damping: 8, stiffness: 200 });
  };
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));
  return (
    <Animated.View style={[styles.choiceBtn, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        accessibilityLabel={name}
        style={({ pressed }) => [
          styles.choiceBtnInner,
          pressed && styles.choiceBtnPressed,
        ]}
      >
        <LinearGradient
          colors={['rgba(155,114,224,0.10)', 'rgba(155,114,224,0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.choiceText}>{name}</Text>
      </Pressable>
    </Animated.View>
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
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string } | null>(null);
  const [typedName, setTypedName] = useState('');
  const [floatScores, setFloatScores] = useState<{ id: number; points: number }[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const scoreRef = useRef(0);
  const correctCountRef = useRef(0);
  const floatIdRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();

  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);

  useEffect(() => {
    cancelledRef.current = false;
    const selected = shuffle(FACE_POOL).slice(0, params.numFaces);
    setFaces(selected);
    setRecallOrder(shuffle([...selected]));
    startTimeRef.current = Date.now();
    return () => { cancelledRef.current = true; };
  }, [params.numFaces]);

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
    selection();
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

    updateDifficulty('face-place', isCorrect);

    if (isCorrect) {
      correctCountRef.current += 1;
      const speedBonus = elapsed < 2 ? 60 : 0;
      const pts = 120 + speedBonus;
      scoreRef.current += pts;
      setScore(s => s + pts);
      success();
      tapMedium();
      scorePulse.value = withSequence(
        withSpring(1.22, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );
      floatIdRef.current += 1;
      const fid = floatIdRef.current;
      setFloatScores(prev => [...prev, { id: fid, points: pts }]);
      setTimeout(() => {
        if (!cancelledRef.current) {
          setFloatScores(prev => prev.filter(f => f.id !== fid));
        }
      }, 1200);
      burstCorrect({ x: width / 2, y: 300 });
    } else {
      hapticError();
      rootShake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
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

  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }],
  }));

  const currentStudyFace = faces[studyIndex];
  const currentRecallFace = recallOrder[recallIndex];

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      <LinearGradient
        colors={['#150B1E', '#0E0816', '#080510']}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(155,114,224,0.10)', 'rgba(0,0,0,0)']}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <FloatingParticles count={6} color="rgba(180,140,240,0.3)" />

      <FeedbackBurst {...burstFeedback} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>{phase === 'study' ? 'STUDY' : 'RECALL'}</Text>
          <Text style={styles.pillText}>
            {phase === 'study' ? `${studyIndex + 1}/${faces.length}` : `${recallIndex + 1}/${recallOrder.length}`}
          </Text>
        </View>
        <Animated.View style={scorePulseStyle}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreLabel}>POINTS</Text>
        </Animated.View>
        <View style={{ width: 70 }} />
      </View>

      {/* Progress pips */}
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
        <Animated.View
          entering={SlideInRight.duration(280)}
          key={currentStudyFace.id}
          style={styles.studyArea}
        >
          <Text style={styles.phaseLabel}>REMEMBER THIS FACE</Text>

          <View style={styles.portraitFrame}>
            <View style={[styles.frameCorner, styles.frameCornerTL]} />
            <View style={[styles.frameCorner, styles.frameCornerTR]} />
            <View style={[styles.frameCorner, styles.frameCornerBL]} />
            <View style={[styles.frameCorner, styles.frameCornerBR]} />
            <IllustratedFace face={currentStudyFace} size={150} />
          </View>

          <View style={styles.namePlate}>
            <View style={styles.namePlateLine} />
            <Text style={styles.nameDisplay}>{currentStudyFace.name}</Text>
            <View style={styles.namePlateLine} />
          </View>

          <Pressable onPress={skipStudy} style={styles.skipBtn}>
            <Text style={styles.skipText}>Got it →</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Recall phase */}
      {phase === 'recall' && currentRecallFace && (
        <Animated.View entering={FadeIn.duration(220)} key={`recall-${recallIndex}`} style={styles.recallArea}>
          <Text style={styles.phaseLabel}>WHO IS THIS?</Text>

          <View style={styles.portraitFrame}>
            <View style={[styles.frameCorner, styles.frameCornerTL]} />
            <View style={[styles.frameCorner, styles.frameCornerTR]} />
            <View style={[styles.frameCorner, styles.frameCornerBL]} />
            <View style={[styles.frameCorner, styles.frameCornerBR]} />
            <IllustratedFace
              face={currentRecallFace}
              size={140}
              correct={feedback?.correct === true}
              wrong={feedback?.correct === false}
            />
            {floatScores.map(f => <FloatScore key={f.id} points={f.points} />)}
          </View>

          {feedback && (
            <Animated.View entering={FadeIn.duration(160)} style={styles.feedbackRow}>
              <Text style={[styles.feedbackText, feedback.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
                {feedback.correct ? '✓ Correct' : `✗ It was ${feedback.answer}`}
              </Text>
            </Animated.View>
          )}

          {!feedback && params.recallType === 'choice' && (
            <View style={styles.choiceGrid}>
              {choices.map(name => (
                <ChoiceButton key={name} name={name} onPress={() => handleAnswer(name)} />
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
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 22,
    justifyContent: 'center',
  },
  pip: {
    width: 22,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pipActive: {
    backgroundColor: C.purple,
  },
  pipDone: {
    backgroundColor: C.purple,
    opacity: 0.5,
  },

  studyArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  recallArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  phaseLabel: {
    color: C.t2,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  // Portrait frame
  portraitFrame: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(155,114,224,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(155,114,224,0.25)',
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: C.purple,
  },
  frameCornerTL: {
    top: 4,
    left: 4,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  frameCornerTR: {
    top: 4,
    right: 4,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  frameCornerBL: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  frameCornerBR: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },

  // Name plate
  namePlate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  namePlateLine: {
    width: 28,
    height: 1,
    backgroundColor: 'rgba(155,114,224,0.4)',
  },
  nameDisplay: {
    color: '#EDE9E0',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(155,114,224,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  skipBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(155,114,224,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(155,114,224,0.35)',
  },
  skipText: {
    color: C.purple,
    fontSize: 14,
    fontWeight: '800',
  },

  feedbackRow: {
    height: 30,
    justifyContent: 'center',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  feedbackCorrect: {
    color: C.green,
    textShadowColor: 'rgba(125,211,168,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  feedbackWrong: {
    color: C.coral,
  },

  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    maxWidth: width - 40,
    marginTop: 4,
  },
  choiceBtn: {
    minWidth: (width - 80) / 2 - 5,
  },
  choiceBtnInner: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(155,114,224,0.25)',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  choiceBtnPressed: {
    borderColor: C.purple,
  },
  choiceText: {
    color: '#EDE9E0',
    fontSize: 16,
    fontWeight: '800',
  },

  typeArea: {
    gap: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  hintText: {
    color: C.t3,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeInput: {
    backgroundColor: 'rgba(155,114,224,0.08)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: C.t1,
    fontSize: 22,
    fontWeight: '800',
    borderWidth: 2,
    borderColor: 'rgba(155,114,224,0.35)',
    textAlign: 'center',
    width: '80%',
    letterSpacing: 0.5,
  },

  faceContainer: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#10131F',
    padding: 6,
  },
  faceName: {
    color: C.t1,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  floatScore: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    color: C.peach,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
