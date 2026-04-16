import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { gameConfigs, AREA_LABELS, type GameId } from '../../constants/gameConfigs';
import { useProgressStore } from '../../stores/progressStore';
import { useGameUnlockStore } from '../../stores/gameUnlockStore';
import { getPlayStats } from '../../utils/gameFreshness';
import { weakestArea } from '../../utils/weakestArea';
import GameCard from './GameCard';
import { useGamesSectionEntrance } from './gameCardStagger';

interface FeaturedGamesRowProps {
  index: number;
  onPlay: (id: GameId) => void;
}

const CARD_WIDTH = 240;

// PHASE 1 STUB — horizontal snap + empty state land when final GameCard ships.
export default React.memo(function FeaturedGamesRow({
  index,
  onPlay,
}: FeaturedGamesRowProps) {
  const entranceStyle = useGamesSectionEntrance(index);
  const brainScores = useProgressStore(s => s.brainScores);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const unlockedIds = useGameUnlockStore(s => s.unlockedIds);

  const weakest = useMemo(() => weakestArea(brainScores), [brainScores]);
  const featured = useMemo<GameId[]>(() => {
    if (!weakest) return [];
    const stats = getPlayStats(gameHistory);
    return Object.values(gameConfigs)
      .filter(g => g.brainArea === weakest && unlockedIds.includes(g.id))
      .map(g => g.id)
      .sort((a, b) => {
        const da = stats[a]?.daysSinceLastPlay ?? Infinity;
        const db = stats[b]?.daysSinceLastPlay ?? Infinity;
        return db - da;
      })
      .slice(0, 3);
  }, [weakest, gameHistory, unlockedIds]);

  if (!weakest || featured.length === 0) {
    return (
      <Animated.View style={[styles.wrap, entranceStyle]}>
        <Text style={styles.eyebrow}>TRAIN YOUR BRAIN</Text>
        <Text style={styles.empty}>
          Play a few sessions and I'll tailor these for you.
        </Text>
      </Animated.View>
    );
  }

  const label = AREA_LABELS[weakest];
  return (
    <Animated.View style={[styles.wrap, entranceStyle]}>
      <Text style={styles.eyebrow}>TRAIN YOUR {label.toUpperCase()}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.row}
      >
        {featured.map(id => (
          <View key={id} style={{ width: CARD_WIDTH }}>
            <GameCard gameId={id} variant="featured" onPress={() => onPlay(id)} />
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: C.t3,
    letterSpacing: 1.4,
    paddingHorizontal: 20,
  },
  row: {
    paddingHorizontal: 20,
    gap: 12,
  },
  empty: {
    fontFamily: fonts.kova,
    fontSize: 15,
    color: C.t3,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
});
