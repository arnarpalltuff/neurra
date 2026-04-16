import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * Entrance stagger for top-level sections on the Games tab. Matches the
 * easing and 70ms cadence used by home/profile/insights so the tab feels
 * like part of the same app.
 */
export function useGamesSectionEntrance(index: number) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(24);

  useEffect(() => {
    const delay = index * 70;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 500, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    );
    ty.value = withDelay(
      delay,
      withTiming(0, { duration: 500, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));
}
