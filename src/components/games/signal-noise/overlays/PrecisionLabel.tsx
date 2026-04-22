import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withSpring, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { C } from '../../../../constants/colors';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Precision label — BULLSEYE / SHARP / SPOTTED
// ─────────────────────────────────────────────────────────────
export function PrecisionLabel({ dist, onDone }: { dist: number; onDone: () => void }) {
  const text = dist < 20 ? 'BULLSEYE' : dist < 40 ? 'SHARP' : 'SPOTTED';
  const color = dist < 20 ? C.amber : dist < 40 ? C.green : C.blue;
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rise = useSharedValue(0);
  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 6, stiffness: 220 }),
      withSpring(1, { damping: 10 }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(500, withTiming(0, { duration: 300 })),
    );
    rise.value = withTiming(-40, { duration: 900, easing: Easing.out(Easing.cubic) });
    const t = setTimeout(onDone, 950);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: rise.value }],
    opacity: opacity.value,
  }));
  return (
    <View style={styles.precisionWrap} pointerEvents="none">
      <Animated.Text style={[styles.precisionText, { color, textShadowColor: `${color}cc` }, style]}>
        {text}
      </Animated.Text>
    </View>
  );
}
