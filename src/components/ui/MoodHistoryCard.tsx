import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import Card from './Card';

interface MoodEntry {
  date: string;
  mood: string;
}

interface MoodHistoryCardProps {
  moodHistory: MoodEntry[];
  currentMood: string | null;
}

const MOOD_CONFIG: Record<string, { emoji: string; color: string; value: number }> = {
  great: { emoji: '😊', color: colors.growth, value: 5 },
  good: { emoji: '🙂', color: colors.sky, value: 4 },
  okay: { emoji: '😐', color: colors.warm, value: 3 },
  low: { emoji: '😔', color: colors.lavender, value: 2 },
  rough: { emoji: '😣', color: colors.coral, value: 1 },
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function MoodHistoryCard({ moodHistory, currentMood }: MoodHistoryCardProps) {
  const last7Days = useMemo(() => {
    const days: Array<{ date: string; dayLabel: string; mood: string | null }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const dayLabel = DAY_LABELS[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
      const entry = moodHistory.find(e => e.date === dateStr);
      days.push({ date: dateStr, dayLabel, mood: entry?.mood ?? null });
    }
    return days;
  }, [moodHistory]);

  const avgMood = useMemo(() => {
    const recent = moodHistory.slice(-14).filter(e => MOOD_CONFIG[e.mood]);
    if (recent.length === 0) return null;
    const avg = recent.reduce((sum, e) => sum + (MOOD_CONFIG[e.mood]?.value ?? 3), 0) / recent.length;
    if (avg >= 4.5) return 'You\'ve been feeling great lately!';
    if (avg >= 3.5) return 'Overall positive mood this week.';
    if (avg >= 2.5) return 'A mixed week — that\'s normal.';
    return 'It\'s been a tough stretch. Be kind to yourself.';
  }, [moodHistory]);

  if (moodHistory.length < 2) return null;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Mood Tracker</Text>
      <View style={styles.weekRow}>
        {last7Days.map((day) => {
          const config = day.mood ? MOOD_CONFIG[day.mood] : null;
          return (
            <View key={day.date} style={styles.dayCol}>
              <View style={[styles.dayDot, config ? { backgroundColor: config.color } : styles.dayDotEmpty]}>
                {config && <Text style={styles.dayEmoji}>{config.emoji}</Text>}
              </View>
              <Text style={styles.dayLabel}>{day.dayLabel}</Text>
            </View>
          );
        })}
      </View>
      {avgMood && <Text style={styles.insight}>{avgMood}</Text>}
      {currentMood && (
        <Text style={styles.todayMood}>
          Today: {MOOD_CONFIG[currentMood]?.emoji} {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  title: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDotEmpty: { backgroundColor: colors.surfaceDim },
  dayEmoji: { fontSize: 18 },
  dayLabel: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 10,
  },
  insight: {
    fontFamily: 'Caveat_400Regular',
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  todayMood: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
});
