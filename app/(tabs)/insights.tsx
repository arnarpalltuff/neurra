import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { C } from '../../src/constants/colors';
import { fonts, type as t } from '../../src/constants/typography';
import { space, radii, shadows } from '../../src/constants/design';
import { AREA_LABELS, AREA_ACCENT } from '../../src/constants/gameConfigs';
import { useProgressStore } from '../../src/stores/progressStore';
import { useUserStore } from '../../src/stores/userStore';
import { generateInsights } from '../../src/utils/insightsEngine';
import BrainPulseHero from '../../src/components/insights/BrainPulseHero';
import InsightCard from '../../src/components/insights/InsightCard';
import JournalTimeline from '../../src/components/journal/JournalTimeline';
import { useWeeklyReportStore } from '../../src/stores/weeklyReportStore';
import ErrorBoundary from '../../src/components/ui/ErrorBoundary';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Crash-safe default pulse. Every field has a valid value. */
const EMPTY_PULSE: import('../../src/utils/insightsEngine').BrainPulseData = {
  score: 0,
  trend: 0,
  weather: 'foggy',
  weatherLabel: 'Loading',
  weatherEmoji: '🌫️',
  strongestArea: 'memory',
  weakestArea: 'creativity',
  streak7DayAvg: 0,
};

function InsightsScreenInner() {
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

  // Wrap in try-catch so a data edge case in the insights engine can never
  // take down the entire screen. Falls back to empty data gracefully.
  const { pulse, insights } = useMemo(() => {
    try {
      return generateInsights({
        sessions: sessions ?? [],
        brainScores: brainScores ?? { memory: 0, focus: 0, speed: 0, flexibility: 0, creativity: 0 },
        gameHistory: gameHistory ?? {},
        personalBests: personalBests ?? {},
        streak: streak ?? 0,
        longestStreak: longestStreak ?? 0,
        totalSessions: totalSessions ?? 0,
        xp: xp ?? 0,
        level: level ?? 1,
        mood: mood ?? null,
        moodHistory: moodHistory ?? [],
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Insights] generateInsights crashed:', e);
      return { pulse: EMPTY_PULSE, insights: [] };
    }
  }, [sessions, brainScores, gameHistory, personalBests, streak, longestStreak, totalSessions, xp, level, mood, moodHistory]);

  const hasData = (totalSessions ?? 0) >= 3;
  const reportEntries = useWeeklyReportStore((s) => s.reports);
  const pastReportIds = useMemo(
    () => Object.keys(reportEntries).sort().reverse(),
    [reportEntries],
  );

  // Personal summary line
  const summaryLine = useMemo(() => {
    if (!hasData) return '';
    const trend = pulse?.trend ?? 0;
    const strongest = AREA_LABELS[pulse?.strongestArea] ?? 'Memory';
    const weakest = AREA_LABELS[pulse?.weakestArea] ?? 'Creativity';
    if (trend > 5) return `Your brain is on an upswing. ${strongest} is leading the charge.`;
    if (trend > 0) return `Steady improvement this week. ${strongest} is your strongest area.`;
    if (trend === 0) return `Consistent performance. ${weakest} could use some extra attention.`;
    if (trend > -5) return `Slight dip this week — totally normal. ${strongest} is still strong.`;
    return `Rough week for the numbers. But showing up matters more than scores.`;
  }, [hasData, pulse]);

  // Weakest area recommendation
  const recommendation = useMemo(() => {
    if (!hasData) return null;
    const weakArea = pulse?.weakestArea ?? 'creativity';
    const weakLabel = AREA_LABELS[weakArea] ?? 'Creativity';
    const weakColor = AREA_ACCENT[weakArea] ?? C.peach;
    const weakScore = Math.round(brainScores?.[weakArea] ?? 0);
    const strongArea = pulse?.strongestArea ?? 'memory';
    const strongScore = Math.round(brainScores?.[strongArea] ?? 0);
    const gap = strongScore - weakScore;
    if (gap < 10) return null; // balanced enough
    return { area: weakLabel, color: weakColor, score: weakScore, gap };
  }, [hasData, pulse, brainScores]);

  // Last 7 days activity
  const weekActivity = useMemo(() => {
    const today = new Date();
    const sessionDates = new Set((sessions ?? []).map((s: any) => s.date?.split('T')[0]));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
      return { dateStr, dayLabel, trained: sessionDates.has(dateStr), isToday: i === 6 };
    });
  }, [sessions]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.delay(50).duration(400)}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>YOUR BRAIN · DECODED</Text>
        </Animated.View>

        {/* Weekly activity dots */}
        {hasData && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.weekRow}>
            {weekActivity.map((day) => (
              <View key={day.dateStr} style={styles.weekDayCol}>
                <View style={[
                  styles.weekDot,
                  day.trained && styles.weekDotActive,
                  day.isToday && styles.weekDotToday,
                ]} />
                <Text style={[styles.weekDayLabel, day.isToday && styles.weekDayLabelToday]}>
                  {day.dayLabel}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Personal summary */}
        {hasData && summaryLine ? (
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.summaryCard}>
            <Text style={styles.summaryText}>{summaryLine}</Text>
          </Animated.View>
        ) : null}

        {!hasData ? (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧠</Text>
            <Text style={styles.emptyTitle}>Still getting to know your brain</Text>
            <Text style={styles.emptyBody}>
              A few more sessions and patterns will start showing up here. Three is the magic number.
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
                  <Text style={[styles.areaStrengthValue, { color: AREA_ACCENT[pulse?.strongestArea] ?? C.green }]}>
                    {AREA_LABELS[pulse?.strongestArea] ?? 'Memory'}
                  </Text>
                </View>
              </View>
              {(['memory', 'focus', 'speed', 'flexibility', 'creativity'] as const).map((area) => {
                const score = brainScores?.[area] ?? 0;
                const color = AREA_ACCENT[area] ?? C.green;
                return (
                  <View key={area} style={styles.areaRow}>
                    <View style={styles.areaLabelRow}>
                      <View style={[styles.areaDot, { backgroundColor: color }]} />
                      <Text style={styles.areaLabel}>{AREA_LABELS[area] ?? area}</Text>
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
                    {Math.round((pulse?.streak7DayAvg ?? 0) * 100)}%
                  </Text>
                  <Text style={styles.compareLabel}>This week avg</Text>
                </View>
                <View style={styles.compareDivider} />
                <View style={styles.compareStat}>
                  <Text style={[styles.compareValue, { color: (pulse?.trend ?? 0) >= 0 ? C.green : C.coral }]}>
                    {(pulse?.trend ?? 0) > 0 ? '+' : ''}{pulse?.trend ?? 0}%
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

            {/* Training recommendation */}
            {recommendation && (
              <Animated.View entering={FadeInDown.delay(450).duration(400)} style={[styles.recCard, { borderLeftColor: recommendation.color }]}>
                <Text style={styles.recLabel}>TRAINING TIP</Text>
                <Text style={styles.recText}>
                  Focus on <Text style={{ color: recommendation.color, fontFamily: fonts.bodyBold }}>{recommendation.area}</Text> this week — it's {recommendation.gap} points behind your strongest area.
                </Text>
                <Pressable
                  style={[styles.recBtn, { backgroundColor: `${recommendation.color}18` }]}
                  onPress={() => router.push('/(tabs)/games' as any)}
                >
                  <Text style={[styles.recBtnText, { color: recommendation.color }]}>Browse {recommendation.area} Games →</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Insight Cards */}
            {insights.length > 0 && (
              <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>Your Patterns</Text>
                {insights.map((insight, i) => (
                  <InsightCard key={insight.id} insight={insight} index={i} />
                ))}
              </View>
            )}

            {/* Brain Journal timeline */}
            <JournalTimeline />

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
                The more you train, the smarter these get. Kova's been taking notes.
              </Text>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 24,
  },
  title: {
    ...t.pageTitle,
    color: C.t1,
  },
  subtitle: {
    ...t.microLabel,
    color: C.t3,
    marginTop: 6,
  },

  // Weekly activity
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  weekDayCol: {
    alignItems: 'center',
    gap: 6,
  },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.bg4,
    borderWidth: 1,
    borderColor: C.border,
  },
  weekDotActive: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  weekDotToday: {
    borderColor: C.t2,
    borderWidth: 2,
  },
  weekDayLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: C.t4,
  },
  weekDayLabelToday: {
    color: C.t1,
  },

  // Summary
  summaryCard: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryText: {
    fontFamily: fonts.kova,
    color: C.t2,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },

  // Training recommendation
  recCard: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    gap: 10,
  },
  recLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: C.t3,
    letterSpacing: 1.5,
  },
  recText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: C.t1,
    lineHeight: 21,
  },
  recBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  recBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },

  // Empty state
  emptyState: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
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
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
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
    color: C.t2,
    fontSize: 13,
    flex: 1,
  },
  areaScore: {
    fontFamily: fonts.bodyBold,
    color: C.t2,
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
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
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
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
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
    ...t.sectionHeader,
    color: C.t3,
    marginBottom: space.xs + 2,
    marginTop: space.xs,
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

export default function InsightsScreen() {
  return (
    <ErrorBoundary scope="Insights tab">
      <InsightsScreenInner />
    </ErrorBoundary>
  );
}
