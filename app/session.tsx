import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/constants/colors';
import GameWrapper from '../src/screens/session/GameWrapper';
import PostSession from '../src/screens/session/PostSession';
import { GameId, gameConfigs } from '../src/constants/gameConfigs';
import { selectDailyGames } from '../src/utils/gameSelection';
import { useProgressStore } from '../src/stores/progressStore';

interface GameResult {
  gameId: GameId;
  score: number;
  accuracy: number;
}

function calcSessionXP(results: GameResult[]): number {
  const base = results.reduce((sum, r) => sum + Math.round(40 + r.accuracy * 40), 0);
  const perfect = results.every(r => r.accuracy >= 0.9) ? 100 : 0;
  return base + 50 + perfect;
}

export default function SessionScreen() {
  const [gameIds] = useState<GameId[]>(() => selectDailyGames());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [sessionXP, setSessionXP] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  const { addXP, addSession, updateStreak, updateBrainScores, streak } = useProgressStore();

  const handleGameComplete = useCallback((score: number, accuracy: number) => {
    const gameId = gameIds[currentIndex];
    const newResults = [...results, { gameId, score, accuracy }];
    setResults(newResults);

    if (currentIndex + 1 >= gameIds.length) {
      const totalXP = calcSessionXP(newResults);
      setSessionXP(totalXP);

      addXP(totalXP);
      updateStreak();

      for (const r of newResults) {
        const area = gameConfigs[r.gameId]?.brainArea;
        if (area) updateBrainScores(area, Math.round(r.accuracy * 100));
      }

      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        games: newResults.map(r => ({
          gameId: r.gameId,
          score: r.score,
          accuracy: r.accuracy,
          date: new Date().toISOString(),
          personalBest: false,
        })),
        totalXP,
        perfect: newResults.every(r => r.accuracy >= 0.9),
      });

      setSessionComplete(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [gameIds, currentIndex, results, addXP, updateStreak, updateBrainScores, addSession]);

  const handleDone = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  if (sessionComplete) {
    return (
      <PostSession
        results={results}
        xpEarned={sessionXP}
        newStreak={streak}
        onDone={handleDone}
        bonusAvailable={false}
      />
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
    backgroundColor: colors.bgPrimary,
  },
});
