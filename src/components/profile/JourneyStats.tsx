import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii, accentGlow } from '../../constants/design';
import { useProgressStore } from '../../stores/progressStore';
import { useUserStore } from '../../stores/userStore';
import { useGameUnlockStore } from '../../stores/gameUnlockStore';
import { useDailyChallengeStore } from '../../stores/dailyChallengeStore';
import { gameConfigs, type GameId } from '../../constants/gameConfigs';
import SectionHeader from '../home/SectionHeader';

const TOTAL_GAMES = Object.keys(gameConfigs).length;
const ROW_GAP = 10;

type IconKind =
  | { kind: 'ion'; name: keyof typeof Ionicons.glyphMap }
  | { kind: 'mc'; name: keyof typeof MaterialCommunityIcons.glyphMap };

function StatTile({
  value,
  label,
  icon,
  accent,
  flex,
  height,
}: {
  value: string | number;
  label: string;
  icon: IconKind;
  accent: string;
  flex: number;
  height: number;
}) {
  return (
    <View
      style={[
        styles.tile,
        accentGlow(accent, 12, 0.15),
        { flex, height, borderColor: `${accent}22` },
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: `${accent}1A` }]}>
        {icon.kind === 'mc' ? (
          <MaterialCommunityIcons name={icon.name} size={14} color={accent} />
        ) : (
          <Ionicons name={icon.name} size={14} color={accent} />
        )}
      </View>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export default React.memo(function JourneyStats() {
  const streak = useProgressStore(s => s.streak);
  const longestStreak = useProgressStore(s => s.longestStreak);
  const sessions = useProgressStore(s => s.sessions);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const joinDate = useUserStore(s => s.joinDate);
  const unlockedIds = useGameUnlockStore(s => s.unlockedIds);
  const challenges = useDailyChallengeStore(s => s.challenges);

  const totalGames = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.games?.length ?? 0), 0),
    [sessions],
  );

  const timeStr = useMemo(() => {
    const mins = totalGames * 1.25;
    return mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${Math.round(mins)}m`;
  }, [totalGames]);

  const favoriteGame = useMemo(() => {
    const entries = Object.entries(gameHistory) as Array<[GameId, any[]]>;
    if (entries.length === 0) return null;
    const top = entries.reduce(
      (a, b) => ((a[1]?.length ?? 0) >= (b[1]?.length ?? 0) ? a : b),
    );
    return gameConfigs[top[0]]?.name ?? null;
  }, [gameHistory]);

  const challengesCompleted = useMemo(
    () => challenges.filter(c => c.status === 'completed').length,
    [challenges],
  );

  const memberSince = useMemo(() => {
    try {
      const d = new Date(joinDate);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  }, [joinDate]);

  return (
    <Animated.View
      entering={FadeInDown.delay(400).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <SectionHeader eyebrow="YOUR JOURNEY" />

      <View style={styles.row}>
        <StatTile
          value={streak}
          label="Day streak"
          icon={{ kind: 'ion', name: 'flame' }}
          accent={C.amber}
          flex={58}
          height={96}
        />
        <StatTile
          value={longestStreak}
          label="Best streak"
          icon={{ kind: 'mc', name: 'trophy-variant' }}
          accent={C.peach}
          flex={42}
          height={96}
        />
      </View>

      <View style={[styles.row, { marginTop: ROW_GAP }]}>
        <StatTile
          value={totalGames}
          label="Games played"
          icon={{ kind: 'ion', name: 'game-controller' }}
          accent={C.green}
          flex={50}
          height={88}
        />
        <StatTile
          value={timeStr}
          label="Time trained"
          icon={{ kind: 'ion', name: 'time' }}
          accent={C.blue}
          flex={50}
          height={88}
        />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Games unlocked</Text>
            <Text style={styles.summaryValue}>
              {unlockedIds.length}
              <Text style={styles.summaryMax}>/{TOTAL_GAMES}</Text>
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Challenges done</Text>
            <Text style={styles.summaryValue}>{challengesCompleted}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Favorite game</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {favoriteGame ?? '—'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Member since</Text>
            <Text style={styles.summaryValue}>{memberSince}</Text>
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
  row: {
    flexDirection: 'row',
    gap: ROW_GAP,
  },
  tile: {
    borderRadius: radii.md,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    padding: space.sm + 2,
    justifyContent: 'space-between',
  },
  tileIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileValue: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: C.t1,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  tileLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t3,
    letterSpacing: 0.2,
  },
  summaryCard: {
    marginTop: ROW_GAP,
    borderRadius: radii.md,
    backgroundColor: 'rgba(19,24,41,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: space.md,
    gap: space.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t4,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: C.t1,
    letterSpacing: -0.2,
  },
  summaryMax: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t4,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: space.sm,
  },
});
