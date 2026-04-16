import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { selection } from '../../utils/haptics';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii, accentGlow } from '../../constants/design';
import {
  useWeeklyReportStore,
  getLatestReportWeekId,
} from '../../stores/weeklyReportStore';
import { AREA_LABELS, AREA_ACCENT } from '../../constants/gameConfigs';
import PressableScale from '../ui/PressableScale';
import SectionHeader from '../home/SectionHeader';

export default React.memo(function WeeklyReportSummary() {
  const reports = useWeeklyReportStore(s => s.reports);

  const report = useMemo(() => {
    const wid = getLatestReportWeekId();
    return wid ? reports[wid] ?? null : null;
  }, [reports]);

  const handleOpen = () => {
    selection();
    router.push('/weekly-report' as any);
  };

  if (!report) {
    return (
      <Animated.View
        entering={FadeInDown.delay(650).duration(450).springify().damping(16)}
        style={styles.wrap}
      >
        <SectionHeader eyebrow="WEEKLY REPORT" />
        <View style={[styles.card, styles.emptyCard]}>
          <Ionicons name="calendar-outline" size={20} color={C.t4} />
          <Text style={styles.emptyText}>
            Your first weekly report arrives after 7 days of training.
          </Text>
        </View>
      </Animated.View>
    );
  }

  const impAccent = report.improvement ? AREA_ACCENT[report.improvement.area] : C.green;
  const nextAccent = AREA_ACCENT[report.nextFocus];

  return (
    <Animated.View
      entering={FadeInDown.delay(650).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <SectionHeader
        eyebrow="THIS WEEK"
        actionLabel="Full report →"
        onAction={handleOpen}
      />

      <PressableScale
        onPress={handleOpen}
        style={[styles.card, accentGlow(impAccent, 14, 0.15)]}
      >
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="chart-line" size={16} color={impAccent} />
          <Text style={styles.headerText}>
            {report.daysTrained}/7 days · {Math.round(report.totalMinutesEstimate)}m · +{report.xpEarned} XP
          </Text>
        </View>

        {report.improvement && (
          <View style={styles.impRow}>
            <Text style={[styles.impValue, { color: impAccent }]}>
              +{Math.round(report.improvement.after - report.improvement.before)}
            </Text>
            <Text style={styles.impLabel}>
              in <Text style={{ color: impAccent }}>{AREA_LABELS[report.improvement.area]}</Text>
            </Text>
          </View>
        )}

        <Text style={styles.bestMoment}>{report.bestMoment}</Text>

        <View style={styles.footerRow}>
          <Ionicons name="compass" size={12} color={nextAccent} />
          <Text style={styles.footerText}>
            Next focus: <Text style={{ color: nextAccent, fontFamily: fonts.bodySemi }}>{AREA_LABELS[report.nextFocus]}</Text>
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: space.md,
    gap: space.xs,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: space.lg,
    gap: space.xs,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
    textAlign: 'center',
    maxWidth: 240,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: C.t2,
    letterSpacing: 0.2,
  },
  impRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  impValue: {
    fontFamily: fonts.heading,
    fontSize: 32,
    letterSpacing: -1,
  },
  impLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: C.t2,
  },
  bestMoment: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.t2,
    lineHeight: 18,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: space.xs,
    paddingTop: space.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
  },
});
