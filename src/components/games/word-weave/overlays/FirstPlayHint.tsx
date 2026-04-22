import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { C } from '../../../../constants/colors';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// First-play hint
// ─────────────────────────────────────────────────────────────
export function FirstPlayHint({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(300)}
      exiting={FadeOutUp.duration(260)}
      style={styles.hintCard}
    >
      <View style={styles.hintDot} />
      <Text style={styles.hintText}>
        Longer words = <Text style={{ color: C.amber }}>exponentially</Text> more points
      </Text>
    </Animated.View>
  );
}
