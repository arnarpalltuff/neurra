import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { GameId, gameConfigs } from '../../constants/gameConfigs';
import GhostKitchen from '../../components/games/ghost-kitchen/GhostKitchen';
import Pulse from '../../components/games/pulse/Pulse';
import WordWeave from '../../components/games/word-weave/WordWeave';
import Kova from '../../components/kova/Kova';
import { useProgressStore } from '../../stores/progressStore';
import Button from '../../components/ui/Button';
import { pickRandom } from '../../utils/arrayUtils';

interface GameWrapperProps {
  gameId: GameId;
  gameIndex: number; // 0, 1, 2
  totalGames: number;
  onGameComplete: (score: number, accuracy: number) => void;
}

type WrapperState = 'intro' | 'playing' | 'result';

export default function GameWrapper({ gameId, gameIndex, totalGames, onGameComplete }: GameWrapperProps) {
  const [state, setState] = useState<WrapperState>('intro');
  const [finalScore, setFinalScore] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const config = gameConfigs[gameId];
  const levels = useProgressStore(s => s.gameLevels);
  const level = levels[gameId] ?? 1;

  const transitionMessages = [
    'Ready? Let\'s go.',
    'Nice one. Next up: something different.',
    'One more. Finish strong.',
  ];

  const handleGameComplete = (score: number, accuracy: number) => {
    setFinalScore(score);
    setFinalAccuracy(accuracy);
    setState('result');
  };

  const handleContinue = () => {
    onGameComplete(finalScore, finalAccuracy);
  };

  const accuracyPercent = Math.round(finalAccuracy * 100);
  const pats = accuracyPercent >= 90 ? 'Excellent!' : accuracyPercent >= 70 ? 'Good work!' : 'Nice try!';

  return (
    <SafeAreaView style={styles.safe}>
      {state === 'intro' && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.introContainer}>
          <Text style={styles.gameNumber}>{gameIndex + 1} of {totalGames}</Text>
          <View style={styles.gameIconContainer}>
            <Text style={styles.gameIcon}>{config.icon}</Text>
          </View>
          <Text style={styles.gameName}>{config.name}</Text>
          <Text style={styles.gameDesc}>{config.description}</Text>
          <Kova
            size={80}
            emotion="curious"
            showSpeechBubble={false}
            dialogueContext="newGame"
          />
          <Text style={styles.transMsg}>{transitionMessages[gameIndex] ?? "Let's go!"}</Text>
          <Button
            label="Start"
            onPress={() => setState('playing')}
            size="lg"
            style={styles.startBtn}
          />
        </Animated.View>
      )}

      {state === 'playing' && (
        <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.gameContainer}>
          {/* Progress bar */}
          <View style={styles.progressHeader}>
            <View style={styles.progressDots}>
              {Array.from({ length: totalGames }).map((_, i) => (
                <View key={i} style={[styles.dot, i < gameIndex && styles.dotDone, i === gameIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
          <View style={styles.gameArea}>
            {gameId === 'ghost-kitchen' && (
              <GhostKitchen onComplete={handleGameComplete} initialLevel={level} />
            )}
            {gameId === 'pulse' && (
              <Pulse onComplete={handleGameComplete} initialLevel={level} />
            )}
            {gameId === 'word-weave' && (
              <WordWeave onComplete={handleGameComplete} initialLevel={level} />
            )}
          </View>
        </Animated.View>
      )}

      {state === 'result' && (
        <Animated.View entering={FadeIn} style={styles.resultContainer}>
          <Kova
            size={90}
            emotion={accuracyPercent >= 80 ? 'proud' : accuracyPercent >= 60 ? 'happy' : 'encouraging'}
            showSpeechBubble={false}
          />
          <Text style={styles.resultTitle}>{pats}</Text>
          <View style={styles.resultStats}>
            <View style={styles.resultStat}>
              <Text style={styles.statValue}>{finalScore}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.resultStatDivider} />
            <View style={styles.resultStat}>
              <Text style={styles.statValue}>{accuracyPercent}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
          <Text style={styles.realWorldText}>
            {pickRandom(config.realWorldFraming)}
          </Text>
          <Button
            label={gameIndex + 1 < totalGames ? 'Next Game' : 'See Results'}
            onPress={handleContinue}
            size="lg"
            style={styles.continueBtn}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  gameNumber: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gameIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameIcon: {
    fontSize: 36,
  },
  gameName: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  gameDesc: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  transMsg: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  startBtn: {
    width: '100%',
    marginTop: 8,
  },
  gameContainer: {
    flex: 1,
  },
  progressHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgTertiary,
  },
  dotDone: { backgroundColor: colors.growth },
  dotActive: { backgroundColor: colors.growth, opacity: 0.5, width: 20 },
  gameArea: { flex: 1 },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 16,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultStat: {
    flex: 1,
    alignItems: 'center',
  },
  resultStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  realWorldText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    fontStyle: 'italic',
  },
  continueBtn: {
    width: '100%',
    marginTop: 8,
  },
});
