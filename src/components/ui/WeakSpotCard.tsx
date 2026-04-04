import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { useProgressStore } from '../../stores/progressStore';
import { analyzeErrors, WeakSpot } from '../../utils/errorReview';
import Card from './Card';

interface WeakSpotCardProps {
  onPractice: (gameIds: string[]) => void;
}

const TREND_ICONS = { improving: '↗', declining: '↘', flat: '→' };
const TREND_COLORS = { improving: colors.growth, declining: colors.coral, flat: colors.textTertiary };

export default function WeakSpotCard({ onPractice }: WeakSpotCardProps) {
  const gameHistory = useProgressStore(s => s.gameHistory);
  const brainScores = useProgressStore(s => s.brainScores);

  const insight = useMemo(
    () => analyzeErrors(gameHistory, brainScores),
    [gameHistory, brainScores],
  );

  if (insight.weakSpots.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(100)}>
      <Text style={styles.sectionTitle}>Areas to Review</Text>
      <Card style={styles.card}>
        {insight.weakSpots.map((spot, i) => (
          <View key={spot.gameId} style={[styles.spotRow, i > 0 && styles.spotBorder]}>
            <Text style={styles.spotIcon}>{spot.icon}</Text>
            <View style={styles.spotInfo}>
              <View style={styles.spotHeader}>
                <Text style={styles.spotName}>{spot.gameName}</Text>
                <View style={[styles.trendBadge, { backgroundColor: `${TREND_COLORS[spot.trend]}12` }]}>
                  <Text style={[styles.trendIcon, { color: TREND_COLORS[spot.trend] }]}>
                    {TREND_ICONS[spot.trend]}
                  </Text>
                  <Text style={[styles.trendText, { color: TREND_COLORS[spot.trend] }]}>
                    {Math.round(spot.recentAvg * 100)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.spotSuggestion}>{spot.suggestion}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.practiceBtn}
          onPress={() => onPractice(insight.focusPracticeGames)}
          accessibilityLabel="Start focus practice"
        >
          <Text style={styles.practiceBtnText}>Focus Practice</Text>
        </TouchableOpacity>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: { gap: 0 },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  spotBorder: {
    borderTopWidth: 0.5,
    borderTopColor: colors.borderSubtle,
  },
  spotIcon: { fontSize: 24, marginTop: 2 },
  spotInfo: { flex: 1, gap: 4 },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotName: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textPrimary,
    fontSize: 14,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  trendIcon: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  trendText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
  },
  spotSuggestion: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 12,
    lineHeight: 17,
  },
  practiceBtn: {
    backgroundColor: colors.coralTint,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(232,124,138,0.2)',
  },
  practiceBtnText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.coral,
    fontSize: 14,
  },
});
