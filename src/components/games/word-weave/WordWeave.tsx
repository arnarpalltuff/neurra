import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withSequence, withDelay, FadeIn, FadeOut, FadeInDown, FadeOutUp,
  Easing, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { selection, success, error as hapticError } from '../../../utils/haptics';
import { C } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { wordWeaveParams, updateDifficulty, getDifficulty } from '../../../utils/difficultyEngine';
import { shuffle } from '../../../utils/arrayUtils';
import { WORD_LIST } from '../../../constants/wordList';

const { width, height } = Dimensions.get('window');
const VALID_WORDS = WORD_LIST;

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

interface LetterItem {
  id: string;
  char: string;
  isBonus: boolean;
  angle: number;
}

interface WordWeaveProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
  isOnboarding?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Letter disc — one glowing orb in the orbit
// ─────────────────────────────────────────────────────────────
function LetterDisc({
  item, selected, x, y, onPress,
}: {
  item: LetterItem;
  selected: boolean;
  x: number;
  y: number;
  onPress: () => void;
}) {
  const breath = useSharedValue(1);
  const press = useSharedValue(1);
  const glow = useSharedValue(item.isBonus ? 0.4 : 0);

  // Breathing — each letter has its own slightly randomized tempo
  const breathDur = useMemo(() => 2400 + Math.random() * 1400, []);
  const breathDelay = useMemo(() => Math.random() * 1200, []);

  useEffect(() => {
    breath.value = withDelay(
      breathDelay,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: breathDur, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.96, { duration: breathDur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    if (item.isBonus) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    }
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x },
      { translateY: y },
      { scale: breath.value * press.value * (selected ? 0.78 : 1) },
    ],
    opacity: selected ? 0.32 : 1,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: item.isBonus ? 0.55 + glow.value * 0.35 : selected ? 0 : 0.55,
    transform: [{ scale: item.isBonus ? 1 + glow.value * 0.15 : 1 }],
  }));

  const handlePressIn = () => {
    press.value = withSpring(0.88, { damping: 10, stiffness: 220 });
  };
  const handlePressOut = () => {
    press.value = withSpring(1, { damping: 8, stiffness: 200 });
  };

  return (
    <Animated.View style={[styles.discWrap, outerStyle]} pointerEvents="box-none">
      {/* Outer halo */}
      <Animated.View
        style={[
          styles.discHalo,
          {
            backgroundColor: item.isBonus
              ? 'rgba(240,181,66,0.22)'
              : 'rgba(155,114,224,0.14)',
          },
          glowStyle,
        ]}
      />
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={selected}
        accessibilityLabel={`Letter ${item.char}`}
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <LinearGradient
          colors={
            item.isBonus
              ? ['#3A2A12', '#1A1220']
              : ['#1F2440', '#10131F']
          }
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[
            styles.discInner,
            {
              borderColor: item.isBonus
                ? 'rgba(240,181,66,0.55)'
                : 'rgba(200,180,255,0.18)',
              shadowColor: item.isBonus ? C.amber : '#8E8CFF',
            },
          ]}
        >
          <Text
            style={[
              styles.discLetter,
              {
                color: item.isBonus ? '#FFE8B0' : '#EDE9E0',
                textShadowColor: item.isBonus
                  ? 'rgba(240,181,66,0.6)'
                  : 'rgba(180,170,255,0.3)',
              },
            ]}
          >
            {item.char}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Decorative rotating ring behind the orbit
// ─────────────────────────────────────────────────────────────
function OrbitRing({ color = 'rgba(155,114,224,0.12)' }: { color?: string }) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(1, { duration: 60000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360}deg` }],
  }));
  return (
    <Animated.View style={[styles.orbitRing, { borderColor: color }, style]} pointerEvents="none">
      {/* Tick marks at 0, 120, 240 for motion cue */}
      <View style={[styles.orbitTick, { top: -3, left: '50%', marginLeft: -3, backgroundColor: color }]} />
      <View style={[styles.orbitTick, { bottom: -3, left: '25%', backgroundColor: color }]} />
      <View style={[styles.orbitTick, { bottom: -3, right: '25%', backgroundColor: color }]} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Faint background glyphs drifting in the distance
// ─────────────────────────────────────────────────────────────
function BackgroundGlyphs() {
  const g1 = useSharedValue(0);
  const g2 = useSharedValue(0);
  const g3 = useSharedValue(0);

  useEffect(() => {
    g1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    g2.value = withDelay(3000, withRepeat(
      withSequence(
        withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    ));
    g3.value = withDelay(6000, withRepeat(
      withSequence(
        withTiming(1, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    ));
  }, []);

  const style1 = useAnimatedStyle(() => ({
    opacity: interpolate(g1.value, [0, 1], [0.018, 0.05], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g1.value, [0, 1], [0, -14]) }],
  }));
  const style2 = useAnimatedStyle(() => ({
    opacity: interpolate(g2.value, [0, 1], [0.015, 0.04], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g2.value, [0, 1], [0, -10]) }],
  }));
  const style3 = useAnimatedStyle(() => ({
    opacity: interpolate(g3.value, [0, 1], [0.02, 0.045], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g3.value, [0, 1], [0, -12]) }],
  }));

  return (
    <>
      <Animated.Text style={[styles.bgGlyph, { top: height * 0.12, left: -20 }, style1]}>A</Animated.Text>
      <Animated.Text style={[styles.bgGlyph, { top: height * 0.42, right: -30 }, style2]}>W</Animated.Text>
      <Animated.Text style={[styles.bgGlyph, { bottom: height * 0.08, left: width * 0.1 }, style3]}>O</Animated.Text>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main game
// ─────────────────────────────────────────────────────────────
export default function WordWeave({ onComplete, initialLevel = 1, isOnboarding = false }: WordWeaveProps) {
  const diff = getDifficulty('word-weave', 0);
  const params = wordWeaveParams(Math.max(initialLevel, diff.level));

  const [letters, setLetters] = useState<LetterItem[]>([]);
  const letterBonusMap = useRef<Map<string, boolean>>(new Map());
  const [currentWord, setCurrentWord] = useState<string[]>([]);
  const [currentWordIds, setCurrentWordIds] = useState<string[]>([]);
  const [submittedWords, setSubmittedWords] = useState<{ word: string; points: number }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(isOnboarding ? 45 : params.timeLimit);
  const [feedbackEvent, setFeedbackEvent] = useState<{ word: string; valid: boolean; points: number; id: number } | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [floatScores, setFloatScores] = useState<{ id: number; points: number }[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const wordCountRef = useRef(0);
  const submittedRef = useRef<Set<string>>(new Set());
  const feedbackIdRef = useRef(0);

  // Animation primitives
  const wordBarScale = useSharedValue(1);
  const wordBarGlow = useSharedValue(0);
  const wordBarShake = useSharedValue(0);
  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);

  // Initialize letters
  useEffect(() => {
    const chars = generateLetters(params.letterCount);
    const angleStep = 360 / chars.length;
    const items: LetterItem[] = chars.map((char, i) => ({
      id: `${char}-${i}-${Date.now()}`,
      char,
      isBonus: params.hasBonusLetters && Math.random() < 0.15,
      angle: angleStep * i - 90, // start at top
    }));
    setLetters(items);
    letterBonusMap.current = new Map(items.map(item => [item.id, item.isBonus]));
  }, []);

  // Timer
  useEffect(() => {
    cancelledRef.current = false;
    timerRef.current = setInterval(() => {
      if (cancelledRef.current) return;
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          const accuracy = wordCountRef.current > 0 ? Math.min(1, wordCountRef.current / 8) : 0.5;
          onComplete(scoreRef.current, accuracy);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onComplete]);

  const tapLetter = useCallback((item: LetterItem) => {
    if (currentWordIds.includes(item.id)) return;
    selection();
    setCurrentWord((w) => [...w, item.char]);
    setCurrentWordIds((ids) => [...ids, item.id]);
  }, [currentWordIds]);

  const submitWord = useCallback(() => {
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
      setScore(s => s + pts);
      setWordCount(c => c + 1);
      setSubmittedWords(prev => [...prev.slice(-9), { word, points: pts }]);
      setFeedbackEvent({ word, valid: true, points: pts, id });
      setFloatScores(prev => [...prev, { id, points: pts }]);
      // Cleanup float text after it fades
      setTimeout(() => {
        if (!cancelledRef.current) {
          setFloatScores(prev => prev.filter(f => f.id !== id));
        }
      }, 1400);
      updateDifficulty('word-weave', true);
      wordBarScale.value = withSequence(
        withSpring(1.10, { damping: 5, stiffness: 180 }),
        withSpring(1, { damping: 8, stiffness: 160 }),
      );
      wordBarGlow.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 700 }),
      );
      scorePulse.value = withSequence(
        withSpring(1.25, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );
      success();
      burstCorrect({ x: width / 2, y: 180 });
    } else {
      setFeedbackEvent({ word, valid: false, points: 0, id });
      updateDifficulty('word-weave', false);
      wordBarShake.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      rootShake.value = withSequence(
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-2, { duration: 50 }),
        withTiming(2, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      hapticError();
      burstWrong({ x: width / 2, y: 180 });
    }

    setCurrentWord([]);
    setCurrentWordIds([]);
    setTimeout(() => {
      if (!cancelledRef.current) setFeedbackEvent((curr) => (curr && curr.id === id ? null : curr));
    }, 1400);
  }, [currentWord, currentWordIds]);

  const clearWord = useCallback(() => {
    selection();
    setCurrentWord([]);
    setCurrentWordIds([]);
  }, []);

  const backspace = useCallback(() => {
    if (currentWord.length === 0) return;
    selection();
    setCurrentWord((w) => w.slice(0, -1));
    setCurrentWordIds((ids) => ids.slice(0, -1));
  }, [currentWord.length]);

  // Animated styles
  const wordBarStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: wordBarScale.value },
      { translateX: wordBarShake.value },
    ],
  }));
  const wordBarGlowStyle = useAnimatedStyle(() => ({
    opacity: wordBarGlow.value,
  }));
  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }],
  }));

  const timeProgress = timeLeft / (isOnboarding ? 45 : params.timeLimit);
  const isUrgent = timeLeft <= 10;
  const isWarning = timeLeft <= 20 && !isUrgent;
  const canSubmit = currentWord.length >= 3;

  // Radius for letter orbit — responsive to letter count
  const r = letters.length >= 9 ? 118 : 108;

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      {/* ── Ambient background ───────────────────────── */}
      <LinearGradient
        colors={['#0B0A1A', '#0A0B17', '#07080F']}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(155,114,224,0.10)', 'rgba(0,0,0,0)']}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <BackgroundGlyphs />
      <FloatingParticles count={10} color="rgba(200,180,255,0.35)" />

      <FeedbackBurst {...burstFeedback} />

      {/* ── Header ───────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <View style={[styles.pillDot, { backgroundColor: C.green }]} />
          <Text style={styles.pillText}>{wordCount}</Text>
          <Text style={styles.pillLabel}>words</Text>
        </View>

        <View style={styles.timerWrap}>
          <Text
            style={[
              styles.timerDigits,
              isWarning && { color: C.amber },
              isUrgent && { color: C.coral },
            ]}
          >
            {timeLeft}
          </Text>
          <Text style={styles.timerUnit}>sec</Text>
        </View>

        <Animated.View style={[styles.pill, scorePulseStyle]}>
          <View style={[styles.pillDot, { backgroundColor: C.peach }]} />
          <Text style={[styles.pillText, { color: C.peach }]}>{score}</Text>
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

      {/* ── Word bar (hero) ──────────────────────────── */}
      <View style={styles.wordBarSlot}>
        <Animated.View
          style={[
            styles.wordBarGlow,
            wordBarGlowStyle,
          ]}
          pointerEvents="none"
        />
        <Animated.View style={[styles.wordBar, wordBarStyle]}>
          <LinearGradient
            colors={['rgba(31,36,64,0.9)', 'rgba(16,19,31,0.9)']}
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
                feedbackEvent.valid ? styles.feedbackValid : styles.feedbackInvalid,
              ]}
            >
              {feedbackEvent.valid
                ? `+${feedbackEvent.points}  ·  ${feedbackEvent.word.toUpperCase()}`
                : `"${feedbackEvent.word}"  ·  not a word`}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* ── Letter orbit ─────────────────────────────── */}
      <View style={styles.orbitContainer} pointerEvents="box-none">
        <View style={styles.orbit} pointerEvents="box-none">
          <OrbitRing />
          <OrbitRing color="rgba(240,181,66,0.08)" />
          {/* Center dot */}
          <View style={styles.centerDot} pointerEvents="none" />

          {letters.map((item) => {
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
                onPress={() => tapLetter(item)}
              />
            );
          })}

          {/* Floating score texts */}
          {floatScores.map((f) => (
            <FloatScore key={f.id} points={f.points} />
          ))}
        </View>
      </View>

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
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Floating "+N" score text that rises from the center
// ─────────────────────────────────────────────────────────────
function FloatScore({ points }: { points: number }) {
  const rise = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    rise.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
    fade.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(400, withTiming(0, { duration: 600 })),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateY: interpolate(rise.value, [0, 1], [0, -90]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.6, 1.15, 1]) },
    ],
  }));
  return (
    <Animated.Text style={[styles.floatScore, style]} pointerEvents="none">
      +{points}
    </Animated.Text>
  );
}

function wordPoints(len: number): number {
  if (len <= 3) return 50;
  if (len === 4) return 120;
  if (len === 5) return 250;
  if (len === 6) return 500;
  return 1000;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080F',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  bgGlyph: {
    position: 'absolute',
    fontSize: 260,
    fontWeight: '900',
    color: '#EDE9E0',
    letterSpacing: -8,
  },

  // Header
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    color: C.t1,
    fontSize: 14,
    fontWeight: '800',
  },
  pillLabel: {
    color: C.t3,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 2,
  },

  timerWrap: {
    alignItems: 'center',
  },
  timerDigits: {
    color: C.t1,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 30,
  },
  timerUnit: {
    color: C.t3,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: -2,
  },

  // Timer bar
  timerBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 18,
  },
  timerFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Word bar
  wordBarSlot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  wordBarGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 22,
    backgroundColor: 'rgba(125,211,168,0.35)',
  },
  wordBar: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.28)',
    overflow: 'hidden',
  },
  wordBarPlaceholder: {
    color: C.t3,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  wordBarLetters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wordBarLetter: {
    color: '#FFE8B0',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: 'rgba(240,181,66,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Feedback
  feedbackContainer: {
    height: 22,
    marginTop: 6,
    justifyContent: 'center',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  feedbackValid: {
    color: C.green,
  },
  feedbackInvalid: {
    color: C.coral,
  },

  // Orbit
  orbitContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  orbit: {
    width: 270,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    width: 236,
    height: 236,
    borderRadius: 118,
    borderWidth: 1,
  },
  orbitTick: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(240,181,66,0.28)',
  },

  discWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discHalo: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  discInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  discLetter: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  floatScore: {
    position: 'absolute',
    color: C.amber,
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(240,181,66,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  iconBtn: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 64,
  },
  iconBtnText: {
    color: C.t2,
    fontSize: 15,
    fontWeight: '800',
  },
  submitBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // Recent words
  recentWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    justifyContent: 'center',
    minHeight: 28,
  },
  stamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(155,114,224,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(155,114,224,0.25)',
  },
  stampWord: {
    color: C.t1,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stampPoints: {
    color: C.peach,
    fontSize: 10,
    fontWeight: '900',
  },
});
