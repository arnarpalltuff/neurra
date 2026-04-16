import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { navigate } from '../../utils/navigate';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { useUserStore, FREE_DEEP_SESSIONS_PER_WEEK, type SessionLength } from '../../stores/userStore';
import { useProgressStore } from '../../stores/progressStore';
import { useProStore } from '../../stores/proStore';
import { useEnergyStore } from '../../stores/energyStore';
import { gameConfigs } from '../../constants/gameConfigs';
import { selectDailyGames } from '../../utils/gameSelection';
import { tapLight } from '../../utils/haptics';
import { playTap, playTransition } from '../../utils/sound';
import { useStaggeredEntrance } from '../../hooks/useStaggeredEntrance';

interface HomeSessionProps {
  index: number;
  /** Coach briefing recommendation text shown above the CTA when present. */
  coachRecommendation?: string;
}

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

function dailySlogan(pool: string[]): string {
  const dayIndex = Math.floor(Date.now() / 86400000) % pool.length;
  return pool[dayIndex];
}

export default React.memo(function HomeSession({
  index,
  coachRecommendation,
}: HomeSessionProps) {
  const style = useStaggeredEntrance(index);

  const sessionLength = useUserStore(s => s.sessionLength);
  const setSessionLength = useUserStore(s => s.setSessionLength);
  const deepSessionsThisWeek = useUserStore(s => s.deepSessionsThisWeek);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const isSessionDoneToday = useProgressStore(s => s.isSessionDoneToday);
  const hearts = useEnergyStore(s => s.hearts);
  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  const sessionDone = isSessionDoneToday();
  const energyDepleted = hearts <= 0;

  const [dailyGames, setDailyGames] = useState(() => selectDailyGames(sessionLength));
  useEffect(() => {
    setDailyGames(selectDailyGames(sessionLength));
  }, [sessionLength]);

  const gameNames = useMemo(
    () => dailyGames.map(id => gameConfigs[id]?.name).filter(Boolean).join(' · '),
    [dailyGames],
  );

  const deepUsed = deepSessionsThisWeek();
  const deepAllowed = isPro || deepUsed < FREE_DEEP_SESSIONS_PER_WEEK;

  const handlePickLength = useCallback((length: SessionLength) => {
    if (length === 'deep' && !deepAllowed) return;
    tapLight();
    setSessionLength(length);
  }, [deepAllowed, setSessionLength]);

  const navigatingRef = useRef(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); };
  }, []);

  const handleStart = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    playTransition();
    const length = useUserStore.getState().sessionLength;
    navigate(`/session?length=${length}`);
    navTimerRef.current = setTimeout(() => { navigatingRef.current = false; }, 1000);
  }, []);

  const ctaPulse = useSharedValue(1);
  useEffect(() => {
    if (!sessionDone) {
      ctaPulse.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    }
  }, [sessionDone, ctaPulse]);
  const ctaPulseStyle = useAnimatedStyle(() => ({ opacity: ctaPulse.value }));

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  if (sessionDone) {
    return (
      <Animated.View style={[styles.cardDone, style]}>
        <Text style={styles.doneEmoji}>✨</Text>
        <Text style={styles.doneTitle}>{dailySlogan(DONE_SLOGANS)}</Text>
        <Text style={styles.doneSubtitle}>Come back tomorrow — your streak is safe.</Text>
        <Pressable
          style={styles.bonusBtn}
          onPress={() => { playTap(); handleStart(); }}
          onPressIn={() => tapLight()}
        >
          <Text style={styles.bonusBtnText}>⚡ Bonus Round</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, style]}>
      <LinearGradient
        colors={['rgba(110,207,154,0.06)', 'transparent']}
        style={styles.topGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.accentLine} />
      <Text style={styles.micro}>
        {totalSessions === 0 ? 'YOUR FIRST SESSION' : "TODAY'S SESSION"}
      </Text>
      <Text style={styles.pitch}>
        {totalSessions === 0
          ? "Kova's ready. 5 minutes is all it takes to start training your brain."
          : dailySlogan(SESSION_SLOGANS)}
      </Text>
      {totalSessions > 0 && <Text style={styles.gameNames}>{gameNames}</Text>}
      {coachRecommendation ? <Text style={styles.coachRec}>{coachRecommendation}</Text> : null}
      {energyDepleted && (
        <Text style={styles.lowEnergy}>
          Low energy. You can still play, but your brain absorbs more when it's rested.
        </Text>
      )}

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
                    styles.pill,
                    selected && styles.pillActive,
                    locked && styles.pillLocked,
                  ]}
                >
                  <Text style={[
                    styles.pillText,
                    selected && styles.pillTextActive,
                    locked && styles.pillTextLocked,
                  ]}>
                    {opt === 'quick' ? 'Quick · 2' : opt === 'standard' ? 'Standard · 3' : 'Deep · 5'}
                  </Text>
                  {locked && <Text style={styles.pillLockBadge}>PRO</Text>}
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.lengthMeta}>
            {sessionLength === 'quick' && '~3 min · short and sweet'}
            {sessionLength === 'standard' && '~5 min · the classic'}
            {sessionLength === 'deep' && (isPro
              ? '~8 min · 1.5× XP · Zen Flow mid-session'
              : `~8 min · 1.5× XP · ${Math.max(0, FREE_DEEP_SESSIONS_PER_WEEK - deepUsed)} free this week`)}
          </Text>
        </>
      )}

      <Animated.View style={[ctaPulseStyle, btnStyle, styles.ctaWrap]}>
        <Pressable
          style={styles.ctaButton}
          onPress={handleStart}
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
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginLeft: 28,
    marginTop: 20,
    padding: 22,
    borderRadius: 24,
    backgroundColor: 'rgba(19,24,41,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(110,207,154,0.18)',
    overflow: 'hidden',
    gap: 8,
    shadowColor: C.green,
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 20,
    width: 3,
    backgroundColor: C.green,
    borderRadius: 1.5,
    shadowColor: C.green,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  micro: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: C.green,
    letterSpacing: 1.6,
  },
  pitch: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: C.t1,
    letterSpacing: -0.5,
    lineHeight: 28,
    marginTop: 2,
  },
  gameNames: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
    marginTop: 2,
  },
  coachRec: {
    fontFamily: fonts.kova,
    fontSize: 14,
    color: C.t2,
    marginTop: 6,
    lineHeight: 20,
  },
  lowEnergy: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.coral,
    marginTop: 4,
    lineHeight: 16,
  },
  lengthRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  pill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    gap: 4,
  },
  pillActive: {
    backgroundColor: `${C.green}22`,
    borderColor: `${C.green}55`,
  },
  pillLocked: {
    opacity: 0.55,
  },
  pillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: C.t3,
    letterSpacing: 0.2,
  },
  pillTextActive: {
    color: C.green,
  },
  pillTextLocked: {
    color: C.t4,
  },
  pillLockBadge: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    color: C.amber,
    letterSpacing: 0.4,
  },
  lengthMeta: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t4,
    marginTop: 5,
    letterSpacing: 0.2,
  },
  ctaWrap: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  ctaButton: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: C.green,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  ctaText: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: '#0C1018',
    letterSpacing: 0.4,
  },

  cardDone: {
    marginHorizontal: 16,
    marginLeft: 28,
    marginTop: 20,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(110,207,154,0.2)',
    alignItems: 'center',
    gap: 8,
    shadowColor: C.green,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  doneEmoji: {
    fontSize: 32,
  },
  doneTitle: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: C.t1,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  doneSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.t3,
    textAlign: 'center',
  },
  bonusBtn: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: `${C.amber}22`,
    borderWidth: 1,
    borderColor: `${C.amber}55`,
  },
  bonusBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: C.amber,
    letterSpacing: 0.3,
  },
});
