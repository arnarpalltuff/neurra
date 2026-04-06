import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { success as hapticSuccess, tapHeavy } from '../../utils/haptics';
import { playSuccess, playStreakMilestone, playCoinEarned, playPerfectScore, playCoinCascade } from '../../utils/sound';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { glow } from '../../utils/glow';
import { GameId, gameConfigs } from '../../constants/gameConfigs';
import Kova from '../../components/kova/Kova';
import { KovaEmotion } from '../../components/kova/KovaStates';
import Button from '../../components/ui/Button';
import CountUpText from '../../components/ui/CountUpText';
import { useProgressStore } from '../../stores/progressStore';
import { useUserStore } from '../../stores/userStore';
import { pickRandom } from '../../utils/arrayUtils';
import { CoinRewardBreakdown } from '../../utils/coinRewards';
import CelebrationOverlay from '../../components/ui/CelebrationOverlay';
import Celebration from '../../components/ui/Celebration';
import RatePromptCard from '../../components/ui/RatePromptCard';
import { getPostSessionMessage } from '../../constants/kovaDialogue';
import { getFramingText } from '../../constants/framingText';
import PaywallFull from '../../components/paywall/PaywallFull';
import { useProStore } from '../../stores/proStore';
import CoachInsightCard from '../../components/insights/CoachInsightCard';
import { useDailyBriefing } from '../../hooks/useDailyBriefing';

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
  const personalBests = useProgressStore(s => s.personalBests);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const mood = useUserStore(s => s.mood);

  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  const canShowFullPaywall = useProStore(s => s.canShowFullPaywall);
  const recordFullPaywall = useProStore(s => s.recordFullPaywall);
  const [showPaywall, setShowPaywall] = useState(false);
  const { briefing: coachBriefing } = useDailyBriefing();

  const [streakCelebrationVisible, setStreakCelebrationVisible] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const avgAccuracy = results.length > 0 ? results.reduce((a, r) => a + r.accuracy, 0) / results.length : 0;
  const isPerfect = avgAccuracy >= 0.9;
  const kovaEmotion: KovaEmotion = isPerfect ? 'proud' : avgAccuracy >= 0.7 ? 'happy' : 'encouraging';
  const streakMilestone = newStreak > 0 && [3, 7, 14, 30, 60, 100, 365].includes(newStreak);

  // Performance-based background gradient
  const bgColors: [string, string] = isPerfect
    ? ['#0A1A10', '#080E08']   // warm green-dark
    : avgAccuracy >= 0.7
    ? ['#0A1218', '#080C12']   // calm blue-dark
    : ['#100A14', '#0C080E'];  // gentle purple-dark

  useEffect(() => {
    hapticSuccess();
    playSuccess();

    if (streakMilestone) {
      playStreakMilestone();
      tapHeavy();
      const t1 = setTimeout(() => setStreakCelebrationVisible(true), 600);
      timersRef.current.push(t1);
    }

    if (isPerfect) {
      const t2 = setTimeout(() => {
        playPerfectScore();
        setConfettiTrigger(t => t + 1);
      }, 400);
      timersRef.current.push(t2);
    }

    if (coinRewards && coinRewards.total > 0) {
      const t3 = setTimeout(() => coinRewards.total >= 20 ? playCoinCascade() : playCoinEarned(), 800);
      timersRef.current.push(t3);
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kovaMessage = getPostSessionMessage(avgAccuracy, mood);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFillObject} />
      {streakMilestone && (
        <CelebrationOverlay
          kind="streakMilestone"
          value={newStreak}
          visible={streakCelebrationVisible}
          onDismiss={() => setStreakCelebrationVisible(false)}
        />
      )}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Kova */}
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.kovaArea}>
          <Kova
            size={100}
            emotion={kovaEmotion}
            showSpeechBubble={false}
            forceDialogue={kovaMessage}
          />
        </Animated.View>

        {/* 2. XP Earned */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.xpArea}>
          <CountUpText
            value={xpEarned}
            prefix="+"
            duration={1200}
            delay={300}
            style={styles.xpValue}
          />
          <Text style={styles.xpLabel}>XP</Text>
        </Animated.View>

        {/* 3. Streak */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.streakArea}>
          <Text style={styles.streakText}>🔥 Day {newStreak}</Text>
        </Animated.View>

        {/* 4. Game result cards */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.gamesSection}>
          {results.map((r, i) => {
            const config = gameConfigs[r.gameId];
            if (!config) return null;
            const accPct = Math.round(r.accuracy * 100);
            const barColor = accPct >= 85 ? C.green : accPct >= 60 ? C.blue : C.coral;
            const framingText = getFramingText({ gameId: r.gameId, score: r.score, accuracy: r.accuracy });

            return (
              <Animated.View
                entering={FadeInDown.delay(450 + i * 100).duration(400)}
                key={r.gameId}
                style={styles.gameCard}
              >
                <View style={styles.gameCardHeader}>
                  <Text style={styles.gameCardName}>{config.name}</Text>
                  <Text style={[styles.gameCardAccuracy, { color: barColor }]}>{accPct}%</Text>
                </View>
                <View style={styles.accuracyBar}>
                  <View style={[styles.accuracyBarFill, { width: `${accPct}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.framingText}>{framingText}</Text>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Coin rewards */}
        {coinRewards && coinRewards.total > 0 && (
          <Animated.View entering={FadeInDown.delay(650).duration(400)} style={styles.coinCard}>
            <Text style={styles.coinTotal}>🪙 +{coinRewards.total}</Text>
            {coinRewards.details.map((d, i) => (
              <Text key={i} style={styles.coinDetail}>{d}</Text>
            ))}
          </Animated.View>
        )}

        {/* Coach encouragement */}
        {coachBriefing?.encouragement && totalSessions >= 3 && (
          <CoachInsightCard insight={coachBriefing.encouragement} delay={700} />
        )}

        {/* 5. Done button */}
        <Animated.View entering={FadeInDown.delay(750).duration(400)} style={styles.actions}>
          {bonusAvailable && onBonusRound && (
            <Pressable style={styles.bonusBtn} onPress={onBonusRound}>
              <Text style={styles.bonusBtnText}>Bonus Round (2x XP)</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.doneBtn}
            onPress={() => {
              if (!isPro && canShowFullPaywall(totalSessions)) {
                recordFullPaywall();
                setShowPaywall(true);
              } else {
                onDone();
              }
            }}
          >
            <Text style={styles.doneBtnText}>Done for today ✓</Text>
          </Pressable>
        </Animated.View>

        {/* Rate prompt */}
        <RatePromptCard
          totalSessions={totalSessions}
          streak={newStreak}
          sessionAccuracy={avgAccuracy}
        />
      </ScrollView>

      <Celebration type={isPerfect ? 'confetti_epic' : 'confetti_standard'} trigger={confettiTrigger} />

      <PaywallFull
        visible={showPaywall}
        onClose={() => {
          setShowPaywall(false);
          onDone();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg2,
  },
  container: {
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  kovaArea: {
    alignItems: 'center',
  },

  // XP
  xpArea: {
    alignItems: 'center',
    gap: 0,
  },
  xpValue: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 48,
    letterSpacing: -1,
  },
  xpLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -4,
  },

  // Streak
  streakArea: {
    alignItems: 'center',
  },
  streakText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 24,
    ...glow(C.amber, 12, 0.3),
  },

  // Games
  gamesSection: {
    gap: 12,
  },
  gameCard: {
    borderRadius: 16,
    backgroundColor: C.bg3,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 16,
    gap: 8,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameCardName: {
    fontFamily: fonts.headingMed,
    color: C.t1,
    fontSize: 16,
  },
  gameCardAccuracy: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  accuracyBar: {
    height: 4,
    backgroundColor: C.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  accuracyBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  framingText: {
    fontFamily: fonts.body,
    color: C.t1,
    fontSize: 15,
    lineHeight: 21,
  },

  // Coins
  coinCard: {
    borderRadius: 16,
    backgroundColor: C.bg3,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 16,
    gap: 4,
  },
  coinTotal: {
    fontFamily: fonts.bodyBold,
    color: C.peach,
    fontSize: 20,
    marginBottom: 4,
  },
  coinDetail: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
  },

  // Actions
  actions: {
    gap: 12,
    marginTop: 4,
  },
  doneBtn: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.green,
    fontSize: 16,
  },
  bonusBtn: {
    backgroundColor: C.amberTint,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(240,181,66,0.3)',
  },
  bonusBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 15,
  },
});
