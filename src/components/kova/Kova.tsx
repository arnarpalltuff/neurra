import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
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
import { Svg, Circle, Ellipse, Path, G } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { KovaEmotion, KovaStage, emotionGlowColors, stageColors } from './KovaStates';
import { getDialogue, DialogueContext } from '../../constants/dialoguePool';
import { getTimeOfDay } from '../../utils/timeUtils';

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
  const lastDialogue = useRef('');

  // Animation values
  const floatY = useSharedValue(0);
  const scaleVal = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const glowScale = useSharedValue(1);
  const wiggle = useSharedValue(0);
  const bounce = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);

  const glowColor = emotionGlowColors[emotion];
  const bodyColor = stageColors[stage];

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
    scaleVal.value = withSequence(
      withSpring(0.88, { damping: 6 }),
      withSpring(1.08, { damping: 5 }),
      withSpring(1, { damping: 8 })
    );

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
        line = getDialogue(ctx, true);
        // Avoid repeating the last line
        if (line === lastDialogue.current) {
          line = getDialogue('tap');
        }
        lastDialogue.current = line;
      }

      setBubble(line);
      setBubbleVisible(true);
      bubbleOpacity.value = withTiming(1, { duration: 200 });

      setTimeout(() => {
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
      { scale: scaleVal.value },
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
      {/* Glow layer */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: s * 1.4,
            height: s * 1.4,
            borderRadius: s * 0.7,
            backgroundColor: glowColor,
            top: s * 0.2,
            left: s * 0.2,
          },
        ]}
      />

      {/* Kova body */}
      <TouchableWithoutFeedback onPress={handleTap} accessible accessibilityLabel="Kova, your brain training companion">
        <Animated.View style={[styles.kovaWrapper, kovaStyle, { top: s * 0.2, left: s * 0.2 }]}>
          <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Stage-specific rendering */}
            {stage === 1 && <SeedStage size={s} bodyColor={bodyColor} glowColor={glowColor} emotion={emotion} />}
            {stage === 2 && <SproutStage size={s} bodyColor={bodyColor} glowColor={glowColor} emotion={emotion} />}
            {stage >= 3 && <BloomingStage size={s} bodyColor={bodyColor} glowColor={glowColor} emotion={emotion} stage={stage} />}
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

// Stage 1: A glowing orb in soil
function SeedStage({ size: s, bodyColor, glowColor, emotion }: { size: number; bodyColor: string; glowColor: string; emotion: KovaEmotion }) {
  const cx = s / 2, cy = s / 2;
  return (
    <G>
      {/* Soil mound */}
      <Ellipse cx={cx} cy={cy + s * 0.28} rx={s * 0.28} ry={s * 0.1} fill="#3D2B1F" opacity={0.8} />
      {/* Glow orb */}
      <Circle cx={cx} cy={cy + s * 0.08} r={s * 0.18} fill={glowColor} opacity={0.25} />
      <Circle cx={cx} cy={cy + s * 0.08} r={s * 0.12} fill={bodyColor} opacity={0.9} />
      <Circle cx={cx} cy={cy + s * 0.08} r={s * 0.07} fill="#FFFFFF" opacity={0.4} />
      {/* Tiny root lines */}
      <Path d={`M${cx} ${cy + s * 0.2} L${cx - s * 0.06} ${cy + s * 0.3}`} stroke={bodyColor} strokeWidth={1.5} opacity={0.7} />
      <Path d={`M${cx} ${cy + s * 0.2} L${cx + s * 0.07} ${cy + s * 0.32}`} stroke={bodyColor} strokeWidth={1.5} opacity={0.7} />
    </G>
  );
}

// Stage 2: Small round body with leaf on top
function SproutStage({ size: s, bodyColor, glowColor, emotion }: { size: number; bodyColor: string; glowColor: string; emotion: KovaEmotion }) {
  const cx = s / 2, cy = s / 2 + s * 0.06;
  const r = s * 0.26;
  const isHappy = emotion === 'happy' || emotion === 'proud' || emotion === 'celebrating' || emotion === 'excited';
  const isWilted = emotion === 'wilted' || emotion === 'worried';
  return (
    <G>
      {/* Glow */}
      <Circle cx={cx} cy={cy} r={r + s * 0.1} fill={glowColor} opacity={0.18} />
      {/* Body */}
      <Circle cx={cx} cy={cy} r={r} fill={bodyColor} opacity={0.95} />
      <Circle cx={cx} cy={cy - r * 0.3} r={r * 0.6} fill="#FFFFFF" opacity={0.12} />
      {/* Eyes */}
      <Circle cx={cx - r * 0.32} cy={cy - r * 0.1} r={r * 0.11} fill="#0B0E17" />
      <Circle cx={cx + r * 0.32} cy={cy - r * 0.1} r={r * 0.11} fill="#0B0E17" />
      <Circle cx={cx - r * 0.27} cy={cy - r * 0.15} r={r * 0.04} fill="#FFFFFF" opacity={0.8} />
      <Circle cx={cx + r * 0.37} cy={cy - r * 0.15} r={r * 0.04} fill="#FFFFFF" opacity={0.8} />
      {/* Smile */}
      {isHappy && (
        <Path
          d={`M${cx - r * 0.22} ${cy + r * 0.22} Q${cx} ${cy + r * 0.42} ${cx + r * 0.22} ${cy + r * 0.22}`}
          stroke="#0B0E17"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {!isHappy && !isWilted && (
        <Path
          d={`M${cx - r * 0.18} ${cy + r * 0.25} Q${cx} ${cy + r * 0.35} ${cx + r * 0.18} ${cy + r * 0.25}`}
          stroke="#0B0E17"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {isWilted && (
        <Path
          d={`M${cx - r * 0.18} ${cy + r * 0.35} Q${cx} ${cy + r * 0.25} ${cx + r * 0.18} ${cy + r * 0.35}`}
          stroke="#0B0E17"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* Leaf on top */}
      <Path
        d={`M${cx} ${cy - r} Q${cx + s * 0.12} ${cy - r - s * 0.14} ${cx + s * 0.04} ${cy - r - s * 0.22} Q${cx - s * 0.04} ${cy - r - s * 0.08} ${cx} ${cy - r}`}
        fill="#5DBF7F"
        opacity={isWilted ? 0.5 : 0.9}
      />
    </G>
  );
}

// Stage 3+: Full Kova with leaf-ears and vine tail
function BloomingStage({ size: s, bodyColor, glowColor, emotion, stage }: { size: number; bodyColor: string; glowColor: string; emotion: KovaEmotion; stage: KovaStage }) {
  const cx = s / 2, cy = s / 2 + s * 0.04;
  const r = s * 0.28;
  const isHappy = ['happy', 'proud', 'celebrating', 'excited', 'relieved'].includes(emotion);
  const isWilted = ['wilted', 'worried'].includes(emotion);
  const isCurious = emotion === 'curious';
  const isZen = emotion === 'zen';

  return (
    <G>
      {/* Vine tail */}
      <Path
        d={`M${cx - r * 0.3} ${cy + r * 0.7} Q${cx - r * 0.7} ${cy + r * 1.1} ${cx - r * 0.5} ${cy + r * 1.4}`}
        stroke="#5DBF7F"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        opacity={isWilted ? 0.4 : 0.85}
      />
      {/* Outer glow */}
      <Circle cx={cx} cy={cy} r={r + s * 0.12} fill={glowColor} opacity={0.2} />
      {/* Body */}
      <Circle cx={cx} cy={cy} r={r} fill={bodyColor} opacity={0.96} />
      <Circle cx={cx} cy={cy - r * 0.25} r={r * 0.65} fill="#FFFFFF" opacity={0.1} />

      {/* Leaf ears */}
      {/* Left ear */}
      <Path
        d={`M${cx - r * 0.65} ${cy - r * 0.55} Q${cx - r * 1.0} ${cy - r * 1.1} ${cx - r * 0.45} ${cy - r * 0.85} Z`}
        fill="#5DBF7F"
        opacity={isWilted ? 0.4 : 0.9}
        transform={isWilted ? `rotate(-20, ${cx - r * 0.65}, ${cy - r * 0.55})` : undefined}
      />
      {/* Right ear */}
      <Path
        d={`M${cx + r * 0.65} ${cy - r * 0.55} Q${cx + r * 1.0} ${cy - r * 1.1} ${cx + r * 0.45} ${cy - r * 0.85} Z`}
        fill="#5DBF7F"
        opacity={isWilted ? 0.4 : 0.9}
        transform={isWilted ? `rotate(20, ${cx + r * 0.65}, ${cy - r * 0.55})` : undefined}
      />

      {/* Eyes */}
      {isZen ? (
        <>
          {/* Closed eyes */}
          <Path d={`M${cx - r * 0.32} ${cy - r * 0.08} Q${cx - r * 0.22} ${cy + r * 0.02} ${cx - r * 0.12} ${cy - r * 0.08}`} stroke="#0B0E17" strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d={`M${cx + r * 0.12} ${cy - r * 0.08} Q${cx + r * 0.22} ${cy + r * 0.02} ${cx + r * 0.32} ${cy - r * 0.08}`} stroke="#0B0E17" strokeWidth={2} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx={cx - r * 0.3} cy={cy - r * 0.08} r={r * 0.13} fill="#0B0E17" />
          <Circle cx={cx + r * 0.3} cy={cy - r * 0.08} r={r * 0.13} fill="#0B0E17" />
          <Circle cx={cx - r * 0.24} cy={cy - r * 0.14} r={r * 0.05} fill="#FFFFFF" opacity={0.85} />
          <Circle cx={cx + r * 0.36} cy={cy - r * 0.14} r={r * 0.05} fill="#FFFFFF" opacity={0.85} />
          {/* Curious: one brow raised */}
          {isCurious && (
            <Path d={`M${cx + r * 0.18} ${cy - r * 0.28} L${cx + r * 0.42} ${cy - r * 0.22}`} stroke="#0B0E17" strokeWidth={1.5} strokeLinecap="round" />
          )}
        </>
      )}

      {/* Mouth */}
      {isHappy && (
        <Path
          d={`M${cx - r * 0.24} ${cy + r * 0.24} Q${cx} ${cy + r * 0.44} ${cx + r * 0.24} ${cy + r * 0.24}`}
          stroke="#0B0E17"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {isWilted && (
        <Path
          d={`M${cx - r * 0.2} ${cy + r * 0.38} Q${cx} ${cy + r * 0.26} ${cx + r * 0.2} ${cy + r * 0.38}`}
          stroke="#0B0E17"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {!isHappy && !isWilted && !isZen && (
        <Path
          d={`M${cx - r * 0.18} ${cy + r * 0.28} Q${cx} ${cy + r * 0.38} ${cx + r * 0.18} ${cy + r * 0.28}`}
          stroke="#0B0E17"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {isZen && (
        <Path
          d={`M${cx - r * 0.14} ${cy + r * 0.3} Q${cx} ${cy + r * 0.36} ${cx + r * 0.14} ${cy + r * 0.3}`}
          stroke="#0B0E17"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      )}

      {/* Stage 5+ flowers on ears */}
      {stage >= 5 && (
        <>
          <Circle cx={cx - r * 0.78} cy={cy - r * 0.96} r={r * 0.1} fill="#E8A87C" opacity={0.9} />
          <Circle cx={cx + r * 0.78} cy={cy - r * 0.96} r={r * 0.1} fill="#E8A87C" opacity={0.9} />
          <Circle cx={cx - r * 0.78} cy={cy - r * 0.96} r={r * 0.05} fill="#FBBF24" opacity={0.9} />
          <Circle cx={cx + r * 0.78} cy={cy - r * 0.96} r={r * 0.05} fill="#FBBF24" opacity={0.9} />
        </>
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
  },
  kovaWrapper: {
    position: 'absolute',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 200,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bubbleText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -7,
    left: '50%',
    marginLeft: -7,
    width: 14,
    height: 7,
    backgroundColor: colors.bgElevated,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
