import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

/**
 * Subtle floating orbs that drift across the background.
 * Renders 3 large, blurred, semi-transparent circles that slowly move.
 */
export default function AuroraBackground() {
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb3X = useSharedValue(0);
  const orb3Y = useSharedValue(0);

  useEffect(() => {
    const drift = (sv: SharedValue<number>, range: number, dur: number) => {
      sv.value = withRepeat(
        withSequence(
          withTiming(range, { duration: dur, easing: Easing.inOut(Easing.sin) }),
          withTiming(-range, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    };
    drift(orb1X, 40, 8000);
    drift(orb1Y, 30, 10000);
    drift(orb2X, -35, 12000);
    drift(orb2Y, 25, 9000);
    drift(orb3X, 30, 11000);
    drift(orb3Y, -20, 7000);
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));
  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));
  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb3X.value }, { translateY: orb3Y.value }],
  }));

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.orb, styles.orb1, orb1Style]} />
      <Animated.View pointerEvents="none" style={[styles.orb, styles.orb2, orb2Style]} />
      <Animated.View pointerEvents="none" style={[styles.orb, styles.orb3, orb3Style]} />
    </>
  );
}

const ORB_SIZE = 200;

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    opacity: 0.06,
  },
  orb1: {
    backgroundColor: colors.growth,
    top: height * 0.15,
    left: -ORB_SIZE * 0.3,
  },
  orb2: {
    backgroundColor: colors.sky,
    top: height * 0.4,
    right: -ORB_SIZE * 0.2,
  },
  orb3: {
    backgroundColor: colors.lavender,
    top: height * 0.65,
    left: width * 0.2,
  },
});
