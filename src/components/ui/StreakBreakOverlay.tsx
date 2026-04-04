import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { warning as hapticWarning } from '../../utils/haptics';
import StreakFlame from './StreakFlame';
import Kova from '../kova/Kova';
import { stageFromXP } from '../kova/KovaStates';

interface StreakBreakOverlayProps {
  visible: boolean;
  brokenStreak: number;
  longestStreak: number;
  totalSessions: number;
  xp: number;
  onStartNewStreak: () => void;
}

export default function StreakBreakOverlay({
  visible,
  brokenStreak,
  longestStreak,
  totalSessions,
  xp,
  onStartNewStreak,
}: StreakBreakOverlayProps) {
  const flameOpacity = useSharedValue(1);
  const flameScale = useSharedValue(1);
  const contentOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      hapticWarning();

      // Flame extinguishes slowly (2 seconds)
      flameOpacity.value = 1;
      flameScale.value = 1;
      flameScale.value = withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.cubic) });
      flameOpacity.value = withSequence(
        withTiming(0.6, { duration: 800 }),
        withTiming(0.2, { duration: 600 }),
        withTiming(0, { duration: 600 }),
      );

      // Content fades in after flame dies
      contentOpacity.value = withDelay(2200, withTiming(1, { duration: 500 }));

      // Button springs in
      buttonScale.value = withDelay(3000, withSpring(1, { damping: 8, stiffness: 150 }));
    } else {
      flameOpacity.value = 1;
      flameScale.value = 1;
      contentOpacity.value = 0;
      buttonScale.value = 0;
    }
  }, [visible]);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: flameOpacity.value,
    transform: [{ scale: flameScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  if (!visible) return null;

  const stage = stageFromXP(xp);

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.overlay}>
      <View style={styles.backdrop}>
        {/* Dying flame */}
        <Animated.View style={[styles.flameArea, flameStyle]}>
          <StreakFlame streak={brokenStreak} size={64} urgencyDim={0.3} />
        </Animated.View>

        {/* Kova looking sad */}
        <View style={styles.kovaArea}>
          <Kova stage={stage} emotion="wilted" size={80} showSpeechBubble={false} />
        </View>

        {/* Recovery content */}
        <Animated.View style={[styles.content, contentStyle]}>
          <Text style={styles.title}>
            Your {brokenStreak}-day streak ended
          </Text>
          <Text style={styles.subtitle}>
            But your progress isn't gone — look:
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{longestStreak}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalSessions}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Stage {stage}</Text>
              <Text style={styles.statLabel}>Kova Growth</Text>
            </View>
          </View>
        </Animated.View>

        {/* New streak button */}
        <Animated.View style={btnStyle}>
          <Pressable style={styles.newStreakBtn} onPress={onStartNewStreak}>
            <StreakFlame streak={1} size={20} />
            <Text style={styles.newStreakText}>Start a new streak</Text>
          </Pressable>
        </Animated.View>
      </View>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  flameArea: {
    marginBottom: 8,
  },
  kovaArea: {
    marginBottom: 8,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    color: colors.textHero,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textPrimary,
    fontSize: 18,
  },
  statLabel: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 11,
  },
  newStreakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.streakTint,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: colors.streakBorder,
    shadowColor: colors.streakGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  newStreakText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.streak,
    fontSize: 16,
  },
});
