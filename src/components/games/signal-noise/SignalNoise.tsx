import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, FadeIn, FadeOut, FadeInDown, FadeOutUp,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../../constants/colors';
import { updateDifficulty, getDifficulty, signalNoiseParams } from '../../../utils/difficultyEngine';
import { pickRandom } from '../../../utils/arrayUtils';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import {
  success, error as hapticError, tapMedium, tapHeavy,
} from '../../../utils/haptics';
import {
  playCorrect, playWrong, playComboHit, playRoundStart, playRoundEnd,
  playStreak,
} from '../../../utils/sound';
import NeuralMapOverlay from '../../ui/NeuralMapOverlay';
import { useNeuralMap } from '../../../hooks/useNeuralMap';
import { useEnergyStore, maxHeartsFor } from '../../../stores/energyStore';
import { useProStore } from '../../../stores/proStore';

import { styles } from './styles';
import { ShapeOrb, type SceneShape, type ShapeType } from './pieces/ShapeOrb';
import { AnimatedScore } from './pieces/AnimatedScore';
import { SensorBackground } from './background/SensorBackground';
import { SceneGrid } from './background/SceneGrid';
import { CornerBreathing } from './background/CornerBreathing';
import { SceneBorderHeartbeat } from './background/SceneBorderHeartbeat';
import { SensorGlyphs } from './background/SensorGlyphs';
import { RadarPing } from './effects/RadarPing';
import { CorrectSparkle } from './effects/CorrectSparkle';
import { ScanSweep } from './effects/ScanSweep';
import { CountdownRing } from './effects/CountdownRing';
import { TapCrosshair } from './effects/TapCrosshair';
import { ScanReticle } from './effects/ScanReticle';
import { DetectionRing } from './effects/DetectionRing';
import { SignalLock } from './effects/SignalLock';
import { ChangeGlow } from './effects/ChangeGlow';
import { FloatScore } from './effects/FloatScore';
import { MissIndicator } from './effects/MissIndicator';
import { MissedPulse } from './effects/MissedPulse';
import { ConfettiBurst } from './effects/Confetti';
import { ScoreTrail } from './effects/ScoreTrail';
import { ShapeHighlight } from './effects/ShapeHighlight';
import { CornerGlow } from './effects/CornerGlow';
import { IntroOverlay } from './overlays/IntroOverlay';
import { OutroOverlay } from './overlays/OutroOverlay';
import { ComboMultiplier } from './overlays/ComboMultiplier';
import { PrecisionLabel } from './overlays/PrecisionLabel';
import { StreakFire } from './overlays/StreakFire';
import { ScanIndicator } from './overlays/ScanIndicator';

const { width: W, height: H } = Dimensions.get('window');
const SCENE_SIZE = W - 40;

interface SignalNoiseProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type GameState = 'intro' | 'playing' | 'outro';

const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'rounded'];

const PALETTE = [
  '#4A90D9', '#D94A6B', '#5CC99A', '#D9A84A', '#9A5CC9', '#C95C5C',
  '#5CAAC9', '#D96BA8', '#6BD96B', '#C9985C', '#7A6BD9', '#D9C95C',
];

const CORRECT_TEXTS = [
  '✦ Sharp eye',
  '✦ Eagle vision',
  '✦ Quick scan',
  '✦ Locked on',
  '✦ Signal found',
  '✦ Target acquired',
];

function generateScene(count: number): SceneShape[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * (SCENE_SIZE - 80),
    y: 40 + Math.random() * (SCENE_SIZE - 80),
    r: 24 + Math.random() * 44,
    color: pickRandom(PALETTE),
    opacity: 0.5 + Math.random() * 0.4,
    shapeType: pickRandom(SHAPE_TYPES),
  }));
}

// ─────────────────────────────────────────────────────────────
// Background pulse — brief brightness on shape change
// ─────────────────────────────────────────────────────────────
function useBgPulse() {
  const bgPulse = useSharedValue(0);
  const fire = useCallback(() => {
    bgPulse.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: bgPulse.value * 0.15,
  }));
  return { fireBgPulse: fire, bgPulseStyle: style };
}

// ─────────────────────────────────────────────────────────────
// Main game
// ─────────────────────────────────────────────────────────────
export default function SignalNoise({ onComplete, initialLevel = 1 }: SignalNoiseProps) {
  const diff = getDifficulty('signal-noise', 0);
  const level = Math.max(initialLevel, diff.level);
  const params = useMemo(() => signalNoiseParams(level), [level]);

  const hearts = useEnergyStore(s => s.hearts);
  const isPro = useProStore(s => s.isPro);
  const maxHearts = maxHeartsFor(isPro);

  const [gameState, setGameState] = useState<GameState>('intro');
  const [shapes, setShapes] = useState<SceneShape[]>([]);
  const [changePos, setChangePos] = useState<{ x: number; y: number } | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'missed' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [floatScores, setFloatScores] = useState<{ id: number; x: number; y: number; points: number }[]>([]);
  const [detectionRings, setDetectionRings] = useState<{ id: number; x: number; y: number }[]>([]);
  const [scoreTrails, setScoreTrails] = useState<{ id: number; startX: number; startY: number; points: number }[]>([]);
  const [confettiBursts, setConfettiBursts] = useState<number[]>([]);
  const [precisionEvent, setPrecisionEvent] = useState<{ id: number; dist: number } | null>(null);
  const [tapCrosshairs, setTapCrosshairs] = useState<{ id: number; x: number; y: number }[]>([]);
  const [wrongTap, setWrongTap] = useState<{ tapX: number; tapY: number; targetX: number; targetY: number } | null>(null);
  const [speedBonus, setSpeedBonus] = useState<{ id: number } | null>(null);
  const [scoreMilestone, setScoreMilestone] = useState<{ id: number; value: number } | null>(null);
  const [changedShapeId, setChangedShapeId] = useState<number | null>(null);
  const [shapeHighlights, setShapeHighlights] = useState<{ id: number; x: number; y: number; r: number }[]>([]);
  const highlightIdRef = useRef(0);
  const sceneExitScale = useSharedValue(1);
  const sceneExitOpacity = useSharedValue(1);
  const changeTimeRef = useRef(0);
  const speedIdRef = useRef(0);
  const milestoneIdRef = useRef(0);
  const lastMilestoneRef = useRef(0);
  const streakBrokenRef = useRef(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [resultHistory, setResultHistory] = useState<('correct' | 'wrong' | 'missed')[]>([]);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const sparkleIdRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const neural = useNeuralMap('signal-noise');
  const { fireBgPulse, bgPulseStyle } = useBgPulse();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const roundRef = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const waitingRef = useRef(false);
  const changePosRef = useRef<{ x: number; y: number } | null>(null);
  const shapesRef = useRef<SceneShape[]>([]);
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const paramsRef = useRef(params);
  const floatIdRef = useRef(0);
  const ringIdRef = useRef(0);
  const trailIdRef = useRef(0);
  const confettiIdRef = useRef(0);
  const precIdRef = useRef(0);
  const correctTrigger = useRef(0);
  const crosshairIdRef = useRef(0);
  onCompleteRef.current = onComplete;
  paramsRef.current = params;

  // Animation primitives
  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);
  const punchScale = useSharedValue(1);
  const screenFlash = useSharedValue(0);
  const comboAura = useSharedValue(0);
  const sceneBorderGlow = useSharedValue(0);
  const dangerTint = useSharedValue(0);
  const sceneZoomX = useSharedValue(0);
  const sceneZoomY = useSharedValue(0);
  const sceneZoomScale = useSharedValue(1);

  const [cornerTrigger, setCornerTrigger] = useState(0);

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

  const finishGame = useCallback(() => {
    sceneExitScale.value = withTiming(0.92, { duration: 600, easing: Easing.inOut(Easing.cubic) });
    sceneExitOpacity.value = withTiming(0.5, { duration: 600, easing: Easing.inOut(Easing.cubic) });
    setTimeout(() => { setGameState('outro'); playRoundEnd(); }, 650);
  }, []);

  const handleOutroDone = useCallback(() => {
    const p = paramsRef.current;
    const acc = p.totalChanges > 0 ? correctRef.current / p.totalChanges : 1;
    onCompleteRef.current(scoreRef.current, acc);
  }, []);

  const scheduleChange = useCallback(() => {
    if (cancelledRef.current) return;
    const p = paramsRef.current;
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      if (roundRef.current >= p.totalChanges) {
        finishGame();
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
      setChangedShapeId(target.id);

      const pos = { x: target.x, y: target.y };
      setChangePos(pos);
      changePosRef.current = pos;
      waitingRef.current = true;
      fireBgPulse();
      changeTimeRef.current = Date.now();

      // Camera zoom toward change location
      const offsetX = (pos.x - SCENE_SIZE / 2) * 0.03;
      const offsetY = (pos.y - SCENE_SIZE / 2) * 0.03;
      sceneZoomX.value = withTiming(offsetX, { duration: 800, easing: Easing.out(Easing.cubic) });
      sceneZoomY.value = withTiming(offsetY, { duration: 800, easing: Easing.out(Easing.cubic) });
      sceneZoomScale.value = withTiming(1.03, { duration: 800, easing: Easing.out(Easing.cubic) });
      roundRef.current += 1;
      setRound(roundRef.current);

      // Danger zone — last 3 rounds
      const remaining = p.totalChanges - roundRef.current;
      if (remaining <= 2) {
        dangerTint.value = withTiming(Math.min(1, (3 - remaining) / 3), { duration: 600 });
      }

      tapTimerRef.current = setTimeout(() => {
        if (cancelledRef.current) return;
        if (waitingRef.current) {
          waitingRef.current = false;
          setFeedback('missed');
          setResultHistory(prev => [...prev.slice(-11), 'missed']);
          if (streakRef.current >= 3) streakBrokenRef.current = true;
          streakRef.current = 0;
          setStreak(0);
          comboAura.value = withTiming(0, { duration: 400 });
          sceneZoomX.value = withSpring(0, { damping: 10 });
          sceneZoomY.value = withSpring(0, { damping: 10 });
          sceneZoomScale.value = withSpring(1, { damping: 10 });
          updateDifficulty('signal-noise', false);
          hapticError();
          feedbackTimerRef.current = setTimeout(() => {
            if (cancelledRef.current) return;
            setFeedback(null);
            scheduleChange();
          }, 800);
        }
      }, 2500);
    }, p.changeInterval);
  }, [finishGame]);

  const scenReady = shapes.length > 0;
  useEffect(() => {
    if (!scenReady || gameState !== 'playing') return;
    cancelledRef.current = false;
    const initial = setTimeout(() => scheduleChange(), 1500);
    return () => {
      cancelledRef.current = true;
      clearTimeout(initial);
      clearAllTimers();
    };
  }, [scenReady, gameState, scheduleChange, clearAllTimers]);

  const handleTap = useCallback((tapX: number, tapY: number) => {
    if (cancelledRef.current || gameState !== 'playing') return;
    if (!waitingRef.current || !changePosRef.current) return;
    waitingRef.current = false;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    const pos = changePosRef.current;
    const dist = Math.sqrt((tapX - pos.x) ** 2 + (tapY - pos.y) ** 2);
    const isClose = dist < 80;
    const p = paramsRef.current;

    // Reset camera zoom
    sceneZoomX.value = withSpring(0, { damping: 10 });
    sceneZoomY.value = withSpring(0, { damping: 10 });
    sceneZoomScale.value = withSpring(1, { damping: 10 });

    // Crosshair at tap point
    crosshairIdRef.current += 1;
    const chId = crosshairIdRef.current;
    setTapCrosshairs(prev => [...prev, { id: chId, x: tapX, y: tapY }]);

    // Speed bonus check
    const reactionTime = Date.now() - changeTimeRef.current;
    const isFast = reactionTime < 800;

    if (isClose) {
      correctRef.current += 1;
      streakRef.current += 1;
      if (streakRef.current > bestStreakRef.current) bestStreakRef.current = streakRef.current;
      setStreak(streakRef.current);
      const precisionBonus = dist < 20 ? 80 : dist < 40 ? 40 : 0;
      const speedBonus = 30;
      const mult = 1 + streakRef.current * 0.25;
      const pts = Math.round((100 + precisionBonus + speedBonus) * mult);
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setFeedback('correct');
      updateDifficulty('signal-noise', true);

      // Haptics by precision
      if (dist < 20) { tapHeavy(); setTimeout(tapMedium, 80); }
      else if (dist < 40) tapMedium();
      else { success(); }

      // Screen punch
      punchScale.value = withSequence(
        withTiming(1.06, { duration: 100, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 7, stiffness: 160 }),
      );

      // Screen flash on high precision
      if (dist < 30) {
        screenFlash.value = withSequence(
          withTiming(0.4, { duration: 50 }),
          withTiming(0, { duration: 340 }),
        );
      }

      // Score animations
      scorePulse.value = withSequence(
        withSpring(1.25, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );

      // Corner bracket glow + green border glow
      correctTrigger.current += 1;
      setCornerTrigger(correctTrigger.current);
      sceneBorderGlow.value = withSequence(
        withTiming(-1, { duration: 80 }),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
      );

      // Combo aura
      comboAura.value = withTiming(
        Math.min(1, Math.max(0, (streakRef.current - 2) / 5)),
        { duration: 500 },
      );

      // Detection ring
      ringIdRef.current += 1;
      const rid = ringIdRef.current;
      setDetectionRings(prev => [...prev, { id: rid, x: tapX, y: tapY }]);

      // Shape highlight ring + sparkles on the changed shape
      const changedShape = shapesRef.current.find(s => s.id === changedShapeId);
      if (changedShape) {
        highlightIdRef.current += 1;
        const hid = highlightIdRef.current;
        setShapeHighlights(prev => [...prev, { id: hid, x: changedShape.x, y: changedShape.y, r: changedShape.r }]);

        sparkleIdRef.current += 1;
        const sid = sparkleIdRef.current;
        setSparkles(prev => [...prev, { id: sid, x: changedShape.x, y: changedShape.y }]);
      }

      // Float score
      floatIdRef.current += 1;
      const fid = floatIdRef.current;
      setFloatScores(prev => [...prev, { id: fid, x: tapX, y: tapY, points: pts }]);
      setTimeout(() => {
        if (!cancelledRef.current) setFloatScores(prev => prev.filter(f => f.id !== fid));
      }, 1200);

      // Score trail
      trailIdRef.current += 1;
      const tid = trailIdRef.current;
      setScoreTrails(prev => [...prev, { id: tid, startX: tapX + 20, startY: tapY + 180, points: pts }]);

      // Precision label
      precIdRef.current += 1;
      setPrecisionEvent({ id: precIdRef.current, dist });

      // Speed bonus
      if (isFast) {
        speedIdRef.current += 1;
        const sid = speedIdRef.current;
        setSpeedBonus({ id: sid });
        setTimeout(() => {
          if (!cancelledRef.current) setSpeedBonus((cur) => cur?.id === sid ? null : cur);
        }, 800);
      }

      // Streak recovery check
      const wasRecovery = streakBrokenRef.current;
      setIsRecovery(wasRecovery);
      streakBrokenRef.current = false;
      setResultHistory(prev => [...prev.slice(-11), 'correct']);

      // Score milestone check (500, 1000, 2000, 3000)
      const milestones = [500, 1000, 2000, 3000];
      for (const m of milestones) {
        if (scoreRef.current >= m && lastMilestoneRef.current < m) {
          lastMilestoneRef.current = m;
          milestoneIdRef.current += 1;
          const mid = milestoneIdRef.current;
          setScoreMilestone({ id: mid, value: m });
          setTimeout(() => {
            if (!cancelledRef.current) setScoreMilestone((cur) => cur?.id === mid ? null : cur);
          }, 1200);
          break;
        }
      }

      // Confetti on streak milestones
      if ([3, 5, 8, 12].includes(streakRef.current)) {
        confettiIdRef.current += 1;
        const cid = confettiIdRef.current;
        setConfettiBursts(prev => [...prev, cid]);
        playStreak();
      }

      playCorrect();
      if (streakRef.current >= 3) playComboHit();
      neural.onCorrectAnswer(); burstCorrect({ x: tapX + 20, y: tapY + 180 });
    } else {
      setFeedback('wrong');
      if (streakRef.current >= 3) streakBrokenRef.current = true;
      streakRef.current = 0;
      setStreak(0);
      comboAura.value = withTiming(0, { duration: 400 });
      updateDifficulty('signal-noise', false);
      hapticError();
      rootShake.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      sceneBorderGlow.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
      );
      playWrong();
      neural.onWrongAnswer(); burstWrong({ x: tapX + 20, y: tapY + 180 });
      setWrongTap({ tapX, tapY, targetX: pos.x, targetY: pos.y });
      setIsRecovery(false);
      setResultHistory(prev => [...prev.slice(-11), 'wrong']);
    }

    feedbackTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setFeedback(null);
      setChangePos(null);
      changePosRef.current = null;
      setWrongTap(null);
      setChangedShapeId(null);
      if (roundRef.current < p.totalChanges) {
        scheduleChange();
      } else {
        finishGame();
      }
    }, 600);
  }, [gameState, scheduleChange, finishGame]);

  // Animated styles
  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }, { scale: punchScale.value }],
  }));
  const screenFlashStyle = useAnimatedStyle(() => ({
    opacity: screenFlash.value,
  }));
  const comboAuraStyle = useAnimatedStyle(() => ({
    opacity: comboAura.value * 0.35,
  }));
  const sceneBorderStyle = useAnimatedStyle(() => {
    const v = sceneBorderGlow.value;
    const isCorrect = v < 0;
    const abs = Math.abs(v);
    return {
      borderColor: isCorrect
        ? `rgba(110,207,154,${abs * 0.7})`
        : `rgba(232,112,126,${abs * 0.7})`,
      shadowColor: isCorrect ? '#6ECF9A' : '#E8707E',
      shadowOpacity: abs * 0.8,
    };
  });
  const dangerStyle = useAnimatedStyle(() => ({
    opacity: dangerTint.value * 0.2,
  }));
  const sceneZoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sceneZoomX.value },
      { translateY: sceneZoomY.value },
      { scale: sceneZoomScale.value * sceneExitScale.value },
    ],
    opacity: sceneExitOpacity.value,
  }));

  const progress = round / params.totalChanges;
  const accuracy = round > 0 ? correctRef.current / round : 1;

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      {/* Background */}
      <View style={styles.bgLayer} pointerEvents="none">
        <SensorBackground />
      </View>

      {/* Combo aura */}
      <Animated.View style={[StyleSheet.absoluteFillObject, comboAuraStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(92,170,201,0.28)', 'rgba(74,144,217,0.12)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Background pulse on shape change */}
      <Animated.View style={[StyleSheet.absoluteFillObject, bgPulseStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(92,170,201,0.4)', 'rgba(74,144,217,0.2)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <SensorGlyphs />
      {/* Temperature gradient — cools blue to warm as rounds progress */}
      {progress > 0.5 && (
        <Animated.View
          entering={FadeIn.duration(800)}
          style={[StyleSheet.absoluteFillObject, { opacity: (progress - 0.5) * 0.3 }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['rgba(217,74,107,0.15)', 'rgba(217,168,74,0.08)', 'rgba(0,0,0,0)']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}

      <FloatingParticles count={8} color="rgba(107,168,224,0.3)" />
      <FloatingParticles count={5} color="rgba(92,170,201,0.2)" />
      <FeedbackBurst {...burstFeedback} />

      <NeuralMapOverlay activeAreas={neural.activeAreas} pulseArea={neural.pulseArea} intensity={neural.intensity} />

      {/* Hearts bar */}
      <View style={styles.heartsRow}>
        {Array.from({ length: maxHearts }, (_, i) => (
          <Text
            key={i}
            style={[styles.heartIcon, i >= hearts && styles.heartDepleted]}
          >
            {i < hearts ? '♥' : '♡'}
          </Text>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>SCAN</Text>
          <Text style={styles.pillText}>{round}<Text style={styles.pillTextDim}>/{params.totalChanges}</Text></Text>
        </View>
        <Animated.View style={scorePulseStyle}>
          <AnimatedScore value={score} style={styles.scoreText} />
          <Text style={styles.scoreLabel}>POINTS</Text>
        </Animated.View>
        <View style={styles.streakSlot}>
          {streak > 2 && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.streakPill}>
              {streak >= 3 && <StreakFire streak={streak} />}
              <Text style={styles.streakText}>{streak}×</Text>
              <Text style={styles.streakLabel}>STREAK</Text>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Accuracy mini display */}
      {round > 0 && gameState === 'playing' && (
        <View style={styles.accuracyRow}>
          <View style={[styles.accuracyDot, { backgroundColor: accuracy >= 0.8 ? C.green : accuracy >= 0.5 ? C.amber : C.coral }]} />
          <Text style={styles.accuracyText}>{Math.round(accuracy * 100)}% accuracy</Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <LinearGradient
          colors={progress > 0.7 ? ['#D9A84A', '#D94A6B'] : ['#5CAAC9', '#4A90D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]}
        />
      </View>

      {/* Scene */}
      <View style={styles.sceneFrame}>
        <CornerBreathing />
        <CornerGlow trigger={cornerTrigger} />

        {/* Scene border glow on wrong */}
        <Animated.View
          style={[styles.sceneBorderGlow, sceneBorderStyle]}
          pointerEvents="none"
        />

        {/* Danger zone tint */}
        <Animated.View style={[styles.dangerOverlay, dangerStyle]} pointerEvents="none" />

        <Animated.View style={[{ width: '100%', height: '100%' }, sceneZoomStyle]}>
        <Pressable
          style={styles.scene}
          onPress={(e) => handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        >
          <LinearGradient
            colors={['#0C1220', '#080E18']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Scene vignette */}
          <View style={styles.sceneVignette} pointerEvents="none">
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
          {/* Scene inner glow */}
          <View style={styles.sceneInnerGlow} pointerEvents="none" />

          {/* Scene border heartbeat */}
          <SceneBorderHeartbeat />

          {/* Active scan indicator */}
          <ScanIndicator active={!!changePos && !feedback} />

          <SceneGrid />
          <RadarPing />
          <ScanSweep />

          {/* In-scene particles */}
          <FloatingParticles count={4} color="rgba(92,170,201,0.18)" />

          {/* Center dot */}
          <View style={styles.centerDot} pointerEvents="none" />

          {/* Analyzing text during idle */}
          {!changePos && !feedback && gameState === 'playing' && round > 0 && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.analyzingWrap}>
              <Text style={styles.analyzingText}>ANALYZING...</Text>
            </Animated.View>
          )}

          {/* Atmospheric data readout */}
          {gameState === 'playing' && (
            <View style={styles.dataReadout}>
              <Text style={styles.dataReadoutText}>
                SIG:{round > 0 ? 'ACTIVE' : 'STANDBY'} | ACC:{Math.round(accuracy * 100)}%
              </Text>
            </View>
          )}

          {/* Round label */}
          {round > 0 && gameState === 'playing' && (
            <View style={styles.roundLabel}>
              <Text style={styles.roundLabelText}>
                ROUND {round}/{params.totalChanges}
              </Text>
            </View>
          )}

          {gameState === 'playing' && <ScanReticle streak={streak} />}

          {shapes.map((shape, i) => (
            <ShapeOrb key={shape.id} shape={shape} index={i} justChanged={shape.id === changedShapeId} />
          ))}

          {/* Countdown ring during response window */}
          {changePos && !feedback && (
            <CountdownRing x={changePos.x} y={changePos.y} duration={2500} />
          )}

          {/* Tap crosshairs */}
          {tapCrosshairs.map(ch => (
            <TapCrosshair
              key={ch.id}
              x={ch.x}
              y={ch.y}
              onDone={() => setTapCrosshairs(prev => prev.filter(c => c.id !== ch.id))}
            />
          ))}

          {/* Signal lock + change glow at changed position */}
          {changePos && !feedback && (
            <>
              <SignalLock x={changePos.x} y={changePos.y} />
              <ChangeGlow x={changePos.x} y={changePos.y} />
            </>
          )}

          {/* Detection rings on correct */}
          {detectionRings.map(r => (
            <DetectionRing
              key={r.id}
              x={r.x}
              y={r.y}
              onDone={() => setDetectionRings(prev => prev.filter(d => d.id !== r.id))}
            />
          ))}

          {feedback === 'correct' && changePos && (
            <Animated.View
              entering={FadeIn.duration(120)}
              exiting={FadeOut.duration(220)}
              style={[styles.correctRipple, { left: changePos.x - 40, top: changePos.y - 40 }]}
            />
          )}

          {/* Scene feedback overlays */}
          {feedback === 'correct' && (
            <Animated.View entering={FadeIn.duration(60)} exiting={FadeOut.duration(300)}
              style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(110,207,154,0.08)' }]}
              pointerEvents="none" />
          )}
          {feedback === 'wrong' && (
            <Animated.View entering={FadeIn.duration(60)} exiting={FadeOut.duration(300)}
              style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(232,112,126,0.10)' }]}
              pointerEvents="none" />
          )}

          {feedback === 'missed' && changePos && (
            <MissedPulse x={changePos.x} y={changePos.y} />
          )}

          {/* Miss indicator — dashed line from wrong tap to actual change */}
          {feedback === 'wrong' && wrongTap && (
            <MissIndicator
              tapX={wrongTap.tapX}
              tapY={wrongTap.tapY}
              targetX={wrongTap.targetX}
              targetY={wrongTap.targetY}
            />
          )}

          {/* Shape highlights on correct */}
          {shapeHighlights.map(h => (
            <ShapeHighlight
              key={h.id}
              x={h.x}
              y={h.y}
              r={h.r}
              onDone={() => setShapeHighlights(prev => prev.filter(s => s.id !== h.id))}
            />
          ))}

          {/* Correct sparkle particles */}
          {sparkles.map(s => (
            <CorrectSparkle
              key={s.id}
              x={s.x}
              y={s.y}
              onDone={() => setSparkles(prev => prev.filter(sp => sp.id !== s.id))}
            />
          ))}

          {floatScores.map(f => (
            <FloatScore key={f.id} x={f.x} y={f.y} points={f.points} />
          ))}
        </Pressable>
        </Animated.View>
      </View>

      {/* Speed bonus label */}
      {speedBonus && (
        <Animated.View
          key={speedBonus.id}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(200)}
          style={styles.speedBonusWrap}
        >
          <Text style={styles.speedBonusText}>⚡ FAST</Text>
        </Animated.View>
      )}

      {/* Score trails */}
      {scoreTrails.map(t => (
        <ScoreTrail
          key={t.id}
          startX={t.startX}
          startY={t.startY}
          points={t.points}
          onDone={() => setScoreTrails(prev => prev.filter(x => x.id !== t.id))}
        />
      ))}

      {/* Precision label */}
      {precisionEvent && (
        <PrecisionLabel
          key={precisionEvent.id}
          dist={precisionEvent.dist}
          onDone={() => setPrecisionEvent(null)}
        />
      )}

      {/* Confetti */}
      {confettiBursts.map(cid => (
        <ConfettiBurst
          key={cid}
          onDone={() => setConfettiBursts(prev => prev.filter(x => x !== cid))}
        />
      ))}

      {/* Score milestone */}
      {scoreMilestone && (
        <Animated.View
          key={scoreMilestone.id}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(300)}
          style={styles.milestoneWrap}
        >
          <Text style={styles.milestoneText}>{scoreMilestone.value}!</Text>
        </Animated.View>
      )}

      {/* Screen flash */}
      <Animated.View style={[styles.screenFlash, screenFlashStyle]} pointerEvents="none" />

      {/* Combo multiplier */}
      {streak >= 2 && gameState === 'playing' && (
        <ComboMultiplier key={streak} streak={streak} />
      )}

      {/* Final scan announcement */}
      {round === params.totalChanges - 1 && gameState === 'playing' && !feedback && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.finalScanWrap}>
          <Text style={styles.finalScanText}>FINAL SCAN</Text>
        </Animated.View>
      )}

      {/* Result history dots */}
      {resultHistory.length > 0 && gameState === 'playing' && (
        <View style={styles.historyRow}>
          {resultHistory.slice(-12).map((r, i) => (
            <View
              key={i}
              style={[styles.historyDot, {
                backgroundColor: r === 'correct' ? C.green : r === 'wrong' ? C.coral : C.t3,
                opacity: 0.4 + (i / 12) * 0.6,
              }]}
            />
          ))}
        </View>
      )}

      {/* Bottom hint */}
      <View style={styles.bottomSlot}>
        {feedback === 'correct' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.correctText}>
            {isRecovery ? '✦ Back on track!' : CORRECT_TEXTS[Math.floor(Math.random() * CORRECT_TEXTS.length)]}
          </Animated.Text>
        )}
        {feedback === 'missed' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.missedText}>
            Too slow — it changed there
          </Animated.Text>
        )}
        {feedback === 'wrong' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.wrongText}>
            {streakBrokenRef.current ? 'Streak broken — stay focused' : 'Close, but not it'}
          </Animated.Text>
        )}
        {!feedback && round === 0 && gameState === 'playing' && (
          <Text style={styles.hintText}>Watch the shapes. Something will change…</Text>
        )}
        {!feedback && round > 0 && round < params.totalChanges - 1 && gameState === 'playing' && (
          <Text style={styles.hintText}>
            {streak >= 5 ? 'On fire — keep scanning!' :
             streak >= 3 ? 'Building momentum.' :
             'Stay focused. Spot the next change.'}
          </Text>
        )}
        {!feedback && round === params.totalChanges - 1 && gameState === 'playing' && (
          <Text style={[styles.hintText, { color: C.coral }]}>Last change — make it count.</Text>
        )}
      </View>

      {/* Intro */}
      {gameState === 'intro' && <IntroOverlay onDone={() => { setGameState('playing'); playRoundStart(); }} />}

      {/* Outro */}
      {gameState === 'outro' && (
        <OutroOverlay
          score={score}
          accuracy={params.totalChanges > 0 ? correctRef.current / params.totalChanges : 1}
          bestStreak={bestStreakRef.current}
          totalChanges={params.totalChanges}
          onDone={handleOutroDone}
        />
      )}
    </Animated.View>
  );
}
