import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withSpring,
  FadeIn, FadeOut,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Combo multiplier display — floating "1.5×" label
// ─────────────────────────────────────────────────────────────
export function ComboMultiplier({ streak }: { streak: number }) {
  const mult = (1 + streak * 0.25).toFixed(2).replace(/\.?0+$/, '');
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 10 }),
    );
  }, [streak]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={[styles.comboMultWrap, style]}>
      <Text style={styles.comboMultText}>{mult}×</Text>
      <Text style={styles.comboMultLabel}>MULTIPLIER</Text>
    </Animated.View>
  );
}
