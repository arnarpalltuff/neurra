import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Dimensions, SafeAreaView, Pressable,
} from 'react-native';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, colors } from '../../src/constants/colors';
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

const { width } = Dimensions.get('window');

const GREETINGS: Record<string, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  lateNight: 'Still up?',
};

const KOVA_GREETINGS = [
  "Let's train that brain!",
  "I've been waiting for you.",
  "Ready when you are.",
  "Your brain called — it wants a workout.",
  "Another day, another neuron.",
  "Let's make today count.",
  "I believe in you.",
  "Brains love consistency.",
  "Small steps, big growth.",
  "You showed up. That's half the battle.",
  "Your future self will thank you.",
  "Time to level up.",
  "Let's see what you've got today.",
  "Warming up the neural pathways...",
  "The brain gym is open.",
  "You're building something here.",
  "One session at a time.",
  "Your streak is glowing.",
  "Ready to surprise yourself?",
  "Let's get those neurons firing.",
];

export default function HomeScreen() {
  const name = useUserStore(s => s.name);
  const mood = useUserStore(s => s.mood);
  const moodHistory = useUserStore(s => s.moodHistory);
  const setMood = useUserStore(s => s.setMood);
  const streak = useProgressStore(s => s.streak);
  const xp = useProgressStore(s => s.xp);
  const level = useProgressStore(s => s.level);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const longestStreak = useProgressStore(s => s.longestStreak);
  const isSessionDoneToday = useProgressStore(s => s.isSessionDoneToday);
  const stage = stageFromXP(xp);
  const sessionDone = isSessionDoneToday();
  const [dailyGames] = useState(() => selectDailyGames());

  const xpProgress = useMemo(() => getXPProgress(xp, level), [xp, level]);
  const moodLoggedToday = useMemo(() => moodHistory.some(e => e.date === todayStr()), [moodHistory]);
  const [moodDismissed, setMoodDismissed] = useState(false);
  const [heartsTrigger, setHeartsTrigger] = useState(0);
  const showMoodCheckIn = !moodLoggedToday && !moodDismissed;
  const kovaGreeting = useMemo(() => KOVA_GREETINGS[Math.floor(Math.random() * KOVA_GREETINGS.length)], []);

  const {
    urgencyDim,
    isUrgent,
    streakBroken,
    brokenStreakValue,
    dismissStreakBreak,
  } = useStreakUrgency();

  const timeOfDay = getTimeOfDay();

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

  const handleStartSession = useCallback(() => {
    router.push('/session');
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

        <View style={{ height: 32 }} />
      </ScrollView>

      <Celebration type="particles_hearts" trigger={heartsTrigger} origin={{ x: width / 2, y: 220 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
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
    backgroundColor: 'rgba(232,112,126,0.08)',
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
    backgroundColor: 'rgba(240,181,66,0.08)',
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
});
