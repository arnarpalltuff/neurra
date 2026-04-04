import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, withDelay, withSpring, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { xpForLevel } from '../../stores/progressStore';

interface XPProgressBarProps {
  currentXP: number;
  xpForCurrentLevel: number;
  xpIntoLevel: number;
  level: number;
  style?: ViewStyle;
}

export function getXPProgress(xp: number, level: number) {
  let accumulated = 0;
  for (let l = 1; l < level; l++) {
    accumulated += xpForLevel(l);
  }
  const xpIntoLevel = xp - accumulated;
  const xpNeeded = xpForLevel(level);
  return { xpIntoLevel, xpNeeded };
}

export default function XPProgressBar({ currentXP, xpForCurrentLevel, xpIntoLevel, level, style }: XPProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (xpIntoLevel / xpForCurrentLevel) * 100));
  const fillWidth = useSharedValue(0);
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    fillWidth.value = withTiming(pct, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [pct]);

  // Subtle shimmer that sweeps across the filled area
  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
    );
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%` as `${number}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 200 }],
    opacity: 0.3,
  }));

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>
          {xpIntoLevel.toLocaleString()} / {xpForCurrentLevel.toLocaleString()} XP
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fillContainer, fillStyle]}>
          <LinearGradient
            colors={[colors.warm, colors.streak]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Shimmer overlay */}
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textPrimary,
    fontSize: 15,
  },
  xpText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.warm,
    fontSize: 13,
  },
  track: {
    width: '100%',
    height: 8,
    backgroundColor: colors.bgTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fillContainer: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
});
