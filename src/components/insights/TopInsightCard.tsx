import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import type { BrainPulseData, Insight } from '../../utils/insightsEngine';

interface TopInsightCardProps {
  pulse: BrainPulseData;
  topInsight: Insight | null;
  delay?: number;
}

export default function TopInsightCard({ pulse, topInsight, delay = 400 }: TopInsightCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/(tabs)/insights' as any)}
      >
        {/* Pulse score mini */}
        <View style={styles.pulseRow}>
          <View style={styles.pulseLeft}>
            <Text style={styles.pulseLabel}>BRAIN PULSE</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.pulseScore}>{pulse.score}</Text>
              <Text style={styles.weatherEmoji}>{pulse.weatherEmoji}</Text>
              {pulse.trend !== 0 && (
                <Text style={[
                  styles.trendText,
                  { color: pulse.trend > 0 ? C.green : C.coral },
                ]}>
                  {pulse.trend > 0 ? '↑' : '↓'}{Math.abs(pulse.trend)}%
                </Text>
              )}
            </View>
          </View>

          {/* Mini ring */}
          <View style={styles.miniRing}>
            <View style={[
              styles.miniRingFill,
              {
                backgroundColor:
                  pulse.score >= 80 ? C.green :
                  pulse.score >= 60 ? C.blue :
                  pulse.score >= 40 ? C.amber : C.coral,
              },
            ]} />
          </View>
        </View>

        {/* Top insight preview */}
        {topInsight && (
          <View style={styles.insightPreview}>
            <View style={[styles.insightAccent, { backgroundColor: topInsight.accent }]} />
            <Text style={styles.insightIcon}>{topInsight.icon}</Text>
            <Text style={styles.insightTitle} numberOfLines={1}>{topInsight.title}</Text>
          </View>
        )}

        <Text style={styles.seeAll}>See all insights →</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.bg3,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  pulseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulseLeft: {
    gap: 2,
  },
  pulseLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  pulseScore: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 32,
    letterSpacing: -1,
  },
  weatherEmoji: {
    fontSize: 18,
  },
  trendText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  miniRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRingFill: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  insightPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.bg4,
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  insightAccent: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  insightIcon: {
    fontSize: 16,
  },
  insightTitle: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 13,
    flex: 1,
  },
  seeAll: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 12,
    textAlign: 'right',
  },
});
