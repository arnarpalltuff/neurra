import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { C } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';
import { AREA_LABELS, AREA_ACCENT } from '../../src/constants/gameConfigs';
import { useProgressStore } from '../../src/stores/progressStore';
import { useUserStore } from '../../src/stores/userStore';
import { generateInsights } from '../../src/utils/insightsEngine';
import BrainPulseHero from '../../src/components/insights/BrainPulseHero';
import InsightCard from '../../src/components/insights/InsightCard';
import { useWeeklyReportStore } from '../../src/stores/weeklyReportStore';

export default function InsightsScreen() {
  const sessions = useProgressStore(s => s.sessions);
  const brainScores = useProgressStore(s => s.brainScores);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const personalBests = useProgressStore(s => s.personalBests);
  const streak = useProgressStore(s => s.streak);
  const longestStreak = useProgressStore(s => s.longestStreak);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const xp = useProgressStore(s => s.xp);
  const level = useProgressStore(s => s.level);
  const mood = useUserStore(s => s.mood);
  const moodHistory = useUserStore(s => s.moodHistory);

  const { pulse, insights } = useMemo(
    () => generateInsights({
      sessions, brainScores, gameHistory, personalBests,
      streak, longestStreak, totalSessions, xp, level,
      mood, moodHistory,
    }),
    [sessions, brainScores, gameHistory, personalBests, streak, longestStreak, totalSessions, xp, level, mood, moodHistory],
  );

  const hasData = totalSessions >= 3;
  const reportEntries = useWeeklyReportStore((s) => s.reports);
  const pastReportIds = useMemo(
    () => Object.keys(reportEntries).sort().reverse(),
    [reportEntries],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.delay(50).duration(400)}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Your brain, decoded.</Text>
        </Animated.View>

        {!hasData ? (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧠</Text>
            <Text style={styles.emptyTitle}>Building your brain profile...</Text>
            <Text style={styles.emptyBody}>
              Complete a few more sessions and your personal insights will appear here.
              {'\n\n'}We need at least 3 sessions to start detecting patterns.
            </Text>
            <View style={styles.emptyProgress}>
              <View style={styles.emptyBar}>
                <View style={[styles.emptyBarFill, { width: `${Math.min(100, (totalSessions / 3) * 100)}%` }]} />
              </View>
              <Text style={styles.emptyCount}>{totalSessions}/3 sessions</Text>
            </View>
          </Animated.View>
        ) : (
          <>
            {/* Brain Pulse Score */}
            <BrainPulseHero pulse={pulse} />

            {/* Brain Area Snapshot */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.areaCard}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaTitle}>Brain Areas</Text>
                <View style={styles.areaStrength}>
                  <Text style={styles.areaStrengthLabel}>Strongest:</Text>
                  <Text style={[styles.areaStrengthValue, { color: AREA_ACCENT[pulse.strongestArea] }]}>
                    {AREA_LABELS[pulse.strongestArea]}
                  </Text>
                </View>
              </View>
              {(['memory', 'focus', 'speed', 'flexibility', 'creativity'] as const).map((area) => {
                const score = brainScores[area];
                const color = AREA_ACCENT[area];
                return (
                  <View key={area} style={styles.areaRow}>
                    <View style={styles.areaLabelRow}>
                      <View style={[styles.areaDot, { backgroundColor: color }]} />
                      <Text style={styles.areaLabel}>{AREA_LABELS[area]}</Text>
                      <Text style={[styles.areaScore, { color }]}>{Math.round(score)}</Text>
                    </View>
                    <View style={styles.areaBar}>
                      <View style={[styles.areaBarFill, { width: `${Math.min(score, 100)}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </Animated.View>

            {/* This Week vs Last Week */}
            <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.compareCard}>
              <Text style={styles.compareTitle}>This Week vs Last Week</Text>
              <View style={styles.compareRow}>
                <View style={styles.compareStat}>
                  <Text style={[styles.compareValue, { color: C.green }]}>
                    {Math.round(pulse.streak7DayAvg * 100)}%
                  </Text>
                  <Text style={styles.compareLabel}>This week avg</Text>
                </View>
                <View style={styles.compareDivider} />
                <View style={styles.compareStat}>
                  <Text style={[styles.compareValue, { color: pulse.trend >= 0 ? C.green : C.coral }]}>
                    {pulse.trend > 0 ? '+' : ''}{pulse.trend}%
                  </Text>
                  <Text style={styles.compareLabel}>Change</Text>
                </View>
                <View style={styles.compareDivider} />
                <View style={styles.compareStat}>
                  <Text style={[styles.compareValue, { color: C.amber }]}>
                    {streak}
                  </Text>
                  <Text style={styles.compareLabel}>Streak</Text>
                </View>
              </View>
            </Animated.View>

            {/* Insight Cards */}
            {insights.length > 0 && (
              <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>Your Patterns</Text>
                {insights.map((insight, i) => (
                  <InsightCard key={insight.id} insight={insight} index={i} />
                ))}
              </View>
            )}

            {pastReportIds.length > 0 && (
              <Animated.View entering={FadeInDown.delay(520).duration(400)} style={styles.reportsSection}>
                <Text style={styles.sectionTitle}>Past reports</Text>
                {pastReportIds.slice(0, 6).map((wid) => (
                  <Pressable
                    key={wid}
                    style={styles.reportRow}
                    onPress={() =>
                      router.push({
                        pathname: '/weekly-report',
                        params: { weekId: wid },
                      } as unknown as Parameters<typeof router.push>[0])
                    }
                  >
                    <Text style={styles.reportRowText}>{wid.replace('w-', 'Week starting ')}</Text>
                    <Text style={styles.reportRowArrow}>›</Text>
                  </Pressable>
                ))}
              </Animated.View>
            )}

            {/* Footer tip */}
            <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.footerTip}>
              <Text style={styles.footerText}>
                Insights update after each session. The more you train, the smarter your insights get.
              </Text>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg2 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 24,
  },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 14,
    marginTop: 2,
  },

  // Empty state
  emptyState: {
    backgroundColor: C.bg3,
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 20,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyProgress: {
    width: '100%',
    gap: 6,
    marginTop: 8,
  },
  emptyBar: {
    height: 6,
    backgroundColor: C.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  emptyBarFill: {
    height: '100%',
    backgroundColor: C.green,
    borderRadius: 3,
  },
  emptyCount: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 12,
    textAlign: 'center',
  },

  // Brain Areas
  areaCard: {
    backgroundColor: C.bg3,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  areaTitle: {
    fontFamily: fonts.headingMed,
    color: C.t1,
    fontSize: 17,
  },
  areaStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  areaStrengthLabel: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 11,
  },
  areaStrengthValue: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
  areaRow: { gap: 4 },
  areaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  areaDot: { width: 8, height: 8, borderRadius: 4 },
  areaLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 13,
    flex: 1,
  },
  areaScore: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  areaBar: {
    height: 5,
    backgroundColor: C.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  areaBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Compare
  compareCard: {
    backgroundColor: C.bg3,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  compareTitle: {
    fontFamily: fonts.headingMed,
    color: C.t1,
    fontSize: 17,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compareStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  compareValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  compareLabel: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 11,
  },
  compareDivider: {
    width: 0.5,
    height: 30,
    backgroundColor: C.border,
  },

  // Insights section
  insightsSection: {
    gap: 12,
  },
  reportsSection: {
    gap: 8,
    marginTop: 8,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg3,
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  reportRowText: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 14,
  },
  reportRowArrow: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 18,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 22,
    letterSpacing: -0.3,
    marginBottom: 4,
  },

  // Footer
  footerTip: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
