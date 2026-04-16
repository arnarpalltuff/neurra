import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { gameConfigs, AREA_ACCENT, type GameId } from '../../constants/gameConfigs';
import { useGamesSectionEntrance } from './gameCardStagger';

interface GameOfTheDayHeroProps {
  index: number;
  gameId: GameId;
  onPress: () => void;
}

// PHASE 1 STUB — hero flourish + SVG icon + breathing glow land in Phase 4.
export default React.memo(function GameOfTheDayHero({
  index,
  gameId,
}: GameOfTheDayHeroProps) {
  const style = useGamesSectionEntrance(index);
  const game = gameConfigs[gameId];
  const accent = AREA_ACCENT[game.brainArea];
  return (
    <Animated.View style={[styles.wrap, { shadowColor: accent, borderColor: `${accent}33` }, style]}>
      <Text style={styles.eyebrow}>GAME OF THE DAY</Text>
      <Text style={[styles.name, { color: C.t1 }]}>{game.name}</Text>
      <Text style={styles.desc} numberOfLines={2}>{game.description}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(19,24,41,0.9)',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    gap: 6,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: C.amber,
    letterSpacing: 1.4,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.t3,
    lineHeight: 18,
  },
});
