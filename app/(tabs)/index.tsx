import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { C } from '../../src/constants/colors';
import BrainFactCard from '../../src/components/ui/BrainFactCard';
import MoodCheckIn from '../../src/components/ui/MoodCheckIn';
import DailyChallengeList from '../../src/components/challenges/DailyChallengeList';
import QuickPlayGrid from '../../src/components/home/QuickPlayGrid';
import PaywallNudge from '../../src/components/paywall/PaywallNudge';
import ErrorBoundary from '../../src/components/ui/ErrorBoundary';
import HomeAmbientRails from '../../src/components/home/HomeAmbientRails';
import HomeOverlays from '../../src/components/home/HomeOverlays';
import HomeGreeting from '../../src/components/home/HomeGreeting';
import HomeKova from '../../src/components/home/HomeKova';
import HomeUrgencyBanner from '../../src/components/home/HomeUrgencyBanner';
import HomeSession from '../../src/components/home/HomeSession';
import HomeQuickHit from '../../src/components/home/HomeQuickHit';
import { useHomeWeather } from '../../src/components/home/useHomeWeather';
import { useUserStore } from '../../src/stores/userStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useProStore } from '../../src/stores/proStore';
import { useEnergyStore } from '../../src/stores/energyStore';
import { useBrainHistoryStore } from '../../src/stores/brainHistoryStore';
import { useGroveStore } from '../../src/stores/groveStore';
import { useKovaStore } from '../../src/stores/kovaStore';
import { useStreakUrgency } from '../../src/hooks/useStreakUrgency';
import { useDailyBriefing } from '../../src/hooks/useDailyBriefing';
import { todayStr } from '../../src/utils/timeUtils';

function HomeScreenInner() {
  const insets = useSafeAreaInsets();

  const setMood = useUserStore(s => s.setMood);
  const moodHistory = useUserStore(s => s.moodHistory);
  const streak = useProgressStore(s => s.streak);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const brainScores = useProgressStore(s => s.brainScores);
  const isSessionDoneToday = useProgressStore(s => s.isSessionDoneToday);
  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  const canShowNudge = useProStore(s => s.canShowNudge);
  const recordNudge = useProStore(s => s.recordNudge);
  const recordBrainSnapshot = useBrainHistoryStore(s => s.recordSnapshot);
  const evaluateKovaOnOpen = useKovaStore(s => s.evaluateOnOpen);

  const sessionDone = isSessionDoneToday();
  const moodLoggedToday = moodHistory.some(e => e.date === todayStr());
  const [moodDismissed, setMoodDismissed] = useState(false);
  const showMoodCheckIn = !moodLoggedToday && !moodDismissed;

  // One-shot mount side-effects: refill hearts, prune area streaks.
  useState(() => {
    const proAtMount = useProStore.getState().isPro || useProStore.getState().debugSimulatePro;
    useEnergyStore.getState().refillIfNewDay(proAtMount);
    useGroveStore.getState().recalcAreaStreaks();
    return null;
  });
  useEffect(() => { evaluateKovaOnOpen(); }, [evaluateKovaOnOpen]);
  useEffect(() => { recordBrainSnapshot(brainScores); }, [recordBrainSnapshot, brainScores]);

  const weather = useHomeWeather();
  const { isUrgent } = useStreakUrgency();
  const { briefing } = useDailyBriefing();

  const [heartsTrigger, setHeartsTrigger] = useState(0);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const showNudge = !isPro && !nudgeDismissed && canShowNudge(totalSessions);

  const handlePlayChallenge = useCallback((challengeId: string, gameType: string) => {
    router.push({ pathname: '/focus-practice', params: { games: gameType, challengeId } } as any);
  }, []);

  let idx = 0;
  return (
    <SafeAreaView style={styles.safe}>
      <HomeAmbientRails weatherTint={weather.tint} />
      <HomeOverlays
        heartsTrigger={heartsTrigger}
        showPaywall={showPaywall}
        onClosePaywall={() => setShowPaywall(false)}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        <HomeGreeting index={idx++} weatherIcon={weather.icon} weatherHeadline={weather.headline} />
        <HomeKova
          index={idx++}
          onTap={() => setHeartsTrigger(t => t + 1)}
          sessionDone={sessionDone}
          isUrgent={isUrgent}
          coachGreeting={briefing?.greeting}
        />
        {isUrgent && streak > 0 && <HomeUrgencyBanner index={idx++} />}
        {showMoodCheckIn && (
          <MoodCheckIn onSelect={setMood} onDismiss={() => setMoodDismissed(true)} />
        )}
        <View style={styles.challengeSection}>
          <DailyChallengeList onPlayChallenge={handlePlayChallenge} />
        </View>
        <HomeSession index={idx++} coachRecommendation={briefing?.recommendation} />
        {totalSessions > 0 && <HomeQuickHit index={idx++} />}
        <QuickPlayGrid />
        <View style={styles.brainFactWrap}><BrainFactCard /></View>
        {showNudge && (
          <PaywallNudge
            onUpgrade={() => { recordNudge(); setShowPaywall(true); }}
            onDismiss={() => { recordNudge(); setNudgeDismissed(true); }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg1 },
  scroll: { paddingTop: 8 },
  challengeSection: { paddingHorizontal: 20, marginTop: 28 },
  brainFactWrap: { paddingHorizontal: 20, marginTop: 24 },
});

export default function HomeScreen() {
  return (
    <ErrorBoundary scope="Home tab">
      <HomeScreenInner />
    </ErrorBoundary>
  );
}
