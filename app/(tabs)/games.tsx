import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import PressableScale from '../../src/components/ui/PressableScale';
import Animated, {
  FadeInDown, FadeIn, FadeInRight,
  useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence,
  withTiming, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { C } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';
import { space } from '../../src/constants/design';
import {
  gameConfigs, availableGames, BrainArea, GameId,
  AREA_LABELS, AREA_ACCENT,
} from '../../src/constants/gameConfigs';
import { useProgressStore } from '../../src/stores/progressStore';
import { getPlayStats, getGameOfTheDay } from '../../src/utils/gameFreshness';
import ErrorBoundary from '../../src/components/ui/ErrorBoundary';
import FloatingParticles from '../../src/components/ui/FloatingParticles';

const { width: W } = Dimensions.get('window');

type FilterArea = 'all' | BrainArea;

const FILTERS: { key: FilterArea; label: string; color?: string }[] = [
  { key: 'all', label: 'All', color: C.green },
  ...(Object.entries(AREA_LABELS) as Array<[BrainArea, string]>).map(([key, label]) => ({
    key: key as FilterArea,
    label,
    color: AREA_ACCENT[key as BrainArea],
  })),
];

// ─────────────────────────────────────────────────────────────
// Hero card CTA pulse
// ─────────────────────────────────────────────────────────────
function PulsingCTA({ color, text, onPress }: { color: string; text: string; onPress: () => void }) {
  const glow = useSharedValue(0);
  React.useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value * 0.6,
    transform: [{ scale: 1 + glow.value * 0.015 }],
  }));
  return (
    <PressableScale onPress={onPress}>
      <Animated.View style={[styles.heroCTA, { borderColor: `${color}70`, shadowColor: color }, glowStyle]}>
        <LinearGradient
          colors={[`${color}30`, `${color}15`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
        />
        <Text style={[styles.heroCTAText, { color }]}>{text}</Text>
      </Animated.View>
    </PressableScale>
  );
}

// ─────────────────────────────────────────────────────────────
// Game card — premium glass design
// ─────────────────────────────────────────────────────────────
function GameCard({
  game, level, best, stats, accent, isNew, onPress,
}: {
  game: typeof gameConfigs[GameId];
  level: number;
  best: number;
  stats: { totalPlays: number } | undefined;
  accent: string;
  isNew: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      style={[
        styles.gameCard,
        { shadowColor: accent },
        !game.available && styles.gameCardLocked,
      ]}
      disabled={!game.available}
      onPress={onPress}
    >
      {/* Glass background */}
      <LinearGradient
        colors={['rgba(19,24,41,0.95)', 'rgba(12,15,26,0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Accent glow strip — left edge */}
      <LinearGradient
        colors={[`${accent}50`, `${accent}00`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentStrip}
      />

      {/* Icon with glow halo + gradient background */}
      <View style={styles.iconWrap}>
        <View style={[styles.iconHalo, { backgroundColor: `${accent}20`, shadowColor: accent }]} />
        <View style={[styles.iconContainer, { borderColor: `${game.color}40` }]}>
          <LinearGradient
            colors={[`${game.color}30`, `${game.color}10`]}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
          />
          <Text style={styles.icon}>{game.icon}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.gameInfo}>
        <View style={styles.nameRow}>
          <Text style={[
            styles.gameName,
            !game.available && styles.gameNameLocked,
            game.available && { textShadowColor: `${accent}30`, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
          ]}>
            {game.name}
          </Text>
          {isNew && game.available && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={styles.gameDesc} numberOfLines={1}>{game.description}</Text>
        {game.available && (
          <View style={styles.gameStats}>
            {/* Glow dots for level */}
            <View style={styles.levelDots}>
              {Array.from({ length: 5 }).map((_, di) => {
                const filled = di < Math.min(Math.ceil(level / 2), 5);
                return (
                  <View
                    key={di}
                    style={[
                      styles.levelDot,
                      filled && {
                        backgroundColor: accent,
                        shadowColor: accent,
                        shadowOpacity: 0.8,
                        shadowRadius: 3,
                      },
                    ]}
                  />
                );
              })}
            </View>
            <Text style={styles.gameStat}>Lv {Math.round(level)}</Text>
            {best > 0 && <Text style={[styles.gameStat, { color: accent }]}>Best: {best}</Text>}
            {stats && stats.totalPlays > 0 && (
              <Text style={styles.gameStat}>{stats.totalPlays}×</Text>
            )}
          </View>
        )}
      </View>

      {/* Right side — area badge + play arrow, or lock */}
      <View style={styles.gameRight}>
        {!game.available ? (
          <View style={styles.lockWrap}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        ) : (
          <>
            <View style={[styles.areaBadge, { backgroundColor: `${accent}12`, borderColor: `${accent}30` }]}>
              <Text style={[styles.areaText, { color: accent }]}>{AREA_LABELS[game.brainArea]}</Text>
            </View>
            <Text style={[styles.playArrow, { color: `${accent}80` }]}>›</Text>
          </>
        )}
      </View>
    </PressableScale>
  );
}

// ─────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────
function GamesScreenInner() {
  const gameLevels = useProgressStore(s => s.gameLevels);
  const personalBests = useProgressStore(s => s.personalBests);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const [filter, setFilter] = useState<FilterArea>('all');

  const playStats = useMemo(() => getPlayStats(gameHistory), [gameHistory]);
  const gameOfTheDay = useMemo(() => getGameOfTheDay(gameHistory, playStats), [gameHistory, playStats]);
  const gotdConfig = gameConfigs[gameOfTheDay] ?? gameConfigs['pulse'];
  const gotdAccent = AREA_ACCENT[gotdConfig.brainArea];

  const filteredGames = useMemo(() => {
    const games = Object.values(gameConfigs);
    if (filter === 'all') return games;
    return games.filter(g => g.brainArea === filter);
  }, [filter]);

  const handlePlayGame = useCallback((gameId: GameId) => {
    router.push({ pathname: '/focus-practice', params: { games: gameId } });
  }, []);

  const activeFilter = FILTERS.find(f => f.key === filter);
  const activeColor = activeFilter?.color ?? C.green;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background gradient */}
      <LinearGradient
        colors={[C.bg1, C.bg2, C.bg1]}
        style={StyleSheet.absoluteFillObject}
      />
      <FloatingParticles count={6} color="rgba(155,114,224,0.15)" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={styles.title}>Games</Text>
          <Text style={styles.subtitle}>
            {availableGames.length} BRAIN WORKOUTS · PICK YOUR CHALLENGE
          </Text>
        </Animated.View>

        {/* ── Game of the Day — premium hero card ──────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify().damping(14)}>
          <View style={[styles.heroCard, { shadowColor: gotdConfig.color }]}>
            {/* Glass background */}
            <LinearGradient
              colors={['rgba(19,24,41,0.92)', 'rgba(12,15,26,0.96)']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Accent glow bleed */}
            <LinearGradient
              colors={[`${gotdConfig.color}20`, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Top glow from accent color */}
            <LinearGradient
              colors={[`${gotdConfig.color}18`, 'transparent']}
              style={styles.heroTopGlow}
            />

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>⭐ GAME OF THE DAY</Text>
            </View>

            <View style={styles.heroContent}>
              {/* Icon with large glow */}
              <View style={styles.heroIconWrap}>
                <View style={[styles.heroIconHalo, { backgroundColor: `${gotdConfig.color}20`, shadowColor: gotdConfig.color }]} />
                <View style={[styles.heroIconBg, { backgroundColor: `${gotdConfig.color}28`, borderColor: `${gotdConfig.color}40` }]}>
                  <Text style={styles.heroIconText}>{gotdConfig.icon}</Text>
                </View>
              </View>

              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>{gotdConfig.name}</Text>
                <Text style={styles.heroDesc}>{gotdConfig.description}</Text>
                <View style={[styles.heroAreaPill, { backgroundColor: `${gotdAccent}15`, borderColor: `${gotdAccent}30` }]}>
                  <View style={[styles.heroAreaDot, { backgroundColor: gotdAccent }]} />
                  <Text style={[styles.heroAreaText, { color: gotdAccent }]}>
                    {AREA_LABELS[gotdConfig.brainArea]}
                  </Text>
                </View>
              </View>
            </View>

            <PulsingCTA
              color={gotdConfig.color}
              text="Play Now →"
              onPress={() => handlePlayGame(gameOfTheDay)}
            />
          </View>
        </Animated.View>

        {/* ── Filter chips ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((f) => {
              const isActive = filter === f.key;
              const chipColor = f.color ?? C.green;
              return (
                <Pressable
                  key={f.key}
                  style={[
                    styles.filterChip,
                    isActive && {
                      backgroundColor: `${chipColor}20`,
                      borderColor: `${chipColor}60`,
                      shadowColor: chipColor,
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      elevation: 4,
                    },
                  ]}
                  onPress={() => setFilter(f.key)}
                >
                  {isActive && (
                    <View style={[styles.filterDot, { backgroundColor: chipColor }]} />
                  )}
                  <Text style={[
                    styles.filterText,
                    isActive && { color: chipColor, fontFamily: fonts.bodyBold },
                  ]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── Game list ───────────────────────────────────────── */}
        {filteredGames.map((game, i) => {
          const level = gameLevels[game.id] ?? 1;
          const best = personalBests[game.id] ?? 0;
          const stats = playStats[game.id];
          const isNew = !stats || stats.totalPlays === 0;
          const accent = AREA_ACCENT[game.brainArea];

          return (
            <Animated.View
              entering={FadeInDown.delay(250 + i * 60).duration(400).springify().damping(16)}
              key={game.id}
            >
              <GameCard
                game={game}
                level={level}
                best={best}
                stats={stats}
                accent={accent}
                isNew={isNew}
                onPress={() => handlePlayGame(game.id)}
              />
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 12 },

  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: fonts.bodyBold,
    color: C.t3,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },

  // ── Hero card (Game of the Day) ─────────────────────────
  heroCard: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 12,
  },
  heroTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroBadge: {
    backgroundColor: 'rgba(240,181,66,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.3)',
  },
  heroBadgeText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconHalo: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  heroIconBg: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroIconText: { fontSize: 36 },
  heroInfo: { flex: 1, gap: 5 },
  heroName: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  heroDesc: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 13,
    lineHeight: 18,
  },
  heroAreaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 2,
  },
  heroAreaDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  heroAreaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  heroCTA: {
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 6,
  },
  heroCTAText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 0.4,
  },

  // ── Filters ─────────────────────────────────────────────
  filterRow: { gap: 8, paddingVertical: 6 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowOffset: { width: 0, height: 0 },
  },
  filterDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  filterText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
  },

  // ── Game cards ──────────────────────────────────────────
  gameCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  gameCardLocked: { opacity: 0.35 },

  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },

  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHalo: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  icon: { fontSize: 28 },

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
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
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
  gameStats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  levelDots: {
    flexDirection: 'row',
    gap: 3,
  },
  levelDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  gameStat: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
  },
  gameRight: { alignItems: 'flex-end' },
  lockWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  lockIcon: { fontSize: 16 },
  areaBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  areaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  playArrow: {
    fontSize: 22,
    fontWeight: '300',
    marginTop: 6,
    lineHeight: 22,
  },
});

export default function GamesScreen() {
  return (
    <ErrorBoundary scope="Games tab">
      <GamesScreenInner />
    </ErrorBoundary>
  );
}
