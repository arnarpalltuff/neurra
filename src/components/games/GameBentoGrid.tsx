import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  gameConfigs,
  type BrainArea,
  type GameId,
  type GameConfig,
} from '../../constants/gameConfigs';
import { useGameUnlockStore } from '../../stores/gameUnlockStore';
import GameCard from './GameCard';
import { useGamesSectionEntrance } from './gameCardStagger';
import type { FilterArea } from './BrainAreaFilterBar';

interface GameBentoGridProps {
  index: number;
  filter: FilterArea;
  onPlay: (id: GameId) => void;
}

// PHASE 1 STUB — asymmetric bento + ≤2 centered edge case land in Phase 5.
export default React.memo(function GameBentoGrid({
  index,
  filter,
  onPlay,
}: GameBentoGridProps) {
  const entranceStyle = useGamesSectionEntrance(index);
  const unlockedIds = useGameUnlockStore(s => s.unlockedIds);

  const games = useMemo<GameConfig[]>(() => {
    const all = Object.values(gameConfigs);
    return filter === 'all' ? all : all.filter(g => g.brainArea === filter);
  }, [filter]);

  // Centered layout when filter returns ≤2 games — a "bento" with one card looks broken.
  const useCenteredLayout = games.length <= 2;

  return (
    <Animated.View style={[styles.wrap, entranceStyle]}>
      <View style={useCenteredLayout ? styles.centered : styles.grid}>
        {games.map(g => {
          const locked = !unlockedIds.includes(g.id);
          return (
            <View key={g.id} style={useCenteredLayout ? styles.centeredItem : styles.gridItem}>
              <GameCard gameId={g.id} locked={locked} onPress={() => onPlay(g.id)} />
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '100%',
  },
  centered: {
    alignItems: 'center',
    gap: 12,
  },
  centeredItem: {
    width: '86%',
  },
});
