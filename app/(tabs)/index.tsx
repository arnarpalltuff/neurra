import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Dimensions, Pressable, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, FadeOut, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../../src/components/ui/FloatingParticles';
import { C } from '../../src/constants/colors';
import { fonts, type as t } from '../../src/constants/typography';
import {
  space,
  radii,
  shadows,
  accentGlow,
  motion,
  asymmetry,
  pillButton,
} from '../../src/constants/design';
import BrainFactCard from '../../src/components/ui/BrainFactCard';
import Kova from '../../src/components/kova/Kova';
import CelebrationOverlay, { CelebrationKind } from '../../src/components/ui/CelebrationOverlay';
import { useGameUnlockStore, daysSinceJoin } from '../../src/stores/gameUnlockStore';
import { unlocksOnDay } from '../../src/constants/gameUnlockSchedule';
import { gameConfigs as gameConfigsMap } from '../../src/constants/gameConfigs';
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
import { playTap, playTransition } from '../../src/utils/sound';
import { getGreeting } from '../../src/constants/kovaDialogue';
import { useKovaContext } from '../../src/hooks/useKovaContext';
import { generateKovaMessage } from '../../src/services/kovaAI';
import type { BrainArea } from '../../src/constants/gameConfigs';
import QuickPlayGrid from '../../src/components/home/QuickPlayGrid';
import { useProStore } from '../../src/stores/proStore';
import { useDailyBriefing } from '../../src/hooks/useDailyBriefing';
import PaywallNudge from '../../src/components/paywall/PaywallNudge';
import PaywallFull from '../../src/components/paywall/PaywallFull';
import { useEnergyStore, maxHeartsFor, MAX_QUICK_HITS_PER_DAY } from '../../src/stores/energyStore';
import { useBrainHistoryStore } from '../../src/stores/brainHistoryStore';
import { classifyBrainWeather } from '../../src/utils/brainWeather';
import { useGroveStore } from '../../src/stores/groveStore';
import type { SessionLength } from '../../src/stores/userStore';
import { FREE_DEEP_SESSIONS_PER_WEEK } from '../../src/stores/userStore';
import ErrorBoundary from '../../src/components/ui/ErrorBoundary';
import { useKovaStore, stageConfigFor, pickDialogue } from '../../src/stores/kovaStore';
import KovaParticles from '../../src/components/kova/KovaParticles';
import KovaSpeechBubble from '../../src/components/kova/KovaSpeechBubble';
import KovaEvolutionAnimation from '../../src/components/kova/KovaEvolutionAnimation';
import DailyChallengeList from '../../src/components/challenges/DailyChallengeList';
import RewardChest from '../../src/components/rewards/RewardChest';

const { width } = Dimensions.get('window');

const GREETINGS: Record<string, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  lateNight: 'Still up?',
};

// Rotating session card slogans — keeps the CTA feeling fresh
const SESSION_SLOGANS = [
  "5 minutes. That's all Kova's asking for today.",
  "Train your brain. Grow your grove.",
  "Your brain called. It wants a workout.",
  "5 minutes now, sharper all day.",
  "Small reps. Big brain gains.",
  "Level up your mind. One session at a time.",
  "Your neurons are warming up. Let's go.",
  "The daily grind — but for your brain.",
  "Flex those neurons. They'll thank you later.",
  "Sharper today than yesterday. That's the deal.",
];

const DONE_SLOGANS = [
  "All wrapped up. Your brain grew today.",
  "Session complete. Neurons fired. Streak alive.",
  "Done. Your future self just sent a thank-you.",
  "That's a wrap. Your grove is glowing.",
  "Brain trained. Kova is proud. See you tomorrow.",
];

function getDailySlogan(pool: string[]): string {
  // Same slogan all day, changes tomorrow
  const dayIndex = Math.floor(Date.now() / 86400000) % pool.length;
  return pool[dayIndex];
}

function HomeScreenInner() {
  // Notch-aware insets — pushes the floating coin/hearts rows below the notch
  // on iPhones with one. SafeAreaView in this file is from safe-area-context,
  // so insets are reliable.
  const insets = useSafeAreaInsets();

  // ── Kova engagement system ─────────────────────────────────
  const kovaStage = useKovaStore(s => s.currentStage);
  const kovaEmotion = useKovaStore(s => s.currentEmotion);
  const kovaStreak = useKovaStore(s => s.currentStreak);
  const pendingEvolution = useKovaStore(s => s.pendingEvolution);
  const pendingDeEvolution = useKovaStore(s => s.pendingDeEvolution);
  const evaluateKovaOnOpen = useKovaStore(s => s.evaluateOnOpen);
  const clearPendingEvolution = useKovaStore(s => s.clearPendingEvolution);
  const kovaStageConfig = stageConfigFor(kovaStage);
  const [showRewardChest, setShowRewardChest] = useState(false);
  const [kovaDialogue, setKovaDialogue] = useState<string | null>(null);
  const [showKovaBubble, setShowKovaBubble] = useState(false);
  const [kovaInsight, setKovaInsight] = useState<string | null>(null);
  const kovaContext = useKovaContext();

  // Evaluate Kova state on mount
  useEffect(() => {
    evaluateKovaOnOpen();
  }, []);

  // AI-powered Kova greeting
  useEffect(() => {
    let mounted = true;
    const mode = kovaContext.returnedAfterBreak ? 'comeback'
      : kovaContext.timeOfDay === 'lateNight' ? 'late_night'
      : kovaContext.streakAtRisk ? 'streak_risk'
      : 'greeting';
    const timer = setTimeout(() => {
      generateKovaMessage(mode, kovaContext).then(msg => {
        if (mounted) {
          setKovaDialogue(msg);
          setShowKovaBubble(true);
        }
      });
    }, 800);
    return () => { mounted = false; clearTimeout(timer); };
  }, []);

  // AI-powered daily insight — pre-generated so a second Kova tap cycles to it.
  useEffect(() => {
    let mounted = true;
    if (kovaContext.totalSessions >= 3) {
      generateKovaMessage('insight', kovaContext).then(msg => {
        if (mounted) setKovaInsight(msg);
      });
    }
    return () => { mounted = false; };
  }, []);

  const handlePlayChallenge = useCallback((challengeId: string, gameType: string) => {
    playTransition();
    router.push({ pathname: '/focus-practice', params: { games: gameType, challengeId } } as any);
  }, []);

  const name = useUserStore(s => s.name);
  const mood = useUserStore(s => s.mood);
  const moodHistory = useUserStore(s => s.moodHistory);
  const setMood = useUserStore(s => s.setMood);
  const sessionLength = useUserStore(s => s.sessionLength);
  const setSessionLength = useUserStore(s => s.setSessionLength);
  const deepSessionsThisWeek = useUserStore(s => s.deepSessionsThisWeek);
  const streak = useProgressStore(s => s.streak);
  const lastSessionDate = useProgressStore(s => s.lastSessionDate);
  const coins = useProgressStore(s => s.coins);
  const xp = useProgressStore(s => s.xp);
  const level = useProgressStore(s => s.level);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const longestStreak = useProgressStore(s => s.longestStreak);
  const isSessionDoneToday = useProgressStore(s => s.isSessionDoneToday);
  const stage = stageFromXP(xp);
  const sessionDone = isSessionDoneToday();
  const [dailyGames, setDailyGames] = useState(() => selectDailyGames(useUserStore.getState().sessionLength));
  // F6: re-pick games when the user changes session length so the preview list updates.
  useEffect(() => {
    setDailyGames(selectDailyGames(sessionLength));
  }, [sessionLength]);

  // F3 Quick Hit: subscribe to a derived value so the UI re-renders the
  // moment a Quick Hit is consumed (and so it shows the full quota again on
  // a fresh day, since the date check is part of the selector).
  const qhLeft = useEnergyStore((s) =>
    s.quickHitsDate === todayStr()
      ? Math.max(0, MAX_QUICK_HITS_PER_DAY - s.quickHitsUsed)
      : MAX_QUICK_HITS_PER_DAY,
  );
  const handleStartQuickHit = useCallback(() => {
    if (qhLeft <= 0) return;
    tapLight();
    playTap();
    router.push('/quick-hit' as any);
  }, [qhLeft]);

  const brainScores = useProgressStore(s => s.brainScores);

  const moodLoggedToday = useMemo(() => moodHistory.some(e => e.date === todayStr()), [moodHistory]);
  const [moodDismissed, setMoodDismissed] = useState(false);
  const [heartsTrigger, setHeartsTrigger] = useState(0);
  const showMoodCheckIn = !moodLoggedToday && !moodDismissed;
  const { briefing: coachBriefing } = useDailyBriefing();
  const fallbackGreeting = useMemo(() => getGreeting({ streak, totalSessions }), [streak, totalSessions]);
  const kovaGreeting = coachBriefing?.greeting ?? fallbackGreeting;

  // F12 Energy + F7: refill hearts and prune stale area streaks BEFORE the
  // first paint so the UI never shows a one-frame stale state. useState's
  // initializer runs synchronously during render and only once per mount,
  // which is exactly the semantics we want here.
  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  useState(() => {
    const proAtMount =
      useProStore.getState().isPro || useProStore.getState().debugSimulatePro;
    useEnergyStore.getState().refillIfNewDay(proAtMount);
    useGroveStore.getState().recalcAreaStreaks();
    return null;
  });
  const hearts = useEnergyStore(s => s.hearts);
  const heartMax = maxHeartsFor(isPro);
  const heartsClamped = Math.min(hearts, heartMax);
  const energyDepleted = heartsClamped <= 0;

  // F2 Brain Weather: snapshot today's scores once on mount, then classify.
  const recordBrainSnapshot = useBrainHistoryStore(s => s.recordSnapshot);
  const getSnapshotFromDaysAgo = useBrainHistoryStore(s => s.getSnapshotFromDaysAgo);
  useEffect(() => {
    recordBrainSnapshot(brainScores);
  }, [recordBrainSnapshot, brainScores]);
  const weatherReport = useMemo(() => {
    const weekAgo = getSnapshotFromDaysAgo(7);
    const gap = lastSessionDate
      ? Math.round(
          (new Date(`${todayStr()}T12:00:00`).getTime() -
            new Date(`${lastSessionDate}T12:00:00`).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : Infinity;
    const returningToday = sessionDone && gap === 0 && streak === 1 && totalSessions > 1;
    return classifyBrainWeather({
      current: brainScores,
      weekAgo,
      streak,
      lastSessionDate,
      returningToday,
    });
  }, [brainScores, getSnapshotFromDaysAgo, lastSessionDate, streak, sessionDone, totalSessions]);

  // Paywall nudge
  const canShowNudge = useProStore(s => s.canShowNudge);
  const recordNudge = useProStore(s => s.recordNudge);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const showNudge = !isPro && !nudgeDismissed && canShowNudge(totalSessions);

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
    playTransition();
    const length = useUserStore.getState().sessionLength;
    router.push(`/session?length=${length}` as any);
    navTimerRef.current = setTimeout(() => { navigatingRef.current = false; }, 1000);
  }, []);

  // F6: Deep mode gating. Pro users always allowed; free users get
  // FREE_DEEP_SESSIONS_PER_WEEK per rolling 7-day window.
  const deepUsedThisWeek = deepSessionsThisWeek();
  const deepAllowed = isPro || deepUsedThisWeek < FREE_DEEP_SESSIONS_PER_WEEK;

  const handlePickLength = useCallback(
    (length: SessionLength) => {
      if (length === 'deep' && !deepAllowed) return;
      tapLight();
      setSessionLength(length);
    },
    [deepAllowed, setSessionLength],
  );

  // Level-up celebration
  const prevLevelRef = useRef(level);
  const [celebration, setCelebration] = useState<{ kind: CelebrationKind; value: string | number } | null>(null);

  useEffect(() => {
    if (prevLevelRef.current < level) {
      setCelebration({ kind: 'levelUp', value: level });
    }
    prevLevelRef.current = level;
  }, [level]);

  // Game-unlock celebration — replaces the old persistent GameUnlockBanner.
  // Fires once per unlock day, then marks the day celebrated.
  const unlockRefresh = useGameUnlockStore(s => s.refresh);
  const markUnlockCelebrated = useGameUnlockStore(s => s.markCelebrated);
  const celebratedDays = useGameUnlockStore(s => s.celebratedDays);
  useEffect(() => {
    unlockRefresh();
    const day = daysSinceJoin();
    const todaysUnlocks = unlocksOnDay(day);
    if (todaysUnlocks.length === 0 || celebratedDays.includes(day)) return;
    const firstId = todaysUnlocks[0];
    const cfg = gameConfigsMap[firstId];
    if (!cfg) return;
    const label = todaysUnlocks.length > 1
      ? `${cfg.name} +${todaysUnlocks.length - 1} more`
      : cfg.name;
    // Queue after level-up so the two never collide visually.
    const t = setTimeout(() => {
      setCelebration(prev => prev ?? { kind: 'gameUnlock', value: label });
      markUnlockCelebrated(day);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {/* Background gradient */}
      <LinearGradient
        colors={[C.bg1, C.bg2, C.bg1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {/* F2 Brain Weather tint — sits behind everything, never blocks touch. */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: weatherReport.tint }]}
      />
      <FloatingParticles count={5} color="rgba(155,114,224,0.12)" />
      <View style={[styles.coinRow, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.coinPillBg} />
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
      {/* F12 Energy hearts — top right, mirrors coin row. */}
      <View style={[styles.heartsRow, { top: insets.top + 8 }]} pointerEvents="none">
        <View style={styles.heartsPillBg} />
        {Array.from({ length: heartMax }).map((_, i) => (
          <Text
            key={i}
            style={[
              styles.heartIcon,
              i >= heartsClamped && styles.heartIconSpent,
            ]}
          >
            ♥
          </Text>
        ))}
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
        {/* ROW 1: Greeting (left) + Streak (right, dropped 8px). Asymmetric. */}
        <View style={styles.headerRow}>
          <Animated.View entering={FadeIn.delay(0).duration(400)} style={styles.headerLeft}>
            <Text style={styles.greetingSub}>
              {weatherReport.icon}  {GREETINGS[timeOfDay].toUpperCase()}
            </Text>
            <Text style={styles.greetingName}>{name || 'friend'}</Text>
            <Text style={styles.weatherHeadline}>{weatherReport.headline}</Text>
          </Animated.View>
          {streak > 0 && (
            <Animated.View entering={FadeIn.delay(120).duration(400)} style={styles.streakColumn}>
              <View style={styles.streakGlowBg} />
              <View style={styles.streakFlameRow}>
                <Text style={styles.flameEmoji}>🔥</Text>
                <Text style={styles.streakNumber}>{streak}</Text>
              </View>
              <Text style={styles.streakLabel}>DAY STREAK</Text>
            </Animated.View>
          )}
        </View>

        {/* ROW 2: Kova — generous breathing room + ambient glow + particles */}
        <Animated.View entering={FadeIn.delay(180).duration(500)} style={styles.kovaZone}>
          <View style={styles.kovaGlow} pointerEvents="none">
            <LinearGradient
              colors={[
                `${kovaStageConfig.primaryColor}15`,
                'transparent',
              ]}
              style={styles.kovaGlowGradient}
              start={{ x: 0.5, y: 0.3 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>
          <KovaParticles
            emotion={kovaEmotion}
            primaryColor={kovaStageConfig.primaryColor}
            size={160}
            glowIntensity={kovaStageConfig.glowIntensity}
          />
          <KovaSpeechBubble
            text={kovaDialogue ?? ''}
            primaryColor={kovaStageConfig.primaryColor}
            visible={showKovaBubble}
            onDismiss={() => setShowKovaBubble(false)}
          />
          <Kova
            stage={stage}
            emotion={sessionDone ? 'happy' : isUrgent ? 'worried' : streak === 0 ? 'curious' : 'idle'}
            size={160 * kovaStageConfig.size}
            onTap={() => {
              setHeartsTrigger(t => t + 1);
              // Cycle Kova voice: if we have a pre-generated insight, show that
              // on the next tap; otherwise keep generating idle_tap chatter.
              if (kovaInsight && kovaDialogue !== kovaInsight) {
                setKovaDialogue(kovaInsight);
                setShowKovaBubble(true);
                return;
              }
              generateKovaMessage('idle_tap', kovaContext).then(msg => {
                setKovaDialogue(msg);
                setShowKovaBubble(true);
              });
            }}
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
              Your streak's running low. A quick session keeps the flame alive.
            </Text>
          </Animated.View>
        )}

        {/* Mood check-in */}
        {showMoodCheckIn && (
          <MoodCheckIn
            onSelect={setMood}
            onDismiss={() => setMoodDismissed(true)}
          />
        )}

        {/* ── Daily Challenges (includes real-life slot) ───── */}
        <View style={styles.challengeSection}>
          <DailyChallengeList onPlayChallenge={handlePlayChallenge} />
        </View>

        {/* ROW 3: Session card — slightly off-center left for asymmetry. */}
        <Animated.View entering={FadeInDown.delay(280).duration(500)}>
          {sessionDone ? (
            <View style={[styles.sessionCardDone, styles.sessionCardOffset]}>
              <Text style={styles.doneEmoji}>✨</Text>
              <Text style={styles.doneTitle}>{getDailySlogan(DONE_SLOGANS)}</Text>
              <Text style={styles.doneSubtitle}>Come back tomorrow — your streak is safe.</Text>
              <Pressable
                style={styles.bonusBtn}
                onPress={handleStartSession}
                onPressIn={() => tapLight()}
              >
                <Text style={styles.bonusBtnText}>⚡ Bonus Round</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.sessionCard, styles.sessionCardOffset]}>
              <LinearGradient
                colors={['rgba(110,207,154,0.06)', 'transparent']}
                style={styles.sessionTopGlow}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
              <View style={styles.sessionAccentLine} />
              <Text style={styles.sessionLabelMicro}>
                {totalSessions === 0 ? 'YOUR FIRST SESSION' : "TODAY'S SESSION"}
              </Text>
              <Text style={styles.sessionPitch}>
                {totalSessions === 0
                  ? "Kova's ready. 5 minutes is all it takes to start training your brain."
                  : getDailySlogan(SESSION_SLOGANS)}
              </Text>
              {totalSessions > 0 && <Text style={styles.gameNamesText}>{gameNames}</Text>}
              {coachBriefing?.recommendation && (
                <Text style={styles.coachRec}>{coachBriefing.recommendation}</Text>
              )}
              {energyDepleted && (
                <Text style={styles.lowEnergyNote}>
                  Low energy. You can still play, but your brain absorbs more when it's rested.
                </Text>
              )}

              {/* F6: session length selector — hidden for first-timers */}
              {totalSessions > 0 && (
                <>
                  <View style={styles.lengthRow}>
                    {(['quick', 'standard', 'deep'] as SessionLength[]).map((opt) => {
                      const selected = sessionLength === opt;
                      const locked = opt === 'deep' && !deepAllowed;
                      return (
                        <Pressable
                          key={opt}
                          onPress={() => handlePickLength(opt)}
                          style={[
                            styles.lengthPill,
                            selected && styles.lengthPillActive,
                            locked && styles.lengthPillLocked,
                          ]}
                        >
                          <Text style={[
                            styles.lengthPillText,
                            selected && styles.lengthPillTextActive,
                            locked && styles.lengthPillTextLocked,
                          ]}>
                            {opt === 'quick' ? 'Quick · 2' : opt === 'standard' ? 'Standard · 3' : 'Deep · 5'}
                          </Text>
                          {locked && <Text style={styles.lengthPillLockBadge}>PRO</Text>}
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.lengthMeta}>
                    {sessionLength === 'quick' && '~3 min · short and sweet'}
                    {sessionLength === 'standard' && '~5 min · the classic'}
                    {sessionLength === 'deep' && (isPro
                      ? '~8 min · 1.5× XP · Zen Flow mid-session'
                      : `~8 min · 1.5× XP · ${Math.max(0, FREE_DEEP_SESSIONS_PER_WEEK - deepUsedThisWeek)} free this week`)}
                  </Text>
                </>
              )}

              {/* CTA Button — gradient fill, glow, pulse */}
              <Animated.View style={[ctaPulseStyle, btnStyle, styles.ctaWrap]}>
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
                  <LinearGradient
                    colors={['#7DD3A8', '#5BC088']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
                  />
                  <Text style={styles.ctaText}>Let's Go</Text>
                </Pressable>
              </Animated.View>
            </View>
          )}
        </Animated.View>

        {/* F3 Quick Hit — hidden until first session completed */}
        {totalSessions > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.weeklyChallengeWrap}>
            <Pressable
              style={[styles.quickHitCard, qhLeft <= 0 && styles.quickHitCardDisabled]}
              onPress={handleStartQuickHit}
            >
              <Text style={styles.quickHitBolt}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickHitTitle}>Quick Hit · 30 seconds</Text>
                <Text style={styles.quickHitSub}>
                  {qhLeft > 0
                    ? `${qhLeft} Quick Hit${qhLeft === 1 ? '' : 's'} left today · bonus XP, no streak cost`
                    : 'No Quick Hits left. Resets at midnight.'}
                </Text>
              </View>
              {qhLeft > 0 && <Text style={styles.quickHitArrow}>›</Text>}
            </Pressable>
          </Animated.View>
        )}

        {/* ── Quick Play Bento Grid ──────────────────────── */}
        <QuickPlayGrid />

        {/* Daily brain fact */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.brainFactWrap}
        >
          <BrainFactCard />
        </Animated.View>

        {/* Paywall nudge — bottom of scroll, less aggressive position */}
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

        <View style={{ height: 40 }} />
      </ScrollView>

      <Celebration type="particles_hearts" trigger={heartsTrigger} origin={{ x: width / 2, y: 220 }} />

      <PaywallFull visible={showPaywall} onClose={() => setShowPaywall(false)} />

      {/* Kova evolution animation */}
      {pendingEvolution != null && (
        <KovaEvolutionAnimation
          fromStage={kovaStage - 1}
          toStage={pendingEvolution}
          isDeEvolution={false}
          onComplete={clearPendingEvolution}
        />
      )}
      {pendingDeEvolution != null && (
        <KovaEvolutionAnimation
          fromStage={kovaStage + 1}
          toStage={pendingDeEvolution}
          isDeEvolution
          onComplete={clearPendingEvolution}
        />
      )}

      {/* Reward chest overlay */}
      <RewardChest
        visible={showRewardChest}
        onDismiss={() => setShowRewardChest(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg1,
  },

  // ── Coin balance (floating top-left) ───────────────────────────────
  // `top` is set dynamically from useSafeAreaInsets() — see HomeScreenInner.
  coinRow: {
    position: 'absolute',
    left: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinPillBg: {
    position: 'absolute',
    top: -6,
    left: -10,
    right: -10,
    bottom: -6,
    borderRadius: 999,
    backgroundColor: 'rgba(10,12,20,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.12)',
  },
  coinIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.amber,
    shadowColor: '#F0B542',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  coinBalance: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: C.amber,
    textShadowColor: 'rgba(240,181,66,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  coinFloat: {
    position: 'absolute',
    left: 26,
    top: -22,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: C.amber,
  },

  // ── F12 Energy hearts (floating top-right) ─────────────────────────
  // `top` is set dynamically from useSafeAreaInsets() — see HomeScreenInner.
  ambientNeuralMap: {
    position: 'absolute',
    right: 16,
    zIndex: 25,
  },
  heartsRow: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heartsPillBg: {
    position: 'absolute',
    top: -6,
    left: -10,
    right: -10,
    bottom: -6,
    borderRadius: 999,
    backgroundColor: 'rgba(10,12,20,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(232,112,126,0.12)',
  },
  heartIcon: {
    fontSize: 18,
    color: C.coral,
    textShadowColor: 'rgba(232,112,126,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heartIconSpent: {
    color: C.t4,
    textShadowColor: 'transparent',
  },

  // ── Scroll container ──────────────────────────────────────────────
  scrollContent: {
    // No horizontal padding here — children apply their own asymmetric padding.
    paddingTop: 36,
    paddingBottom: 110,
  },

  // ── Row 1: Header (asymmetric) ────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingLeft: asymmetry.greetingLeft,
    paddingRight: asymmetry.streakRight,
    marginBottom: space.lg,
  },
  headerLeft: {
    flex: 1,
    marginTop: space.sm,
    gap: 2,
  },
  greetingSub: {
    ...t.microLabel,
    color: C.t3,
  },
  greetingName: {
    ...t.pageTitle,
    color: C.t1,
    marginTop: 2,
  },
  weatherHeadline: {
    fontFamily: fonts.kova,
    fontSize: 16,
    color: C.t2,
    marginTop: 4,
    lineHeight: 20,
    maxWidth: 240,
  },

  // Streak — right-aligned, dropped 8px below the greeting line.
  streakColumn: {
    alignItems: 'flex-end',
    marginTop: asymmetry.streakDrop + space.sm,
    position: 'relative',
  },
  streakGlowBg: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    right: -10,
    top: -10,
    backgroundColor: 'rgba(240,181,66,0.08)',
    shadowColor: '#F0B542',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 4,
  },
  streakFlameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flameEmoji: {
    fontSize: 26,
  },
  streakNumber: {
    ...t.heroNumber,
    fontSize: 52,
    color: C.amber,
    textShadowColor: 'rgba(240,181,66,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  streakLabel: {
    ...t.microLabel,
    color: C.t3,
    marginTop: -2,
  },

  // ── Row 2: Kova zone — generous breathing room ────────────────────
  kovaZone: {
    alignItems: 'center',
    marginTop: space.xs,
    marginBottom: space.huge - space.xl,
    zIndex: 10,
  },
  kovaGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -60,
    alignSelf: 'center',
  },
  kovaGlowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
  },

  // ── Urgency banner ────────────────────────────────────────────────
  urgencyBanner: {
    backgroundColor: 'rgba(232,112,126,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,112,126,0.3)',
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: asymmetry.pagePadding,
    marginTop: space.xxl,
    marginBottom: space.xs,
    shadowColor: '#E8707E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  urgencyText: {
    fontFamily: fonts.bodySemi,
    color: C.coral,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Story badge ───────────────────────────────────────────────────
  // ── Row 3: Session card (off-center left for asymmetry) ───────────
  sessionCardOffset: {
    marginLeft: asymmetry.sessionMarginLeft,
    marginRight: asymmetry.sessionMarginRight,
  },
  sessionCard: {
    borderRadius: radii.lg,
    backgroundColor: 'rgba(19,24,41,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(110,207,154,0.18)',
    paddingHorizontal: space.xl,
    paddingTop: space.lg + 4,
    paddingBottom: space.xl,
    gap: space.xs,
    overflow: 'hidden',
    ...shadows.hero,
    shadowColor: '#6ECF9A',
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  sessionTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  sessionAccentLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(110,207,154,0.35)',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionCardDone: {
    borderRadius: radii.lg,
    backgroundColor: 'rgba(19,24,41,0.90)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.15)',
    padding: space.xl,
    gap: space.sm,
    alignItems: 'center',
    ...shadows.soft,
    shadowColor: '#F0B542',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  sessionLabelMicro: {
    ...t.sectionHeader,
    color: C.t3,
  },
  sessionPitch: {
    fontFamily: fonts.kova,
    fontSize: 19,
    lineHeight: 26,
    color: C.t1,
    marginTop: 2,
  },
  gameNamesText: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 13,
    marginTop: 2,
  },
  coachRec: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  lowEnergyNote: {
    fontFamily: fonts.body,
    color: C.coral,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },

  // ── F6 Session length selector ────────────────────────────────────
  lengthRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: space.sm,
  },
  lengthPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  lengthPillActive: {
    backgroundColor: 'rgba(110,207,154,0.12)',
    borderColor: 'rgba(110,207,154,0.5)',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lengthPillLocked: {
    opacity: 0.55,
  },
  lengthPillText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  lengthPillTextActive: {
    color: C.green,
  },
  lengthPillTextLocked: {
    color: C.t3,
  },
  lengthPillLockBadge: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  lengthMeta: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── F3 Quick Hit card ─────────────────────────────────────────────
  quickHitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: 'rgba(240,181,66,0.08)',
    borderRadius: radii.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.35)',
    shadowColor: '#F0B542',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  quickHitCardDisabled: {
    opacity: 0.55,
  },
  quickHitBolt: {
    fontSize: 26,
    textShadowColor: 'rgba(240,181,66,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  quickHitTitle: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 14,
    letterSpacing: 0.1,
  },
  quickHitSub: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
    marginTop: 1,
  },
  quickHitArrow: {
    fontFamily: fonts.body,
    color: C.amber,
    fontSize: 22,
    lineHeight: 22,
  },
  ctaWrap: {
    marginTop: space.md,
  },
  ctaButton: {
    height: pillButton.height,
    borderRadius: pillButton.borderRadius,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: pillButton.paddingHorizontal,
    overflow: 'hidden',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
    fontSize: 17,
    letterSpacing: 0.2,
  },

  // Done state
  doneEmoji: { fontSize: 32, marginBottom: 4 },
  doneTitle: {
    ...t.pageTitle,
    fontSize: 22,
    color: C.t1,
  },
  doneSubtitle: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bonusBtn: {
    backgroundColor: 'rgba(240,181,66,0.14)',
    borderRadius: radii.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.45)',
    marginTop: space.md,
    shadowColor: '#F0B542',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  bonusBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 14,
  },

  // ── Daily quote ────────────────────────────────────────────────
  quoteCard: {
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderRadius: radii.md,
    padding: space.lg,
    borderWidth: 1,
    borderColor: 'rgba(155,114,224,0.18)',
    borderLeftWidth: 4,
    borderLeftColor: C.purple,
    shadowColor: '#9B72E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },
  quoteText: {
    fontFamily: fonts.kova,
    color: C.t1,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontFamily: fonts.bodySemi,
    color: C.purple,
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 0.3,
  },

  // ── Compact stats (inline row) ──────────────────────────────────
  // XP progress bar
  xpBarWrap: {
    paddingHorizontal: asymmetry.pagePadding,
    marginTop: space.md,
    gap: 4,
  },
  xpBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(155,114,224,0.12)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
    shadowColor: '#9B72E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  xpBarText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t3,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // Individual stat cards
  compactStatsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: asymmetry.pagePadding,
    marginTop: space.md,
  },
  compactStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm + 2,
    borderRadius: radii.md,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  compactStatValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  compactStatUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactStatLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: C.t4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },

  // ── Kova insight ──────────────────────────────────────────────────
  insightSection: {
    paddingHorizontal: asymmetry.pagePadding,
    marginTop: space.sm,
  },
  insightCard: {
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.purple,
    borderWidth: 1,
    borderColor: 'rgba(155,114,224,0.12)',
    shadowColor: '#9B72E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    gap: 6,
  },
  insightLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: C.t4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  insightText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: C.t2,
    lineHeight: 20,
  },

  // ── Daily challenges ──────────────────────────────────────────────
  challengeSection: {
    paddingHorizontal: asymmetry.pagePadding,
    marginTop: space.md,
    marginBottom: space.sm,
  },

  // ── Brain fact ────────────────────────────────────────────────────
  brainFactWrap: {
    paddingHorizontal: asymmetry.pagePadding,
    marginTop: space.lg,
  },

  // ── Weekly challenge / game unlock ────────────────────────────────
  weeklyChallengeWrap: {
    paddingHorizontal: asymmetry.pagePadding,
    marginTop: space.lg,
  },
});

export default function HomeScreen() {
  return (
    <ErrorBoundary scope="Home tab">
      <HomeScreenInner />
    </ErrorBoundary>
  );
}
