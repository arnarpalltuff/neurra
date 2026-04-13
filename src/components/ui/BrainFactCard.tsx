import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { radii, space, shadows } from '../../constants/design';
import { useFactStore } from '../../stores/factStore';

interface Props {
  /** Stagger delay (ms) — pass index * staggerStep from caller. */
  delay?: number;
}

/**
 * Daily brain fact card. One fact per day, never repeats within 30 days.
 *
 * Sits on the home screen below the stats row. Small, neutral, conversational.
 * Brain emoji left-aligned, fact text in dim secondary color so it doesn't
 * compete with the session card.
 */
export default function BrainFactCard({ delay = 0 }: Props) {
  // useMemo so the fact is stable across re-renders within a screen mount.
  const fact = useMemo(() => useFactStore.getState().getTodaysFact(), []);

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500)}
      style={styles.card}
    >
      <Text style={styles.emoji}>🧠</Text>
      <Text style={styles.text}>{fact.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: radii.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: 1,
    borderColor: 'rgba(107,168,224,0.12)',
    shadowColor: '#6BA8E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 24,
    marginTop: 1,
    textShadowColor: 'rgba(107,168,224,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  text: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: C.t2,
  },
});
