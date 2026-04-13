import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, Easing,
} from 'react-native-reanimated';
import { tapMedium } from '../../utils/haptics';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';

const { width, height } = Dimensions.get('window');

interface AwakeningProps {
  onNext: () => void;
}

export default function Awakening({ onNext }: AwakeningProps) {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);
  const textOpacity = useSharedValue(0);
  const rootOpacity = useSharedValue(0);
  const tapTextOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    // Core pulse
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200 }),
        withTiming(0.2, { duration: 1200 })
      ),
      -1,
      true
    );

    // Outer ring pulse (offset timing for depth)
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.2, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Show text quickly — don't make users wait. The orb is beautiful but
    // impatient users will tap away before they see it.
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 800 });
      rootOpacity.value = withTiming(1, { duration: 1000 });
      ringOpacity.value = withTiming(0.15, { duration: 800 });
    }, 800);

    setTimeout(() => {
      tapTextOpacity.value = withTiming(1, { duration: 600 });
    }, 1500);
  }, []);

  const handleTap = () => {
    tapMedium();
    onNext();
  };

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const tapStyle = useAnimatedStyle(() => ({ opacity: tapTextOpacity.value }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: rootOpacity.value }));

  return (
    <TouchableWithoutFeedback onPress={handleTap} accessible={false}>
      <View style={styles.container}>
        {/* Center glow */}
        <View style={styles.center}>
          <Animated.View style={[styles.glowRing, ringStyle]} />
          <Animated.View style={[styles.glowOuter, glowStyle]} />
          <View style={styles.glowCore} />
          {/* Root lines */}
          <Animated.View style={[styles.roots, rootStyle]}>
            <View style={[styles.root, { transform: [{ rotate: '-30deg' }] }]} />
            <View style={[styles.root, { transform: [{ rotate: '0deg' }] }]} />
            <View style={[styles.root, { transform: [{ rotate: '30deg' }] }]} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.mainText}>Something is growing.</Text>
        </Animated.View>

        <Animated.View style={[styles.tapContainer, tapStyle]}>
          <Text style={styles.tapText}>Tap to wake it up.</Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 140,
    height: 140,
  },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: C.green,
  },
  glowOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.green,
  },
  glowCore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.t1,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  roots: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  root: {
    position: 'absolute',
    width: 1.5,
    height: 32,
    backgroundColor: C.green,
    top: 14,
    borderRadius: 1,
    opacity: 0.6,
  },
  textContainer: {
    alignItems: 'center',
  },
  mainText: {
    fontFamily: fonts.headingMed,
    color: C.t1,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  tapContainer: {
    alignItems: 'center',
  },
  tapText: {
    fontFamily: fonts.kova,
    color: C.t2,
    fontSize: 20,
    letterSpacing: 0.3,
  },
});
