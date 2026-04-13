import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C } from '../src/constants/colors';
import GameWrapper from '../src/screens/session/GameWrapper';
import PostSession from '../src/screens/session/PostSession';
import RewardChest from '../src/components/rewards/RewardChest';
import { GameId, gameConfigs } from '../src/constants/gameConfigs';
import { useProgressStore } from '../src/stores/progressStore';
import { useCoinStore } from '../src/stores/coinStore';
import { useKovaStore } from '../src/stores/kovaStore';
import { useDailyChallengeStore } from '../src/stores/dailyChallengeStore';
import { calcSessionCoinRewards, CoinRewardBreakdown } from '../src/utils/coinRewards';
import { SessionGameResult, calcSessionXP } from '../src/utils/sessionUtils';

export default function FocusPracticeScreen() {
  const params = useLocalSearchParams<{ games?: string; challengeId?: string }>();
  const gameIds = (params.games?.split(',') ?? []) as GameId[];
  const challengeId = params.challengeId ?? null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionGameResult[]>([]);
  const [sessionXP, setSessionXP] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [coinRewards, setCoinRewards] = useState<CoinRewardBreakdown | null>(null);
  const [showChest, setShowChest] = useState(false);
  const completeChallenge = useDailyChallengeStore(s => s.completeChallenge);
  const recordKovaChallenge = useKovaStore(s => s.recordChallengeCompletion);

  const addXP = useProgressStore(s => s.addXP);
  const addSession = useProgressStore(s => s.addSession);
  const updateStreak = useProgressStore(s => s.updateStreak);
  const updateBrainScores = useProgressStore(s => s.updateBrainScores);
  const level = useProgressStore(s => s.level);
  const earnCoins = useCoinStore(s => s.earnCoins);
  const personalBests = useProgressStore(s => s.personalBests);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const isSessionDoneToday = useProgressStore(s => s.isSessionDoneToday);
  const streak = useProgressStore(s => s.streak);

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
        if (area) updateBrainScores(area, Math.round(r.accuracy * 100));
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

      if (rewards.total > 0) earnCoins(rewards.total, 'Focus practice rewards');
      setCoinRewards(rewards);

      // Mark daily challenge as completed if this was a challenge
      if (challengeId) {
        const totalScore = newResults.reduce((sum, r) => sum + r.score, 0);
        completeChallenge(challengeId, totalScore);
        recordKovaChallenge();
      }

      setSessionComplete(true);
      // Show reward chest after a brief delay
      setTimeout(() => setShowChest(true), 800);
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [gameIds, currentIndex, results, addXP, updateStreak, updateBrainScores, addSession, level, personalBests, gameHistory, earnCoins, isSessionDoneToday]);

  const handleDone = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  useEffect(() => {
    if (gameIds.length === 0) router.replace('/(tabs)');
  }, [gameIds.length]);

  if (gameIds.length === 0) return null;

  if (sessionComplete) {
    return (
      <View style={{ flex: 1 }}>
        <PostSession
          results={results}
          xpEarned={sessionXP}
          newStreak={streak}
          onDone={handleDone}
          bonusAvailable={false}
          coinRewards={coinRewards}
        />
        <RewardChest
          visible={showChest}
          onDismiss={() => {
            setShowChest(false);
            handleDone();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameWrapper
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
    backgroundColor: C.bg1,
  },
});
