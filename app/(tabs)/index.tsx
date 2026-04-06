import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Dimensions, SafeAreaView, Pressable, Alert,
} from 'react-native';
import Animated, {
  FadeInDown, FadeIn, FadeOut, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';
import { glow } from '../../src/utils/glow';
import Kova from '../../src/components/kova/Kova';
import CelebrationOverlay, { CelebrationKind } from '../../src/components/ui/CelebrationOverlay';
import { useUserStore } from '../../src/stores/userStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { gameConfigs } from '../../src/constants/gameConfigs';
import { stageFromXP } from '../../src/components/kova/KovaStates';
import { selectDailyGames } from '../../src/utils/gameSelection';
import { getTimeOfDay, todayStr } from '../../src/utils/timeUtils';
import { getXPProgress } from '../../src/components/ui/XPProgressBar';
import MoodCheckIn from '../../src/components/ui/MoodCheckIn';
import StreakBreakOverlay from '../../src/components/ui/StreakBreakOverlay';
import Celebration from '../../src/components/ui/Celebration';
import { useStreakUrgency } from '../../src/hooks/useStreakUrgency';
import { tapLight } from '../../src/utils/haptics';
import { getGreeting } from '../../src/constants/kovaDialogue';
import { useProStore } from '../../src/stores/proStore';
import { useStoryStore } from '../../src/stores/storyStore';
import { getArcLabel } from '../../src/constants/story';
import { generateInsights } from '../../src/utils/insightsEngine';
import TopInsightCard from '../../src/components/insights/TopInsightCard';
import CoachInsightCard from '../../src/components/insights/CoachInsightCard';
import { useDailyBriefing } from '../../src/hooks/useDailyBriefing';
import PaywallNudge from '../../src/components/paywall/PaywallNudge';
import PaywallFull from '../../src/components/paywall/PaywallFull';
import {
  useWeeklyReportStore,
  getLatestReportWeekId,
} from '../../src/stores/weeklyReportStore';

const { width } = Dimensions.get('window');

const GREETINGS: Record<string, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  lateNight: 'Still up?',
};

export default function HomeScreen() {
  const name = useUserStore(s => s.name);
  const mood = useUserStore(s => s.mood);
  const moodHistory = useUserStore(s => s.moodHistory);
  const setMood = useUserStore(s => s.setMood);
  const streak = useProgressStore(s => s.streak);
  const coins = useProgressStore(s => s.coins);
  const xp = useProgressStore(s => s.xp);
  const level = useProgressStore(s => s.level);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const longestStreak = useProgressStore(s => s.longestStreak);
  const isSessionDoneToday = useProgressStore(s => s.isSessionDoneToday);
  const stage = stageFromXP(xp);
  const sessionDone = isSessionDoneToday();
  const [dailyGames] = useState(() => selectDailyGames());

  const sessions = useProgressStore(s => s.sessions);
  const brainScores = useProgressStore(s => s.brainScores);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const personalBests = useProgressStore(s => s.personalBests);

  const xpProgress = useMemo(() => getXPProgress(xp, level), [xp, level]);

  // Brain Pulse insights (for home card)
  const { pulse, insights: allInsights } = useMemo(
    () => generateInsights({
      sessions, brainScores, gameHistory, personalBests,
      streak, longestStreak, totalSessions, xp, level,
      mood, moodHistory,
    }),
    [sessions, brainScores, gameHistory, personalBests, streak, longestStreak, totalSessions, xp, level, mood, moodHistory],
  );
  const moodLoggedToday = useMemo(() => moodHistory.some(e => e.date === todayStr()), [moodHistory]);
  const [moodDismissed, setMoodDismissed] = useState(false);
  const [heartsTrigger, setHeartsTrigger] = useState(0);
  const showMoodCheckIn = !moodLoggedToday && !moodDismissed;
  const { briefing: coachBriefing } = useDailyBriefing();
  const fallbackGreeting = useMemo(() => getGreeting({ streak, totalSessions }), [streak, totalSessions]);
  const kovaGreeting = coachBriefing?.greeting ?? fallbackGreeting;

  // Paywall nudge
  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  const canShowNudge = useProStore(s => s.canShowNudge);
  const recordNudge = useProStore(s => s.recordNudge);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const showNudge = !isPro && !nudgeDismissed && canShowNudge(totalSessions);

  // Story mode
  const storyEnabled = useStoryStore(s => s.storyEnabled);
  const storyDay = useStoryStore(s => s.currentDay);
  const arcLabel = storyEnabled ? getArcLabel(storyDay) : null;

  const {
    urgencyDim,
    isUrgent,
    streakBroken,
    brokenStreakValue,
    dismissStreakBreak,
  } = useStreakUrgency();

  const timeOfDay = getTimeOfDay();

  const pendingFreezeMsg = useProgressStore(s => s.pendingStreakFreezeMessage);
  const clearPendingFreezeMsg = useProgressStore(s => s.clearPendingStreakFreezeMessage);
  const reportMap = useWeeklyReportStore((s) => s.reports);
  const homeBannerDismissed = useWeeklyReportStore((s) => s.homeBannerDismissedWeekId);

  const prevCoinsRef = useRef<number | null>(null);
  const [coinFloat, setCoinFloat] = useState<{ amount: number; key: number } | null>(null);

  useEffect(() => {
    if (pendingFreezeMsg) {
      Alert.alert('Kova', pendingFreezeMsg, [
        { text: 'Thanks, Kova', onPress: () => clearPendingFreezeMsg() },
      ]);
    }
  }, [pendingFreezeMsg, clearPendingFreezeMsg]);

  useEffect(() => {
    const prev = prevCoinsRef.current;
    prevCoinsRef.current = coins;
    if (prev !== null && coins > prev) {
      setCoinFloat({ amount: coins - prev, key: Date.now() });
      const t = setTimeout(() => setCoinFloat(null), 1800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [coins]);

  const latestWeekId = getLatestReportWeekId();
  const showWeeklyBanner =
    !!latestWeekId &&
    !!reportMap[latestWeekId] &&
    homeBannerDismissed !== latestWeekId;

  // CTA pulse for session button
  const ctaPulse = useSharedValue(1);
  useEffect(() => {
    if (!sessionDone) {
      ctaPulse.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true,
      );
    }
  }, [sessionDone]);

  const ctaPulseStyle = useAnimatedStyle(() => ({
    opacity: ctaPulse.value,
  }));

  const navigatingRef = useRef(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); };
  }, []);
  const handleStartSession = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push('/session');
    navTimerRef.current = setTimeout(() => { navigatingRef.current = false; }, 1000);
  }, []);

  // Level-up celebration
  const prevLevelRef = useRef(level);
  const [celebration, setCelebration] = useState<{ kind: CelebrationKind; value: string | number } | null>(null);

  useEffect(() => {
    if (prevLevelRef.current < level) {
      setCelebration({ kind: 'levelUp', value: level });
    }
    prevLevelRef.current = level;
  }, [level]);

  // Button press animation
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const gameNames = dailyGames
    .map(id => gameConfigs[id]?.name)
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.coinRow} pointerEvents="box-none">
        <View style={styles.coinIcon} />
        <Text style={styles.coinBalance}>{coins}</Text>
        {coinFloat && (
          <Animated.Text
            key={coinFloat.key}
            entering={FadeInDown.duration(280)}
            exiting={FadeOut.duration(350)}
            style={styles.coinFloat}
          >
            +{coinFloat.amount}
          </Animated.Text>
        )}
      </View>
      {celebration && (
        <CelebrationOverlay
          kind={celebration.kind}
          value={celebration.value}
          visible
          onDismiss={() => setCelebration(null)}
        />
      )}
      <StreakBreakOverlay
        visible={streakBroken}
        brokenStreak={brokenStreakValue}
        longestStreak={longestStreak}
        totalSessions={totalSessions}
        xp={xp}
        onStartNewStreak={dismissStreakBreak}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ROW 1: Greeting + Streak */}
        <Animated.View entering={FadeIn.delay(80).duration(400)} style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingSub}>{GREETINGS[timeOfDay]}</Text>
            <Text style={styles.greetingName}>{name || 'friend'}</Text>
          </View>
          <View style={styles.streakColumn}>
            <View style={styles.streakFlameRow}>
              <Text style={styles.flameEmoji}>🔥</Text>
              <Text style={styles.streakNumber}>{streak}</Text>
            </View>
            <Text style={styles.streakLabel}>DAY STREAK</Text>
          </View>
        </Animated.View>

        {/* ROW 2: Kova */}
        <Animated.View entering={FadeIn.delay(160).duration(400)} style={styles.kovaZone}>
          <Kova
            stage={stage}
            emotion={sessionDone ? 'happy' : isUrgent ? 'worried' : streak === 0 ? 'curious' : 'idle'}
            size={160}
            onTap={() => setHeartsTrigger(t => t + 1)}
            dialogueContext={
              timeOfDay === 'morning' ? 'tapMorning' :
              timeOfDay === 'lateNight' ? 'tapLateNight' :
              'tap'
            }
            forceDialogue={kovaGreeting}
          />
        </Animated.View>

        {/* Urgency */}
        {isUrgent && streak > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.urgencyBanner}>
            <Text style={styles.urgencyText}>
              Your streak flame is fading! Play now to keep it alive.
            </Text>
          </Animated.View>
        )}

        {/* Story mode indicator */}
        {storyEnabled && arcLabel && (
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.storyBadge}>
            <Text style={styles.storyBadgeText}>Day {storyDay} — {arcLabel}</Text>
          </Animated.View>
        )}

        {showWeeklyBanner && latestWeekId && (
          <Animated.View entering={FadeInDown.delay(220).duration(350)} style={styles.weekBanner}>
            <Pressable
              style={styles.weekBannerInner}
              onPress={() =>
                router.push({
                  pathname: '/weekly-report',
                  params: { weekId: latestWeekId },
                } as unknown as Parameters<typeof router.push>[0])
              }
            >
              <Text style={styles.weekBannerTitle}>Your week in review</Text>
              <Text style={styles.weekBannerSub}>See how you trained · Tap to open</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Mood check-in */}
        {showMoodCheckIn && (
          <MoodCheckIn
            onSelect={setMood}
            onDismiss={() => setMoodDismissed(true)}
          />
        )}

        {/* ROW 3: Session card */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          {sessionDone ? (
            <View style={styles.sessionCardDone}>
              <Text style={styles.doneEmoji}>✨</Text>
              <Text style={styles.doneTitle}>Done for today</Text>
              <Text style={styles.doneSubtitle}>Come back tomorrow to keep your streak alive</Text>
              <Pressable
                style={styles.bonusBtn}
                onPress={handleStartSession}
                onPressIn={() => tapLight()}
              >
                <Text style={styles.bonusBtnText}>⚡ Bonus Round</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.sessionCard}>
              <Text style={styles.sessionLabelMicro}>TODAY'S SESSION</Text>
              <Text style={styles.gameNamesText}>{gameNames}</Text>
              {coachBriefing?.recommendation && (
                <Text style={styles.coachRec}>{coachBriefing.recommendation}</Text>
              )}
              <Text style={styles.sessionTime}>~5 min</Text>

              {/* CTA Button */}
              <Animated.View style={[ctaPulseStyle, btnStyle]}>
                <Pressable
                  style={styles.ctaButton}
                  onPress={handleStartSession}
                  onPressIn={() => {
                    tapLight();
                    btnScale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
                  }}
                  onPressOut={() => {
                    btnScale.value = withSpring(1, { damping: 15, stiffness: 200 });
                  }}
                >
                  <Text style={styles.ctaText}>LET'S GO</Text>
                </Pressable>
              </Animated.View>
            </View>
          )}
        </Animated.View>

        {/* Paywall nudge (non-Pro, after session 7) */}
        {showNudge && (
          <PaywallNudge
            onUpgrade={() => {
              recordNudge();
              setShowPaywall(true);
            }}
            onDismiss={() => {
              recordNudge();
              setNudgeDismissed(true);
            }}
          />
        )}

        {/* ROW 4: Stats row */}
        <Animated.View entering={FadeInDown.delay(380).duration(400)} style={styles.statsRow}>
          {/* Days this week */}
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={[styles.statHero, { color: C.blue }]}>
              {(() => {
                const today = new Date();
                const dayOfWeek = today.getDay();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                // Estimate from streak vs days elapsed
                const daysElapsed = Math.min(7, dayOfWeek === 0 ? 7 : dayOfWeek);
                const sessionsThisWeek = Math.min(daysElapsed, streak, 7);
                return `${sessionsThisWeek}/7`;
              })()}
            </Text>
            <Text style={styles.statLabel}>days this week</Text>
          </View>

          {/* Best streak */}
          <View style={[styles.statCard, { flex: 1.2 }]}>
            <Text style={[styles.statHero, { color: C.amber }]}>{longestStreak}</Text>
            <Text style={styles.statLabel}>best streak</Text>
          </View>

          {/* Level + XP */}
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={[styles.statHero, { color: C.green }]}>Lv {level}</Text>
            <Text style={styles.statLabel}>{xpProgress.xpNeeded - xpProgress.xpIntoLevel} XP to next</Text>
          </View>
        </Animated.View>

        {/* AI Coach insight (after 3+ sessions) */}
        {totalSessions >= 3 && coachBriefing && (
          <CoachInsightCard insight={coachBriefing.insight} delay={400} />
        )}

        {/* Brain Pulse insight (after 3+ sessions) */}
        {totalSessions >= 3 && (
          <TopInsightCard
            pulse={pulse}
            topInsight={allInsights[0] ?? null}
            delay={450}
          />
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <Celebration type="particles_hearts" trigger={heartsTrigger} origin={{ x: width / 2, y: 220 }} />

      <PaywallFull visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg2,
  },
  coinRow: {
    position: 'absolute',
    top: 8,
    left: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.amber,
  },
  coinBalance: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: C.amber,
  },
  coinFloat: {
    position: 'absolute',
    left: 26,
    top: -22,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: C.amber,
  },
  weekBanner: {
    marginTop: 10,
    marginHorizontal: 4,
  },
  weekBannerInner: {
    backgroundColor: C.bg3,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(107,168,224,0.35)',
  },
  weekBannerTitle: {
    fontFamily: fonts.bodyBold,
    color: C.blue,
    fontSize: 16,
  },
  weekBannerSub: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 13,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 110,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  greetingSub: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 14,
  },
  greetingName: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 24,
    letterSpacing: -0.3,
  },

  // Streak
  streakColumn: {
    alignItems: 'center',
    gap: 0,
    paddingTop: 4,
  },
  streakFlameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flameEmoji: {
    fontSize: 28,
  },
  streakNumber: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1,
    textShadowColor: 'rgba(240,181,66,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  streakLabel: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: -2,
  },

  // Kova
  kovaZone: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: -24,
    zIndex: 10,
  },

  // Urgency
  urgencyBanner: {
    backgroundColor: C.coralTint,
    borderWidth: 0.5,
    borderColor: 'rgba(232,112,126,0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 8,
  },
  urgencyText: {
    fontFamily: fonts.bodySemi,
    color: C.coral,
    fontSize: 13,
    textAlign: 'center',
  },

  // Session card
  sessionCard: {
    borderRadius: 20,
    backgroundColor: C.bg3,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 24,
    gap: 8,
  },
  sessionCardDone: {
    borderRadius: 20,
    backgroundColor: C.bg3,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 24,
    gap: 10,
    alignItems: 'center',
  },
  sessionLabelMicro: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  gameNamesText: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 14,
  },
  coachRec: {
    fontFamily: fonts.body,
    color: C.purple,
    fontSize: 13,
    textAlign: 'center',
  },
  sessionTime: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 13,
  },
  ctaButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    ...glow(C.green),
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
    fontSize: 16,
  },

  // Done state
  doneEmoji: { fontSize: 32, marginBottom: 4 },
  doneTitle: {
    fontFamily: fonts.heading,
    color: C.green,
    fontSize: 20,
  },
  doneSubtitle: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 14,
    textAlign: 'center',
  },
  bonusBtn: {
    backgroundColor: C.amberTint,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(240,181,66,0.3)',
    marginTop: 8,
  },
  bonusBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 14,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },
  statCard: {
    borderRadius: 14,
    backgroundColor: C.bg3,
    padding: 14,
    minHeight: 90,
    justifyContent: 'flex-end',
    gap: 4,
  },
  statHero: {
    fontFamily: fonts.bodyBold,
    fontSize: 28,
    letterSpacing: -1,
    lineHeight: 30,
  },
  statLabel: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
  },

  // Story
  storyBadge: {
    alignSelf: 'center',
    backgroundColor: C.purpleTint,
    borderWidth: 0.5,
    borderColor: 'rgba(155,114,224,0.25)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
  },
  storyBadgeText: {
    fontFamily: fonts.bodySemi,
    color: C.purple,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
