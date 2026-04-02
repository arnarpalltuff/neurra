import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, SafeAreaView,
} from 'react-native';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../src/constants/colors';
import Kova from '../../src/components/kova/Kova';
import StreakCounter from '../../src/components/ui/StreakCounter';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import { useUserStore } from '../../src/stores/userStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { gameConfigs, availableGames } from '../../src/constants/gameConfigs';
import { stageFromXP } from '../../src/components/kova/KovaStates';
import { selectDailyGames } from '../../src/utils/gameSelection';
import { getTimeOfDay } from '../../src/utils/timeUtils';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { name } = useUserStore();
  const { streak, xp, level, totalSessions, coins, league, isSessionDoneToday } = useProgressStore();
  const stage = stageFromXP(xp);
  const sessionDone = isSessionDoneToday();
  const [dailyGames] = useState(() => selectDailyGames());

  const timeOfDay = getTimeOfDay();
  const greetings: Record<string, string> = {
    morning: `Good morning, ${name || 'friend'} ☀️`,
    afternoon: `Hey ${name || 'there'}`,
    evening: `Evening, ${name || 'friend'}`,
    lateNight: `Still up, ${name || 'friend'}?`,
  };
  const greeting = greetings[timeOfDay];

  // Ambient background pulse for session card
  const pulse = useSharedValue(0.9);
  useEffect(() => {
    if (!sessionDone) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.94, { duration: 1500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    }
  }, [sessionDone]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleStartSession = useCallback(() => {
    router.push('/session');
  }, []);

  const bgColors: Record<string, string[]> = {
    morning: ['#1A1510', '#0B0E17'],
    afternoon: ['#0D1520', '#0B0E17'],
    evening: ['#1A100D', '#0B0E17'],
    lateNight: ['#0A0B1A', '#0B0E17'],
  };
  const bg = bgColors[timeOfDay];

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={bg as [string, string]} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top status bar */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.statusBar}>
          <View style={styles.coinsDisplay}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinText}>{coins}</Text>
          </View>
          <View style={styles.leagueBadge}>
            <Text style={styles.leagueText}>{league} League</Text>
          </View>
          <StreakCounter streak={streak} size="sm" />
        </Animated.View>

        {/* Greeting */}
        <Animated.Text entering={FadeIn.delay(200)} style={styles.greeting}>
          {greeting}
        </Animated.Text>

        {/* Kova zone */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.kovaZone}>
          <Kova
            stage={stage}
            emotion={sessionDone ? 'happy' : streak === 0 ? 'curious' : 'idle'}
            size={130}
            dialogueContext={
              timeOfDay === 'morning' ? 'tapMorning' :
              timeOfDay === 'lateNight' ? 'tapLateNight' :
              'tap'
            }
          />
          {!sessionDone && xp > 0 && (
            <Animated.View entering={FadeInDown.delay(500)} style={styles.xpBubble}>
              <Text style={styles.xpBubbleText}>+XP waiting</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Daily session card */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.sessionCardWrapper}>
          {sessionDone ? (
            <Card style={styles.sessionCardDone}>
              <Text style={styles.doneTitle}>Done for today ✓</Text>
              <Text style={styles.doneSubtitle}>Come back tomorrow to continue your streak.</Text>
              <TouchableOpacity style={styles.bonusBtn} onPress={handleStartSession}>
                <Text style={styles.bonusBtnText}>⚡ Bonus Round</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <Animated.View style={pulseStyle}>
              <Card elevated style={styles.sessionCard}>
                <View style={styles.sessionCardHeader}>
                  <Text style={styles.sessionLabel}>Today's Session</Text>
                  <Text style={styles.sessionTime}>~5 min</Text>
                </View>
                <View style={styles.gameIconsRow}>
                  {dailyGames.map((gameId) => (
                    <View key={gameId} style={styles.gameIconPill}>
                      <Text style={styles.gameIconEmoji}>{gameConfigs[gameId].icon}</Text>
                      <Text style={styles.gameIconName}>{gameConfigs[gameId].name}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  label="Let's Go"
                  onPress={handleStartSession}
                  size="lg"
                  style={styles.sessionBtn}
                />
              </Card>
            </Animated.View>
          )}
        </Animated.View>

        {/* Quick stats */}
        <Animated.View entering={FadeInDown.delay(550)} style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </Card>
        </Animated.View>

        {/* Level info */}
        <Animated.View entering={FadeInDown.delay(650)}>
          <Card style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelTitle}>Level {level}</Text>
              <Text style={styles.levelXP}>{xp.toLocaleString()} XP</Text>
            </View>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${Math.min(100, (xp % 500) / 5)}%` }]} />
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    gap: 16,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warmDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  coinIcon: { fontSize: 14 },
  coinText: {
    color: colors.warm,
    fontSize: 14,
    fontWeight: '700',
  },
  leagueBadge: {
    backgroundColor: colors.lavenderDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  leagueText: {
    color: colors.lavender,
    fontSize: 12,
    fontWeight: '700',
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  kovaZone: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  xpBubble: {
    backgroundColor: colors.growthDim,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.growth,
  },
  xpBubbleText: {
    color: colors.growth,
    fontSize: 12,
    fontWeight: '700',
  },
  sessionCardWrapper: {},
  sessionCard: {
    gap: 14,
  },
  sessionCardDone: {
    gap: 10,
    alignItems: 'center',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionLabel: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  sessionTime: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  gameIconsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gameIconPill: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  gameIconEmoji: { fontSize: 22 },
  gameIconName: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  sessionBtn: { width: '100%' },
  doneTitle: {
    color: colors.growth,
    fontSize: 18,
    fontWeight: '800',
  },
  doneSubtitle: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
  },
  bonusBtn: {
    backgroundColor: colors.streakDim,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.streak,
  },
  bonusBtnText: {
    color: colors.streak,
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelCard: {
    gap: 10,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  levelXP: {
    color: colors.warm,
    fontSize: 14,
    fontWeight: '700',
  },
  xpBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.bgTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.warm,
    borderRadius: 3,
  },
});
