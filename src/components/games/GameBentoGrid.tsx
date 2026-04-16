import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
} from 'react-native-reanimated';
import {
  gameConfigs,
  type GameConfig,
  type GameId,
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

/**
 * Asymmetric bento layout: rows alternate between full-width and half-width
 * pairs so the grid has visual rhythm instead of uniform columns. When the
 * filter returns ≤2 games the layout centers cards with generous margin —
 * a bento with one card looks broken.
 */
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

  const useCenteredLayout = games.length <= 2;

  // Build rows: full → pair → pair → full → repeat.
  // Rows are used only for the asymmetric variant (>2 games).
  const rows = useMemo(() => {
    if (useCenteredLayout) return [];
    const result: GameConfig[][] = [];
    let i = 0;
    let rowType: 'full' | 'pair' = 'full';
    while (i < games.length) {
      if (rowType === 'full') {
        result.push([games[i]]);
        i += 1;
        rowType = 'pair';
      } else {
        result.push(games.slice(i, i + 2));
        i += 2;
        // After two pair rows, go back to full for rhythm.
        if (result.length % 3 === 0) rowType = 'full';
      }
    }
    return result;
  }, [games, useCenteredLayout]);

  return (
    <Animated.View style={[styles.wrap, entranceStyle]}>
      {useCenteredLayout ? (
        <View style={styles.centered}>
          {games.map((g, gi) => (
            <Animated.View
              key={g.id}
              entering={FadeIn.delay(gi * 80).duration(400)}
              style={styles.centeredItem}
            >
              <GameCard
                gameId={g.id}
                locked={!unlockedIds.includes(g.id)}
                onPress={() => onPlay(g.id)}
              />
            </Animated.View>
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <Animated.View
              key={ri}
              entering={FadeIn.delay(ri * 70).duration(400)}
              style={row.length === 1 ? styles.fullRow : styles.pairRow}
            >
              {row.map(g => (
                <View key={g.id} style={row.length === 1 ? styles.fullItem : styles.halfItem}>
                  <GameCard
                    gameId={g.id}
                    locked={!unlockedIds.includes(g.id)}
                    onPress={() => onPlay(g.id)}
                  />
                </View>
              ))}
            </Animated.View>
          ))}
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
  },
  grid: {
    gap: 12,
  },
  fullRow: {
    flexDirection: 'row',
  },
  pairRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fullItem: {
    flex: 1,
  },
  halfItem: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    gap: 12,
  },
  centeredItem: {
    width: '86%',
  },
});
