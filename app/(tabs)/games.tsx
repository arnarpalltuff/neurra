import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../src/constants/colors';
import { gameConfigs } from '../../src/constants/gameConfigs';
import { useProgressStore } from '../../src/stores/progressStore';

export default function GamesScreen() {
  const gameLevels = useProgressStore(s => s.gameLevels);
  const personalBests = useProgressStore(s => s.personalBests);

  const games = Object.values(gameConfigs);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Games</Text>
        <Text style={styles.subtitle}>10 games to train every part of your brain</Text>

        {games.map((game, i) => {
          const level = gameLevels[game.id] ?? 1;
          const best = personalBests[game.id] ?? 0;
          return (
            <Animated.View entering={FadeInDown.delay(i * 60)} key={game.id}>
              <TouchableOpacity
                style={[styles.gameCard, !game.available && styles.gameCardLocked]}
                disabled={!game.available}
                accessibilityLabel={game.name}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${game.color}20` }]}>
                  <Text style={styles.icon}>{game.icon}</Text>
                </View>
                <View style={styles.gameInfo}>
                  <Text style={[styles.gameName, !game.available && styles.gameNameLocked]}>{game.name}</Text>
                  <Text style={styles.gameDesc}>{game.description}</Text>
                  {game.available && (
                    <View style={styles.gameStats}>
                      <Text style={styles.gameStat}>Lv {Math.round(level)}</Text>
                      {best > 0 && <Text style={styles.gameStat}>Best: {best}</Text>}
                    </View>
                  )}
                </View>
                <View style={styles.gameRight}>
                  {!game.available ? (
                    <Text style={styles.comingSoon}>Soon</Text>
                  ) : (
                    <View style={[styles.areaBadge, { backgroundColor: `${game.color}25` }]}>
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
  content: { padding: 20, paddingBottom: 100, gap: 10 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 2 },
  subtitle: { color: colors.textTertiary, fontSize: 14, marginBottom: 8 },
  gameCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameCardLocked: { opacity: 0.45 },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 26 },
  gameInfo: { flex: 1, gap: 3 },
  gameName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  gameNameLocked: { color: colors.textSecondary },
  gameDesc: { color: colors.textTertiary, fontSize: 12 },
  gameStats: { flexDirection: 'row', gap: 10, marginTop: 2 },
  gameStat: { color: colors.textTertiary, fontSize: 11, fontWeight: '600' },
  gameRight: { alignItems: 'flex-end' },
  comingSoon: { color: colors.textTertiary, fontSize: 11, fontWeight: '600' },
  areaBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  areaText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
