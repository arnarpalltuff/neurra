import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, withSequence, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import { GameId, gameConfigs } from '../../constants/gameConfigs';
import { GameResult } from '../../stores/progressStore';
import Kova from '../../components/kova/Kova';
import { KovaEmotion } from '../../components/kova/KovaStates';
import Button from '../../components/ui/Button';
import StreakCounter from '../../components/ui/StreakCounter';
import { useProgressStore } from '../../stores/progressStore';
import { pickRandom } from '../../utils/arrayUtils';
import { CoinRewardBreakdown } from '../../utils/coinRewards';
import AdBanner from '../../components/ads/AdBanner';
import RatePromptCard from '../../components/ui/RatePromptCard';

const BRAIN_FACTS = [
  "Fun fact: your brain uses 20% of your body's energy. You just gave it a workout.",
  "Your hippocampus is growing new connections right now.",
  "Sleep will consolidate everything you just practiced.",
  "Consistent practice beats intense cramming — every time.",
  "Your brain is most plastic (changeable) after challenging itself like this.",
];

interface PostSessionProps {
  results: Array<{ gameId: GameId; score: number; accuracy: number }>;
  xpEarned: number;
  newStreak: number;
  onDone: () => void;
  onBonusRound?: () => void;
  bonusAvailable?: boolean;
  isFirstSession?: boolean;
  coinRewards?: CoinRewardBreakdown | null;
}

export default function PostSession({
  results,
  xpEarned,
  newStreak,
  onDone,
  onBonusRound,
  bonusAvailable = false,
  isFirstSession = false,
  coinRewards,
}: PostSessionProps) {
  const xpDisplay = useSharedValue(0);
  const personalBests = useProgressStore(s => s.personalBests);
  const totalSessions = useProgressStore(s => s.totalSessions);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    xpDisplay.value = withTiming(xpEarned, { duration: 1200 });
  }, []);

  const avgAccuracy = results.reduce((a, r) => a + r.accuracy, 0) / results.length;
  const isPerfect = avgAccuracy >= 0.9;
  const kovaEmotion: KovaEmotion = isPerfect ? 'proud' : avgAccuracy >= 0.7 ? 'happy' : 'encouraging';

  const streakMilestone = newStreak > 0 && [3, 7, 14, 30, 60, 100, 365].includes(newStreak);

  const fact = useMemo(() => pickRandom(BRAIN_FACTS), []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Kova */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.kovaArea}>
          <Kova
            size={100}
            emotion={kovaEmotion}
            showSpeechBubble={false}
            forceDialogue={
              isPerfect
                ? "That was incredible. I'm glowing!"
                : avgAccuracy >= 0.7
                ? "We did it! Great session."
                : "That was tough. You showed up — that's what matters."
            }
          />
          {streakMilestone && (
            <Animated.Text entering={FadeIn.delay(400)} style={styles.streakCelebration}>
              🎉 {newStreak} day streak!
            </Animated.Text>
          )}
        </Animated.View>

        {/* XP earned */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.xpCard}>
          <Text style={styles.xpLabel}>XP Earned</Text>
          <Text style={styles.xpValue}>+{xpEarned}</Text>
          <View style={styles.streakRow}>
            <StreakCounter streak={newStreak} />
          </View>
        </Animated.View>

        {/* Coin rewards */}
        {coinRewards && coinRewards.total > 0 && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.coinCard}>
            <View style={styles.coinHeader}>
              <Text style={styles.coinEmoji}>🪙</Text>
              <Text style={styles.coinTotal}>+{coinRewards.total}</Text>
            </View>
            {coinRewards.details.map((d, i) => (
              <Text key={i} style={styles.coinDetail}>{d}</Text>
            ))}
          </Animated.View>
        )}

        {/* Game results */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
          <Text style={styles.sectionTitle}>This Session</Text>
          {results.map((r, i) => {
            const config = gameConfigs[r.gameId];
            const accPct = Math.round(r.accuracy * 100);
            const isPB = (personalBests[r.gameId] ?? 0) <= r.score && r.score > 0;
            return (
              <Animated.View entering={FadeInDown.delay(400 + i * 100)} key={r.gameId} style={styles.gameCard}>
                <View style={styles.gameCardLeft}>
                  <Text style={styles.gameCardIcon}>{config.icon}</Text>
                  <View>
                    <Text style={styles.gameCardName}>{config.name}</Text>
                    <Text style={styles.gameCardSub}>{accPct}% accuracy</Text>
                  </View>
                </View>
                <View style={styles.gameCardRight}>
                  <Text style={styles.gameCardScore}>{r.score}</Text>
                  {isPB && <Text style={styles.pbBadge}>NEW BEST</Text>}
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Brain fact */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.factCard}>
          <Text style={styles.factEmoji}>🧠</Text>
          <Text style={styles.factText}>{fact}</Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(800)} style={styles.actions}>
          {bonusAvailable && onBonusRound && (
            <TouchableOpacity style={styles.bonusBtn} onPress={onBonusRound} accessibilityLabel="Play bonus round">
              <Text style={styles.bonusText}>⚡ Bonus Round (2× XP)</Text>
            </TouchableOpacity>
          )}
          <Button
            label={isFirstSession ? "Explore Neurra" : "Done for today ✓"}
            onPress={onDone}
            size="lg"
            style={styles.doneBtn}
          />
        </Animated.View>

        {/* Rate prompt — only after great sessions when all conditions met */}
        <RatePromptCard
          totalSessions={totalSessions}
          streak={newStreak}
          sessionAccuracy={avgAccuracy}
        />

        {/* Banner ad — free users only, delayed 2s */}
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  kovaArea: {
    alignItems: 'center',
    gap: 8,
  },
  streakCelebration: {
    color: colors.streak,
    fontSize: 18,
    fontWeight: '800',
  },
  xpCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  xpLabel: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  xpValue: {
    color: colors.warm,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 8,
  },
  coinCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  coinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  coinEmoji: { fontSize: 20 },
  coinTotal: { color: colors.warm, fontSize: 24, fontWeight: '900' },
  coinDetail: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  gameCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gameCardIcon: {
    fontSize: 28,
  },
  gameCardName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  gameCardSub: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  gameCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  gameCardScore: {
    color: colors.warm,
    fontSize: 22,
    fontWeight: '800',
  },
  pbBadge: {
    color: colors.streak,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  factCard: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  factEmoji: {
    fontSize: 20,
  },
  factText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    fontStyle: 'italic',
  },
  actions: {
    gap: 12,
  },
  bonusBtn: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.streak,
  },
  bonusText: {
    color: colors.streak,
    fontSize: 15,
    fontWeight: '700',
  },
  doneBtn: {
    width: '100%',
  },
});
