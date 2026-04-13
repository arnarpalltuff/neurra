import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn, FadeOut, FadeInDown,
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../src/components/ui/FloatingParticles';
import { fonts } from '../src/constants/typography';
import { success, tapMedium } from '../src/utils/haptics';
import { playRoundStart, playTransition } from '../src/utils/sound';
import { router, useLocalSearchParams } from 'expo-router';
import { C } from '../src/constants/colors';
import GameWrapper from '../src/screens/session/GameWrapper';
import PostSession from '../src/screens/session/PostSession';
import StoryScreen from '../src/components/story/StoryScreen';
import { GameId, gameConfigs } from '../src/constants/gameConfigs';
import { selectDailyGames } from '../src/utils/gameSelection';
import { useProgressStore } from '../src/stores/progressStore';
import { useCoinStore } from '../src/stores/coinStore';
import { useGroveStore } from '../src/stores/groveStore';
import { useStoryStore } from '../src/stores/storyStore';
import { useEnergyStore, DEPLETED_XP_MULTIPLIER } from '../src/stores/energyStore';
import { useProStore } from '../src/stores/proStore';
import { useUserStore, type SessionLength } from '../src/stores/userStore';
import { useWeeklyChallengeStore } from '../src/stores/weeklyChallengeStore';
import type { BrainArea } from '../src/constants/gameConfigs';
import { checkBadges } from '../src/utils/checkBadges';
import BadgeUnlockCelebration from '../src/components/badges/BadgeUnlockCelebration';
import { calcSessionCoinRewards, CoinRewardBreakdown } from '../src/utils/coinRewards';
import { startSessionAmbient, stopAmbient } from '../src/utils/sound';
import { useKovaStore } from '../src/stores/kovaStore';
import RewardChest from '../src/components/rewards/RewardChest';
import { SessionGameResult, calcSessionXP } from '../src/utils/sessionUtils';
import { getStoryBeat } from '../src/constants/story';
import { shouldOfferChallenge, pickChallenge, CHALLENGE_XP_BONUS, type Challenge } from '../src/constants/challenges';
import ChallengePrompt from '../src/components/challenges/ChallengePrompt';
import ChallengeGame from '../src/components/challenges/ChallengeGame';
import ChallengeResult from '../src/components/challenges/ChallengeResult';

type Phase = 'sessionIntro' | 'preStory' | 'playing' | 'postStory' | 'summary' | 'challengePrompt' | 'challengePlay' | 'challengeResult';

const DEEP_XP_MULTIPLIER = 1.5;

function resolveSessionLength(paramLength: string | undefined): SessionLength {
  if (paramLength === 'quick' || paramLength === 'standard' || paramLength === 'deep') {
    return paramLength;
  }
  return useUserStore.getState().sessionLength;
}

export default function SessionScreen() {
  // F6: lock the session length on mount. Either from the route param or the
  // user's saved preference. Stable for the lifetime of the screen so the
  // closure in handleGameComplete can't go stale.
  const params = useLocalSearchParams<{ length?: string }>();
  const [sessionLength] = useState<SessionLength>(() => resolveSessionLength(params?.length));
  const [gameIds] = useState<GameId[]>(() => selectDailyGames(sessionLength));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionGameResult[]>([]);
  const [sessionXP, setSessionXP] = useState(0);
  const [coinRewards, setCoinRewards] = useState<CoinRewardBreakdown | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeScore, setChallengeScore] = useState({ score: 0, total: 0 });
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const betweenGamesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Story mode
  const storyEnabled = useStoryStore(s => s.storyEnabled);
  const currentDay = useStoryStore(s => s.currentDay);
  const streak = useProgressStore(s => s.streak);
  const hasCompletedToday = useStoryStore(s => s.hasCompletedToday);

  const storyBeat = storyEnabled && !hasCompletedToday()
    ? getStoryBeat(currentDay, streak)
    : null;

  const [phase, setPhase] = useState<Phase>(storyBeat ? 'preStory' : 'sessionIntro');
  const [showSessionChest, setShowSessionChest] = useState(false);
  const recordKovaChallenge = useKovaStore(s => s.recordChallengeCompletion);

  useEffect(() => {
    if (phase === 'sessionIntro') {
      tapMedium();
      playTransition();
      const t = setTimeout(() => {
        success();
        playRoundStart();
        setPhase('playing');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // F12 Energy: charge one heart on mount. If hearts were already depleted,
  // remember it so we can halve the final XP award. Sessions are never blocked.
  const wasDepletedRef = useRef(false);
  useEffect(() => {
    const isPro = useProStore.getState().isPro || useProStore.getState().debugSimulatePro;
    const { wasDepleted } = useEnergyStore.getState().consumeHeartForSession(isPro);
    wasDepletedRef.current = wasDepleted;
  }, []);

  useEffect(() => {
    startSessionAmbient();
    return () => {
      stopAmbient();
      if (betweenGamesTimerRef.current) {
        clearTimeout(betweenGamesTimerRef.current);
        betweenGamesTimerRef.current = null;
      }
    };
  }, []);

  const addXP = useProgressStore(s => s.addXP);
  const addSession = useProgressStore(s => s.addSession);
  const updateStreak = useProgressStore(s => s.updateStreak);
  const updateBrainScores = useProgressStore(s => s.updateBrainScores);
  const level = useProgressStore(s => s.level);
  const earnCoins = useCoinStore(s => s.earnCoins);
  const personalBests = useProgressStore(s => s.personalBests);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const isSessionDoneToday = useProgressStore(s => s.isSessionDoneToday);
  const markAreaTrained = useGroveStore(s => s.markAreaTrained);
  const advanceDay = useStoryStore(s => s.advanceDay);
  const addBeacon = useStoryStore(s => s.addBeacon);
  const addCompanion = useStoryStore(s => s.addCompanion);

  const handleGameComplete = useCallback((score: number, accuracy: number) => {
    const gameId = gameIds[currentIndex];
    const newResults = [...results, { gameId, score, accuracy }];
    setResults(newResults);

    if (currentIndex + 1 >= gameIds.length) {
      let xp = calcSessionXP(newResults);
      // F6: deep mode awards 1.5x XP.
      if (sessionLength === 'deep') xp = Math.round(xp * DEEP_XP_MULTIPLIER);
      // F12: half XP if user started this session with no hearts left.
      // Stacks multiplicatively with deep bonus (deep + depleted = 0.75x).
      if (wasDepletedRef.current) xp = Math.round(xp * DEPLETED_XP_MULTIPLIER);
      const totalXP = xp;
      setSessionXP(totalXP);

      // F6: record deep session for the weekly cap.
      if (sessionLength === 'deep') {
        useUserStore.getState().recordDeepSession();
      }

      const prevLevel = level;
      const wasSessionDone = isSessionDoneToday();

      addXP(totalXP);
      updateStreak();

      const pbGameIds: GameId[] = [];
      const firstTimeGameIds: GameId[] = [];
      const areasTrained = new Set<BrainArea>();

      // F7: track which areas just hit a 7-day specialist streak so we can
      // award the 50-coin bonus once per area per streak start.
      const newSpecialistAreas: BrainArea[] = [];

      for (const r of newResults) {
        const area = gameConfigs[r.gameId]?.brainArea;
        if (area) {
          updateBrainScores(area, Math.round(r.accuracy * 100));
          const result = markAreaTrained(area);
          if (result.reachedSeven) newSpecialistAreas.push(area);
          areasTrained.add(area);
        }
        const prevBest = personalBests[r.gameId] ?? 0;
        if (r.score > prevBest && r.score > 0) pbGameIds.push(r.gameId);
        const history = gameHistory[r.gameId];
        if (!history || history.length === 0) firstTimeGameIds.push(r.gameId);
      }

      if (newSpecialistAreas.length > 0) {
        earnCoins(50 * newSpecialistAreas.length, `Area specialist streak`);
      }

      // Record progress on the active weekly skill challenge.
      useWeeklyChallengeStore.getState().recordSession(Array.from(areasTrained));

      // Evaluate achievement badges. Newly unlocked ones queue for celebration.
      const newlyUnlocked = checkBadges();
      if (newlyUnlocked.length > 0) {
        setUnlockedBadges(newlyUnlocked);
      }

      const isPerfect = newResults.every(r => r.accuracy >= 0.9);

      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        games: newResults.map(r => ({
          gameId: r.gameId,
          score: r.score,
          accuracy: r.accuracy,
          date: new Date().toISOString(),
          personalBest: pbGameIds.includes(r.gameId),
        })),
        totalXP,
        perfect: isPerfect,
      });

      const newLevel = useProgressStore.getState().level;
      const newStreak = useProgressStore.getState().streak;
      const rewards = calcSessionCoinRewards({
        isFirstSessionToday: !wasSessionDone,
        streak: newStreak,
        isPerfect,
        personalBestGameIds: pbGameIds,
        firstTimeGameIds,
        previousLevel: prevLevel,
        newLevel,
      });

      if (rewards.total > 0) earnCoins(rewards.total, 'Session rewards');
      setCoinRewards(rewards);

      // Handle story unlocks
      if (storyBeat?.postSession.unlock) {
        const u = storyBeat.postSession.unlock;
        if (u.type === 'beacon' || u.type === 'grove_area') addBeacon(u.id);
        if (u.type === 'companion') addCompanion(u.id);
      }

      // Record Kova challenge completion for streak tracking
      recordKovaChallenge();

      // Show post-story or go straight to summary
      if (storyBeat) {
        setPhase('postStory');
      } else {
        setPhase('summary');
        // Show reward chest after summary loads
        setTimeout(() => setShowSessionChest(true), 1200);
      }
    } else {
      if (betweenGamesTimerRef.current) clearTimeout(betweenGamesTimerRef.current);
      betweenGamesTimerRef.current = setTimeout(() => {
        betweenGamesTimerRef.current = null;
        setCurrentIndex((i) => i + 1);
      }, 500);
    }
  }, [gameIds, currentIndex, results, addXP, updateStreak, updateBrainScores, addSession, level, personalBests, gameHistory, earnCoins, markAreaTrained, isSessionDoneToday, storyBeat, addBeacon, addCompanion, sessionLength]);

  const handleDone = useCallback(() => {
    if (storyBeat) advanceDay();
    // Offer challenge after every 3rd session
    const sessions = useProgressStore.getState().totalSessions;
    if (shouldOfferChallenge(sessions)) {
      const ch = pickChallenge(sessions);
      setChallenge(ch);
      setPhase('challengePrompt');
    } else {
      router.replace('/(tabs)');
    }
  }, [storyBeat, advanceDay]);

  const handleChallengeComplete = useCallback((score: number, total: number) => {
    setChallengeScore({ score, total });
    // Award bonus XP
    useProgressStore.getState().addXP(CHALLENGE_XP_BONUS);
    useCoinStore.getState().earnCoins(50, 'Real-life challenge');
    setPhase('challengeResult');
  }, []);

  const handleChallengeExit = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  // Resolve performance branch text
  const getPostText = () => {
    if (!storyBeat) return '';
    const post = storyBeat.postSession;
    if (post.performanceBranch && results.length > 0) {
      const avg = results.reduce((a, r) => a + r.accuracy, 0) / results.length;
      return avg >= post.performanceBranch.threshold
        ? post.performanceBranch.above
        : post.performanceBranch.below;
    }
    return post.text;
  };

  // Session intro — brief entrance ceremony
  if (phase === 'sessionIntro') {
    const gameCount = gameIds.length;
    const timeEst = sessionLength === 'quick' ? '~3' : sessionLength === 'deep' ? '~8' : '~5';
    return (
      <View style={styles.container}>
        <LinearGradient colors={[C.bg1, '#0A0E1A', C.bg1]} style={StyleSheet.absoluteFillObject} />
        <FloatingParticles count={8} color="rgba(110,207,154,0.15)" />
        <Animated.View entering={FadeIn.duration(400)} style={styles.sessionIntroCenter}>
          <Animated.Text entering={FadeInDown.delay(100).duration(400)} style={styles.sessionIntroLabel}>
            DAILY SESSION
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(250).duration(400)} style={styles.sessionIntroCount}>
            {gameCount} games · {timeEst} min
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.sessionIntroGamesRow}>
            {gameIds.map((id, i) => {
              const cfg = gameConfigs[id];
              return (
                <Animated.View
                  key={id}
                  entering={FadeInDown.delay(600 + i * 100).duration(300)}
                  style={styles.sessionIntroGamePill}
                >
                  <Text style={styles.sessionIntroGameIcon}>{cfg?.icon}</Text>
                  <Text style={styles.sessionIntroGameName}>{cfg?.name}</Text>
                </Animated.View>
              );
            })}
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(1200).duration(300)} style={styles.sessionIntroGo}>
            LET'S GO
          </Animated.Text>
        </Animated.View>
      </View>
    );
  }

  // Pre-story screen
  if (phase === 'preStory' && storyBeat) {
    return (
      <StoryScreen
        text={storyBeat.preSession.text}
        mood={storyBeat.preSession.mood}
        duration={storyBeat.preSession.duration}
        onContinue={() => setPhase('playing')}
      />
    );
  }

  // Post-story screen
  if (phase === 'postStory' && storyBeat) {
    return (
      <StoryScreen
        text={getPostText()}
        mood={storyBeat.preSession.mood === 'tense' ? 'hopeful' : storyBeat.preSession.mood}
        duration={3000}
        unlock={storyBeat.postSession.unlock}
        onContinue={() => setPhase('summary')}
      />
    );
  }

  // Challenge prompt
  if (phase === 'challengePrompt' && challenge) {
    return (
      <ChallengePrompt
        challenge={challenge}
        storyMode={storyEnabled}
        onAccept={() => setPhase('challengePlay')}
        onSkip={handleChallengeExit}
      />
    );
  }

  // Challenge gameplay
  if (phase === 'challengePlay' && challenge) {
    return (
      <ChallengeGame
        challenge={challenge}
        onComplete={handleChallengeComplete}
      />
    );
  }

  // Challenge result
  if (phase === 'challengeResult' && challenge) {
    return (
      <ChallengeResult
        score={challengeScore.score}
        total={challengeScore.total}
        realWorldFraming={challenge.realWorldFraming}
        onDone={handleChallengeExit}
      />
    );
  }

  // Session summary
  if (phase === 'summary') {
    return (
      <View style={styles.container}>
        <PostSession
          results={results}
          xpEarned={sessionXP}
          newStreak={streak}
          onDone={handleDone}
          bonusAvailable={false}
          coinRewards={coinRewards}
        />
        {/* Show badge unlock celebrations on top of the summary, one at a time. */}
        <BadgeUnlockCelebration
          badgeId={unlockedBadges[0] ?? null}
          onDismiss={() => setUnlockedBadges((q) => q.slice(1))}
        />
        <RewardChest
          visible={showSessionChest}
          onDismiss={() => setShowSessionChest(false)}
        />
      </View>
    );
  }

  // Playing games — pass running session stats for context-aware transitions
  const runningScore = results.reduce((sum, r) => sum + r.score, 0);
  const runningAccuracy = results.length > 0
    ? results.reduce((sum, r) => sum + r.accuracy, 0) / results.length
    : 0;

  return (
    <View style={styles.container}>
      <GameWrapper
        key={`game-${currentIndex}`}
        gameId={gameIds[currentIndex]}
        gameIndex={currentIndex}
        totalGames={gameIds.length}
        onGameComplete={handleGameComplete}
        sessionAccuracy={runningAccuracy}
        sessionScore={runningScore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg1,
  },
  sessionIntroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 28,
  },
  sessionIntroLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: C.t3,
    letterSpacing: 3,
  },
  sessionIntroCount: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: C.t1,
    letterSpacing: -0.5,
  },
  sessionIntroGamesRow: {
    gap: 8,
    marginTop: 8,
  },
  sessionIntroGamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(19,24,41,0.85)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(110,207,154,0.12)',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    minWidth: 200,
  },
  sessionIntroGameIcon: {
    fontSize: 22,
  },
  sessionIntroGameName: {
    fontFamily: fonts.headingMed,
    fontSize: 15,
    color: C.t1,
  },
  sessionIntroGo: {
    fontFamily: fonts.heading,
    fontSize: 42,
    color: C.green,
    letterSpacing: 4,
    marginTop: 16,
    textShadowColor: 'rgba(110,207,154,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
});
