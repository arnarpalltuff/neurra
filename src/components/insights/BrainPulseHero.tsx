import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  Easing, FadeIn,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import type { BrainPulseData } from '../../utils/insightsEngine';

const SIZE = 180;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface BrainPulseHeroProps {
  pulse: BrainPulseData;
}

export default function BrainPulseHero({ pulse }: BrainPulseHeroProps) {
  const safeScore = Number.isFinite(pulse.score) ? pulse.score : 0;
  const safeTrend = Number.isFinite(pulse.trend) ? pulse.trend : 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(safeScore / 100, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, [safeScore]);

  const animatedDashOffset = useAnimatedStyle(() => ({
    // This is a workaround — we animate a wrapper instead
    opacity: 1,
  }));

  const scoreColor =
    safeScore >= 80 ? C.green :
    safeScore >= 60 ? C.blue :
    safeScore >= 40 ? C.amber :
    C.coral;

  const trendText = safeTrend > 0 ? `+${safeTrend}` : `${safeTrend}`;
  // Brain score drops use amber — never red (anti-slop rule)
  const trendColor = safeTrend > 0 ? C.green : safeTrend < 0 ? C.amber : C.t3;

  const ringGlow = {
    shadowColor: scoreColor,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  };

  return (
    <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.container}>
      {/* Score Ring */}
      <View style={[styles.ringContainer, ringGlow]}>
        <Svg width={SIZE} height={SIZE} style={styles.svg}>
          {/* Background ring */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Progress ring */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={scoreColor}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - safeScore / 100)}
            transform={`rotate(-90, ${SIZE / 2}, ${SIZE / 2})`}
          />
        </Svg>

        {/* Score number */}
        <View style={styles.scoreCenter}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>
            {safeScore}
          </Text>
          <Text style={styles.scoreLabel}>BRAIN PULSE</Text>
        </View>
      </View>

      {/* Weather + Trend row */}
      <View style={styles.metaRow}>
        <View style={styles.weatherBadge}>
          <Text style={styles.weatherEmoji}>{pulse.weatherEmoji}</Text>
          <Text style={styles.weatherLabel}>{pulse.weatherLabel}</Text>
        </View>

        {safeTrend !== 0 && (
          <View style={[styles.trendBadge, { backgroundColor: `${trendColor}12` }]}>
            <Text style={[styles.trendText, { color: trendColor }]}>
              {safeTrend > 0 ? '↑' : '↓'} {trendText} vs last week
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  ringContainer: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  scoreCenter: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 56,
    letterSpacing: -2,
    lineHeight: 60,
  },
  scoreLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: -2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.bg4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  weatherEmoji: {
    fontSize: 16,
  },
  weatherLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 13,
  },
  trendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  trendText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
});
