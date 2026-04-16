import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * Shared entrance stagger for tab sections. Each section passes its display
 * order via `index`; the hook returns an animated style that fades in and
 * rises from 24px below with the app's standard bezier. 70ms stagger keeps
 * the reveal brisk but legible.
 *
 * Used by: Home, Games, and any future tab that follows the same pattern.
 */
export function useStaggeredEntrance(index: number) {
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
