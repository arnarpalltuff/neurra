import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts, type as t } from '../../constants/typography';
import { space, radii, motion, shadows } from '../../constants/design';
import { useJournalStore, JournalMood } from '../../stores/journalStore';

const MOOD_META: Record<JournalMood, { emoji: string; color: string; label: string }> = {
  up: { emoji: '👍', color: C.green, label: 'good' },
  neutral: { emoji: '😐', color: C.t3, label: 'okay' },
  down: { emoji: '👎', color: C.amber, label: 'rough' },
};

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - timestamp) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  limit?: number;
}

/**
 * Timeline view of brain journal entries. Renders inside the Insights tab.
 *
 * Each entry shows: date, mood emoji with accent color, optional note,
 * and the session's top score for context.
 *
 * Returns null if there are no entries (the section will be hidden by
 * the parent screen rather than showing an empty state — the home screen
 * already prompts for one).
 */
export default function JournalTimeline({ limit = 10 }: Props) {
  // Select the raw stable array, not a method that creates a new reference.
  // Sorting/slicing happens in useMemo so it only recomputes when entries change.
  const rawEntries = useJournalStore((s) => s.entries);
  const entries = useMemo(
    () => [...rawEntries].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit),
    [rawEntries, limit],
  );

  if (entries.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>JOURNAL</Text>
      <View style={styles.list}>
        {entries.map((e, i) => {
          const meta = MOOD_META[e.mood];
          return (
            <Animated.View
              key={e.id}
              entering={FadeInDown.delay(100 + i * motion.staggerStep).duration(350)}
              style={[styles.entry, { borderLeftColor: meta.color }]}
            >
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{formatDate(e.timestamp)}</Text>
                <Text style={styles.entryEmoji}>{meta.emoji}</Text>
              </View>
              {e.note && <Text style={styles.entryNote}>{e.note}</Text>}
              {e.topScore != null && e.topScore > 0 && (
                <Text style={styles.entryMeta}>
                  best: {e.topScore.toLocaleString()}
                  {e.bestGameName ? ` · ${e.bestGameName}` : ''}
                </Text>
              )}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm + 2,
  },
  sectionLabel: {
    ...t.sectionHeader,
    color: C.t3,
    marginBottom: space.xs,
  },
  list: {
    gap: space.sm,
  },
  entry: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.md,
    paddingLeft: space.md - 1,
    gap: 4,
    ...shadows.subtle,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryDate: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 13,
  },
  entryEmoji: {
    fontSize: 18,
  },
  entryNote: {
    fontFamily: fonts.body,
    color: C.t1,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  entryMeta: {
    ...t.microLabel,
    color: C.t4,
    marginTop: 2,
  },
});
