import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import PressableScale from '../../src/components/ui/PressableScale';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { C } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';
import { gameConfigs, availableGames, BrainArea, GameId, AREA_LABELS, AREA_ACCENT } from '../../src/constants/gameConfigs';
import { useProgressStore } from '../../src/stores/progressStore';
import { getPlayStats, getGameOfTheDay } from '../../src/utils/gameFreshness';

type FilterArea = 'all' | BrainArea;

const FILTERS: { key: FilterArea; label: string }[] = [
  { key: 'all', label: 'All' },
  ...(Object.entries(AREA_LABELS) as Array<[BrainArea, string]>).map(([key, label]) => ({ key, label })),
];

export default function GamesScreen() {
  const gameLevels = useProgressStore(s => s.gameLevels);
  const personalBests = useProgressStore(s => s.personalBests);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const [filter, setFilter] = useState<FilterArea>('all');

  const playStats = useMemo(() => getPlayStats(gameHistory), [gameHistory]);
  const gameOfTheDay = useMemo(() => getGameOfTheDay(gameHistory, playStats), [gameHistory, playStats]);
  const gotdConfig = gameConfigs[gameOfTheDay] ?? gameConfigs['pulse'];

  const filteredGames = useMemo(() => {
    const games = Object.values(gameConfigs);
    if (filter === 'all') return games;
    return games.filter(g => g.brainArea === filter);
  }, [filter]);

  const handlePlayGame = useCallback((gameId: GameId) => {
    router.push({ pathname: '/focus-practice', params: { games: gameId } });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Games</Text>
        <Text style={styles.subtitle}>{availableGames.length} games to train every part of your brain</Text>

        {/* Game of the Day */}
        <Animated.View entering={FadeIn.delay(100).duration(400)}>
          <PressableScale
            style={styles.gotdCard}
            onPress={() => handlePlayGame(gameOfTheDay)}
          >
            <View style={styles.gotdBadge}>
              <Text style={styles.gotdBadgeText}>GAME OF THE DAY</Text>
            </View>
            <View style={styles.gotdContent}>
              <View style={[styles.gotdIcon, { backgroundColor: `${gotdConfig.color}15` }]}>
                <Text style={styles.gotdIconText}>{gotdConfig.icon}</Text>
              </View>
              <View style={styles.gotdInfo}>
                <Text style={styles.gotdName}>{gotdConfig.name}</Text>
                <Text style={styles.gotdDesc}>{gotdConfig.description}</Text>
              </View>
              <View style={styles.gotdPlayBtn}>
                <Text style={styles.gotdPlayText}>Play</Text>
              </View>
            </View>
          </PressableScale>
        </Animated.View>

        {/* Filter chips */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Game list */}
        {filteredGames.map((game, i) => {
          const level = gameLevels[game.id] ?? 1;
          const best = personalBests[game.id] ?? 0;
          const stats = playStats[game.id];
          const isNew = !stats || stats.totalPlays === 0;
          const accent = AREA_ACCENT[game.brainArea];

          return (
            <Animated.View entering={FadeInDown.delay(200 + i * 50).duration(400)} key={game.id}>
              <PressableScale
                style={[
                  styles.gameCard,
                  !game.available && styles.gameCardLocked,
                ]}
                disabled={!game.available}
                onPress={() => handlePlayGame(game.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${game.color}15` }]}>
                  <Text style={styles.icon}>{game.icon}</Text>
                </View>
                <View style={styles.gameInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.gameName, !game.available && styles.gameNameLocked]}>{game.name}</Text>
                    {isNew && game.available && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.gameDesc}>{game.description}</Text>
                  {game.available && (
                    <View style={styles.gameStats}>
                      <Text style={styles.gameStat}>Lv {Math.round(level)}</Text>
                      {best > 0 && <Text style={styles.gameStat}>Best: {best}</Text>}
                      {stats && stats.totalPlays > 0 && (
                        <Text style={styles.gameStat}>{stats.totalPlays} plays</Text>
                      )}
                    </View>
                  )}
                </View>
                <View style={styles.gameRight}>
                  {!game.available ? (
                    <Text style={styles.comingSoon}>Soon</Text>
                  ) : (
                    <View style={[styles.areaBadge, { backgroundColor: `${accent}12` }]}>
                      <Text style={[styles.areaText, { color: accent }]}>{AREA_LABELS[game.brainArea]}</Text>
                    </View>
                  )}
                </View>
              </PressableScale>
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg2 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 10 },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 14,
    marginBottom: 8,
  },

  // Game of the Day
  gotdCard: {
    backgroundColor: C.bg3,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: C.border,
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  gotdBadge: {
    backgroundColor: C.amberTint,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  gotdBadgeText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  gotdContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  gotdIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gotdIconText: { fontSize: 30 },
  gotdInfo: { flex: 1, gap: 3 },
  gotdName: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 19,
  },
  gotdDesc: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
  },
  gotdPlayBtn: {
    backgroundColor: C.amberTint,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: 'rgba(240,181,66,0.3)',
  },
  gotdPlayText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 13,
  },

  // Filters
  filterRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    backgroundColor: C.bg4,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  filterChipActive: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  filterText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
  },
  filterTextActive: { color: C.bg1 },

  // Game cards
  gameCard: {
    borderRadius: 18,
    backgroundColor: C.bg3,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  gameCardLocked: { opacity: 0.4 },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 26 },
  gameInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gameName: {
    fontFamily: fonts.headingMed,
    color: C.t1,
    fontSize: 16,
  },
  gameNameLocked: { color: C.t3 },
  newBadge: {
    backgroundColor: C.coral,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  gameDesc: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
  },
  gameStats: { flexDirection: 'row', gap: 10, marginTop: 2 },
  gameStat: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
  },
  gameRight: { alignItems: 'flex-end' },
  comingSoon: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
  },
  areaBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  areaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
