import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withSequence, FadeIn, FadeOut, FadeInDown, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  selection, error as hapticError, tapLight, tapMedium, tapHeavy,
} from '../../../utils/haptics';
import {
  playCorrect, playWrong, playComboHit, playTimerWarning, playTimerTick,
  playRoundStart, playRoundEnd, playConfetti,
} from '../../../utils/sound';
import { C } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import NeuralMapOverlay from '../../ui/NeuralMapOverlay';
import { useNeuralMap } from '../../../hooks/useNeuralMap';
import { wordWeaveParams, updateDifficulty, getDifficulty } from '../../../utils/difficultyEngine';
import { shuffle } from '../../../utils/arrayUtils';
import { WORD_LIST } from '../../../constants/wordList';

import { styles } from './styles';
import { LetterDisc, type LetterItem } from './pieces/LetterDisc';
import { AnimatedScore } from './pieces/AnimatedScore';
import { TapComet } from './effects/TapComet';
import { MegaFlash, MegaBurst } from './effects/MegaFlash';
import { BonusSparkle } from './effects/BonusSparkle';
import { LetterEcho } from './effects/LetterEcho';
import { ScoreTrail } from './effects/ScoreTrail';
import { ConfettiBurst } from './effects/Confetti';
import { FloatScoreText } from './effects/FloatScoreText';
import { IntroOverlay } from './overlays/IntroOverlay';
import { OutroOverlay } from './overlays/OutroOverlay';
import { ComboBadge } from './overlays/ComboBadge';
import { FirstPlayHint } from './overlays/FirstPlayHint';
import { TierLabel } from './overlays/TierLabel';
import { NebulaBackground } from './background/NebulaBackground';
import { BackgroundGlyphs, BackgroundGlyphsFar } from './background/BackgroundGlyphs';
import { OrbitRing } from './background/OrbitRing';

const { width, height } = Dimensions.get('window');
const VALID_WORDS = WORD_LIST;

// Module-level flag: first-play hint shows once per app lifetime
let HAS_SEEN_HINT = false;

function generateLetters(count: number): string[] {
  const vowels = 'AEIOU';
  const consonants = 'BCDFGHLMNPRST';
  const letters: string[] = [];
  const vowelCount = Math.max(3, Math.floor(count * 0.35));
  for (let i = 0; i < vowelCount; i++) {
    letters.push(vowels[Math.floor(Math.random() * vowels.length)]);
  }
  for (let i = vowelCount; i < count; i++) {
    letters.push(consonants[Math.floor(Math.random() * consonants.length)]);
  }
  return shuffle(letters);
}

// Near-miss check: single letter substitution away from a real word.
function isNearMiss(word: string): boolean {
  if (word.length < 4) return false;
  const chars = word.split('');
  for (let i = 0; i < chars.length; i++) {
    const original = chars[i];
    for (let c = 97; c <= 122; c++) {
      const letter = String.fromCharCode(c);
      if (letter === original) continue;
      chars[i] = letter;
      const variant = chars.join('');
      if (VALID_WORDS.has(variant)) {
        chars[i] = original;
        return true;
      }
    }
    chars[i] = original;
  }
  return false;
}

function wordPoints(len: number): number {
  if (len <= 3) return 50;
  if (len === 4) return 120;
  if (len === 5) return 250;
  if (len === 6) return 500;
  return 1000;
}

// Progressive haptic by word length.
function hapticForLength(len: number): void {
  if (len <= 3) tapLight();
  else if (len <= 5) tapMedium();
  else if (len <= 6) { tapMedium(); setTimeout(tapMedium, 80); }
  else { tapHeavy(); setTimeout(tapHeavy, 90); setTimeout(tapMedium, 180); }
}

interface WordWeaveProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
  isOnboarding?: boolean;
}

type GameState = 'intro' | 'playing' | 'outro';

// ─────────────────────────────────────────────────────────────
// Main game
// ─────────────────────────────────────────────────────────────
export default function WordWeave({ onComplete, initialLevel = 1, isOnboarding = false }: WordWeaveProps) {
  const diff = getDifficulty('word-weave', 0);
  const params = wordWeaveParams(Math.max(initialLevel, diff.level));

  const [gameState, setGameState] = useState<GameState>('intro');
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const letterBonusMap = useRef<Map<string, boolean>>(new Map());
  const [currentWord, setCurrentWord] = useState<string[]>([]);
  const [currentWordIds, setCurrentWordIds] = useState<string[]>([]);
  const [submittedWords, setSubmittedWords] = useState<{ word: string; points: number }[]>([]);
  const [score, setScore] = useState(0);
  const TOTAL_TIME = isOnboarding ? 45 : params.timeLimit;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [feedbackEvent, setFeedbackEvent] = useState<{ word: string; points: number; id: number; kind: 'valid' | 'invalid' | 'nearMiss' } | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [floatScores, setFloatScores] = useState<{ id: number; points: number; big: boolean }[]>([]);
  const [comboCount, setComboCount] = useState(0);
  const [megaBursts, setMegaBursts] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [comets, setComets] = useState<{ id: number; x: number; y: number }[]>([]);
  const [echoes, setEchoes] = useState<{ id: number; char: string; x: number; y: number }[]>([]);
  const [megaFlash, setMegaFlash] = useState<{ word: string; id: number } | null>(null);
  const [confettiBursts, setConfettiBursts] = useState<number[]>([]);
  const [tierLabel, setTierLabel] = useState<{ text: string; color: string; id: number } | null>(null);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [scoreTrails, setScoreTrails] = useState<{ id: number; points: number }[]>([]);
  const cometIdRef = useRef(0);
  const echoIdRef = useRef(0);
  const confettiIdRef = useRef(0);
  const tierIdRef = useRef(0);
  const sparkleIdRef = useRef(0);
  const scoreTrailIdRef = useRef(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Unmount-only guard. All five consumers of `cancelledRef` below treat it
  // as "has the component unmounted?" — so it must only flip on real unmount,
  // not on intra-component state transitions like 'playing' → 'outro'.
  const cancelledRef = useRef(false);
  useEffect(() => {
    return () => { cancelledRef.current = true; };
  }, []);
  const scoreRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const neural = useNeuralMap('word-weave');
  const wordCountRef = useRef(0);
  const submittedRef = useRef<Set<string>>(new Set());
  const feedbackIdRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const bestWordRef = useRef<{ word: string; points: number } | null>(null);
  const totalLettersRef = useRef(0); // for avg length
  const megaIdRef = useRef(0);

  // Animation primitives
  const wordBarScale = useSharedValue(1);
  const wordBarGlow = useSharedValue(0);
  const wordBarShake = useSharedValue(0);
  const wordBarRotate = useSharedValue(0);
  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);
  const timerPulse = useSharedValue(1);
  const urgencyTint = useSharedValue(0);
  const punchScale = useSharedValue(1);
  const orbitFinale = useSharedValue(1);
  const screenFlash = useSharedValue(0);
  const submitGlow = useSharedValue(0);
  const pressureRing = useSharedValue(0);
  const comboAura = useSharedValue(0);

  // Initialize letters
  useEffect(() => {
    const chars = generateLetters(params.letterCount);
    const angleStep = 360 / chars.length;
    const items: LetterItem[] = chars.map((char, i) => ({
      id: `${char}-${i}-${Date.now()}`,
      char,
      isBonus: params.hasBonusLetters && Math.random() < 0.15,
      angle: angleStep * i - 90,
    }));
    setLetters(items);
    letterBonusMap.current = new Map(items.map(item => [item.id, item.isBonus]));
  }, []);

  // First-play hint
  useEffect(() => {
    if (!HAS_SEEN_HINT && gameState === 'playing') {
      setShowHint(true);
      HAS_SEEN_HINT = true;
    }
  }, [gameState]);

  // Finale orbit zoom + pressure ring — kick in at t<=5, release at 0
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft === 5) {
      orbitFinale.value = withTiming(1.15, { duration: 900, easing: Easing.out(Easing.cubic) });
      pressureRing.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.25, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else if (timeLeft === 0) {
      orbitFinale.value = withTiming(1, { duration: 400 });
      pressureRing.value = withTiming(0, { duration: 300 });
    }
  }, [timeLeft, gameState]);

  // Combo aura — background tint ramps with combo streak
  useEffect(() => {
    comboAura.value = withTiming(
      Math.min(1, Math.max(0, (comboCount - 2) / 6)),
      { duration: 500 },
    );
  }, [comboCount]);

  // Timer — only runs in 'playing' state
  useEffect(() => {
    if (gameState !== 'playing') return;
    timerRef.current = setInterval(() => {
      if (cancelledRef.current) return;
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setTimeout(() => {
            if (!cancelledRef.current) {
              setGameState('outro');
              playRoundEnd();
            }
          }, 0);
          return 0;
        }
        // Slow-mo warning pulse in final stretch
        if (t <= 10) playTimerTick();
        if (t <= 6) {
          playTimerWarning();
          timerPulse.value = withSequence(
            withSpring(1.18, { damping: 5 }),
            withSpring(1, { damping: 10 }),
          );
          tapLight();
        }
        // Urgency tint rises as time drops
        const ratio = 1 - (t / TOTAL_TIME);
        urgencyTint.value = withTiming(Math.max(0, Math.min(1, ratio * 1.3 - 0.3)), { duration: 800 });
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleIntroDone = useCallback(() => {
    setGameState('playing');
    playRoundStart();
  }, []);

  const handleOutroDone = useCallback(() => {
    if (cancelledRef.current) return;
    const accuracy = wordCountRef.current > 0 ? Math.min(1, wordCountRef.current / 8) : 0.5;
    onComplete(scoreRef.current, accuracy);
  }, [onComplete]);

  const tapLetter = useCallback((item: LetterItem) => {
    if (gameState !== 'playing') return;
    if (currentWordIds.includes(item.id)) return;
    selection();
    setCurrentWord((w) => [...w, item.char]);
    setCurrentWordIds((ids) => [...ids, item.id]);

    // Fire a comet from the tapped disc up to the word bar
    const rad = (item.angle * Math.PI) / 180;
    const radius = letters.length >= 9 ? 118 : 108;
    const cx = radius * Math.cos(rad);
    const cy = radius * Math.sin(rad);
    cometIdRef.current += 1;
    const cid = cometIdRef.current;
    setComets((prev) => [...prev, { id: cid, x: cx, y: cy }]);
  }, [currentWordIds, gameState, letters.length]);

  const removeComet = useCallback((id: number) => {
    setComets((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const removeEcho = useCallback((id: number) => {
    setEchoes((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const submitWord = useCallback(() => {
    if (gameState !== 'playing') return;
    const word = currentWord.join('').toLowerCase();
    if (word.length < 3) {
      setCurrentWord([]);
      setCurrentWordIds([]);
      return;
    }

    const isValid = VALID_WORDS.has(word);
    const isDuplicate = submittedRef.current.has(word);
    feedbackIdRef.current += 1;
    const id = feedbackIdRef.current;

    if (isValid && !isDuplicate) {
      submittedRef.current.add(word);
      const bonus = currentWordIds.some((i) => letterBonusMap.current.get(i));
      let pts = wordPoints(word.length);
      if (bonus) pts *= 2;
      scoreRef.current += pts;
      wordCountRef.current += 1;
      totalLettersRef.current += word.length;
      setScore(s => s + pts);
      setWordCount(c => c + 1);
      setSubmittedWords(prev => [...prev.slice(-9), { word, points: pts }]);
      setFeedbackEvent({ word, points: pts, id, kind: 'valid' });

      // Screen-punch zoom on every valid word
      punchScale.value = withSequence(
        withTiming(1.07, { duration: 110, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 7, stiffness: 160 }),
      );

      // Letter echoes from each consumed disc
      const rr = letters.length >= 9 ? 118 : 108;
      const idMap = new Map(letters.map(l => [l.id, l]));
      const newEchoes = currentWordIds.map((lid) => {
        const item = idMap.get(lid);
        if (!item) return null;
        const rad = (item.angle * Math.PI) / 180;
        echoIdRef.current += 1;
        return {
          id: echoIdRef.current,
          char: item.char,
          x: rr * Math.cos(rad),
          y: rr * Math.sin(rad),
        };
      }).filter(Boolean) as { id: number; char: string; x: number; y: number }[];
      if (newEchoes.length > 0) {
        setEchoes((prev) => [...prev, ...newEchoes]);
      }

      // Bonus sparkles at bonus disc positions (gold harvest moment)
      const newSparkles = currentWordIds
        .map((lid) => {
          if (!letterBonusMap.current.get(lid)) return null;
          const item = idMap.get(lid);
          if (!item) return null;
          const rad = (item.angle * Math.PI) / 180;
          sparkleIdRef.current += 1;
          return {
            id: sparkleIdRef.current,
            x: rr * Math.cos(rad),
            y: rr * Math.sin(rad),
          };
        })
        .filter(Boolean) as { id: number; x: number; y: number }[];
      if (newSparkles.length > 0) {
        setSparkles((prev) => [...prev, ...newSparkles]);
      }

      // Best word tracking — detect a new best for confetti
      const prevBest = bestWordRef.current?.points ?? 0;
      const isNewBest = pts > prevBest;
      if (!bestWordRef.current || pts > bestWordRef.current.points) {
        bestWordRef.current = { word, points: pts };
      }
      if (isNewBest && wordCountRef.current > 1) {
        confettiIdRef.current += 1;
        const confId = confettiIdRef.current;
        setConfettiBursts((prev) => [...prev, confId]);
        playConfetti();
      }

      // Combo
      comboRef.current += 1;
      setComboCount(comboRef.current);
      if (comboRef.current > maxComboRef.current) {
        maxComboRef.current = comboRef.current;
      }

      // Float score (big for long words)
      const big = word.length >= 6;
      setFloatScores(prev => [...prev, { id, points: pts, big }]);
      setTimeout(() => {
        if (!cancelledRef.current) {
          setFloatScores(prev => prev.filter(f => f.id !== id));
        }
      }, 1400);

      // Mega burst for 6+ letters — ring + chromatic flash + screen flash
      if (word.length >= 6) {
        megaIdRef.current += 1;
        const mid = megaIdRef.current;
        setMegaBursts(prev => [...prev, mid]);
        setMegaFlash({ word, id: mid });
        screenFlash.value = withSequence(
          withTiming(0.55, { duration: 50, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 360, easing: Easing.in(Easing.cubic) }),
        );
        setTimeout(() => {
          if (!cancelledRef.current) {
            setMegaBursts(prev => prev.filter(x => x !== mid));
          }
        }, 900);
      }

      // Tier label — NICE / GREAT / MEGA / LEGENDARY
      const tier =
        word.length >= 8 ? { text: 'LEGENDARY', color: '#FFE8B0' } :
        word.length === 7 ? { text: 'MEGA', color: C.peach } :
        word.length === 6 ? { text: 'GREAT', color: C.amber } :
        word.length === 5 ? { text: 'NICE', color: C.green } :
        null;
      if (tier) {
        tierIdRef.current += 1;
        setTierLabel({ ...tier, id: tierIdRef.current });
      }

      updateDifficulty('word-weave', true);
      wordBarScale.value = withSequence(
        withSpring(1.10, { damping: 5, stiffness: 180 }),
        withSpring(1, { damping: 8, stiffness: 160 }),
      );
      wordBarRotate.value = withSequence(
        withTiming(4, { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(-3, { duration: 130, easing: Easing.inOut(Easing.sin) }),
        withSpring(0, { damping: 9, stiffness: 170 }),
      );
      wordBarGlow.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 700 }),
      );

      // Spawn a score trail from word bar up to score pill
      scoreTrailIdRef.current += 1;
      const trailId = scoreTrailIdRef.current;
      setScoreTrails((prev) => [...prev, { id: trailId, points: pts }]);
      scorePulse.value = withSequence(
        withSpring(1.25, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );
      hapticForLength(word.length);
      playCorrect();
      if (comboRef.current >= 3) playComboHit();
      neural.onCorrectAnswer();
      burstCorrect({ x: width / 2, y: 180 });
    } else {
      // Near-miss check
      const nearMiss = !isValid && !isDuplicate && isNearMiss(word);
      setFeedbackEvent({
        word,
        points: 0,
        id,
        kind: nearMiss ? 'nearMiss' : 'invalid',
      });
      comboRef.current = 0;
      setComboCount(0);
      updateDifficulty('word-weave', false);
      wordBarShake.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      if (nearMiss) {
        tapLight();
      } else {
        rootShake.value = withSequence(
          withTiming(-3, { duration: 50 }),
          withTiming(3, { duration: 50 }),
          withTiming(-2, { duration: 50 }),
          withTiming(2, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        );
        hapticError();
        playWrong();
      }
      neural.onWrongAnswer();
      burstWrong({ x: width / 2, y: 180 });
    }

    setCurrentWord([]);
    setCurrentWordIds([]);
    setTimeout(() => {
      if (!cancelledRef.current) setFeedbackEvent((curr) => (curr && curr.id === id ? null : curr));
    }, 1400);
  }, [currentWord, currentWordIds, gameState]);

  const clearWord = useCallback(() => {
    if (gameState !== 'playing') return;
    selection();
    setCurrentWord([]);
    setCurrentWordIds([]);
  }, [gameState]);

  const backspace = useCallback(() => {
    if (gameState !== 'playing') return;
    if (currentWord.length === 0) return;
    selection();
    setCurrentWord((w) => w.slice(0, -1));
    setCurrentWordIds((ids) => ids.slice(0, -1));
  }, [currentWord.length, gameState]);

  // Animated styles
  const wordBarStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: wordBarScale.value },
      { translateX: wordBarShake.value },
      { rotate: `${wordBarRotate.value}deg` },
    ],
  }));
  const wordBarGlowStyle = useAnimatedStyle(() => ({
    opacity: wordBarGlow.value,
  }));
  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rootShake.value },
      { scale: punchScale.value },
    ],
  }));
  const orbitFinaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbitFinale.value }],
  }));
  const timerPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerPulse.value }],
  }));
  const urgencyOverlayStyle = useAnimatedStyle(() => ({
    opacity: urgencyTint.value * 0.22,
  }));

  const timeProgress = timeLeft / TOTAL_TIME;
  const isUrgent = timeLeft <= 10;
  const isWarning = timeLeft <= 20 && !isUrgent;
  const isFinalStretch = timeLeft <= 5;
  const canSubmit = currentWord.length >= 3;

  // Submit button glow breathing when armed
  useEffect(() => {
    if (canSubmit) {
      submitGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else {
      submitGlow.value = withTiming(0, { duration: 200 });
    }
  }, [canSubmit]);

  const screenFlashStyle = useAnimatedStyle(() => ({
    opacity: screenFlash.value,
  }));
  const submitGlowStyle = useAnimatedStyle(() => ({
    opacity: submitGlow.value * 0.75,
    transform: [{ scale: 1 + submitGlow.value * 0.04 }],
  }));
  const pressureRingStyle = useAnimatedStyle(() => ({
    opacity: pressureRing.value * 0.7,
    transform: [{ scale: 1 + pressureRing.value * 0.06 }],
  }));
  const comboAuraStyle = useAnimatedStyle(() => ({
    opacity: comboAura.value * 0.35,
  }));

  const r = letters.length >= 9 ? 118 : 108;

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      {/* ── Ambient background ───────────────────────── */}
      <View style={styles.nebulaLayer} pointerEvents="none">
        <NebulaBackground />
      </View>
      <LinearGradient
        colors={['rgba(155,114,224,0.10)', 'rgba(0,0,0,0)']}
        style={styles.topGlow}
        pointerEvents="none"
      />
      {/* Urgency warm overlay — bleeds in as time drops */}
      <Animated.View style={[StyleSheet.absoluteFillObject, urgencyOverlayStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(232,112,126,0.25)', 'rgba(224,155,107,0.12)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      {/* Combo aura — tint deepens with streak */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, comboAuraStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['rgba(240,181,66,0.30)', 'rgba(224,155,107,0.14)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <BackgroundGlyphsFar />
      <BackgroundGlyphs />
      <FloatingParticles count={10} color="rgba(200,180,255,0.35)" />
      <FloatingParticles count={6} color="rgba(240,181,66,0.25)" />

      <FeedbackBurst {...burstFeedback} />

      <NeuralMapOverlay
        activeAreas={neural.activeAreas}
        pulseArea={neural.pulseArea}
        intensity={neural.intensity}
      />

      {/* ── Header ───────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <View style={[styles.pillDot, { backgroundColor: C.green }]} />
          <Text style={styles.pillText}>{wordCount}</Text>
          <Text style={styles.pillLabel}>words</Text>
        </View>

        <Animated.View style={[styles.timerWrap, timerPulseStyle]}>
          <Text
            style={[
              styles.timerDigits,
              isWarning && { color: C.amber },
              isUrgent && { color: C.coral },
              isFinalStretch && styles.timerDigitsFinal,
            ]}
          >
            {timeLeft}
          </Text>
          <Text style={styles.timerUnit}>sec</Text>
        </Animated.View>

        <Animated.View style={[styles.pill, scorePulseStyle]}>
          <View style={[styles.pillDot, { backgroundColor: C.peach }]} />
          <AnimatedScore value={score} style={[styles.pillText, { color: C.peach }]} />
        </Animated.View>
      </View>

      {/* ── Timer bar ────────────────────────────────── */}
      <View style={styles.timerBar}>
        <LinearGradient
          colors={
            isUrgent
              ? ['#FF4B6A', '#E8707E']
              : isWarning
              ? ['#F0B542', '#E09B6B']
              : ['#7DD3A8', '#6ECF9A']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.timerFill, { width: `${Math.max(0, timeProgress * 100)}%` }]}
        />
      </View>

      {/* ── Combo badge ──────────────────────────────── */}
      <View style={styles.comboSlot}>
        {comboCount >= 3 && <ComboBadge count={comboCount} />}
      </View>

      {/* ── Word bar (hero) ──────────────────────────── */}
      <View style={styles.wordBarSlot}>
        <Animated.View
          style={[styles.wordBarGlow, wordBarGlowStyle]}
          pointerEvents="none"
        />
        <Animated.View style={[styles.wordBar, wordBarStyle]}>
          <BlurView
            intensity={40}
            tint="dark"
            style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
          />
          <LinearGradient
            colors={['rgba(31,36,64,0.55)', 'rgba(16,19,31,0.55)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {currentWord.length === 0 ? (
            <Text style={styles.wordBarPlaceholder}>Tap letters to weave a word</Text>
          ) : (
            <View style={styles.wordBarLetters}>
              {currentWord.map((ch, i) => (
                <Animated.Text
                  key={`${ch}-${i}`}
                  entering={FadeInDown.duration(180)}
                  style={styles.wordBarLetter}
                >
                  {ch}
                </Animated.Text>
              ))}
            </View>
          )}
        </Animated.View>
      </View>

      {/* ── Feedback toast ───────────────────────────── */}
      <View style={styles.feedbackContainer}>
        {feedbackEvent && (
          <Animated.View
            key={feedbackEvent.id}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(220)}
          >
            <Text
              style={[
                styles.feedbackText,
                feedbackEvent.kind === 'valid' && styles.feedbackValid,
                feedbackEvent.kind === 'invalid' && styles.feedbackInvalid,
                feedbackEvent.kind === 'nearMiss' && styles.feedbackNearMiss,
              ]}
            >
              {feedbackEvent.kind === 'valid' && `+${feedbackEvent.points}  ·  ${feedbackEvent.word.toUpperCase()}`}
              {feedbackEvent.kind === 'invalid' && `"${feedbackEvent.word}"  ·  not a word`}
              {feedbackEvent.kind === 'nearMiss' && `"${feedbackEvent.word}"  ·  so close`}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* ── Letter orbit ─────────────────────────────── */}
      <View style={styles.orbitContainer} pointerEvents="box-none">
        <Animated.View style={[styles.orbit, orbitFinaleStyle]} pointerEvents="box-none">
          <OrbitRing combo={comboCount} />
          <OrbitRing color="rgba(240,181,66,0.08)" combo={comboCount} />
          {/* Pressure ring — pulses during final 5 seconds */}
          <Animated.View
            style={[styles.pressureRing, pressureRingStyle]}
            pointerEvents="none"
          />
          <View style={styles.centerDot} pointerEvents="none" />

          {letters.map((item, index) => {
            const isSelected = currentWordIds.includes(item.id);
            const rad = (item.angle * Math.PI) / 180;
            const x = r * Math.cos(rad);
            const y = r * Math.sin(rad);
            return (
              <LetterDisc
                key={item.id}
                item={item}
                selected={isSelected}
                x={x}
                y={y}
                startDelay={index * 60}
                isPlaying={gameState === 'playing'}
                onPress={() => tapLetter(item)}
              />
            );
          })}

          {/* Mega burst rings */}
          {megaBursts.map((id) => (
            <MegaBurst key={id} onDone={() => {}} />
          ))}

          {/* Letter echoes — ghost copies of used letters */}
          {echoes.map((e) => (
            <LetterEcho
              key={e.id}
              char={e.char}
              x={e.x}
              y={e.y}
              onDone={() => removeEcho(e.id)}
            />
          ))}

          {/* Bonus sparkles — gold harvest rings on bonus letters */}
          {sparkles.map((s) => (
            <BonusSparkle
              key={s.id}
              x={s.x}
              y={s.y}
              onDone={() =>
                setSparkles((prev) => prev.filter((x) => x.id !== s.id))
              }
            />
          ))}

          {/* Tap comets — fly from tapped disc to word bar */}
          {comets.map((c) => (
            <TapComet
              key={c.id}
              startX={c.x}
              startY={c.y}
              onDone={() => removeComet(c.id)}
            />
          ))}

          {/* Floating score texts */}
          {floatScores.map((f) => (
            <FloatScoreText key={f.id} points={f.points} big={f.big} />
          ))}
        </Animated.View>
      </View>

      {/* ── Mega chromatic flash (6+ letters) ───────── */}
      {megaFlash && (
        <MegaFlash
          key={megaFlash.id}
          word={megaFlash.word}
          triggerId={megaFlash.id}
          onDone={() => setMegaFlash(null)}
        />
      )}

      {/* ── Tier label (NICE / GREAT / MEGA / LEGENDARY) ─ */}
      {tierLabel && (
        <TierLabel
          key={tierLabel.id}
          text={tierLabel.text}
          color={tierLabel.color}
          onDone={() => setTierLabel(null)}
        />
      )}

      {/* ── Confetti bursts on new best word ────────── */}
      {confettiBursts.map((cid) => (
        <ConfettiBurst
          key={cid}
          onDone={() =>
            setConfettiBursts((prev) => prev.filter((x) => x !== cid))
          }
        />
      ))}

      {/* ── Score trails — ghost +N flying to score pill ─ */}
      {scoreTrails.map((t) => (
        <ScoreTrail
          key={t.id}
          points={t.points}
          onDone={() =>
            setScoreTrails((prev) => prev.filter((x) => x.id !== t.id))
          }
        />
      ))}

      {/* ── Screen-wide white flash on mega word ─────── */}
      <Animated.View
        style={[styles.screenFlash, screenFlashStyle]}
        pointerEvents="none"
      />

      {/* ── Actions ──────────────────────────────────── */}
      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} onPress={clearWord} accessibilityLabel="Clear word">
          <Text style={styles.iconBtnText}>Clear</Text>
        </Pressable>
        <Pressable
          style={[styles.iconBtn, currentWord.length === 0 && styles.btnDisabled]}
          onPress={backspace}
          disabled={currentWord.length === 0}
          accessibilityLabel="Delete last letter"
        >
          <Text style={styles.iconBtnText}>⌫</Text>
        </Pressable>
        <View style={styles.submitWrap}>
          <Animated.View
            style={[styles.submitGlow, submitGlowStyle]}
            pointerEvents="none"
          />
          <Pressable
            style={[styles.submitBtn, !canSubmit && styles.btnDisabled]}
            onPress={submitWord}
            disabled={!canSubmit}
            accessibilityLabel="Submit word"
          >
            <LinearGradient
              colors={canSubmit ? ['#7DD3A8', '#6ECF9A'] : ['#2A3550', '#1F2A42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
            />
            <Text style={[styles.submitText, { color: canSubmit ? '#08120A' : C.t3 }]}>
              {canSubmit ? 'Submit' : currentWord.length === 0 ? 'Pick letters' : `${3 - currentWord.length} more`}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Recent words as stamps ───────────────────── */}
      <View style={styles.recentWords}>
        {submittedWords.slice(-6).map((w, i, arr) => {
          const age = arr.length - 1 - i;
          const opacity = 1 - age * 0.12;
          return (
            <View key={`${w.word}-${i}`} style={[styles.stamp, { opacity: Math.max(0.35, opacity) }]}>
              <Text style={styles.stampWord}>{w.word}</Text>
              <Text style={styles.stampPoints}>+{w.points}</Text>
            </View>
          );
        })}
      </View>

      {/* ── First-play hint ─────────────────────────── */}
      {showHint && (
        <FirstPlayHint onDismiss={() => setShowHint(false)} />
      )}

      {/* ── Intro overlay ───────────────────────────── */}
      {gameState === 'intro' && <IntroOverlay onDone={handleIntroDone} />}

      {/* ── Outro overlay ───────────────────────────── */}
      {gameState === 'outro' && (
        <OutroOverlay
          score={score}
          wordCount={wordCount}
          bestWord={bestWordRef.current?.word ?? null}
          bestWordPoints={bestWordRef.current?.points ?? 0}
          maxCombo={maxComboRef.current}
          avgLen={wordCount > 0 ? totalLettersRef.current / wordCount : 0}
          onDone={handleOutroDone}
        />
      )}
    </Animated.View>
  );
}
