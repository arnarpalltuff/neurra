import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import Kova from '../../components/kova/Kova';
import GhostKitchen from '../../components/games/ghost-kitchen/GhostKitchen';
import Pulse from '../../components/games/pulse/Pulse';
import WordWeave from '../../components/games/word-weave/WordWeave';

interface VibeCheckProps {
  onComplete: (scores: { memory: number; focus: number; creativity: number }) => void;
}

type VibeGame = 'ghost-kitchen' | 'pulse' | 'word-weave';
const GAMES: VibeGame[] = ['ghost-kitchen', 'pulse', 'word-weave'];

const GAME_META: Record<VibeGame, { name: string; desc: string; icon: string }> = {
  'ghost-kitchen': { name: 'Memory Check', desc: "Let's see your working memory", icon: '🍳' },
  'pulse': { name: 'Focus Check', desc: "Let's test your attention", icon: '⭕' },
  'word-weave': { name: 'Creativity Check', desc: "Let's see your verbal fluency", icon: '✨' },
};

export default function VibeCheck({ onComplete }: VibeCheckProps) {
  const [gameIndex, setGameIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'playing'>('intro');
  const [scores, setScores] = useState<number[]>([]);

  const current = GAMES[gameIndex];
  const meta = GAME_META[current];
  const isLast = gameIndex === GAMES.length - 1;

  const handleGameComplete = (score: number, accuracy: number) => {
    const newScores = [...scores, Math.round(accuracy * 100)];
    setScores(newScores);
    if (isLast) {
      onComplete({
        memory: newScores[0] ?? 50,
        focus: newScores[1] ?? 50,
        creativity: newScores[2] ?? 50,
      });
    } else {
      setGameIndex(gameIndex + 1);
      setPhase('intro');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {phase === 'intro' && (
        <Animated.View entering={FadeIn} style={styles.introContainer}>
          <View style={styles.progressRow}>
            {GAMES.map((_, i) => (
              <View key={i} style={[styles.pip, i < gameIndex && styles.pipDone, i === gameIndex && styles.pipActive]} />
            ))}
          </View>

          <Kova size={100} emotion="curious" showSpeechBubble={false} />

          <View style={styles.introText}>
            <View style={styles.checkBadge}>
              <Text style={styles.checkLabel}>{gameIndex + 1} of 3</Text>
            </View>
            <Text style={styles.checkName}>{meta.name}</Text>
            <Text style={styles.checkDesc}>{meta.desc}</Text>
            <Text style={styles.noPresure}>No pressure — just play.</Text>
          </View>

          <Pressable
            style={styles.startArea}
            onPress={() => setPhase('playing')}
            accessibilityRole="button"
            accessibilityLabel="Start this game"
          >
            <Text style={styles.startText}>Tap to start</Text>
          </Pressable>
        </Animated.View>
      )}

      {phase === 'playing' && (
        <Animated.View entering={FadeIn} style={styles.gameContainer}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameHeaderText}>{meta.icon} {meta.name}</Text>
          </View>
          {current === 'ghost-kitchen' && (
            <GhostKitchen onComplete={handleGameComplete} initialLevel={1} isOnboarding />
          )}
          {current === 'pulse' && (
            <Pulse onComplete={handleGameComplete} initialLevel={1} isOnboarding />
          )}
          {current === 'word-weave' && (
            <WordWeave onComplete={handleGameComplete} initialLevel={1} isOnboarding />
          )}
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
    padding: 28,
    gap: 28,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pip: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceDim,
  },
  pipDone: { backgroundColor: colors.growth },
  pipActive: { backgroundColor: colors.growth, opacity: 0.5 },
  introText: {
    alignItems: 'center',
    gap: 8,
  },
  checkBadge: {
    backgroundColor: colors.growthTint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  checkLabel: {
    fontFamily: 'Nunito_700Bold',
    color: colors.growth,
    fontSize: 11,
    letterSpacing: 1,
  },
  checkName: {
    fontFamily: 'Quicksand_700Bold',
    color: colors.textHero,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  checkDesc: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  noPresure: {
    fontFamily: 'Caveat_400Regular',
    color: colors.textTertiary,
    fontSize: 18,
  },
  startArea: {
    backgroundColor: colors.growth,
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 999,
    shadowColor: colors.growthGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  startText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textInverse,
    fontSize: 17,
  },
  gameContainer: {
    flex: 1,
  },
  gameHeader: {
    padding: 16,
    paddingTop: 12,
  },
  gameHeaderText: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    fontSize: 14,
  },
});
