import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { C } from '../../src/constants/colors';
import { fonts, type as t } from '../../src/constants/typography';
import { space, radii, accentGlow } from '../../src/constants/design';
import { AREA_LABELS, AREA_ACCENT } from '../../src/constants/gameConfigs';
import { useProgressStore } from '../../src/stores/progressStore';
import { useUserStore } from '../../src/stores/userStore';
import { useBrainHistoryStore } from '../../src/stores/brainHistoryStore';
import { generateInsights, getBrainTrend } from '../../src/utils/insightsEngine';
import { selection } from '../../src/utils/haptics';
import { localDateStr } from '../../src/utils/timeUtils';
import BrainPulseHero from '../../src/components/insights/BrainPulseHero';
import InsightCard from '../../src/components/insights/InsightCard';
import KovaBrainCoach from '../../src/components/insights/KovaBrainCoach';
import PersonalBests from '../../src/components/insights/PersonalBests';
import BrainTrend from '../../src/components/insights/BrainTrend';
import ActivityCalendar from '../../src/components/insights/ActivityCalendar';
import PressableScale from '../../src/components/ui/PressableScale';
import JournalTimeline from '../../src/components/journal/JournalTimeline';
import { useWeeklyReportStore } from '../../src/stores/weeklyReportStore';
import ErrorBoundary from '../../src/components/ui/ErrorBoundary';
import { SafeAreaView } from 'react-native-safe-area-context';

// Spacing rhythm — related sections hug tighter, distinct groups breathe
const RELATED = 16;
const DISTINCT = 28;

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
  const mood = useUserStore(s => s.mood);
  const moodHistory = useUserStore(s => s.moodHistory);
  const snapshots = useBrainHistoryStore(s => s.snapshots);

  // Try-catch so a data edge case in the insights engine can never take down
  // the entire screen. Falls back to empty data gracefully.
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
        mood: mood ?? null,
        moodHistory: moodHistory ?? [],
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Insights] generateInsights crashed:', e);
      return { pulse: EMPTY_PULSE, insights: [] };
    }
  }, [sessions, brainScores, gameHistory, personalBests, streak, longestStreak, totalSessions, mood, moodHistory]);

  // Single 30-day trend computation shared with KovaBrainCoach + BrainTrend.
  const trend = useMemo(() => getBrainTrend(snapshots, 30), [snapshots]);

  const hasData = (totalSessions ?? 0) >= 3;
  const reportEntries = useWeeklyReportStore((s) => s.reports);
  const pastReportIds = useMemo(
    () => Object.keys(reportEntries).sort().reverse(),
    [reportEntries],
  );

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

  const recommendation = useMemo(() => {
    if (!hasData) return null;
    const weakArea = pulse?.weakestArea ?? 'creativity';
    const weakLabel = AREA_LABELS[weakArea] ?? 'Creativity';
    const weakColor = AREA_ACCENT[weakArea] ?? C.peach;
    const weakScore = Math.round(brainScores?.[weakArea] ?? 0);
    const strongArea = pulse?.strongestArea ?? 'memory';
    const strongScore = Math.round(brainScores?.[strongArea] ?? 0);
    const gap = strongScore - weakScore;
    if (gap < 10) return null;
    return { area: weakLabel, color: weakColor, score: weakScore, gap };
  }, [hasData, pulse, brainScores]);

  const weekActivity = useMemo(() => {
    const today = new Date();
    // Use device-local dates so "trained" matches what the user sees on the clock.
    const sessionDates = new Set(
      (sessions ?? []).map(s => localDateStr(new Date(s.date))),
    );
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = localDateStr(d);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
      return { dateStr, dayLabel, trained: sessionDates.has(dateStr), isToday: i === 6 };
    });
  }, [sessions]);

  const strongestAccent = AREA_ACCENT[pulse?.strongestArea] ?? C.green;

  const handleBrowseGames = () => {
    selection();
    router.push('/(tabs)/games' as any);
  };

  const handleOpenReport = (wid: string) => {
    selection();
    router.push({
      pathname: '/weekly-report',
      params: { weekId: wid },
    } as unknown as Parameters<typeof router.push>[0]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.delay(50).duration(400)}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>YOUR BRAIN · DECODED</Text>
        </Animated.View>

        {/* Weekly activity dots */}
        {hasData && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={[styles.weekRow, { marginTop: DISTINCT }]}
          >
            {weekActivity.map((day) => (
              <View key={day.dateStr} style={styles.weekDayCol}>
                <View
                  style={[
                    styles.weekDot,
                    day.trained && styles.weekDotActive,
                    day.trained && accentGlow(C.green, 8, 0.3),
                    day.isToday && styles.weekDotToday,
                  ]}
                />
                <Text style={[styles.weekDayLabel, day.isToday && styles.weekDayLabelToday]}>
                  {day.dayLabel}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Personal summary */}
        {hasData && summaryLine ? (
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={[styles.summaryCard, accentGlow(C.green, 14, 0.18), { marginTop: RELATED }]}
          >
            <Text style={styles.summaryText}>{summaryLine}</Text>
          </Animated.View>
        ) : null}

        {!hasData ? (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={[styles.emptyState, accentGlow(C.green, 16, 0.18), { marginTop: DISTINCT }]}
          >
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
            {/* Brain Pulse Score — DISTINCT: opens the data section */}
            <View style={{ marginTop: DISTINCT }}>
              <BrainPulseHero pulse={pulse} />
            </View>

            {/* Kova Brain Coach — RELATED: pulse + commentary */}
            <View style={{ marginTop: RELATED }}>
              <KovaBrainCoach trend={trend} />
            </View>

            {/* Brain Area Snapshot — DISTINCT: voice → data */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={[
                styles.areaCard,
                accentGlow(strongestAccent, 14, 0.18),
                { marginTop: DISTINCT, borderColor: `${strongestAccent}22` },
              ]}
            >
              <View style={styles.areaHeader}>
                <Text style={styles.eyebrow}>BRAIN AREAS</Text>
                <View style={styles.areaStrength}>
                  <Text style={styles.areaStrengthLabel}>Strongest:</Text>
                  <Text style={[styles.areaStrengthValue, { color: strongestAccent }]}>
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

            {/* Personal Bests — RELATED: per-area + per-game */}
            <View style={{ marginTop: RELATED }}>
              <PersonalBests />
            </View>

            {/* This Week vs Last Week — DISTINCT: short-term numbers */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(400)}
              style={[styles.compareCard, accentGlow(C.green, 14, 0.18), { marginTop: DISTINCT }]}
            >
              <Text style={styles.eyebrow}>THIS WEEK VS LAST WEEK</Text>
              <View style={styles.compareRow}>
                <View style={styles.compareStat}>
                  <Text style={[styles.compareValue, { color: C.green }]}>
                    {Math.round((pulse?.streak7DayAvg ?? 0) * 100)}%
                  </Text>
                  <Text style={styles.compareLabel}>This week avg</Text>
                </View>
                <View style={styles.compareDivider} />
                <View style={styles.compareStat}>
                  <Text style={[styles.compareValue, { color: (pulse?.trend ?? 0) >= 0 ? C.green : C.amber }]}>
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

            {/* 30-day brain trend — RELATED: time-based with compare above */}
            <View style={{ marginTop: RELATED }}>
              <BrainTrend trend={trend} />
            </View>

            {/* Activity calendar — RELATED: stays with trend */}
            <View style={{ marginTop: RELATED }}>
              <ActivityCalendar />
            </View>

            {/* Training recommendation — DISTINCT: action pivot */}
            {recommendation && (
              <Animated.View
                entering={FadeInDown.delay(450).duration(400)}
                style={[
                  styles.recCard,
                  accentGlow(recommendation.color, 14, 0.18),
                  { marginTop: DISTINCT, borderLeftColor: recommendation.color, borderColor: `${recommendation.color}22` },
                ]}
              >
                <Text style={[styles.eyebrow, { color: recommendation.color }]}>TRAINING TIP</Text>
                <Text style={styles.recText}>
                  Focus on <Text style={{ color: recommendation.color, fontFamily: fonts.bodyBold }}>{recommendation.area}</Text> this week — it's {recommendation.gap} points behind your strongest area.
                </Text>
                <PressableScale
                  style={[styles.recBtn, { backgroundColor: `${recommendation.color}18`, borderColor: `${recommendation.color}55` }]}
                  onPress={handleBrowseGames}
                >
                  <Text style={[styles.recBtnText, { color: recommendation.color }]}>Browse {recommendation.area} Games →</Text>
                </PressableScale>
              </Animated.View>
            )}

            {/* Insight Cards — DISTINCT: patterns block */}
            {insights.length > 0 && (
              <View style={[styles.insightsSection, { marginTop: DISTINCT }]}>
                <Text style={styles.eyebrow}>YOUR PATTERNS</Text>
                {insights.map((insight, i) => (
                  <InsightCard key={insight.id} insight={insight} index={i} />
                ))}
              </View>
            )}

            {/* Brain Journal timeline — DISTINCT */}
            <View style={{ marginTop: DISTINCT }}>
              <JournalTimeline />
            </View>

            {pastReportIds.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(520).duration(400)}
                style={[styles.reportsSection, { marginTop: DISTINCT }]}
              >
                <Text style={[styles.eyebrow, { marginBottom: space.sm }]}>PAST REPORTS</Text>
                {pastReportIds.slice(0, 6).map((wid) => (
                  <PressableScale
                    key={wid}
                    style={[styles.reportRow, accentGlow(C.purple, 10, 0.12)]}
                    onPress={() => handleOpenReport(wid)}
                  >
                    <Text style={styles.reportRowText}>{wid.replace('w-', 'Week starting ')}</Text>
                    <Text style={styles.reportRowArrow}>›</Text>
                  </PressableScale>
                ))}
              </Animated.View>
            )}

            {/* Footer tip — DISTINCT */}
            <Animated.View
              entering={FadeInDown.delay(600).duration(400)}
              style={[styles.footerTip, { marginTop: DISTINCT }]}
            >
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

  // Canonical eyebrow style — used across every section header
  eyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: C.t3,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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
    borderColor: `${C.green}22`,
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
    borderWidth: 1,
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
    borderColor: `${C.green}22`,
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
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderColor: `${C.green}22`,
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
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: `${C.purple}1A`,
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
