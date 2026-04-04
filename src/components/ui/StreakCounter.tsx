import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import StreakFlame from './StreakFlame';

interface StreakCounterProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  /** 0-1 urgency dim factor (1 = full, 0 = nearly out) */
  urgencyDim?: number;
}

export default function StreakCounter({ streak, size = 'md', urgencyDim = 1 }: StreakCounterProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  React.useEffect(() => {
    if (streak > 0) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 4 }),
        withSpring(1, { damping: 8 })
      );
    }
  }, [streak]);

  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 20 : 16;
  const flameSize = size === 'sm' ? 16 : size === 'lg' ? 26 : 20;

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <StreakFlame streak={streak} size={flameSize} urgencyDim={urgencyDim} />
      <Text style={[styles.count, { fontSize }]}>{streak}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.streakTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    shadowColor: colors.streakGlow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  count: {
    fontFamily: 'Nunito_700Bold',
    color: colors.streak,
    letterSpacing: 0.5,
  },
});
