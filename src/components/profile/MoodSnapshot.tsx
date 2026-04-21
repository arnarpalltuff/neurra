import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii } from '../../constants/design';
import { useJournalStore } from '../../stores/journalStore';
import { localDateStr, isToday as isTodayStr } from '../../utils/timeUtils';
import { selection } from '../../utils/haptics';
import { navigate } from '../../utils/navigate';
import SectionHeader from '../home/SectionHeader';

type JournalMood = 'up' | 'neutral' | 'down';

const MOOD_COLOR: Record<JournalMood, string> = {
  up: C.green,
  neutral: C.amber,
  down: C.blue,
};

function dayLabel(d: Date): string {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
}

export default React.memo(function MoodSnapshot() {
  const entries = useJournalStore(s => s.entries);

  const last7 = useMemo(() => {
    const byDate = new Map<string, JournalMood>();
    entries.forEach(e => {
      byDate.set(e.date, e.mood as JournalMood);
    });
    const out: Array<{ key: string; label: string; mood: JournalMood | null; isToday: boolean }> = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = localDateStr(d);
      out.push({
        key: k,
        label: dayLabel(d),
        mood: byDate.get(k) ?? null,
        isToday: isTodayStr(k),
      });
    }
    return out;
  }, [entries]);

  const handleOpen = () => {
    selection();
    navigate('/(tabs)/insights');
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(500).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <SectionHeader
        eyebrow="MOOD · 7 DAYS"
        actionLabel="Journal →"
        onAction={handleOpen}
      />

      <View style={styles.card}>
        <View style={styles.dotsRow}>
          {last7.map(d => (
            <View key={d.key} style={styles.dotCol}>
              <View
                style={[
                  styles.dot,
                  d.mood
                    ? {
                        backgroundColor: MOOD_COLOR[d.mood],
                        shadowColor: MOOD_COLOR[d.mood],
                        shadowOpacity: 0.5,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 2,
                      }
                    : styles.dotEmpty,
                  d.isToday && styles.dotToday,
                ]}
              />
              <Text style={[styles.dayLabel, d.isToday && styles.dayLabelToday]}>
                {d.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <LegendDot color={C.green} label="Up" />
          <LegendDot color={C.amber} label="Neutral" />
          <LegendDot color={C.blue} label="Down" />
        </View>
      </View>
    </Animated.View>
  );
});

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  card: {
    borderRadius: radii.md,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: space.md,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotCol: {
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotEmpty: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'transparent',
  },
  dotToday: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  dayLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t4,
    letterSpacing: 0.5,
  },
  dayLabelToday: {
    color: C.t2,
    fontFamily: fonts.bodySemi,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.md,
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t4,
    letterSpacing: 0.3,
  },
});
