import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C } from '../src/constants/colors';
import { fonts } from '../src/constants/typography';
import { AREA_LABELS } from '../src/constants/gameConfigs';
import {
  useWeeklyReportStore,
  getLatestReportWeekId,
} from '../src/stores/weeklyReportStore';
import Kova from '../src/components/kova/Kova';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyReportScreen() {
  const { weekId: paramWeek } = useLocalSearchParams<{ weekId?: string }>();
  const reports = useWeeklyReportStore((s) => s.reports);
  const dismissHomeBanner = useWeeklyReportStore((s) => s.dismissHomeBanner);

  const weekId = paramWeek ?? getLatestReportWeekId() ?? '';
  const report = reports[weekId];

  const onClose = () => {
    if (weekId) dismissHomeBanner(weekId);
    router.back();
  };

  const heatmap = useMemo(() => {
    if (!report) return DAYS.map(() => false);
    const filled = Math.min(7, report.daysTrained);
    return DAYS.map((_, i) => i < filled);
  }, [report]);

  if (!report) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
        </View>
        <Text style={styles.empty}>No report for this week yet.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Your week</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Kova size={72} emotion="proud" showSpeechBubble={false} />
          <Text style={styles.cardTitle}>Here&apos;s what your brain did this week.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardH}>Days trained</Text>
          <View style={styles.dotsRow}>
            {heatmap.map((on, i) => (
              <View key={DAYS[i]} style={styles.dotWrap}>
                <View style={[styles.dot, on && styles.dotOn]} />
                <Text style={styles.dotLbl}>{DAYS[i]}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.muted}>{report.daysTrained} of 7 days</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardH}>Time in training</Text>
          <Text style={styles.big}>{report.totalMinutesEstimate} min</Text>
        </View>

        {report.improvement && (
          <View style={styles.card}>
            <Text style={styles.cardH}>Biggest lift</Text>
            <Text style={styles.body}>
              {AREA_LABELS[report.improvement.area]}: {report.improvement.before}% → {report.improvement.after}%
            </Text>
            <Text style={styles.muted}>Compared to the week before.</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardH}>Best moment</Text>
          <Text style={styles.body}>{report.bestMoment}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardH}>Streak</Text>
          <Text style={styles.big}>🔥 {report.streakAtEnd} days</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardH}>XP this week</Text>
          <Text style={styles.big}>+{report.xpEarned}</Text>
        </View>

        <View style={[styles.card, styles.focusCard]}>
          <Text style={styles.cardH}>Next week&apos;s focus</Text>
          <Text style={styles.body}>
            Spend a little extra time on {AREA_LABELS[report.nextFocus]} — small reps add up.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { fontFamily: fonts.bodySemi, color: C.blue, fontSize: 15 },
  title: { fontFamily: fonts.heading, color: C.t1, fontSize: 18 },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  focusCard: { borderColor: 'rgba(107,168,224,0.35)' },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 18,
    marginTop: 12,
    lineHeight: 26,
  },
  cardH: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  body: { fontFamily: fonts.body, color: C.t1, fontSize: 15, lineHeight: 22 },
  muted: { fontFamily: fonts.body, color: C.t3, fontSize: 13, marginTop: 8 },
  big: { fontFamily: fonts.bodyBold, color: C.t1, fontSize: 28 },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dotWrap: { alignItems: 'center', gap: 6 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.bg5,
    borderWidth: 1,
    borderColor: C.border,
  },
  dotOn: { backgroundColor: C.green, borderColor: C.green },
  dotLbl: { fontFamily: fonts.body, color: C.t3, fontSize: 10 },
  empty: { fontFamily: fonts.body, color: C.t2, padding: 24, textAlign: 'center' },
});
