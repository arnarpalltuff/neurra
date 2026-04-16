import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii } from '../../constants/design';
import { selection } from '../../utils/haptics';
import { useProgressStore } from '../../stores/progressStore';
import { useDailyChallengeStore } from '../../stores/dailyChallengeStore';
import {
  getActivityCalendar,
  type ActivityCell,
} from '../../utils/insightsEngine';

const SQUARE = 14;
const GAP = 3;
const WEEKS = 8;

const LEVEL_BG: Record<number, string> = {
  0: C.bg4,
  1: `${C.green}33`,
  2: `${C.green}88`,
  3: C.green,
};

const CellSquare = React.memo(function CellSquare({
  cell,
  delay,
  selected,
  isLatestActive,
  onPress,
}: {
  cell: ActivityCell;
  delay: number;
  selected: boolean;
  isLatestActive: boolean;
  onPress: (c: ActivityCell) => void;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const breathe = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }));
    scale.value = withDelay(delay, withSpring(1, { damping: 20, stiffness: 160 }));
  }, [delay, opacity, scale]);

  // Breathing glow on the most recent active square. Starts after the cascade
  // finishes so it doesn't fight the entrance animation.
  useEffect(() => {
    if (!isLatestActive) return;
    breathe.value = withDelay(
      delay + 300,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(breathe);
      breathe.value = 1;
    };
  }, [isLatestActive, delay, breathe]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value * breathe.value,
    transform: [{ scale: scale.value }],
  }));

  const bg = LEVEL_BG[cell.level];
  const isHeavy = cell.level === 3;

  return (
    <Pressable
      onPress={() => {
        selection();
        onPress(cell);
      }}
      hitSlop={4}
    >
      <Animated.View
        style={[
          {
            width: SQUARE,
            height: SQUARE,
            borderRadius: 2,
            backgroundColor: bg,
          },
          cell.level === 0 && styles.emptyCell,
          isHeavy && {
            shadowColor: C.green,
            shadowOpacity: 0.25,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
          },
          selected && { borderWidth: 1.5, borderColor: C.t1 },
          style,
        ]}
      />
    </Pressable>
  );
});

function formatCellDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function tooltipText(cell: ActivityCell): string {
  if (cell.sessionCount === 0 && cell.challengeCount === 0) return 'No activity';
  const parts: string[] = [];
  if (cell.sessionCount > 0) {
    parts.push(`${cell.sessionCount} session${cell.sessionCount === 1 ? '' : 's'}`);
  }
  if (cell.challengeCount > 0) {
    parts.push(`${cell.challengeCount} challenge${cell.challengeCount === 1 ? '' : 's'}`);
  }
  return parts.join(', ');
}

export default React.memo(function ActivityCalendar() {
  const sessions = useProgressStore(s => s.sessions);
  const challenges = useDailyChallengeStore(s => s.challenges);
  const [selected, setSelected] = useState<ActivityCell | null>(null);

  const data = useMemo(
    () => getActivityCalendar(sessions, challenges, WEEKS),
    [sessions, challenges],
  );

  // Find the highest-date cell with level > 0 so we can breathe on it.
  const latestActiveDate = useMemo(() => {
    let latest = '';
    for (const row of data.grid) {
      for (const cell of row) {
        if (cell.level > 0 && cell.date > latest) latest = cell.date;
      }
    }
    return latest;
  }, [data.grid]);

  // Grid shape: rows[dayOfWeek][weekIndex]. Cascade reads top-left → bottom-right
  // by scanning week column then day row, so delay = (col * 7 + row) * 10ms.
  const cascadeDelay = (row: number, col: number) => (col * 7 + row) * 10;

  const handleCellPress = useCallback((c: ActivityCell) => {
    setSelected(prev => (prev?.date === c.date ? null : c));
  }, []);

  return (
    <Animated.View
      entering={FadeInDown.delay(250).duration(450).springify().damping(16)}
      style={styles.card}
    >
      <Text style={styles.eyebrow}>CONSISTENCY</Text>

      <View style={styles.gridRow}>
        <View style={styles.rowLabels}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <Text key={i} style={[styles.rowLabel, { height: SQUARE, lineHeight: SQUARE }]}>
              {i === 1 ? 'Mon' : i === 3 ? 'Wed' : i === 5 ? 'Fri' : ''}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {data.grid.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRowInner}>
              {row.map((cell, colIdx) => (
                <CellSquare
                  key={cell.date}
                  cell={cell}
                  delay={cascadeDelay(rowIdx, colIdx)}
                  selected={selected?.date === cell.date}
                  isLatestActive={cell.date === latestActiveDate}
                  onPress={handleCellPress}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {selected ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipDate}>{formatCellDate(selected.date)}</Text>
          <Text style={styles.tooltipBody}>{tooltipText(selected)}</Text>
        </View>
      ) : (
        <Text style={styles.summary}>
          {data.hasEnoughData
            ? `${data.totalActive} of ${data.totalDays} days (${data.percentage}%)`
            : 'Train for two weeks to see your consistency pattern.'}
        </Text>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: radii.lg,
    padding: 20,
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
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rowLabels: {
    gap: GAP,
    paddingTop: 0,
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: C.t4,
    width: 24,
    letterSpacing: 0.3,
  },
  grid: {
    gap: GAP,
    flex: 1,
  },
  gridRowInner: {
    flexDirection: 'row',
    gap: GAP,
  },
  emptyCell: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  summary: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: C.t3,
    marginTop: 4,
  },
  tooltip: {
    marginTop: 4,
    padding: space.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tooltipDate: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: C.t1,
    marginBottom: 2,
  },
  tooltipBody: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
  },
});
