import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withSpring,
  FadeInDown, FadeOutUp,
} from 'react-native-reanimated';
import { C } from '../../../../constants/colors';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Combo badge — floating chip when streak ≥ 3
// ─────────────────────────────────────────────────────────────
export function ComboBadge({ count }: { count: number }) {
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
