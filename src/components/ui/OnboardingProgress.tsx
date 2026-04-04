import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '../../constants/colors';

interface OnboardingProgressProps {
  currentStep: number; // 0-indexed
  totalSteps: number;
  stepLabel?: string;
}

export default function OnboardingProgress({ currentStep, totalSteps, stepLabel }: OnboardingProgressProps) {
  const progress = (currentStep + 1) / totalSteps;

  const barStyle = useAnimatedStyle(() => ({
    width: withTiming(`${Math.round(progress * 100)}%`, { duration: 400 }),
  }));

  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.stepCount}>{currentStep + 1} of {totalSteps}</Text>
        {stepLabel && <Text style={styles.stepLabel}>{stepLabel}</Text>}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 12, gap: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepCount: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 12,
  },
  stepLabel: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    fontSize: 12,
  },
  track: {
    height: 3,
    backgroundColor: colors.surfaceDim,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    backgroundColor: colors.growth,
    borderRadius: 999,
  },
});
