import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, Easing,
} from 'react-native-reanimated';
import { tapMedium } from '../../utils/haptics';
import { colors } from '../../constants/colors';

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

    // Show text after 2 pulses
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 1000 });
      rootOpacity.value = withTiming(1, { duration: 1400 });
      ringOpacity.value = withTiming(0.15, { duration: 1200 });
    }, 2400);

    setTimeout(() => {
      tapTextOpacity.value = withTiming(1, { duration: 800 });
    }, 3800);
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
    backgroundColor: colors.bgVoid,
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
    borderColor: colors.growth,
  },
  glowOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.growth,
  },
  glowCore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.textHero,
    shadowColor: colors.growth,
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
    backgroundColor: colors.growth,
    top: 14,
    borderRadius: 1,
    opacity: 0.6,
  },
  textContainer: {
    alignItems: 'center',
  },
  mainText: {
    fontFamily: 'Quicksand_600SemiBold',
    color: colors.textHero,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  tapContainer: {
    alignItems: 'center',
  },
  tapText: {
    fontFamily: 'Caveat_400Regular',
    color: colors.textSecondary,
    fontSize: 20,
    letterSpacing: 0.3,
  },
});
