import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { C } from '../../../../constants/colors';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Active scan indicator — pulsing dot in scene corner when scanning
// ─────────────────────────────────────────────────────────────
export function ScanIndicator({ active }: { active: boolean }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        ), -1, true,
      );
    } else {
      pulse.value = withTiming(0.15, { duration: 300 });
    }
  }, [active]);
  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.8 + pulse.value * 0.3 }],
  }));
  return (
    <Animated.View style={[styles.scanIndicator, style]} pointerEvents="none">
      <View style={[styles.scanIndicatorDot, { backgroundColor: active ? '#5CAAC9' : C.t3 }]} />
      <Text style={[styles.scanIndicatorText, { color: active ? '#5CAAC9' : C.t3 }]}>
        {active ? 'SCANNING' : 'IDLE'}
      </Text>
    </Animated.View>
  );
}
