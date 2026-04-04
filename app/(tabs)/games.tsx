import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../src/constants/colors';
import { gameConfigs, availableGames, BrainArea, GameId, AREA_LABELS } from '../../src/constants/gameConfigs';
import { useProgressStore } from '../../src/stores/progressStore';
import Card from '../../src/components/ui/Card';
import { getGameOfTheDay, getPlayStats } from '../../src/utils/gameFreshness';

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
  const gotdConfig = gameConfigs[gameOfTheDay];

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

        {/* Game of the Day — hero card */}
        <Animated.View entering={FadeIn.delay(100)}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => handlePlayGame(gameOfTheDay)}>
            <Card elevated style={styles.gotdCard}>
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
            </Card>
          </TouchableOpacity>
        </Animated.View>

        {/* Filter chips — pill shape */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
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

          return (
            <Animated.View entering={FadeInDown.delay(200 + i * 50).springify()} key={game.id}>
              <TouchableOpacity
                style={[styles.gameCard, !game.available && styles.gameCardLocked]}
                disabled={!game.available}
                onPress={() => handlePlayGame(game.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.bgCardTop, colors.bgCard]}
                  style={StyleSheet.absoluteFill}
                />
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
                    <View style={[styles.areaBadge, { backgroundColor: `${game.color}12` }]}>
                      <Text style={[styles.areaText, { color: game.color }]}>{game.brainArea}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 10 },
  title: {
    fontFamily: 'Quicksand_700Bold',
    color: colors.textPrimary,
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 14,
    marginBottom: 8,
  },

  // Game of the Day
  gotdCard: {
    gap: 12,
    marginBottom: 8,
    shadowColor: colors.streak,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  gotdBadge: {
    backgroundColor: colors.streakTint,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  gotdBadgeText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.streak,
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
    fontFamily: 'Quicksand_700Bold',
    color: colors.textPrimary,
    fontSize: 19,
  },
  gotdDesc: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 12,
  },
  gotdPlayBtn: {
    backgroundColor: colors.streakTint,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: colors.streakBorder,
  },
  gotdPlayText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.streak,
    fontSize: 13,
  },

  // Filters
  filterRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    backgroundColor: colors.bgHover,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: colors.growth,
    borderColor: colors.growth,
  },
  filterText: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 13,
  },
  filterTextActive: { color: colors.textInverse },

  // Game cards
  gameCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
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
    fontFamily: 'Quicksand_600SemiBold',
    color: colors.textPrimary,
    fontSize: 16,
  },
  gameNameLocked: { color: colors.textSecondary },
  newBadge: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  gameDesc: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 12,
  },
  gameStats: { flexDirection: 'row', gap: 10, marginTop: 2 },
  gameStat: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 11,
  },
  gameRight: { alignItems: 'flex-end' },
  comingSoon: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 11,
  },
  areaBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  areaText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
});
