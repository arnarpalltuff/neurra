import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { gameConfigs, AREA_ACCENT, type GameId } from '../../constants/gameConfigs';

interface GameCardProps {
  gameId: GameId;
  locked?: boolean;
  onPress: () => void;
  /** Layout variant — grid uses vertical stack, featured uses horizontal snap width. */
  variant?: 'grid' | 'featured';
}

// PHASE 1 STUB — real card lands in Phase 2 after approval.
export default React.memo(function GameCard({ gameId, locked }: GameCardProps) {
  const game = gameConfigs[gameId];
  const accent = AREA_ACCENT[game.brainArea];
  return (
    <View style={[styles.stub, { borderColor: `${accent}44` }, locked && styles.locked]}>
      <Text style={[styles.name, { color: accent }]}>{game.name}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  stub: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(19,24,41,0.9)',
  },
  locked: { opacity: 0.55 },
  name: {
    fontFamily: fonts.heading,
    fontSize: 16,
    letterSpacing: -0.2,
  },
});
