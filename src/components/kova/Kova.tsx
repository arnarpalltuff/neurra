import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { tapLight, tapMedium, tapHeavy } from '../../utils/haptics';
import { playKovaHappy, playKovaExcited, playKovaGiggle, playKovaWow } from '../../utils/sound';
import { Svg, Circle, Ellipse, Path, G } from 'react-native-svg';
import { C } from '../../constants/colors';
import { KovaEmotion, KovaStage, emotionGlowColors, stageColors } from './KovaStates';
import { getDialogue, DialogueContext } from '../../constants/dialoguePool';
import { getTimeOfDay } from '../../utils/timeUtils';
import { fonts } from '../../constants/typography';
import { usePersonalityStore } from '../../stores/personalityStore';
import { pickPersonalityLine } from '../../constants/kovaPersonalityDialogue';

interface KovaProps {
  stage?: KovaStage;
  emotion?: KovaEmotion;
  size?: number;
  onTap?: () => void;
  showSpeechBubble?: boolean;
  forceDialogue?: string;
  dialogueContext?: DialogueContext;
}

export default function Kova({
  stage = 1,
  emotion = 'idle',
  size = 120,
  onTap,
  showSpeechBubble = true,
  forceDialogue,
  dialogueContext,
}: KovaProps) {
  const [bubble, setBubble] = useState<string | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const lastDialogue = useRef('');
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values
  const floatY = useSharedValue(0);
  const scaleVal = useSharedValue(1);
  const breathScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const glowScale = useSharedValue(1);
  const wiggle = useSharedValue(0);
  const bounce = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);
  const lookX = useSharedValue(0);

  const glowColor = emotionGlowColors[emotion] ?? emotionGlowColors.idle;
  const bodyColor = stageColors[stage] ?? stageColors[1];

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // Idle float animation
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  // Breathing animation — randomized per cycle so Kova never breathes at
  // exactly the same speed twice. Robots breathe at 3.000s; living things
  // breathe at 2.8, 3.1, 2.9... That tiny variance is what makes her feel alive.
  useEffect(() => {
    let cancelled = false;
    const breathe = () => {
      if (cancelled) return;
      const inDur = 2600 + Math.random() * 600;
      const outDur = 2600 + Math.random() * 600;
      breathScale.value = withSequence(
        withTiming(1.03, { duration: inDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: outDur, easing: Easing.inOut(Easing.sin) }, (finished) => {
          if (finished) runOnJS(breathe)();
        }),
      );
    };
    breathe();
    return () => { cancelled = true; };
  }, []);

  // Blink animation (random interval 2-6s)
  useEffect(() => {
    let cancelled = false;
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 4000;
      blinkTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        setTimeout(() => {
          if (!cancelled) setBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };
    scheduleBlink();
    return () => {
      cancelled = true;
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // Random idle actions (every 8-15s)
  useEffect(() => {
    let cancelled = false;
    const actions = [
      // Look left, then right, then center
      () => {
        lookX.value = withSequence(
          withTiming(-8, { duration: 400 }),
          withDelay(800, withTiming(8, { duration: 400 })),
          withDelay(800, withTiming(0, { duration: 300 })),
        );
      },
      // Little bounce
      () => {
        bounce.value = withSequence(
          withSpring(-10, { damping: 4 }),
          withSpring(0, { damping: 8 }),
        );
      },
      // Quick wiggle (dance)
      () => {
        wiggle.value = withSequence(
          withTiming(-6, { duration: 120 }),
          withTiming(6, { duration: 120 }),
          withTiming(-4, { duration: 120 }),
          withTiming(4, { duration: 120 }),
          withTiming(-2, { duration: 120 }),
          withTiming(0, { duration: 120 }),
        );
      },
      // Wave (tilt back and forth)
      () => {
        wiggle.value = withSequence(
          withTiming(10, { duration: 200 }),
          withTiming(-10, { duration: 200 }),
          withTiming(10, { duration: 200 }),
          withTiming(0, { duration: 200 }),
        );
      },
    ];

    const scheduleAction = () => {
      const delay = 8000 + Math.random() * 7000;
      idleTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        const action = actions[Math.floor(Math.random() * actions.length)];
        action();
        scheduleAction();
      }, delay);
    };
    scheduleAction();
    return () => {
      cancelled = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Emotion-based animations
  useEffect(() => {
    switch (emotion) {
      case 'happy':
      case 'relieved':
        bounce.value = withSequence(
          withSpring(-15, { damping: 4 }),
          withSpring(0, { damping: 8 }),
          withSpring(-8, { damping: 6 }),
          withSpring(0, { damping: 10 })
        );
        break;
      case 'proud':
      case 'celebrating':
      case 'excited':
        bounce.value = withSequence(
          withSpring(-20, { damping: 3 }),
          withSpring(0, { damping: 5 }),
          withSpring(-14, { damping: 5 }),
          withSpring(0, { damping: 8 })
        );
        scaleVal.value = withSequence(
          withSpring(1.15, { damping: 4 }),
          withSpring(1, { damping: 8 })
        );
        break;
      case 'encouraging':
        wiggle.value = withSequence(
          withTiming(-8, { duration: 150 }),
          withTiming(8, { duration: 150 }),
          withTiming(-6, { duration: 150 }),
          withTiming(6, { duration: 150 }),
          withTiming(0, { duration: 150 })
        );
        break;
      case 'wilted':
      case 'worried':
        scaleVal.value = withTiming(0.92, { duration: 500 });
        break;
      default:
        scaleVal.value = withTiming(1, { duration: 300 });
        bounce.value = withTiming(0, { duration: 300 });
        wiggle.value = withTiming(0, { duration: 300 });
    }
  }, [emotion]);

  const handleTap = useCallback(() => {
    tapCountRef.current += 1;
    const taps = tapCountRef.current;

    // Escalating tap reactions
    if (taps >= 10) {
      // Rocket launch
      tapHeavy();
      playKovaWow();
      bounce.value = withSequence(
        withTiming(-80, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withDelay(200, withSpring(0, { damping: 6, stiffness: 100 })),
      );
      scaleVal.value = withSequence(
        withTiming(0.7, { duration: 150 }),
        withDelay(300, withSpring(1.1, { damping: 4 })),
        withSpring(1, { damping: 8 }),
      );
      tapCountRef.current = 0; // Reset cycle
    } else if (taps >= 5) {
      // Dizzy spin
      tapMedium();
      playKovaGiggle();
      wiggle.value = withSequence(
        withTiming(360, { duration: 600 }),
        withTiming(380, { duration: 100 }),
        withTiming(360, { duration: 200 }),
        withTiming(0, { duration: 10 }),
      );
      scaleVal.value = withSequence(
        withSpring(0.85, { damping: 4 }),
        withSpring(1.05, { damping: 5 }),
        withSpring(1, { damping: 8 }),
      );
    } else if (taps >= 3) {
      // Spin
      tapMedium();
      playKovaExcited();
      wiggle.value = withSequence(
        withTiming(360, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 10 }),
      );
      scaleVal.value = withSequence(
        withSpring(0.9, { damping: 5 }),
        withSpring(1.05, { damping: 6 }),
        withSpring(1, { damping: 8 }),
      );
    } else {
      // Normal bounce
      tapLight();
      playKovaHappy();
      scaleVal.value = withSequence(
        withSpring(0.88, { damping: 6 }),
        withSpring(1.08, { damping: 5 }),
        withSpring(1, { damping: 8 }),
      );
    }

    if (showSpeechBubble) {
      let line: string;
      if (forceDialogue) {
        line = forceDialogue;
      } else {
        const tod = getTimeOfDay();
        const ctx: DialogueContext =
          dialogueContext ??
          (tod === 'morning'
            ? 'tapMorning'
            : tod === 'lateNight'
            ? 'tapLateNight'
            : tod === 'evening'
            ? 'tapEvening'
            : 'tap');
        // 40% chance Kova speaks from her current personality pool. The
        // other 60% she falls back to the standard time-of-day dialogue.
        const personality = usePersonalityStore.getState().current();
        if (personality !== 'neutral' && Math.random() < 0.4) {
          line = pickPersonalityLine(personality);
        } else {
          line = getDialogue(ctx, true);
        }
        // Avoid repeating the last line
        if (line === lastDialogue.current) {
          line = getDialogue('tap');
        }
        lastDialogue.current = line;
      }

      setBubble(line);
      setBubbleVisible(true);
      bubbleOpacity.value = withTiming(1, { duration: 200 });

      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
      bubbleTimeoutRef.current = setTimeout(() => {
        bubbleOpacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(setBubbleVisible)(false);
        });
      }, 2500);
    }

    onTap?.();
  }, [showSpeechBubble, forceDialogue, dialogueContext, onTap]);

  const kovaStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value + bounce.value },
      { translateX: lookX.value },
      { scale: scaleVal.value * breathScale.value },
      { rotate: `${wiggle.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [
      {
        scale: interpolate(bubbleOpacity.value, [0, 1], [0.85, 1]),
      },
    ],
  }));

  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const bodyR = s * 0.32;

  return (
    <View style={[styles.container, { width: s * 1.8, height: s * 1.8 }]}>
      {/* Primary glow — elliptical (slightly wider than tall). Real
          bioluminescence isn't a perfect circle. */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: s * 1.45,
            height: s * 1.25,
            borderTopLeftRadius: s * 0.725,
            borderTopRightRadius: s * 0.725,
            borderBottomLeftRadius: s * 0.625,
            borderBottomRightRadius: s * 0.625,
            backgroundColor: glowColor,
            shadowColor: glowColor,
            top: s * 0.28,
            left: s * 0.18,
          },
        ]}
      />
      {/* Secondary glow — smaller, offset 4px right and 8px down, 60% opacity.
          Creates the illusion of light hitting a surface and bouncing. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          glowStyle,
          {
            width: s * 1.15,
            height: s * 1.0,
            borderTopLeftRadius: s * 0.575,
            borderTopRightRadius: s * 0.575,
            borderBottomLeftRadius: s * 0.5,
            borderBottomRightRadius: s * 0.5,
            backgroundColor: glowColor,
            shadowColor: glowColor,
            top: s * 0.36,
            left: s * 0.28,
            opacity: 0.6,
          },
        ]}
      />

      {/* Kova body */}
      <TouchableWithoutFeedback onPress={handleTap} accessible accessibilityLabel="Kova, your brain training companion">
        <Animated.View style={[styles.kovaWrapper, kovaStyle, { top: s * 0.2, left: s * 0.2 }]}>
          <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Stage-specific rendering */}
            {stage === 1 && <SeedStage size={s} bodyColor={bodyColor} glowColor={glowColor} emotion={emotion} blinking={blinking} />}
            {stage === 2 && <SproutStage size={s} bodyColor={bodyColor} glowColor={glowColor} emotion={emotion} blinking={blinking} />}
            {stage >= 3 && <BloomingStage size={s} bodyColor={bodyColor} glowColor={glowColor} emotion={emotion} stage={stage} blinking={blinking} />}
          </Svg>
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Speech bubble */}
      {bubbleVisible && bubble && (
        <Animated.View style={[styles.bubble, bubbleStyle, { top: 0, left: 0, right: 0 }]}>
          <Text style={styles.bubbleText}>{bubble}</Text>
          <View style={styles.bubbleTail} />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * KOVA STAGE RENDERERS
 *
 * Kova is a forest spirit that grows from a tiny seed into a majestic
 * nature guardian. Each stage has a genuinely different silhouette —
 * not just a color shift, but a shape evolution.
 *
 * Stage 1 (Seed): A small acorn shape with one big eye peeking out.
 * Stage 2 (Sprout): Round body, two eyes, a leaf antenna on top, stub feet.
 * Stage 3-4 (Budding/Blooming): Bell-shaped body, leaf ears, small arms, roots.
 * Stage 5-6 (Flourishing/Radiant): Taller, flower crown, vine arms, glowing patterns.
 * Stage 7 (Ancient): Majestic tree-spirit with golden crown and deep roots.
 */

type StageProps = { size: number; bodyColor: string; glowColor: string; emotion: KovaEmotion; blinking: boolean };

function KovaEyes({ cx, cy, r, blinking, emotion }: { cx: number; cy: number; r: number; blinking: boolean; emotion: KovaEmotion }) {
  const isZen = emotion === 'zen' || emotion === 'sleepy';
  const isCurious = emotion === 'curious';
  if (blinking || isZen) {
    return (
      <G>
        <Path d={`M${cx - r * 0.38} ${cy} Q${cx - r * 0.25} ${cy + r * 0.1} ${cx - r * 0.12} ${cy}`} stroke="#0B0E17" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M${cx + r * 0.12} ${cy} Q${cx + r * 0.25} ${cy + r * 0.1} ${cx + r * 0.38} ${cy}`} stroke="#0B0E17" strokeWidth={2} fill="none" strokeLinecap="round" />
      </G>
    );
  }
  return (
    <G>
      <Circle cx={cx - r * 0.28} cy={cy} r={r * 0.13} fill="#0B0E17" />
      <Circle cx={cx + r * 0.28} cy={cy} r={r * 0.13} fill="#0B0E17" />
      <Circle cx={cx - r * 0.23} cy={cy - r * 0.05} r={r * 0.05} fill="#FFF" opacity={0.85} />
      <Circle cx={cx + r * 0.33} cy={cy - r * 0.05} r={r * 0.05} fill="#FFF" opacity={0.85} />
      {isCurious && (
        <Path d={`M${cx + r * 0.16} ${cy - r * 0.2} L${cx + r * 0.4} ${cy - r * 0.15}`} stroke="#0B0E17" strokeWidth={1.5} strokeLinecap="round" />
      )}
    </G>
  );
}

function KovaMouth({ cx, cy, r, emotion }: { cx: number; cy: number; r: number; emotion: KovaEmotion }) {
  const isHappy = ['happy', 'proud', 'celebrating', 'excited', 'relieved'].includes(emotion);
  const isWilted = ['wilted', 'worried'].includes(emotion);
  if (isHappy) {
    return <Path d={`M${cx - r * 0.2} ${cy + r * 0.22} Q${cx} ${cy + r * 0.42} ${cx + r * 0.2} ${cy + r * 0.22}`} stroke="#0B0E17" strokeWidth={2} fill="none" strokeLinecap="round" />;
  }
  if (isWilted) {
    return <Path d={`M${cx - r * 0.16} ${cy + r * 0.36} Q${cx} ${cy + r * 0.26} ${cx + r * 0.16} ${cy + r * 0.36}`} stroke="#0B0E17" strokeWidth={1.5} fill="none" strokeLinecap="round" />;
  }
  return <Path d={`M${cx - r * 0.14} ${cy + r * 0.28} Q${cx} ${cy + r * 0.35} ${cx + r * 0.14} ${cy + r * 0.28}`} stroke="#0B0E17" strokeWidth={1.5} fill="none" strokeLinecap="round" />;
}

// Stage 1: Tiny acorn seed with one big eye peeking out
function SeedStage({ size: s, bodyColor, glowColor, emotion, blinking }: StageProps) {
  const cx = s / 2, cy = s / 2 + s * 0.05;
  const r = s * 0.16;
  return (
    <G>
      {/* Ground */}
      <Ellipse cx={cx} cy={cy + s * 0.28} rx={s * 0.3} ry={s * 0.06} fill="#3D2B1F" opacity={0.7} />
      {/* Glow */}
      <Circle cx={cx} cy={cy + s * 0.05} r={r * 2} fill={glowColor} opacity={0.12} />
      {/* Acorn cap */}
      <Ellipse cx={cx} cy={cy - r * 0.3} rx={r * 1.2} ry={r * 0.5} fill="#8B6B4A" opacity={0.9} />
      <Path d={`M${cx - r * 0.15} ${cy - r * 0.7} L${cx} ${cy - r * 1.1} L${cx + r * 0.15} ${cy - r * 0.7}`} fill="#8B6B4A" />
      {/* Body (acorn) */}
      <Ellipse cx={cx} cy={cy + r * 0.2} rx={r} ry={r * 1.2} fill={bodyColor} opacity={0.95} />
      <Ellipse cx={cx} cy={cy} rx={r * 0.7} ry={r * 0.5} fill="#FFF" opacity={0.1} />
      {/* One big eye */}
      {blinking ? (
        <Path d={`M${cx - r * 0.4} ${cy + r * 0.1} Q${cx} ${cy + r * 0.25} ${cx + r * 0.4} ${cy + r * 0.1}`} stroke="#0B0E17" strokeWidth={2} fill="none" strokeLinecap="round" />
      ) : (
        <G>
          <Circle cx={cx} cy={cy + r * 0.15} r={r * 0.35} fill="#0B0E17" />
          <Circle cx={cx + r * 0.1} cy={cy + r * 0.05} r={r * 0.12} fill="#FFF" opacity={0.9} />
          <Circle cx={cx - r * 0.12} cy={cy + r * 0.2} r={r * 0.06} fill="#FFF" opacity={0.5} />
        </G>
      )}
      {/* Tiny crack line (emerging) */}
      <Path d={`M${cx + r * 0.6} ${cy + r * 0.1} L${cx + r * 0.8} ${cy - r * 0.1}`} stroke={glowColor} strokeWidth={1} opacity={0.4} />
      {/* Root tendrils */}
      <Path d={`M${cx - r * 0.3} ${cy + r * 1.2} Q${cx - r * 0.6} ${cy + r * 1.6} ${cx - r * 0.4} ${cy + r * 1.9}`} stroke="#5A4030" strokeWidth={1.5} fill="none" opacity={0.6} />
      <Path d={`M${cx + r * 0.2} ${cy + r * 1.2} Q${cx + r * 0.5} ${cy + r * 1.5} ${cx + r * 0.6} ${cy + r * 1.8}`} stroke="#5A4030" strokeWidth={1.5} fill="none" opacity={0.6} />
    </G>
  );
}

// Stage 2: Round body with two eyes, leaf antenna, stub feet — a tiny creature
function SproutStage({ size: s, bodyColor, glowColor, emotion, blinking }: StageProps) {
  const cx = s / 2, cy = s / 2 + s * 0.04;
  const r = s * 0.22;
  const isWilted = ['wilted', 'worried'].includes(emotion);
  return (
    <G>
      {/* Glow */}
      <Circle cx={cx} cy={cy} r={r * 1.8} fill={glowColor} opacity={0.15} />
      {/* Stub feet */}
      <Ellipse cx={cx - r * 0.45} cy={cy + r * 1.05} rx={r * 0.22} ry={r * 0.15} fill={bodyColor} opacity={0.8} />
      <Ellipse cx={cx + r * 0.45} cy={cy + r * 1.05} rx={r * 0.22} ry={r * 0.15} fill={bodyColor} opacity={0.8} />
      {/* Body — slightly pear-shaped, wider at bottom */}
      <Path
        d={`M${cx} ${cy - r} Q${cx + r * 0.85} ${cy - r * 0.6} ${cx + r * 0.95} ${cy + r * 0.1} Q${cx + r * 0.9} ${cy + r * 0.9} ${cx} ${cy + r * 1.0} Q${cx - r * 0.9} ${cy + r * 0.9} ${cx - r * 0.95} ${cy + r * 0.1} Q${cx - r * 0.85} ${cy - r * 0.6} ${cx} ${cy - r} Z`}
        fill={bodyColor}
        opacity={0.95}
      />
      {/* Highlight */}
      <Ellipse cx={cx - r * 0.15} cy={cy - r * 0.3} rx={r * 0.35} ry={r * 0.25} fill="#FFF" opacity={0.12} />
      {/* Leaf antenna */}
      <Path
        d={`M${cx} ${cy - r} L${cx + r * 0.15} ${cy - r * 1.6}`}
        stroke="#4A8B5E" strokeWidth={2} fill="none" strokeLinecap="round"
      />
      <Path
        d={`M${cx + r * 0.15} ${cy - r * 1.6} Q${cx + r * 0.6} ${cy - r * 1.8} ${cx + r * 0.35} ${cy - r * 1.3} Q${cx + r * 0.1} ${cy - r * 1.4} ${cx + r * 0.15} ${cy - r * 1.6}`}
        fill={isWilted ? '#6B8B6B' : '#5DBF7F'}
        opacity={isWilted ? 0.5 : 0.9}
      />
      {/* Eyes + mouth */}
      <KovaEyes cx={cx} cy={cy - r * 0.1} r={r} blinking={blinking} emotion={emotion} />
      <KovaMouth cx={cx} cy={cy - r * 0.1} r={r} emotion={emotion} />
      {/* Cheek blush when happy */}
      {['happy', 'proud', 'excited'].includes(emotion) && (
        <G opacity={0.2}>
          <Circle cx={cx - r * 0.55} cy={cy + r * 0.15} r={r * 0.12} fill="#E8A87C" />
          <Circle cx={cx + r * 0.55} cy={cy + r * 0.15} r={r * 0.12} fill="#E8A87C" />
        </G>
      )}
    </G>
  );
}

// Stage 3+: Full forest spirit — bell-shaped body, leaf ears, arms, evolving crown
function BloomingStage({ size: s, bodyColor, glowColor, emotion, stage, blinking }: { size: number; bodyColor: string; glowColor: string; emotion: KovaEmotion; stage: KovaStage; blinking: boolean }) {
  const cx = s / 2, cy = s / 2 + s * 0.02;
  const r = s * 0.26;
  const isWilted = ['wilted', 'worried'].includes(emotion);
  const leafColor = isWilted ? '#6B8B6B' : '#5DBF7F';
  const leafOp = isWilted ? 0.5 : 0.9;

  return (
    <G>
      {/* Outer glow — bigger at higher stages */}
      <Circle cx={cx} cy={cy} r={r * (1.4 + stage * 0.08)} fill={glowColor} opacity={0.12 + stage * 0.02} />

      {/* Root feet */}
      <Path
        d={`M${cx - r * 0.35} ${cy + r * 0.85} Q${cx - r * 0.6} ${cy + r * 1.3} ${cx - r * 0.4} ${cy + r * 1.5}`}
        stroke="#5A4030" strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.7}
      />
      <Path
        d={`M${cx + r * 0.35} ${cy + r * 0.85} Q${cx + r * 0.55} ${cy + r * 1.2} ${cx + r * 0.5} ${cy + r * 1.45}`}
        stroke="#5A4030" strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.7}
      />

      {/* Vine arms — stage 4+ */}
      {stage >= 4 && (
        <G opacity={leafOp}>
          <Path
            d={`M${cx - r * 0.9} ${cy + r * 0.1} Q${cx - r * 1.3} ${cy - r * 0.2} ${cx - r * 1.2} ${cy - r * 0.5}`}
            stroke={leafColor} strokeWidth={2} fill="none" strokeLinecap="round"
          />
          <Circle cx={cx - r * 1.2} cy={cy - r * 0.5} r={r * 0.08} fill={leafColor} />
          <Path
            d={`M${cx + r * 0.9} ${cy + r * 0.1} Q${cx + r * 1.25} ${cy + r * 0.05} ${cx + r * 1.15} ${cy - r * 0.3}`}
            stroke={leafColor} strokeWidth={2} fill="none" strokeLinecap="round"
          />
          <Circle cx={cx + r * 1.15} cy={cy - r * 0.3} r={r * 0.08} fill={leafColor} />
        </G>
      )}

      {/* Body — bell/droplet shape, wider at bottom */}
      <Path
        d={`M${cx} ${cy - r * 0.9} Q${cx + r * 0.75} ${cy - r * 0.5} ${cx + r * 0.9} ${cy + r * 0.2} Q${cx + r * 0.8} ${cy + r * 0.85} ${cx} ${cy + r * 0.95} Q${cx - r * 0.8} ${cy + r * 0.85} ${cx - r * 0.9} ${cy + r * 0.2} Q${cx - r * 0.75} ${cy - r * 0.5} ${cx} ${cy - r * 0.9} Z`}
        fill={bodyColor}
        opacity={0.96}
      />
      {/* Body highlight */}
      <Ellipse cx={cx - r * 0.12} cy={cy - r * 0.25} rx={r * 0.3} ry={r * 0.4} fill="#FFF" opacity={0.08} />

      {/* Leaf ears */}
      <Path
        d={`M${cx - r * 0.55} ${cy - r * 0.7} Q${cx - r * 1.1} ${cy - r * 1.3} ${cx - r * 0.5} ${cy - r * 1.05} Z`}
        fill={leafColor} opacity={leafOp}
        transform={isWilted ? `rotate(-25, ${cx - r * 0.55}, ${cy - r * 0.7})` : undefined}
      />
      <Path
        d={`M${cx + r * 0.55} ${cy - r * 0.7} Q${cx + r * 1.1} ${cy - r * 1.3} ${cx + r * 0.5} ${cy - r * 1.05} Z`}
        fill={leafColor} opacity={leafOp}
        transform={isWilted ? `rotate(25, ${cx + r * 0.55}, ${cy - r * 0.7})` : undefined}
      />

      {/* Leaf vein lines on ears — stage 5+ detail */}
      {stage >= 5 && (
        <G opacity={0.3}>
          <Path d={`M${cx - r * 0.55} ${cy - r * 0.75} L${cx - r * 0.85} ${cy - r * 1.1}`} stroke="#2D6B3A" strokeWidth={1} />
          <Path d={`M${cx + r * 0.55} ${cy - r * 0.75} L${cx + r * 0.85} ${cy - r * 1.1}`} stroke="#2D6B3A" strokeWidth={1} />
        </G>
      )}

      {/* Eyes + mouth */}
      <KovaEyes cx={cx} cy={cy - r * 0.1} r={r} blinking={blinking} emotion={emotion} />
      <KovaMouth cx={cx} cy={cy - r * 0.1} r={r} emotion={emotion} />

      {/* Cheek blush */}
      {['happy', 'proud', 'excited', 'celebrating'].includes(emotion) && (
        <G opacity={0.2}>
          <Circle cx={cx - r * 0.55} cy={cy + r * 0.15} r={r * 0.1} fill="#E8A87C" />
          <Circle cx={cx + r * 0.55} cy={cy + r * 0.15} r={r * 0.1} fill="#E8A87C" />
        </G>
      )}

      {/* Stage 5+ flower buds on ear tips */}
      {stage >= 5 && (
        <G opacity={0.9}>
          <Circle cx={cx - r * 0.82} cy={cy - r * 1.18} r={r * 0.1} fill="#E8A87C" />
          <Circle cx={cx + r * 0.82} cy={cy - r * 1.18} r={r * 0.1} fill="#E8A87C" />
          <Circle cx={cx - r * 0.82} cy={cy - r * 1.18} r={r * 0.05} fill="#FBBF24" />
          <Circle cx={cx + r * 0.82} cy={cy - r * 1.18} r={r * 0.05} fill="#FBBF24" />
        </G>
      )}

      {/* Stage 6+ golden crown sparkles */}
      {stage >= 6 && (
        <G opacity={0.6}>
          <Circle cx={cx} cy={cy - r * 1.15} r={r * 0.06} fill="#FBBF24" />
          <Circle cx={cx - r * 0.3} cy={cy - r * 1.05} r={r * 0.04} fill="#FBBF24" />
          <Circle cx={cx + r * 0.3} cy={cy - r * 1.05} r={r * 0.04} fill="#FBBF24" />
        </G>
      )}

      {/* Stage 7: golden aura ring */}
      {stage >= 7 && (
        <Circle cx={cx} cy={cy - r * 0.2} r={r * 1.3} stroke="#FBBF24" strokeWidth={1.5} fill="none" opacity={0.25} />
      )}

      {/* Body pattern — subtle inner markings at stage 6+ */}
      {stage >= 6 && (
        <G opacity={0.1}>
          <Path d={`M${cx - r * 0.2} ${cy + r * 0.1} Q${cx} ${cy + r * 0.3} ${cx + r * 0.2} ${cy + r * 0.1}`} stroke="#FFF" strokeWidth={1} fill="none" />
          <Path d={`M${cx - r * 0.15} ${cy + r * 0.35} Q${cx} ${cy + r * 0.5} ${cx + r * 0.15} ${cy + r * 0.35}`} stroke="#FFF" strokeWidth={1} fill="none" />
        </G>
      )}
    </G>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  kovaWrapper: {
    position: 'absolute',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(19,24,41,0.85)',
    // Speech-bubble shape: the corner near the speaker (top-left) is less
    // round than the others, like a real cartoon bubble.
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 210,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  bubbleText: {
    fontFamily: fonts.kova,
    color: C.t1,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 6,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
