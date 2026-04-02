import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/constants/colors';
import GameWrapper from '../src/screens/session/GameWrapper';
import PostSession from '../src/screens/session/PostSession';
import { GameId } from '../src/constants/gameConfigs';
import { selectDailyGames } from '../src/utils/gameSelection';
import { useProgressStore } from '../src/stores/progressStore';
import { useSessionStore } from '../src/stores/sessionStore';

interface GameResult {
  gameId: GameId;
  score: number;
  accuracy: number;
}

export default function SessionScreen() {
  const [gameIds] = useState<GameId[]>(() => selectDailyGames());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);

  const { addXP, addSession, updateStreak, updateBrainScores, streak } = useProgressStore();
  const { gameConfigs } = require('../src/constants/gameConfigs');

  const handleGameComplete = (score: number, accuracy: number) => {
    const gameId = gameIds[currentIndex];
    const newResult = { gameId, score, accuracy };
    const newResults = [...results, newResult];
    setResults(newResults);

    if (currentIndex + 1 >= gameIds.length) {
      // Session done — calculate XP
      const baseXP = newResults.reduce((sum, r) => sum + Math.round(40 + r.accuracy * 40), 0);
      const bonusXP = 50; // session completion bonus
      const perfectBonus = newResults.every(r => r.accuracy >= 0.9) ? 100 : 0;
      const totalXP = baseXP + bonusXP + perfectBonus;

      addXP(totalXP);
      updateStreak();

      // Update brain scores
      const { gameConfigs: gc } = require('../src/constants/gameConfigs');
      for (const r of newResults) {
        const area = gc[r.gameId]?.brainArea;
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
  };

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  const totalXP = results.reduce((sum, r) => sum + Math.round(40 + r.accuracy * 40), 0) + 50;

  if (sessionComplete) {
    return (
      <PostSession
        results={results}
        xpEarned={totalXP}
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
