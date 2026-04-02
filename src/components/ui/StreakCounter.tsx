import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

interface StreakCounterProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakCounter({ streak, size = 'md' }: StreakCounterProps) {
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
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <Text style={[styles.icon, { fontSize: iconSize }]}>🔥</Text>
      <Text style={[styles.count, { fontSize }]}>{streak}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.streakDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  icon: {},
  count: {
    color: colors.streak,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
