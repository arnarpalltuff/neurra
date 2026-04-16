import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { decorationById, type PlacedDecoration } from '../../stores/groveStore';
import { decorationGlow, isLightingCategory } from '../../utils/groveDecorationGlow';

interface GroveDecorationProps {
  placement: PlacedDecoration;
  /** Stable index for deterministic flicker stagger. */
  index: number;
}

function rotationTransform(rotation: number) {
  if (!rotation) return undefined;
  return [{ rotate: `${rotation}deg` as const }];
}

const LightingDecoration = React.memo(function LightingDecoration({
  placement,
  emoji,
  glow,
  index,
}: {
  placement: PlacedDecoration;
  emoji: string;
  glow: ReturnType<typeof decorationGlow>;
  index: number;
}) {
  const flicker = useSharedValue(1);
  const baseShadowOpacity = glow.shadowOpacity;

  useEffect(() => {
    // Small random flicker so lanterns don't pulse in lockstep.
    const dur = 2200 + (index % 5) * 320;
    flicker.value = withDelay(
      (index % 4) * 400,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: dur, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.8, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(flicker);
  }, [index, flicker]);

  const style = useAnimatedStyle(() => ({
    shadowOpacity: baseShadowOpacity * flicker.value,
  }));

  return (
    <Animated.View
      style={[
        styles.decoration,
        { left: placement.x, top: placement.y },
        glow,
        style,
      ]}
    >
      <Text style={[styles.emoji, { transform: rotationTransform(placement.rotation) }]}>
        {emoji}
      </Text>
    </Animated.View>
  );
});

const StaticDecoration = React.memo(function StaticDecoration({
  placement,
  emoji,
  glow,
}: {
  placement: PlacedDecoration;
  emoji: string;
  glow: ReturnType<typeof decorationGlow>;
}) {
  return (
    <View
      style={[
        styles.decoration,
        { left: placement.x, top: placement.y },
        glow,
      ]}
    >
      <Text style={[styles.emoji, { transform: rotationTransform(placement.rotation) }]}>
        {emoji}
      </Text>
    </View>
  );
});

export default React.memo(function GroveDecoration({
  placement,
  index,
}: GroveDecorationProps) {
  const def = decorationById(placement.defId);
  const emoji = def?.emoji ?? '🌿';
  const category = def?.category;
  const glow = useMemo(() => decorationGlow(category), [category]);

  return isLightingCategory(category)
    ? <LightingDecoration placement={placement} emoji={emoji} glow={glow} index={index} />
    : <StaticDecoration placement={placement} emoji={emoji} glow={glow} />;
});

const styles = StyleSheet.create({
  decoration: {
    position: 'absolute',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});
