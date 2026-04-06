import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import PressableScale from '../../src/components/ui/PressableScale';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { C } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';
import { glow } from '../../src/utils/glow';
import Kova from '../../src/components/kova/Kova';
import { useUserStore } from '../../src/stores/userStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { stageFromXP, stageNames } from '../../src/components/kova/KovaStates';
import { BrainArea, AREA_LABELS, AREA_ACCENT } from '../../src/constants/gameConfigs';
import MoodHistoryCard from '../../src/components/ui/MoodHistoryCard';

export default function ProfileScreen() {
  const name = useUserStore(s => s.name);
  const mood = useUserStore(s => s.mood);
  const moodHistory = useUserStore(s => s.moodHistory);
  const xp = useProgressStore(s => s.xp);
  const level = useProgressStore(s => s.level);
  const longestStreak = useProgressStore(s => s.longestStreak);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const coins = useProgressStore(s => s.coins);
  const brainScores = useProgressStore(s => s.brainScores);
  const stage = stageFromXP(xp);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.profileHeader}>
          <Kova stage={stage} emotion="happy" size={80} showSpeechBubble={false} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name || 'Trainer'}</Text>
            <Text style={styles.profileLevel}>Level {level} · {stageNames[stage]}</Text>
          </View>
        </Animated.View>

        {/* Stats grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsGrid}>
          {[
            { label: 'Total XP', value: xp.toLocaleString(), color: C.peach },
            { label: 'Sessions', value: totalSessions.toString(), color: C.blue },
            { label: 'Best Streak', value: `${longestStreak}d`, color: C.amber },
            { label: 'Coins', value: coins.toString(), color: C.purple },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Brain Map */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.sectionTitle}>Your Brain</Text>
          {totalSessions === 0 ? (
            <View style={styles.brainMapCard}>
              <Text style={styles.emptyStateText}>Play a few sessions to see your brain map light up.</Text>
            </View>
          ) : (
            <View style={styles.brainMapCard}>
              {(Object.entries(brainScores) as Array<[BrainArea, number]>).map(([area, score], i) => {
                const color = AREA_ACCENT[area];
                return (
                  <Animated.View
                    key={area}
                    entering={FadeInDown.delay(350 + i * 100).duration(400)}
                    style={styles.brainRow}
                  >
                    <View style={styles.brainLabelRow}>
                      <View style={styles.brainDotLabel}>
                        <View style={[styles.brainDot, { backgroundColor: color }]} />
                        <Text style={styles.brainLabel}>{AREA_LABELS[area]}</Text>
                      </View>
                      <Text style={[styles.brainScore, { color }]}>{Math.round(score)}</Text>
                    </View>
                    <View style={styles.brainBar}>
                      <View style={[styles.brainBarFill, { width: `${Math.min(score, 100)}%`, backgroundColor: color }]} />
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Mood history */}
        {moodHistory.length >= 2 && (
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <MoodHistoryCard moodHistory={moodHistory} currentMood={mood} />
          </Animated.View>
        )}

        {/* Quick links */}
        <Animated.View entering={FadeInDown.delay(550).duration(400)} style={styles.links}>
          <PressableScale style={styles.linkRow} onPress={() => router.push('/(tabs)/insights' as any)}>
            <Text style={styles.linkText}>Brain Pulse & Insights</Text>
            <Text style={styles.linkArrow}>›</Text>
          </PressableScale>
          <PressableScale style={styles.linkRow} onPress={() => router.push('/settings')}>
            <Text style={styles.linkText}>Settings</Text>
            <Text style={styles.linkArrow}>›</Text>
          </PressableScale>
          <PressableScale style={styles.linkRow} onPress={() => router.push('/shop')}>
            <Text style={styles.linkText}>🏪 Kova Shop</Text>
            <Text style={styles.linkArrow}>›</Text>
          </PressableScale>
          <PressableScale style={styles.linkRow} onPress={() => router.push('/science')}>
            <Text style={styles.linkText}>The Science</Text>
            <Text style={styles.linkArrow}>›</Text>
          </PressableScale>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Neurra v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg2 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 20 },

  // Profile header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: C.bg3,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  profileInfo: { gap: 3 },
  profileName: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  profileLevel: {
    fontFamily: fonts.bodySemi,
    color: C.green,
    fontSize: 14,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: C.bg3,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 8,
  },
  statItem: { width: '50%', alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 12, gap: 3 },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Brain Map
  sectionTitle: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 26,
    marginBottom: 16,
  },
  brainMapCard: {
    backgroundColor: C.bg3,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 20,
    gap: 18,
  },
  emptyStateText: {
    fontFamily: fonts.kova,
    color: C.t3,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingVertical: 20,
  },
  brainRow: { gap: 6 },
  brainLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brainDotLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brainDot: { width: 8, height: 8, borderRadius: 4 },
  brainLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 14,
  },
  brainScore: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  brainBar: {
    height: 6,
    backgroundColor: C.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  brainBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Links
  links: {
    backgroundColor: C.bg3,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  linkText: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 15,
  },
  linkArrow: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 20,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  versionText: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
  },
});
