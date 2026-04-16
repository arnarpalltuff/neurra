import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii } from '../../constants/design';
import NeuralMap from '../ui/NeuralMap';
import { useProgressStore } from '../../stores/progressStore';
import { useBrainHistoryStore } from '../../stores/brainHistoryStore';
import {
  AREA_LABELS,
  AREA_ACCENT,
  type BrainArea,
} from '../../constants/gameConfigs';
import SectionHeader from '../home/SectionHeader';

const AREAS: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];
const MAX_BAR = 100;

type Trend = 'up' | 'flat' | 'down';

function trendFor(delta: number): Trend {
  if (delta >= 3) return 'up';
  if (delta <= -3) return 'down';
  return 'flat';
}

function ScoreBar({
  area,
  score,
  trend,
  delay,
}: {
  area: BrainArea;
  score: number;
  trend: Trend;
  delay: number;
}) {
  const accent = AREA_ACCENT[area];
  const fill = useSharedValue(0);
  const pct = Math.min(100, Math.max(0, (score / MAX_BAR) * 100));

  useEffect(() => {
    fill.value = withDelay(
      delay,
      withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [pct, delay, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value}%` }));

  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const arrowColor = trend === 'up' ? C.green : trend === 'down' ? C.amber : C.t4;

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>
        {AREA_LABELS[area]}
      </Text>
      <View style={styles.barTrack}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: accent }, fillStyle]}
        />
      </View>
      <View style={styles.barEnd}>
        <Text style={styles.barValue}>{Math.round(score)}</Text>
        <Text style={[styles.barTrend, { color: arrowColor }]}>{arrow}</Text>
      </View>
    </View>
  );
}

export default React.memo(function BrainFingerprint() {
  const brainScores = useProgressStore(s => s.brainScores);
  const getSnapshotFromDaysAgo = useBrainHistoryStore(s => s.getSnapshotFromDaysAgo);

  const deltas = useMemo<Record<BrainArea, number>>(() => {
    const past = getSnapshotFromDaysAgo(7);
    const out = {} as Record<BrainArea, number>;
    AREAS.forEach(a => {
      const prior = past?.scores?.[a] ?? brainScores[a];
      out[a] = brainScores[a] - prior;
    });
    return out;
  }, [brainScores, getSnapshotFromDaysAgo]);

  const strongest = useMemo(() => {
    return AREAS.reduce((a, b) => (brainScores[a] >= brainScores[b] ? a : b));
  }, [brainScores]);

  const fastestGrowing = useMemo(() => {
    return AREAS.reduce((a, b) => (deltas[a] >= deltas[b] ? a : b));
  }, [deltas]);

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <SectionHeader eyebrow="BRAIN FINGERPRINT" />

      <View style={styles.card}>
        <View style={styles.mapRow}>
          <NeuralMap activeAreas={AREAS} size={160} intensity={0.6} />
        </View>

        <View style={styles.bars}>
          {AREAS.map((a, i) => (
            <ScoreBar
              key={a}
              area={a}
              score={brainScores[a] ?? 0}
              trend={trendFor(deltas[a])}
              delay={200 + i * 80}
            />
          ))}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Strongest</Text>
            <Text style={[styles.summaryValue, { color: AREA_ACCENT[strongest] }]}>
              {AREA_LABELS[strongest]}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Growing fastest</Text>
            <Text style={[styles.summaryValue, { color: AREA_ACCENT[fastestGrowing] }]}>
              {AREA_LABELS[fastestGrowing]}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: space.lg,
  },
  mapRow: {
    alignItems: 'center',
    marginBottom: space.md,
  },
  bars: {
    gap: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  barLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: C.t2,
    width: 76,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barEnd: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    width: 44,
    justifyContent: 'flex-end',
  },
  barValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: C.t1,
  },
  barTrend: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: space.sm,
  },
});
