import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../../src/components/ui/FloatingParticles';
import ErrorBoundary from '../../src/components/ui/ErrorBoundary';
import { C } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';
import { availableGames, type GameId } from '../../src/constants/gameConfigs';
import { useProgressStore } from '../../src/stores/progressStore';
import { getPlayStats, getGameOfTheDay } from '../../src/utils/gameFreshness';
import { navigate } from '../../src/utils/navigate';
import GameOfTheDayHero from '../../src/components/games/GameOfTheDayHero';
import BrainAreaFilterBar, {
  type FilterArea,
} from '../../src/components/games/BrainAreaFilterBar';
import FeaturedGamesRow from '../../src/components/games/FeaturedGamesRow';
import GameBentoGrid from '../../src/components/games/GameBentoGrid';

function GamesScreenInner() {
  const gameHistory = useProgressStore(s => s.gameHistory);
  const [filter, setFilter] = useState<FilterArea>('all');

  const playStats = useMemo(() => getPlayStats(gameHistory), [gameHistory]);
  const gameOfTheDay = useMemo(
    () => getGameOfTheDay(gameHistory, playStats),
    [gameHistory, playStats],
  );

  const handlePlay = useCallback((gameId: GameId) => {
    navigate({ pathname: '/focus-practice', params: { games: gameId } });
  }, []);

  let idx = 0;
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[C.bg1, C.bg2, C.bg1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <FloatingParticles count={6} color="rgba(155,114,224,0.15)" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Games</Text>
          <Text style={styles.subtitle}>
            {availableGames.length} BRAIN WORKOUTS · PICK YOUR CHALLENGE
          </Text>
        </View>

        <GameOfTheDayHero
          index={idx++}
          gameId={gameOfTheDay}
          onPress={() => handlePlay(gameOfTheDay)}
        />
        <View style={styles.filterGap} />
        <BrainAreaFilterBar
          index={idx++}
          selected={filter}
          onSelect={setFilter}
        />
        <View style={styles.featuredGap} />
        <FeaturedGamesRow index={idx++} onPlay={handlePlay} />
        <View style={styles.gridGap} />
        <GameBentoGrid index={idx++} filter={filter} onPlay={handlePlay} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg1 },
  scroll: { paddingTop: 12, paddingBottom: 120 },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.bodyBold,
    color: C.t3,
    fontSize: 10,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  filterGap: { height: 20 },
  featuredGap: { height: 16 },
  gridGap: { height: 28 },
});

export default function GamesScreen() {
  return (
    <ErrorBoundary scope="Games tab">
      <GamesScreenInner />
    </ErrorBoundary>
  );
}
