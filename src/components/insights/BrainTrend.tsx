import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  cancelAnimation,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii } from '../../constants/design';
import {
  type BrainTrendPoint,
  type BrainTrendResult,
} from '../../utils/insightsEngine';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CARD_PADDING = 20;
const CHART_HEIGHT = 150;

/**
 * Monotone cubic bezier — control points stay inside local min/max so the
 * curve never overshoots between data points.
 */
function monotonePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  // Secant slopes between each pair of points.
  const n = points.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = []; // secant slopes
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    dy.push(points[i + 1].y - points[i].y);
    m.push(dx[i] === 0 ? 0 : dy[i] / dx[i]);
  }

  // Tangent at each interior point = avg of adjacent secants, unless either
  // secant is 0 (flat) or signs differ — then 0 (preserves monotonicity).
  const tangent: number[] = [];
  tangent.push(m[0]);
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) tangent.push(0);
    else tangent.push((m[i - 1] + m[i]) / 2);
  }
  tangent.push(m[n - 2]);

  // Fritsch–Carlson fix to enforce monotonicity.
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
    } else {
      const a = tangent[i] / m[i];
      const b = tangent[i + 1] / m[i];
      const h = a * a + b * b;
      if (h > 9) {
        const t = 3 / Math.sqrt(h);
        tangent[i] = t * a * m[i];
        tangent[i + 1] = t * b * m[i];
      }
    }
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + dx[i] / 3;
    const cp1y = p0.y + (tangent[i] * dx[i]) / 3;
    const cp2x = p1.x - dx[i] / 3;
    const cp2y = p1.y - (tangent[i + 1] * dx[i]) / 3;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  return d;
}

function layoutPoints(data: BrainTrendPoint[], width: number, height: number) {
  if (data.length === 0) return { points: [], min: 0, max: 0 };
  const values = data.map(d => d.avg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padX = 8;
  const usableW = Math.max(1, width - padX * 2);
  const padY = 14;
  const usableH = Math.max(1, height - padY * 2);

  const points = data.map((p, i) => {
    const x = padX + (data.length === 1 ? usableW / 2 : (usableW * i) / (data.length - 1));
    const y = padY + usableH - ((p.avg - min) / range) * usableH;
    return { x, y };
  });
  return { points, min, max };
}

function EmptyTrend() {
  return (
    <View style={styles.chartWrap}>
      <Svg width="100%" height={CHART_HEIGHT}>
        <Path
          d={`M 12 ${CHART_HEIGHT * 0.62} C 80 ${CHART_HEIGHT * 0.45}, 160 ${CHART_HEIGHT * 0.7}, 240 ${CHART_HEIGHT * 0.5} S 360 ${CHART_HEIGHT * 0.55}, 440 ${CHART_HEIGHT * 0.4}`}
          stroke={C.t4}
          strokeWidth={1.5}
          strokeDasharray="4 6"
          strokeLinecap="round"
          fill="none"
          opacity={0.25}
        />
      </Svg>
      <Text style={styles.emptyText}>Train for a week to see your brain trend.</Text>
    </View>
  );
}

function TrendChart({ trend, width }: { trend: BrainTrendResult; width: number }) {
  const lineColor =
    trend.trendDirection === 'up'
      ? C.green
      : trend.trendDirection === 'down'
      ? C.amber
      : C.t3;

  const { points } = useMemo(
    () => layoutPoints(trend.dataPoints, width, CHART_HEIGHT),
    [trend.dataPoints, width],
  );

  const pathD = useMemo(() => monotonePath(points), [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${pathD} L ${last.x} ${CHART_HEIGHT} L ${first.x} ${CHART_HEIGHT} Z`;
  }, [pathD, points]);

  const progress = useSharedValue(0);
  const areaOpacity = useSharedValue(0);
  const travel = useSharedValue(0);

  // Redraw the line whenever the data changes.
  useEffect(() => {
    progress.value = 0;
    areaOpacity.value = 0;
    progress.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
    areaOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, [pathD]);

  // Perpetual traveling dot — starts once on mount, cancelled on unmount.
  // Keyed on [] so new data doesn't stall the loop for the 1.4s delay.
  useEffect(() => {
    travel.value = withDelay(
      1400,
      withRepeat(
        withTiming(1, { duration: 8000, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(travel);
  }, []);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: 2000 * (1 - progress.value),
  }));

  const areaProps = useAnimatedProps(() => ({
    opacity: areaOpacity.value * 0.08,
  }));

  // Traveling dot — 4px green circle walks the line every 8s.
  // Linear lerp between adjacent points; the eye doesn't catch arc-length drift.
  const dotProps = useAnimatedProps(() => {
    const n = points.length;
    if (n === 0) return { cx: -10, cy: -10, opacity: 0 };
    if (n === 1) {
      return { cx: points[0].x, cy: points[0].y, opacity: 0.6 * progress.value };
    }
    const idx = travel.value * (n - 1);
    const i = Math.floor(idx);
    const frac = idx - i;
    const p0 = points[i] ?? points[0];
    const p1 = points[Math.min(i + 1, n - 1)] ?? p0;
    return {
      cx: p0.x + (p1.x - p0.x) * frac,
      cy: p0.y + (p1.y - p0.y) * frac,
      opacity: 0.6 * progress.value,
    };
  });

  return (
    <View
      style={[
        styles.chartWrap,
        {
          shadowColor: lineColor,
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    >
      <Svg width="100%" height={CHART_HEIGHT}>
        <AnimatedPath
          d={areaD}
          fill={lineColor}
          animatedProps={areaProps}
        />
        <AnimatedPath
          d={pathD}
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="2000"
          animatedProps={lineProps}
        />
        <AnimatedCircle
          r={4}
          fill={C.green}
          animatedProps={dotProps}
        />
      </Svg>
      <View style={styles.axisRow}>
        <Text style={styles.axisLabel}>Day 1</Text>
        <Text style={styles.axisLabel}>Today</Text>
      </View>
    </View>
  );
}

interface BrainTrendProps {
  trend: BrainTrendResult;
}

export default React.memo(function BrainTrend({ trend }: BrainTrendProps) {
  // Chart width = screen width - (horizontal page padding 20 × 2) - card padding
  const screenW = Dimensions.get('window').width;
  const chartWidth = screenW - 40 - CARD_PADDING * 2;

  const overallColor =
    trend.overallDelta > 0 ? C.green : trend.overallDelta < 0 ? C.amber : C.t3;
  const overallSign = trend.overallDelta > 0 ? '+' : '';

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(450).springify().damping(16)}
      style={styles.card}
    >
      <Text style={styles.eyebrow}>30-DAY TREND</Text>

      {trend.hasEnoughData ? (
        <TrendChart trend={trend} width={chartWidth} />
      ) : (
        <EmptyTrend />
      )}

      {trend.hasEnoughData && (
        <>
          <View style={styles.deltaRow}>
            {trend.perArea.map(a => {
              const color =
                a.delta > 0 ? C.green : a.delta < 0 ? C.amber : C.t4;
              const arrow = a.delta > 0 ? '↑' : a.delta < 0 ? '↓' : '→';
              return (
                <View key={a.area} style={styles.deltaPill}>
                  <Text style={[styles.deltaArrow, { color }]}>{arrow}</Text>
                  <Text style={[styles.deltaArea, { color: a.accent }]}>{a.label}</Text>
                  <Text style={styles.deltaValue}>
                    {a.delta > 0 ? '+' : ''}{a.delta}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={[styles.overall, { color: overallColor }]}>
            Overall: {overallSign}
            {trend.overallDelta} pts since 30 days ago
          </Text>
        </>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: radii.lg,
    padding: CARD_PADDING,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: space.sm,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.t3,
    textTransform: 'uppercase',
  },
  chartWrap: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  axisLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t4,
    letterSpacing: 0.4,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
    textAlign: 'center',
    marginTop: 8,
  },
  deltaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  deltaArrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  deltaArea: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
  deltaValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: C.t2,
  },
  overall: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
