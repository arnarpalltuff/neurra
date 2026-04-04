import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/constants/colors';
import GameWrapper from '../src/screens/session/GameWrapper';
import PostSession from '../src/screens/session/PostSession';
import { GameId, gameConfigs } from '../src/constants/gameConfigs';
import { selectDailyGames } from '../src/utils/gameSelection';
import { useProgressStore } from '../src/stores/progressStore';
import { useGroveStore } from '../src/stores/groveStore';
import { calcSessionCoinRewards, CoinRewardBreakdown } from '../src/utils/coinRewards';
import { startSessionAmbient, stopAmbient } from '../src/utils/sound';
import { SessionGameResult, calcSessionXP } from '../src/utils/sessionUtils';

export default function SessionScreen() {
  const [gameIds] = useState<GameId[]>(() => selectDailyGames());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionGameResult[]>([]);
  const [sessionXP, setSessionXP] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    startSessionAmbient();
    return () => stopAmbient();
  }, []);
  const [coinRewards, setCoinRewards] = useState<CoinRewardBreakdown | null>(null);

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

      // Determine personal bests and first-time games
      const pbGameIds: GameId[] = [];
      const firstTimeGameIds: GameId[] = [];

      for (const r of newResults) {
        const area = gameConfigs[r.gameId]?.brainArea;
        if (area) {
          updateBrainScores(area, Math.round(r.accuracy * 100));
          markAreaTrained(area);
        }
        // Check personal best
        const prevBest = personalBests[r.gameId] ?? 0;
        if (r.score > prevBest && r.score > 0) pbGameIds.push(r.gameId);
        // Check first time playing
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

      // Calculate and award coin rewards
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

      if (rewards.total > 0) {
        addCoins(rewards.total);
      }
      setCoinRewards(rewards);

      setSessionComplete(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [gameIds, currentIndex, results, addXP, updateStreak, updateBrainScores, addSession, level, personalBests, gameHistory, addCoins, markAreaTrained, isSessionDoneToday]);

  const handleDone = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  if (sessionComplete) {
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
    backgroundColor: colors.bgPrimary,
  },
});
