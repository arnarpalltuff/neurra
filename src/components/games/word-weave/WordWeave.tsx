import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withSequence, withDelay, FadeIn, FadeOut, FadeInDown, FadeOutUp,
  Easing, interpolate, Extrapolation, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import {
  selection, success, error as hapticError, tapLight, tapMedium, tapHeavy,
} from '../../../utils/haptics';
import {
  playCorrect, playWrong, playComboHit, playTimerWarning, playTimerTick,
  playRoundStart, playRoundEnd, playConfetti, playPerfect, playTap,
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

type GameState = 'intro' | 'playing' | 'outro';

// ─────────────────────────────────────────────────────────────
// Letter disc — glowing orb that flies in from center on start
// ─────────────────────────────────────────────────────────────
function LetterDisc({
  item, selected, x, y, onPress, startDelay, isPlaying,
}: {
  item: LetterItem;
  selected: boolean;
  x: number;
  y: number;
  onPress: () => void;
  startDelay: number;
  isPlaying: boolean;
}) {
  const breath = useSharedValue(1);
  const press = useSharedValue(1);
  const glow = useSharedValue(item.isBonus ? 0.4 : 0);
  const entry = useSharedValue(0);

  const breathDur = useMemo(() => 2400 + Math.random() * 1400, []);
  const breathDelay = useMemo(() => Math.random() * 1200, []);

  useEffect(() => {
    // Entry animation: fly in from center with stagger
    entry.value = withDelay(
      startDelay,
      withSpring(1, { damping: 12, stiffness: 120, mass: 0.9 }),
    );
    // Breathing loop
    breath.value = withDelay(
      breathDelay + startDelay + 600,
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
      glow.value = withDelay(
        startDelay + 400,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        ),
      );
    }
  }, []);

  const outerStyle = useAnimatedStyle(() => {
    const e = entry.value;
    return {
      transform: [
        { translateX: x * e },
        { translateY: y * e },
        { scale: breath.value * press.value * (selected ? 0.78 : 1) * (0.3 + 0.7 * e) },
      ],
      opacity: (selected ? 0.32 : 1) * e,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: item.isBonus ? 0.55 + glow.value * 0.35 : selected ? 0 : 0.55,
    transform: [{ scale: item.isBonus ? 1 + glow.value * 0.15 : 1 }],
  }));

  const handlePressIn = () => {
    if (!isPlaying) return;
    press.value = withSpring(0.88, { damping: 10, stiffness: 220 });
  };
  const handlePressOut = () => {
    press.value = withSpring(1, { damping: 8, stiffness: 200 });
  };

  const orbId = `orb-${item.id}`;
  const shineId = `shine-${item.id}`;
  const bonus = item.isBonus;

  return (
    <Animated.View style={[styles.discWrap, outerStyle]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.discHalo,
          {
            backgroundColor: bonus
              ? 'rgba(240,181,66,0.32)'
              : 'rgba(155,114,224,0.22)',
          },
          glowStyle,
        ]}
      />
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={selected || !isPlaying}
        accessibilityLabel={`Letter ${item.char}`}
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <View
          style={[
            styles.discInner,
            {
              borderColor: bonus
                ? 'rgba(255,220,120,0.8)'
                : 'rgba(200,180,255,0.35)',
              shadowColor: bonus ? C.amber : '#8E8CFF',
              shadowOpacity: bonus ? 0.8 : 0.5,
              shadowRadius: bonus ? 14 : 10,
            },
          ]}
        >
          <Svg width={54} height={54} style={StyleSheet.absoluteFillObject}>
            <Defs>
              <RadialGradient
                id={orbId}
                cx="32%"
                cy="26%"
                rx="78%"
                ry="78%"
                fx="32%"
                fy="26%"
              >
                {bonus
                  ? [
                      <Stop key="0" offset="0%" stopColor="#FFE8A8" stopOpacity="1" />,
                      <Stop key="1" offset="45%" stopColor="#D19B2A" stopOpacity="1" />,
                      <Stop key="2" offset="100%" stopColor="#3A2410" stopOpacity="1" />,
                    ]
                  : [
                      <Stop key="0" offset="0%" stopColor="#5A6AA0" stopOpacity="1" />,
                      <Stop key="1" offset="50%" stopColor="#1F2440" stopOpacity="1" />,
                      <Stop key="2" offset="100%" stopColor="#080A18" stopOpacity="1" />,
                    ]}
              </RadialGradient>
              <RadialGradient
                id={shineId}
                cx="30%"
                cy="22%"
                rx="45%"
                ry="45%"
                fx="30%"
                fy="22%"
              >
                <Stop
                  offset="0%"
                  stopColor="#FFFFFF"
                  stopOpacity={bonus ? '0.85' : '0.55'}
                />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={27} cy={27} r={25} fill={`url(#${orbId})`} />
            <Circle cx={27} cy={27} r={23} fill={`url(#${shineId})`} />
          </Svg>
          <Text
            style={[
              styles.discLetter,
              {
                color: bonus ? '#FFF4C8' : '#F2EDE4',
                textShadowColor: bonus
                  ? 'rgba(255,220,120,0.85)'
                  : 'rgba(200,190,255,0.55)',
                textShadowRadius: bonus ? 12 : 8,
              },
            ]}
          >
            {item.char}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Decorative rotating ring — speeds up with combo
// ─────────────────────────────────────────────────────────────
function OrbitRing({
  color = 'rgba(155,114,224,0.12)',
  combo = 0,
}: { color?: string; combo?: number }) {
  const rot = useSharedValue(0);
  const speed = useSharedValue(1);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(1, { duration: 60000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);
  useEffect(() => {
    speed.value = withTiming(Math.min(3.5, 1 + combo * 0.22), { duration: 500 });
  }, [combo]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360 * speed.value}deg` }],
  }));
  return (
    <Animated.View style={[styles.orbitRing, { borderColor: color }, style]} pointerEvents="none">
      <View style={[styles.orbitTick, { top: -3, left: '50%', marginLeft: -3, backgroundColor: color }]} />
      <View style={[styles.orbitTick, { bottom: -3, left: '25%', backgroundColor: color }]} />
      <View style={[styles.orbitTick, { bottom: -3, right: '25%', backgroundColor: color }]} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Ambient drifting background glyphs
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
// Intro overlay: 3-2-1 countdown with title and brain area
// ─────────────────────────────────────────────────────────────
function IntroOverlay({ onDone }: { onDone: () => void }) {
  const titleScale = useSharedValue(0.7);
  const titleOpacity = useSharedValue(0);
  const subOpacity = useSharedValue(0);
  const goScale = useSharedValue(0);
  const goOpacity = useSharedValue(0);

  useEffect(() => {
    titleScale.value = withSpring(1, { damping: 10, stiffness: 140 });
    titleOpacity.value = withTiming(1, { duration: 300 });
    subOpacity.value = withDelay(400, withTiming(1, { duration: 280 }));
    goScale.value = withDelay(900, withSequence(
      withSpring(1.2, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 10 }),
    ));
    goOpacity.value = withDelay(900, withTiming(1, { duration: 140 }));
    tapMedium();
    const goHaptic = setTimeout(() => success(), 900);
    const done = setTimeout(onDone, 1600);
    return () => {
      clearTimeout(goHaptic);
      clearTimeout(done);
    };
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subOpacity.value }));
  const goStyle = useAnimatedStyle(() => ({
    transform: [{ scale: goScale.value }],
    opacity: goOpacity.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(260)}
      style={styles.overlay}
      pointerEvents="auto"
    >
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(7,8,15,0.45)' },
        ]}
      />
      <View style={styles.introCenter}>
        <Animated.Text style={[styles.introTitle, titleStyle]}>
          Word Weave
        </Animated.Text>
        <Animated.Text style={[styles.introSub, subStyle]}>
          Tap letters · form words · longer = more points
        </Animated.Text>
        <Animated.Text style={[styles.introGo, goStyle]}>
          GO
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Outro overlay: summary card with best word highlighted
// ─────────────────────────────────────────────────────────────
function OutroOverlay({
  score, wordCount, bestWord, bestWordPoints, maxCombo, avgLen, onDone,
}: {
  score: number;
  wordCount: number;
  bestWord: string | null;
  bestWordPoints: number;
  maxCombo: number;
  avgLen: number;
  onDone: () => void;
}) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const bestRowScale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 300 });
    bestRowScale.value = withDelay(
      400,
      withSpring(1, { damping: 8, stiffness: 140 }),
    );
    tapMedium();
    setTimeout(() => { success(); }, 500);
    const done = setTimeout(onDone, 2600);
    return () => clearTimeout(done);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const bestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bestRowScale.value }],
    opacity: bestRowScale.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(260)}
      style={styles.overlay}
      pointerEvents="auto"
    >
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(7,8,15,0.60)' },
        ]}
      />
      <Animated.View style={[styles.outroCard, cardStyle]}>
        <View style={styles.outroHeader}>
          <View style={styles.outroStripe} />
          <Text style={styles.outroLabel}>TIME</Text>
          <View style={styles.outroStripe} />
        </View>

        <Text style={styles.outroScoreLabel}>FINAL SCORE</Text>
        <OutroScoreText target={score} style={styles.outroScore} />

        {bestWord && (
          <Animated.View style={[styles.bestRow, bestStyle]}>
            <Text style={styles.bestLabel}>BEST WORD</Text>
            <Text style={styles.bestWord}>{bestWord.toUpperCase()}</Text>
            <Text style={styles.bestPoints}>+{bestWordPoints}</Text>
          </Animated.View>
        )}

        <View style={styles.outroStatsRow}>
          <View style={styles.outroStat}>
            <OutroCountUp
              target={wordCount}
              delay={400}
              format="int"
              style={styles.outroStatValue}
            />
            <Text style={styles.outroStatLabel}>WORDS</Text>
          </View>
          <View style={styles.outroStatDivider} />
          <View style={styles.outroStat}>
            <OutroCountUp
              target={maxCombo}
              delay={550}
              format="intX"
              style={styles.outroStatValue}
            />
            <Text style={styles.outroStatLabel}>BEST COMBO</Text>
          </View>
          <View style={styles.outroStatDivider} />
          <View style={styles.outroStat}>
            <OutroCountUp
              target={avgLen}
              delay={700}
              format="float"
              style={styles.outroStatValue}
            />
            <Text style={styles.outroStatLabel}>AVG LENGTH</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Combo badge — floating chip when streak ≥ 3
// ─────────────────────────────────────────────────────────────
function ComboBadge({ count }: { count: number }) {
  const s = useSharedValue(0.6);
  const color = count >= 8 ? '#7DD3A8' : count >= 5 ? '#E09B6B' : C.amber;
  const label = count >= 8 ? 'BLAZING' : count >= 5 ? 'HOT' : 'STREAK';
  useEffect(() => {
    s.value = withSequence(
      withSpring(1.2, { damping: 6 }),
      withSpring(1, { damping: 10 }),
    );
  }, [count]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
  }));
  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.comboBadge,
        { borderColor: color, shadowColor: color, backgroundColor: `${color}15` },
        style,
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.comboBadgeCount, { color }]}>{count}×</Text>
      <Text style={[styles.comboBadgeLabel, { color }]}>{label}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Mega burst for 6+ letter words
// ─────────────────────────────────────────────────────────────
function MegaBurst({ onDone }: { onDone: () => void }) {
  const ring = useSharedValue(0);
  useEffect(() => {
    ring.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.1, 1], [0, 0.95, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.2, 2.4]) }],
  }));
  return (
    <Animated.View style={[styles.megaRing, style]} pointerEvents="none" />
  );
}

// ─────────────────────────────────────────────────────────────
// First-play hint
// ─────────────────────────────────────────────────────────────
function FirstPlayHint({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(300)}
      exiting={FadeOutUp.duration(260)}
      style={styles.hintCard}
    >
      <View style={styles.hintDot} />
      <Text style={styles.hintText}>
        Longer words = <Text style={{ color: C.amber }}>exponentially</Text> more points
      </Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Tier label — big floating announce for long words
// ─────────────────────────────────────────────────────────────
function TierLabel({
  text, color, onDone,
}: { text: string; color: string; onDone: () => void }) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.18, { damping: 6, stiffness: 220 }),
      withSpring(1, { damping: 10 }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(450, withTiming(0, { duration: 320 })),
    );
    translateY.value = withTiming(-48, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
    const t = setTimeout(onDone, 950);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));
  return (
    <View style={styles.tierLabelWrap} pointerEvents="none">
      <Animated.Text
        style={[
          styles.tierLabelText,
          { color, textShadowColor: `${color}cc` },
          style,
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Animated score — rolls from previous value to new value
// ─────────────────────────────────────────────────────────────
function AnimatedScore({ value, style }: { value: number; style: any }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current;
    const target = value;
    if (start === target) return;
    const startTime = Date.now();
    const duration = 500;
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(start + (target - start) * eased);
      setDisplay(current);
      if (t >= 1) {
        clearInterval(id);
        prev.current = target;
      }
    }, 24);
    return () => clearInterval(id);
  }, [value]);
  return <Text style={style}>{display}</Text>;
}

// ─────────────────────────────────────────────────────────────
// Mega flash — chromatic-aberration word reveal for 6+ words
// ─────────────────────────────────────────────────────────────
function MegaFlash({ word, triggerId, onDone }: { word: string; triggerId: number; onDone: () => void }) {
  const shift = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  useEffect(() => {
    shift.value = withSequence(
      withTiming(1, { duration: 70, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 340, easing: Easing.in(Easing.cubic) }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 70 }),
      withDelay(220, withTiming(0, { duration: 280 })),
    );
    scale.value = withSequence(
      withSpring(1.08, { damping: 6, stiffness: 220 }),
      withSpring(1, { damping: 9 }),
    );
    const t = setTimeout(onDone, 620);
    return () => clearTimeout(t);
  }, [triggerId]);

  const baseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const redStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.85,
    transform: [{ scale: scale.value }, { translateX: -shift.value * 14 }],
  }));
  const cyanStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.85,
    transform: [{ scale: scale.value }, { translateX: shift.value * 14 }],
  }));

  const upper = word.toUpperCase();
  return (
    <View style={styles.megaFlashWrap} pointerEvents="none">
      <Animated.Text style={[styles.megaFlashText, { color: C.coral }, redStyle]}>{upper}</Animated.Text>
      <Animated.Text style={[styles.megaFlashText, { color: C.blue }, cyanStyle]}>{upper}</Animated.Text>
      <Animated.Text style={[styles.megaFlashText, styles.megaFlashCore, baseStyle]}>{upper}</Animated.Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Tap comet — glowing dot that flies from a tapped letter to the word bar
// ─────────────────────────────────────────────────────────────
function TapComet({ startX, startY, onDone }: { startX: number; startY: number; onDone: () => void }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: 420, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onDone)();
      },
    );
  }, []);
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const tx = startX + (0 - startX) * t;
    const ty = startY + (-190 - startY) * t;
    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: interpolate(t, [0, 0.25, 1], [0.3, 1.1, 0.4]) },
      ],
      opacity: interpolate(t, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
    };
  });
  return <Animated.View style={[styles.tapComet, style]} pointerEvents="none" />;
}

// ─────────────────────────────────────────────────────────────
// Bonus sparkle — golden expanding ring on bonus-letter harvest
// ─────────────────────────────────────────────────────────────
function BonusSparkle({
  x, y, onDone,
}: { x: number; y: number; onDone: () => void }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(
      1,
      { duration: 720, easing: Easing.out(Easing.cubic) },
      (done) => {
        if (done) runOnJS(onDone)();
      },
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x },
      { translateY: y },
      { scale: interpolate(prog.value, [0, 1], [0.4, 4.2]) },
    ],
    opacity: interpolate(prog.value, [0, 0.12, 1], [0, 1, 0]),
  }));
  return (
    <Animated.View style={[styles.bonusSparkle, style]} pointerEvents="none" />
  );
}

// ─────────────────────────────────────────────────────────────
// Outro score text — rolls up from 0 on mount
// ─────────────────────────────────────────────────────────────
function OutroScoreText({ target, style }: { target: number; style: any }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const duration = 1200;
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t >= 1) clearInterval(id);
    }, 24);
    return () => clearInterval(id);
  }, [target]);
  return <Text style={style}>{display}</Text>;
}

// ─────────────────────────────────────────────────────────────
// Outro stat count-up — delayed roll-up for summary stats
// ─────────────────────────────────────────────────────────────
function OutroCountUp({
  target, delay, format, style,
}: {
  target: number;
  delay: number;
  format: 'int' | 'float' | 'intX';
  style: any;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const duration = 900;
      const id = setInterval(() => {
        const t = Math.min(1, (Date.now() - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(target * eased);
        if (t >= 1) clearInterval(id);
      }, 24);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  const text =
    format === 'float' ? display.toFixed(1) :
    format === 'intX' ? `${Math.round(display)}×` :
    `${Math.round(display)}`;
  return <Text style={style}>{text}</Text>;
}

// ─────────────────────────────────────────────────────────────
// Score trail — ghost +N that flies from word bar to score pill
// ─────────────────────────────────────────────────────────────
function ScoreTrail({ points, onDone }: { points: number; onDone: () => void }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: 600, easing: Easing.inOut(Easing.cubic) },
      (done) => {
        if (done) runOnJS(onDone)();
      },
    );
  }, []);
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const startX = width / 2 - 24;
    const startY = 250;
    const endX = width - 76;
    const endY = 26;
    const tx = startX + (endX - startX) * t;
    const ty = startY + (endY - startY) * t - Math.sin(t * Math.PI) * 36;
    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: interpolate(t, [0, 0.2, 0.85, 1], [0.4, 1, 0.9, 0.4]) },
      ],
      opacity: interpolate(t, [0, 0.12, 0.85, 1], [0, 1, 1, 0]),
    };
  });
  return (
    <Animated.Text style={[styles.scoreTrail, style]} pointerEvents="none">
      +{points}
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────────────────────
// Letter echo — ghost copy of a used letter that expands and fades
// ─────────────────────────────────────────────────────────────
function LetterEcho({
  char, x, y, onDone,
}: { char: string; x: number; y: number; onDone: () => void }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: 560, easing: Easing.out(Easing.cubic) },
      (done) => {
        if (done) runOnJS(onDone)();
      },
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x },
      { translateY: y },
      { scale: interpolate(progress.value, [0, 1], [1, 2.6]) },
    ],
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 0.95, 0]),
  }));
  return (
    <Animated.View style={[styles.letterEcho, style]} pointerEvents="none">
      <Text style={styles.letterEchoText}>{char}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Confetti burst — fires on a new best word
// ─────────────────────────────────────────────────────────────
const CONFETTI_COLORS = [C.amber, C.peach, C.green, C.purple, '#FFE8B0', C.blue];

function ConfettiPiece({
  angle, dist, rotate, delay, color,
}: {
  angle: number;
  dist: number;
  rotate: number;
  delay: number;
  color: string;
}) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withDelay(
      delay,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }),
    );
  }, []);
  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * dist * prog.value;
    const dy = Math.sin(rad) * dist * prog.value + prog.value * prog.value * 220;
    return {
      transform: [
        { translateX: dx },
        { translateY: dy },
        { rotate: `${rotate * prog.value * 4}deg` },
      ],
      opacity: interpolate(prog.value, [0, 0.08, 0.85, 1], [0, 1, 1, 0]),
    };
  });
  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: 8,
        height: 14,
        backgroundColor: color,
        borderRadius: 2,
      }, style]}
      pointerEvents="none"
    />
  );
}

function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const pieces = useMemo(
    () => Array.from({ length: 44 }, () => ({
      angle: -90 + (Math.random() - 0.5) * 160,
      dist: 90 + Math.random() * 180,
      rotate: (Math.random() - 0.5) * 900,
      delay: Math.random() * 140,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    })),
    [],
  );
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.confettiOrigin} pointerEvents="none">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} {...p} />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SVG nebula background — painted cosmic backdrop
// ─────────────────────────────────────────────────────────────
const NEBULA_STARS = Array.from({ length: 38 }, (_, i) => ({
  id: i,
  cx: Math.random() * 100,
  cy: Math.random() * 100,
  r: 0.15 + Math.random() * 0.55,
  op: 0.25 + Math.random() * 0.55,
}));

function NebulaBackground() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 200"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        {/* Deep indigo base wash */}
        <RadialGradient id="nebBase" cx="50%" cy="40%" rx="110%" ry="90%">
          <Stop offset="0%" stopColor="#161235" stopOpacity="1" />
          <Stop offset="55%" stopColor="#0A0A1C" stopOpacity="1" />
          <Stop offset="100%" stopColor="#05060E" stopOpacity="1" />
        </RadialGradient>
        {/* Amber ember bleed, upper-right */}
        <RadialGradient id="nebEmber" cx="78%" cy="22%" rx="65%" ry="50%">
          <Stop offset="0%" stopColor="#D28538" stopOpacity="0.55" />
          <Stop offset="50%" stopColor="#B05A1F" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#3A1E0A" stopOpacity="0" />
        </RadialGradient>
        {/* Lavender glow, lower-left */}
        <RadialGradient id="nebLavender" cx="20%" cy="78%" rx="70%" ry="55%">
          <Stop offset="0%" stopColor="#6A4CB0" stopOpacity="0.5" />
          <Stop offset="55%" stopColor="#372063" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#14082C" stopOpacity="0" />
        </RadialGradient>
        {/* Teal accent, mid-left */}
        <RadialGradient id="nebTeal" cx="12%" cy="38%" rx="40%" ry="30%">
          <Stop offset="0%" stopColor="#2E6B88" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#0A1824" stopOpacity="0" />
        </RadialGradient>
        {/* Central warm halo, behind the orbit */}
        <RadialGradient id="nebCore" cx="50%" cy="52%" rx="35%" ry="32%">
          <Stop offset="0%" stopColor="#FFE3A8" stopOpacity="0.22" />
          <Stop offset="60%" stopColor="#F0B542" stopOpacity="0.06" />
          <Stop offset="100%" stopColor="#F0B542" stopOpacity="0" />
        </RadialGradient>
        {/* Vignette edge */}
        <RadialGradient id="nebVignette" cx="50%" cy="50%" rx="85%" ry="85%">
          <Stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
        </RadialGradient>
      </Defs>

      <Ellipse cx={50} cy={100} rx={500} ry={500} fill="url(#nebBase)" />
      <Ellipse cx={78} cy={44} rx={80} ry={70} fill="url(#nebEmber)" />
      <Ellipse cx={20} cy={156} rx={85} ry={75} fill="url(#nebLavender)" />
      <Ellipse cx={12} cy={76} rx={55} ry={50} fill="url(#nebTeal)" />
      <Ellipse cx={50} cy={104} rx={45} ry={45} fill="url(#nebCore)" />

      {NEBULA_STARS.map((s) => (
        <Circle
          key={s.id}
          cx={s.cx}
          cy={s.cy * 2}
          r={s.r}
          fill="#FFF8E0"
          opacity={s.op}
        />
      ))}

      <Ellipse cx={50} cy={100} rx={500} ry={500} fill="url(#nebVignette)" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Parallax back layer — distant drifting glyphs for depth
// ─────────────────────────────────────────────────────────────
function BackgroundGlyphsFar() {
  const g1 = useSharedValue(0);
  const g2 = useSharedValue(0);
  const g3 = useSharedValue(0);
  const g4 = useSharedValue(0);

  useEffect(() => {
    const loop = (dur: number) =>
      withRepeat(
        withSequence(
          withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    g1.value = loop(18000);
    g2.value = withDelay(2500, loop(20000));
    g3.value = withDelay(5200, loop(22000));
    g4.value = withDelay(8000, loop(24000));
  }, []);

  const s1 = useAnimatedStyle(() => ({
    opacity: interpolate(g1.value, [0, 1], [0.007, 0.022], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g1.value, [0, 1], [0, 18]) }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: interpolate(g2.value, [0, 1], [0.007, 0.022], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g2.value, [0, 1], [0, 18]) }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: interpolate(g3.value, [0, 1], [0.007, 0.022], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g3.value, [0, 1], [0, 18]) }],
  }));
  const s4 = useAnimatedStyle(() => ({
    opacity: interpolate(g4.value, [0, 1], [0.007, 0.022], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g4.value, [0, 1], [0, 18]) }],
  }));

  return (
    <>
      <Animated.Text style={[styles.bgGlyphFar, { top: height * 0.22, left: width * 0.18 }, s1]}>R</Animated.Text>
      <Animated.Text style={[styles.bgGlyphFar, { top: height * 0.48, right: width * 0.12 }, s2]}>E</Animated.Text>
      <Animated.Text style={[styles.bgGlyphFar, { bottom: height * 0.22, left: width * 0.48 }, s3]}>N</Animated.Text>
      <Animated.Text style={[styles.bgGlyphFar, { top: height * 0.30, left: width * 0.66 }, s4]}>V</Animated.Text>
    </>
  );
}

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

// ─────────────────────────────────────────────────────────────
// Floating "+N" score text that rises from the center
// ─────────────────────────────────────────────────────────────
function FloatScoreText({ points, big }: { points: number; big: boolean }) {
  const rise = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    rise.value = withTiming(1, { duration: big ? 1400 : 1200, easing: Easing.out(Easing.cubic) });
    fade.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(400, withTiming(0, { duration: 600 })),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateY: interpolate(rise.value, [0, 1], [0, big ? -130 : -90]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.6, big ? 1.5 : 1.15, big ? 1.2 : 1]) },
    ],
  }));
  return (
    <Animated.Text style={[styles.floatScore, big && styles.floatScoreBig, style]} pointerEvents="none">
      +{points}
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060E',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
  },
  nebulaLayer: {
    position: 'absolute',
    top: -20,
    left: -40,
    right: -40,
    bottom: -20,
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
  bgGlyphFar: {
    position: 'absolute',
    fontSize: 140,
    fontWeight: '900',
    color: '#C8B4FF',
    letterSpacing: -4,
  },

  // Tap comet — flies from letter to word bar
  tapComet: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFE8B0',
    shadowColor: '#F0B542',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },

  // Letter echo — ghost copy of a used letter
  letterEcho: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(240,181,66,0.6)',
    backgroundColor: 'rgba(240,181,66,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterEchoText: {
    color: '#FFE8B0',
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: 'rgba(240,181,66,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Mega chromatic flash (6+ letter words)
  megaFlashWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
  },
  megaFlashText: {
    position: 'absolute',
    fontSize: 76,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: 'rgba(255,232,176,0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 38,
  },
  megaFlashCore: {
    color: '#FFE8B0',
  },

  // Confetti origin — fires from the word bar area downward
  confettiOrigin: {
    position: 'absolute',
    top: 220,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 95,
  },

  // Screen-wide white flash
  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 88,
  },

  // Tier label
  tierLabelWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 92,
  },
  tierLabelText: {
    fontSize: 88,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 42,
  },

  // Submit button wrap + glow
  submitWrap: {
    flex: 1,
    position: 'relative',
  },
  submitGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 22,
    backgroundColor: 'rgba(125,211,168,0.45)',
    shadowColor: '#7DD3A8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 10,
  },

  // Pressure ring — coral pulse around the orbit during finale
  pressureRing: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 5,
    borderColor: 'rgba(232,112,126,0.95)',
    shadowColor: '#E8707E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 34,
    elevation: 16,
  },

  // Score trail — ghost +N flying from word bar to score pill
  scoreTrail: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontSize: 24,
    fontWeight: '900',
    color: C.peach,
    textShadowColor: 'rgba(224,155,107,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    zIndex: 80,
  },

  // Bonus sparkle — gold ring expanding from bonus letter
  bonusSparkle: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(255,220,120,0.9)',
    backgroundColor: 'rgba(255,220,120,0.15)',
    shadowColor: '#FFE08C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
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
  timerDigitsFinal: {
    textShadowColor: 'rgba(232,112,126,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
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
    marginBottom: 12,
  },
  timerFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Combo
  comboSlot: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 4,
  },
  comboBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  comboBadgeCount: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  comboBadgeLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
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
  feedbackNearMiss: {
    color: C.amber,
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
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  discInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
    elevation: 6,
  },
  discLetter: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 0 },
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
  floatScoreBig: {
    fontSize: 34,
    color: '#FFE8B0',
    textShadowColor: 'rgba(255,232,176,0.8)',
    textShadowRadius: 18,
  },

  megaRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: C.amber,
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
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

  // First-play hint
  hintCard: {
    position: 'absolute',
    bottom: 130,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(10,12,24,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.4)',
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.amber,
  },
  hintText: {
    color: C.t1,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Overlays (intro/outro)
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },

  // Intro — clean centered layout
  introCenter: {
    alignItems: 'center',
    gap: 16,
  },
  introTitle: {
    color: '#FFE8B0',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(240,181,66,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  introSub: {
    color: C.t2,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  introGo: {
    fontSize: 56,
    fontWeight: '900',
    color: C.green,
    letterSpacing: 4,
    marginTop: 12,
    textShadowColor: 'rgba(125,211,168,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },

  // Outro card
  outroCard: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 30,
    borderRadius: 28,
    backgroundColor: 'rgba(16,19,31,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.35)',
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 12,
    minWidth: 300,
  },
  outroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  outroStripe: {
    width: 44,
    height: 1,
    backgroundColor: 'rgba(240,181,66,0.5)',
  },
  outroLabel: {
    color: C.amber,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  outroScoreLabel: {
    color: C.t3,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginTop: 4,
  },
  outroScore: {
    color: C.peach,
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 62,
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  bestRow: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(240,181,66,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.4)',
    marginVertical: 6,
  },
  bestLabel: {
    color: C.amber,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  bestWord: {
    color: '#FFE8B0',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(240,181,66,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  bestPoints: {
    color: C.peach,
    fontSize: 14,
    fontWeight: '900',
  },
  outroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
  },
  outroStat: {
    alignItems: 'center',
    flex: 1,
  },
  outroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  outroStatValue: {
    color: C.t1,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  outroStatLabel: {
    color: C.t3,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
});
