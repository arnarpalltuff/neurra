import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { tapHeavy } from '../../utils/haptics';
import { playLevelUp, playStreakMilestone, playConfetti } from '../../utils/sound';
import Celebration, { CelebrationType } from './Celebration';

const { width, height } = Dimensions.get('window');

export type CelebrationKind = 'levelUp' | 'streakMilestone' | 'leaguePromotion';

interface CelebrationOverlayProps {
  kind: CelebrationKind;
  value: string | number;
  visible: boolean;
  onDismiss: () => void;
}

const CELEBRATION_CONFIG: Record<CelebrationKind, {
  emoji: string;
  title: string;
  subtitle: (v: string | number) => string;
  glowColor: string;
  sound: () => void;
  confettiType: CelebrationType;
}> = {
  levelUp: {
    emoji: '⭐',
    title: 'LEVEL UP!',
    subtitle: (v) => `Level ${v}`,
    glowColor: '#FBBF24',
    sound: playLevelUp,
    confettiType: 'confetti_epic',
  },
  streakMilestone: {
    emoji: '🔥',
    title: 'STREAK FIRE!',
    subtitle: (v) => `${v} day streak!`,
    glowColor: '#FF6B35',
    sound: playStreakMilestone,
    confettiType: 'confetti_gold',
  },
  leaguePromotion: {
    emoji: '🏆',
    title: 'PROMOTED!',
    subtitle: (v) => `Welcome to ${v} League`,
    glowColor: '#A87CE8',
    sound: playStreakMilestone,
    confettiType: 'confetti_rainbow',
  },
};

export default function CelebrationOverlay({ kind, value, visible, onDismiss }: CelebrationOverlayProps) {
  const config = CELEBRATION_CONFIG[kind];
  const emojiScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0);
  const firedRef = useRef(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  useEffect(() => {
    if (visible && !firedRef.current) {
      firedRef.current = true;
      tapHeavy();
      config.sound();
      playConfetti();

      setConfettiTrigger(t => t + 1);

      glowScale.value = withSequence(
        withTiming(1.5, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      );

      emojiScale.value = withSequence(
        withSpring(1.3, { damping: 4, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 150 }),
      );

      titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    }
    if (!visible) {
      firedRef.current = false;
      emojiScale.value = 0;
      titleOpacity.value = 0;
      glowScale.value = 0;
    }
  }, [visible]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: (1 - titleOpacity.value) * 20 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.3 * glowScale.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        {/* Glow burst */}
        <Animated.View style={[styles.glow, { backgroundColor: config.glowColor }, glowStyle]} />

        {/* Emoji */}
        <Animated.Text style={[styles.emoji, emojiStyle]}>{config.emoji}</Animated.Text>

        {/* Title + subtitle */}
        <Animated.View style={[styles.textContainer, titleStyle]}>
          <Text style={[styles.title, { color: config.glowColor }]}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle(value)}</Text>
          <Text style={styles.tapHint}>Tap to continue</Text>
        </Animated.View>
      </Pressable>

      {/* Full confetti from the Celebration library */}
      <Celebration
        type={config.confettiType}
        trigger={confettiTrigger}
        origin={{ x: width / 2, y: height * 0.3 }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 32,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'Nunito_600SemiBold',
    color: C.t1,
    fontSize: 18,
  },
  tapHint: {
    fontFamily: 'Nunito_400Regular',
    color: C.t3,
    fontSize: 13,
    marginTop: 24,
  },
});
