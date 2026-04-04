import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { colors } from '../src/constants/colors';
import Card from '../src/components/ui/Card';
import { useProgressStore } from '../src/stores/progressStore';
import { getPerformanceOverview } from '../src/utils/performanceAnalytics';
import { gameConfigs, AREA_LABELS, AREA_COLORS } from '../src/constants/gameConfigs';

const TREND_ICONS = { improving: '↗', declining: '↘', flat: '→' };
const TREND_COLORS = { improving: colors.growth, declining: colors.coral, flat: colors.textTertiary };

export default function StatsScreen() {
  const sessions = useProgressStore(s => s.sessions);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const brainScores = useProgressStore(s => s.brainScores);
  const xp = useProgressStore(s => s.xp);

  const overview = useMemo(
    () => getPerformanceOverview(sessions, gameHistory, brainScores, xp),
    [sessions, gameHistory, brainScores, xp],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Performance</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Overview cards */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.overviewRow}>
          <Card style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{overview.totalSessions}</Text>
            <Text style={styles.overviewLabel}>Sessions</Text>
          </Card>
          <Card style={styles.overviewCard}>
            <Text style={[styles.overviewValue, { color: colors.warm }]}>{overview.totalXP.toLocaleString()}</Text>
            <Text style={styles.overviewLabel}>Total XP</Text>
          </Card>
          <Card style={styles.overviewCard}>
            <Text style={[styles.overviewValue, { color: colors.sky }]}>{Math.round(overview.avgAccuracy * 100)}%</Text>
            <Text style={styles.overviewLabel}>Avg Accuracy</Text>
          </Card>
        </Animated.View>

        {/* Best day */}
        {overview.bestDay && (
          <Animated.View entering={FadeInDown.delay(150)}>
            <Card style={styles.bestDayCard}>
              <Text style={styles.bestDayLabel}>Best Day</Text>
              <Text style={styles.bestDayValue}>{overview.bestDay.xp} XP</Text>
              <Text style={styles.bestDayDate}>{overview.bestDay.date}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Weekly activity chart */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <Card style={styles.chartCard}>
            <View style={styles.barChart}>
              {(() => {
                const maxXP = Math.max(...overview.weeklyStats.map(w => w.totalXP), 1);
                return overview.weeklyStats.map((week, i) => {
                const height = Math.max(4, (week.totalXP / maxXP) * 100);
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.bar, { height, backgroundColor: week.totalXP > 0 ? colors.growth : colors.surfaceDim }]} />
                    <Text style={styles.barLabel}>{week.weekLabel.split(' ')[1]}</Text>
                  </View>
                );
              });
              })()}
            </View>
            <View style={styles.chartLegend}>
              <Text style={styles.chartLegendText}>
                Avg {overview.avgSessionXP} XP per session
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* 30-day streak calendar */}
        <Animated.View entering={FadeInDown.delay(250)}>
          <Text style={styles.sectionTitle}>30-Day Activity</Text>
          <Card style={styles.calendarCard}>
            <View style={styles.calendarGrid}>
              {overview.streakHistory.map((day, i) => (
                <View
                  key={day.date}
                  style={[
                    styles.calendarDot,
                    day.hadSession ? styles.calendarDotActive : styles.calendarDotInactive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.calendarDotActive]} />
                <Text style={styles.legendText}>Trained</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.calendarDotInactive]} />
                <Text style={styles.legendText}>Missed</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Brain area trends */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Brain Area Trends</Text>
          <Card style={styles.trendsCard}>
            {overview.brainTrends.map((bt) => (
              <View key={bt.area} style={styles.trendRow}>
                <View style={styles.trendLabel}>
                  <View style={[styles.trendDot, { backgroundColor: AREA_COLORS[bt.area] }]} />
                  <Text style={styles.trendArea}>{AREA_LABELS[bt.area]}</Text>
                </View>
                <Text style={[styles.trendScore, { color: AREA_COLORS[bt.area] }]}>{bt.current}</Text>
                <Text style={[
                  styles.trendChange,
                  { color: bt.change > 0 ? colors.growth : bt.change < 0 ? colors.coral : colors.textTertiary },
                ]}>
                  {bt.change > 0 ? '+' : ''}{bt.change} this week
                </Text>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Game progressions */}
        <Animated.View entering={FadeInDown.delay(350)}>
          <Text style={styles.sectionTitle}>Game Stats</Text>
          {overview.gameProgressions.map((gp) => (
            <Card key={gp.gameId} style={styles.gameCard}>
              <View style={styles.gameHeader}>
                <View style={[styles.gameIconWrap, { backgroundColor: `${gameConfigs[gp.gameId]?.color ?? colors.growth}15` }]}>
                  <Text style={styles.gameIcon}>{gp.icon}</Text>
                </View>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameName}>{gp.gameName}</Text>
                  <Text style={styles.gamePlays}>{gp.totalPlays} plays</Text>
                </View>
                <View style={[styles.trendBadge, { backgroundColor: `${TREND_COLORS[gp.trend]}12` }]}>
                  <Text style={[styles.gameTrend, { color: TREND_COLORS[gp.trend] }]}>
                    {TREND_ICONS[gp.trend]} {gp.trend}
                  </Text>
                </View>
              </View>
              <View style={styles.gameScoreRow}>
                <View style={styles.gameScoreStat}>
                  <Text style={styles.gameScoreValue}>{gp.bestScore}</Text>
                  <Text style={styles.gameScoreLabel}>Best</Text>
                </View>
                <View style={styles.gameScoreStat}>
                  <Text style={styles.gameScoreValue}>{gp.avgScore}</Text>
                  <Text style={styles.gameScoreLabel}>Average</Text>
                </View>
                <View style={styles.gameScoreStat}>
                  <Text style={styles.gameScoreValue}>
                    {gp.scores.length > 0 ? Math.round(gp.scores[gp.scores.length - 1].accuracy * 100) : 0}%
                  </Text>
                  <Text style={styles.gameScoreLabel}>Last Acc.</Text>
                </View>
              </View>
              {/* Mini score chart */}
              <View style={styles.miniChart}>
                {(() => {
                  const recent = gp.scores.slice(-10);
                  const max = Math.max(...recent.map(x => x.score), 1);
                  return recent.map((s, i) => {
                    const h = Math.max(3, (s.score / max) * 32);
                    return (
                      <View key={i} style={[styles.miniBar, { height: h, backgroundColor: AREA_COLORS[gameConfigs[gp.gameId]?.brainArea ?? 'memory'] + '80' }]} />
                    );
                  });
                })()}
              </View>
            </Card>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.sky,
    fontSize: 15,
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    color: colors.textPrimary,
    fontSize: 20,
    letterSpacing: -0.3,
  },

  // Overview
  overviewRow: { flexDirection: 'row', gap: 8 },
  overviewCard: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  overviewValue: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textPrimary,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  overviewLabel: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Best day
  bestDayCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bestDayLabel: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bestDayValue: {
    fontFamily: 'Nunito_700Bold',
    color: colors.streak,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  bestDayDate: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 12,
  },

  // Section
  sectionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 4,
  },

  // Chart
  chartCard: { gap: 12 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '80%', borderRadius: 999, minHeight: 4 },
  barLabel: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 9,
  },
  chartLegend: { alignItems: 'center' },
  chartLegendText: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 11,
  },

  // Calendar
  calendarCard: { gap: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  calendarDot: { width: 14, height: 14, borderRadius: 4 },
  calendarDotActive: { backgroundColor: colors.growth },
  calendarDotInactive: { backgroundColor: colors.surfaceDim },
  calendarLegend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 11,
  },

  // Brain trends
  trendsCard: { gap: 14 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trendLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  trendDot: { width: 8, height: 8, borderRadius: 4 },
  trendArea: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textPrimary,
    fontSize: 14,
  },
  trendScore: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    width: 36,
    textAlign: 'right',
  },
  trendChange: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    width: 80,
    textAlign: 'right',
  },

  // Game progressions
  gameCard: { gap: 12, marginBottom: 8 },
  gameHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gameIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameIcon: { fontSize: 22 },
  gameInfo: { flex: 1, gap: 2 },
  gameName: {
    fontFamily: 'Quicksand_600SemiBold',
    color: colors.textPrimary,
    fontSize: 15,
  },
  gamePlays: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 11,
  },
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  gameTrend: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  gameScoreRow: {
    flexDirection: 'row',
    gap: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  gameScoreStat: { flex: 1, alignItems: 'center', gap: 3 },
  gameScoreValue: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textPrimary,
    fontSize: 16,
  },
  gameScoreLabel: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 36 },
  miniBar: { flex: 1, borderRadius: 999, minHeight: 3 },
});
