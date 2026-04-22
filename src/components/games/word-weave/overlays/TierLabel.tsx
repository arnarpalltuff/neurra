import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withSpring, withTiming, withDelay,
  Easing,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Tier label — big floating announce for long words
// ─────────────────────────────────────────────────────────────
export function TierLabel({
  text, color, onDone,
}: { text: string; color: string; onDone: () => void }) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.18, { damping: 6, stiffness: 220 }),
      withSpring(1, { damping: 10 }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(450, withTiming(0, { duration: 320 })),
    );
    translateY.value = withTiming(-48, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
    const t = setTimeout(onDone, 950);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));
  return (
    <View style={styles.tierLabelWrap} pointerEvents="none">
      <Animated.Text
        style={[
          styles.tierLabelText,
          { color, textShadowColor: `${color}cc` },
          style,
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}
