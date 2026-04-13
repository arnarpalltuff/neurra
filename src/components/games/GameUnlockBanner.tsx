import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { fonts, type as t } from '../../constants/typography';
import { space, radii, shadows, accentGlow } from '../../constants/design';
import { gameConfigs, AREA_ACCENT, GameId } from '../../constants/gameConfigs';
import { useGameUnlockStore, daysSinceJoin } from '../../stores/gameUnlockStore';
import { unlocksOnDay } from '../../constants/gameUnlockSchedule';
import { tapMedium } from '../../utils/haptics';

/**
 * Home-screen banner shown when one or more games unlock today.
 *
 * Lists the new games with their accent colors and lets the user tap to
 * try one immediately. Self-dismisses after the user marks the day as
 * celebrated, so it only appears once per unlock day.
 */
export default function GameUnlockBanner() {
  const celebratedDays = useGameUnlockStore((s) => s.celebratedDays);
  const markCelebrated = useGameUnlockStore((s) => s.markCelebrated);
  const refresh = useGameUnlockStore((s) => s.refresh);
  const [day, setDay] = useState(() => daysSinceJoin());
  const [todaysUnlocks, setTodaysUnlocks] = useState<GameId[]>(() => unlocksOnDay(day));

  useEffect(() => {
    // Refresh on mount in case the schedule advanced since last open.
    refresh();
    const d = daysSinceJoin();
    setDay(d);
    setTodaysUnlocks(unlocksOnDay(d));
  }, [refresh]);

  if (todaysUnlocks.length === 0 || celebratedDays.includes(day)) return null;

  const firstGame = todaysUnlocks[0];
  const firstConfig = gameConfigs[firstGame];
  if (!firstConfig) return null;
  const accent = AREA_ACCENT[firstConfig.brainArea];
  const isPlural = todaysUnlocks.length > 1;

  const handleTryNow = () => {
    tapMedium();
    markCelebrated(day);
    // focus-practice reads `games` (string, comma-separated). Pass single id.
    router.push({
      pathname: '/focus-practice',
      params: { games: firstGame },
    } as unknown as Parameters<typeof router.push>[0]);
  };

  const handleDismiss = () => {
    markCelebrated(day);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(450)}
      exiting={FadeOut.duration(250)}
      style={[styles.card, { borderLeftColor: accent }]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>NEW GAME{isPlural ? 'S' : ''} UNLOCKED</Text>
        <Pressable hitSlop={10} onPress={handleDismiss}>
          <Text style={styles.dismiss}>×</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{firstConfig.icon} {firstConfig.name}</Text>
      <Text style={styles.message}>
        {isPlural
          ? `${firstConfig.name} and ${todaysUnlocks.length - 1} more — Kova thinks you're ready.`
          : `Kova thinks you're ready. Tap to try it.`}
      </Text>
      <Pressable
        style={[styles.tryBtn, { backgroundColor: accent, ...accentGlow(accent, 12, 0.3) }]}
        onPress={handleTryNow}
      >
        <Text style={styles.tryBtnText}>Let's try it</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    paddingVertical: space.md,
    paddingHorizontal: space.md + 2,
    paddingLeft: space.md - 1,
    gap: space.xs + 2,
    ...shadows.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...t.sectionHeader,
    color: C.t3,
  },
  dismiss: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 22,
    lineHeight: 22,
  },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 20,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  message: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 13,
    lineHeight: 19,
  },
  tryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radii.full,
    marginTop: space.xs,
  },
  tryBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
