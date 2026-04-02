import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, Easing, runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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

  useEffect(() => {
    // Initial pulse
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1000 }),
        withTiming(0.25, { duration: 1000 })
      ),
      -1,
      true
    );

    // Show text after 2 pulses
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 800 });
      rootOpacity.value = withTiming(1, { duration: 1200 });
    }, 2200);

    setTimeout(() => {
      tapTextOpacity.value = withTiming(1, { duration: 600 });
    }, 3500);
  }, []);

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const tapStyle = useAnimatedStyle(() => ({ opacity: tapTextOpacity.value }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: rootOpacity.value }));

  return (
    <TouchableWithoutFeedback onPress={handleTap} accessible={false}>
      <View style={styles.container}>
        {/* Center glow */}
        <View style={styles.center}>
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
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 120,
    height: 120,
  },
  glowOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.growth,
  },
  glowCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  roots: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  root: {
    position: 'absolute',
    width: 2,
    height: 30,
    backgroundColor: colors.growth,
    top: 12,
    borderRadius: 1,
    opacity: 0.7,
  },
  textContainer: {
    alignItems: 'center',
  },
  mainText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  tapContainer: {
    alignItems: 'center',
  },
  tapText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});
