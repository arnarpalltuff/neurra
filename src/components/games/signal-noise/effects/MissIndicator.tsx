import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

// ─────────────────────────────────────────────────────────────
// Miss indicator — arrow/line from wrong tap to actual change
// ─────────────────────────────────────────────────────────────
export function MissIndicator({
  tapX, tapY, targetX, targetY,
}: { tapX: number; tapY: number; targetX: number; targetY: number }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withSequence(
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
      withDelay(600, withTiming(0, { duration: 300 })),
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: prog.value * 0.7 }));
  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Line
          x1={tapX} y1={tapY} x2={targetX} y2={targetY}
          stroke="rgba(232,112,126,0.6)" strokeWidth={1.5} strokeDasharray="6,4"
        />
        <Circle cx={targetX} cy={targetY} r={8}
          stroke="rgba(232,112,126,0.8)" strokeWidth={1.5} fill="none" />
      </Svg>
    </Animated.View>
  );
}
