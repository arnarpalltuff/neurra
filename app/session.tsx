import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { C } from '../src/constants/colors';
import GameWrapper from '../src/screens/session/GameWrapper';
import PostSession from '../src/screens/session/PostSession';
import StoryScreen from '../src/components/story/StoryScreen';
import { GameId, gameConfigs } from '../src/constants/gameConfigs';
import { selectDailyGames } from '../src/utils/gameSelection';
import { useProgressStore } from '../src/stores/progressStore';
import { useGroveStore } from '../src/stores/groveStore';
import { useStoryStore } from '../src/stores/storyStore';
import { calcSessionCoinRewards, CoinRewardBreakdown } from '../src/utils/coinRewards';
import { startSessionAmbient, stopAmbient } from '../src/utils/sound';
import { SessionGameResult, calcSessionXP } from '../src/utils/sessionUtils';
import { getStoryBeat } from '../src/constants/story';
import { shouldOfferChallenge, pickChallenge, CHALLENGE_XP_BONUS, type Challenge } from '../src/constants/challenges';
import ChallengePrompt from '../src/components/challenges/ChallengePrompt';
import ChallengeGame from '../src/components/challenges/ChallengeGame';
import ChallengeResult from '../src/components/challenges/ChallengeResult';

type Phase = 'preStory' | 'playing' | 'postStory' | 'summary' | 'challengePrompt' | 'challengePlay' | 'challengeResult';

export default function SessionScreen() {
  const [gameIds] = useState<GameId[]>(() => selectDailyGames());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionGameResult[]>([]);
  const [sessionXP, setSessionXP] = useState(0);
  const [coinRewards, setCoinRewards] = useState<CoinRewardBreakdown | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeScore, setChallengeScore] = useState({ score: 0, total: 0 });
  const betweenGamesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Story mode
  const storyEnabled = useStoryStore(s => s.storyEnabled);
  const currentDay = useStoryStore(s => s.currentDay);
  const streak = useProgressStore(s => s.streak);
  const hasCompletedToday = useStoryStore(s => s.hasCompletedToday);

  const storyBeat = storyEnabled && !hasCompletedToday()
    ? getStoryBeat(currentDay, streak)
    : null;

  const [phase, setPhase] = useState<Phase>(storyBeat ? 'preStory' : 'playing');

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
  const addCoins = useProgressStore(s => s.addCoins);
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
      const totalXP = calcSessionXP(newResults);
      setSessionXP(totalXP);

      const prevLevel = level;
      const wasSessionDone = isSessionDoneToday();

      addXP(totalXP);
      updateStreak();

      const pbGameIds: GameId[] = [];
      const firstTimeGameIds: GameId[] = [];

      for (const r of newResults) {
        const area = gameConfigs[r.gameId]?.brainArea;
        if (area) {
          updateBrainScores(area, Math.round(r.accuracy * 100));
          markAreaTrained(area);
        }
        const prevBest = personalBests[r.gameId] ?? 0;
        if (r.score > prevBest && r.score > 0) pbGameIds.push(r.gameId);
        const history = gameHistory[r.gameId];
        if (!history || history.length === 0) firstTimeGameIds.push(r.gameId);
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

      if (rewards.total > 0) addCoins(rewards.total);
      setCoinRewards(rewards);

      // Handle story unlocks
      if (storyBeat?.postSession.unlock) {
        const u = storyBeat.postSession.unlock;
        if (u.type === 'beacon' || u.type === 'grove_area') addBeacon(u.id);
        if (u.type === 'companion') addCompanion(u.id);
      }

      // Show post-story or go straight to summary
      if (storyBeat) {
        setPhase('postStory');
      } else {
        setPhase('summary');
      }
    } else {
      if (betweenGamesTimerRef.current) clearTimeout(betweenGamesTimerRef.current);
      betweenGamesTimerRef.current = setTimeout(() => {
        betweenGamesTimerRef.current = null;
        setCurrentIndex((i) => i + 1);
      }, 500);
    }
  }, [gameIds, currentIndex, results, addXP, updateStreak, updateBrainScores, addSession, level, personalBests, gameHistory, addCoins, markAreaTrained, isSessionDoneToday, storyBeat, addBeacon, addCompanion]);

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
    useProgressStore.getState().addCoins(50);
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
      <PostSession
        results={results}
        xpEarned={sessionXP}
        newStreak={useProgressStore.getState().streak}
        onDone={handleDone}
        bonusAvailable={false}
        coinRewards={coinRewards}
      />
    );
  }

  // Playing games
  return (
    <View style={styles.container}>
      <GameWrapper
        key={`game-${currentIndex}`}
        gameId={gameIds[currentIndex]}
        gameIndex={currentIndex}
        totalGames={gameIds.length}
        onGameComplete={handleGameComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg2,
  },
});
