import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withSequence, Easing,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

interface SessionProgressBarProps {
  /** 0-based index of the current game */
  currentIndex: number;
  /** Total number of games in the session */
  totalGames: number;
  /** How far through the current game (0–1) */
  currentProgress?: number;
  style?: ViewStyle;
}

function Segment({
  state,
  progress,
  index,
}: {
  state: 'done' | 'active' | 'upcoming';
  progress: number;
  index: number;
}) {
  const fillWidth = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (state === 'done') {
      fillWidth.value = withTiming(100, { duration: 400, easing: Easing.out(Easing.cubic) });
      glowOpacity.value = withTiming(0.6, { duration: 300 });
    } else if (state === 'active') {
      fillWidth.value = withTiming(progress * 100, { duration: 300, easing: Easing.out(Easing.cubic) });
      glowOpacity.value = 0;
    } else {
      fillWidth.value = 0;
      glowOpacity.value = 0;
    }
  }, [state, progress]);

  const fillColor = state === 'done' ? colors.streak : colors.growth;

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%` as `${number}%`,
    backgroundColor: fillColor,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.segmentFill, fillStyle]} />
      <Animated.View style={[styles.segmentGlow, glowStyle, { backgroundColor: colors.streak }]} />
    </View>
  );
}

export default function SessionProgressBar({
  currentIndex,
  totalGames,
  currentProgress = 0,
  style,
}: SessionProgressBarProps) {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: totalGames }).map((_, i) => {
        let state: 'done' | 'active' | 'upcoming';
        let progress = 0;
        if (i < currentIndex) {
          state = 'done';
          progress = 1;
        } else if (i === currentIndex) {
          state = 'active';
          progress = currentProgress;
        } else {
          state = 'upcoming';
        }
        return (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.divider} />}
            <Segment state={state} progress={progress} index={i} />
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: colors.bgTertiary,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  segmentFill: {
    height: '100%',
    borderRadius: 2,
  },
  segmentGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
  },
  divider: {
    width: 2,
    height: 4,
    backgroundColor: colors.bgPrimary,
  },
});
