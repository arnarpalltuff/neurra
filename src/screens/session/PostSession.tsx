import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { success as hapticSuccess, tapHeavy } from '../../utils/haptics';
import { playSuccess, playStreakMilestone, playCoinEarned, playPerfectScore, playCoinCascade } from '../../utils/sound';
import { C } from '../../constants/colors';
import { fonts, type as t } from '../../constants/typography';
import { space, radii, shadows, accentGlow, motion, summaryStagger, pillButton } from '../../constants/design';
import { glow } from '../../utils/glow';
import { GameId, gameConfigs } from '../../constants/gameConfigs';
import Kova from '../../components/kova/Kova';
import { KovaEmotion } from '../../components/kova/KovaStates';
import CountUpText from '../../components/ui/CountUpText';
import { useProgressStore } from '../../stores/progressStore';
import { useUserStore } from '../../stores/userStore';
import { CoinRewardBreakdown } from '../../utils/coinRewards';
import CelebrationOverlay from '../../components/ui/CelebrationOverlay';
import Celebration from '../../components/ui/Celebration';
import RatePromptCard from '../../components/ui/RatePromptCard';
import { getPostSessionMessage } from '../../constants/kovaDialogue';
import { generateKovaMessage, KovaContext } from '../../services/kovaAI';
import { useKovaContext } from '../../hooks/useKovaContext';
import { getFramingText } from '../../constants/framingText';
import { AREA_LABELS, AREA_ACCENT, BrainArea } from '../../constants/gameConfigs';
import { getRandomQuote } from '../../constants/quotes';
import PaywallFull from '../../components/paywall/PaywallFull';
import { useProStore } from '../../stores/proStore';
import CoachInsightCard from '../../components/insights/CoachInsightCard';
import NeuralMap from '../../components/ui/NeuralMap';
import { getAreasForGame } from '../../hooks/useNeuralMap';
import JournalPrompt from '../../components/journal/JournalPrompt';
import { useDailyBriefing } from '../../hooks/useDailyBriefing';
import ShareCard, { SessionShareData } from '../../components/ui/ShareCard';
import { captureAndShare } from '../../utils/shareCapture';

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
  const brainScores = useProgressStore(s => s.brainScores);
  const mood = useUserStore(s => s.mood);

  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  const canShowFullPaywall = useProStore(s => s.canShowFullPaywall);
  const recordFullPaywall = useProStore(s => s.recordFullPaywall);
  const [showPaywall, setShowPaywall] = useState(false);
  const { briefing: coachBriefing } = useDailyBriefing();

  const [streakCelebrationVisible, setStreakCelebrationVisible] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const shareRef = useRef<View>(null);

  const avgAccuracy = results.length > 0 ? results.reduce((a, r) => a + r.accuracy, 0) / results.length : 0;
  const isPerfect = avgAccuracy >= 0.9;
  const kovaEmotion: KovaEmotion = isPerfect ? 'proud' : avgAccuracy >= 0.7 ? 'happy' : 'encouraging';
  const streakMilestone = newStreak > 0 && [3, 7, 14, 30, 60, 100, 365].includes(newStreak);

  const sessionNeuralAreas = useMemo(
    () => Array.from(new Set(results.flatMap(r => getAreasForGame(r.gameId)))) as BrainArea[],
    [results],
  );
  const sessionAreaLabels = useMemo(
    () => sessionNeuralAreas.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(' · '),
    [sessionNeuralAreas],
  );

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

  const kovaCtx = useKovaContext({
    justCompletedSession: true,
    justGotPersonalBest: results.some(r => r.accuracy > 0.9),
    lastThreeGames: results.map(r => ({
      name: gameConfigs[r.gameId]?.name ?? r.gameId,
      score: r.score,
      accuracy: Math.round(r.accuracy * 100),
    })),
  });
  const [kovaMessage, setKovaMessage] = useState(
    isFirstSession
      ? "Your first session! I felt that. This is just the beginning."
      : getPostSessionMessage(avgAccuracy, mood),
  );
  useEffect(() => {
    let mounted = true;
    const mode = results.some(r => r.accuracy > 0.9) ? 'celebration'
      : avgAccuracy < 0.6 ? 'encouragement'
      : 'post_session';
    generateKovaMessage(mode, kovaCtx).then(msg => {
      if (mounted) setKovaMessage(msg);
    });
    return () => { mounted = false; };
  }, []);

  const bestResult = results.length > 0
    ? results.reduce((best, r) => r.score > best.score ? r : best, results[0])
    : null;

  // Session headline based on performance
  const headline = isPerfect
    ? 'Flawless Session'
    : avgAccuracy >= 0.8
    ? 'Great Session'
    : avgAccuracy >= 0.6
    ? 'Solid Session'
    : 'Session Complete';

  // Brain areas trained in this session (unique)
  const areasTrained = [...new Set(
    results.map(r => gameConfigs[r.gameId]?.brainArea).filter(Boolean)
  )] as BrainArea[];

  const shareData: SessionShareData = {
    type: 'session',
    streak: newStreak,
    xpEarned,
    bestGameName: bestResult ? (gameConfigs[bestResult.gameId]?.name ?? '') : '',
    bestGameScore: bestResult?.score ?? 0,
    framingText: bestResult ? getFramingText({ gameId: bestResult.gameId, score: bestResult.score, accuracy: bestResult.accuracy }) : '',
    brainScores,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  const handleShare = async () => {
    setIsSharing(true);
    await captureAndShare(shareRef);
    setIsSharing(false);
  };

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
        {/* Session headline */}
        <Animated.View entering={FadeIn.delay(50).duration(400)} style={styles.headlineArea}>
          <Text style={styles.headlineText}>{headline}</Text>
          <View style={styles.accuracyPill}>
            <Text style={styles.accuracyPillText}>{Math.round(avgAccuracy * 100)}% accuracy</Text>
          </View>
        </Animated.View>

        {/* 1. Kova */}
        <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.kovaArea}>
          <Kova
            size={100}
            emotion={kovaEmotion}
            showSpeechBubble={false}
            forceDialogue={kovaMessage}
          />
        </Animated.View>

        {/* 2. XP Earned — hero number, animated count-up */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.xpArea}>
          <View style={styles.xpNumberRow}>
            <Text style={styles.xpPlus}>+</Text>
            <CountUpText
              value={xpEarned}
              duration={2000}
              delay={300}
              style={styles.xpValue}
            />
          </View>
          <Text style={styles.xpLabel}>XP EARNED</Text>
        </Animated.View>

        {sessionNeuralAreas.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.neuralMapWrap}>
            <NeuralMap activeAreas={sessionNeuralAreas} intensity={0.7} size={140} />
            <Text style={styles.neuralMapLabel}>{sessionAreaLabels} trained</Text>
          </Animated.View>
        )}

        {/* 3. Streak + brain areas */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.streakArea}>
          <Text style={styles.streakText}>🔥 Day {newStreak}</Text>
          {areasTrained.length > 0 && (
            <View style={styles.areasRow}>
              {areasTrained.map(area => (
                <View key={area} style={[styles.areaPill, { backgroundColor: `${AREA_ACCENT[area]}18` }]}>
                  <Text style={[styles.areaPillText, { color: AREA_ACCENT[area] }]}>
                    {AREA_LABELS[area]}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* 4. Game result cards — staggered indents, single accent border per card */}
        <View style={styles.gamesSection}>
          {results.map((r, i) => {
            const config = gameConfigs[r.gameId];
            if (!config) return null;
            const accPct = Math.round(r.accuracy * 100);
            const accentColor = config.color; // brain area color
            const framingText = getFramingText({ gameId: r.gameId, score: r.score, accuracy: r.accuracy });
            // Stagger margins — scattered paper feel.
            const indent = summaryStagger[i % summaryStagger.length];

            return (
              <Animated.View
                entering={FadeInDown.delay(500 + i * 200).duration(500)}
                key={r.gameId}
                style={[
                  styles.gameCard,
                  { marginLeft: indent, borderLeftColor: accentColor },
                ]}
              >
                <View style={styles.gameCardHeader}>
                  <Text style={styles.gameCardName}>{config.name}</Text>
                  <Text style={styles.gameCardAccuracy}>{accPct}%</Text>
                </View>
                <View style={styles.accuracyBar}>
                  <View style={[styles.accuracyBarFill, { width: `${accPct}%`, backgroundColor: accentColor }]} />
                </View>
                <Text style={styles.framingText}>{framingText}</Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Coin rewards */}
        {coinRewards && coinRewards.total > 0 && (
          <Animated.View entering={FadeInDown.delay(900).duration(400)} style={styles.coinCard}>
            <Text style={styles.coinTotal}>🪙 +{coinRewards.total}</Text>
            {coinRewards.details.map((d, i) => (
              <Text key={i} style={styles.coinDetail}>{d}</Text>
            ))}
          </Animated.View>
        )}

        {/* Coach encouragement */}
        {coachBriefing?.encouragement && totalSessions >= 3 && (
          <View style={styles.coachWrap}>
            <CoachInsightCard insight={coachBriefing.encouragement} delay={950} />
          </View>
        )}

        {/* Journal prompt — "How did that feel?" */}
        <JournalPrompt
          delay={1000}
          topScore={bestResult?.score}
          bestGameName={bestResult ? gameConfigs[bestResult.gameId]?.name : undefined}
        />

        {/* Post-session quote — a thought from a brilliant mind */}
        <Animated.View entering={FadeInDown.delay(1050).duration(400)} style={styles.quoteCard}>
          {(() => {
            const q = getRandomQuote();
            return (
              <>
                <Text style={styles.quoteText}>"{q.text}"</Text>
                <Text style={styles.quoteAuthor}>— {q.author}</Text>
              </>
            );
          })()}
        </Animated.View>

        {/* 5. Done button — at the very bottom with breathing room */}
        <Animated.View entering={FadeInDown.delay(1050).duration(400)} style={styles.actions}>
          {bonusAvailable && onBonusRound && (
            <Pressable style={styles.bonusBtn} onPress={onBonusRound}>
              <Text style={styles.bonusBtnText}>Bonus Round · 2× XP</Text>
            </Pressable>
          )}
          <View style={styles.primaryRow}>
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
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
            <Pressable style={styles.shareBtn} onPress={handleShare} disabled={isSharing}>
              <Text style={styles.shareBtnText}>↗</Text>
            </Pressable>
          </View>
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

      {/* Off-screen share card for capture */}
      <View style={styles.offScreen} pointerEvents="none">
        <ShareCard ref={shareRef} data={shareData} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg1,
  },
  container: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xxxl,
    gap: 0,
  },

  // ── Session headline ─────────────────────────────────────────────
  headlineArea: {
    alignItems: 'center',
    gap: 8,
    marginBottom: space.sm,
  },
  headlineText: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  accuracyPill: {
    backgroundColor: 'rgba(110,207,154,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  accuracyPillText: {
    fontFamily: fonts.bodySemi,
    color: C.green,
    fontSize: 12,
    letterSpacing: 0.3,
  },

  // ── Kova ─────────────────────────────────────────────────────────
  kovaArea: {
    alignItems: 'center',
    marginBottom: space.lg,
  },

  // ── XP hero ──────────────────────────────────────────────────────
  xpArea: {
    alignItems: 'center',
    marginBottom: space.xs,
  },
  xpNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  xpPlus: {
    fontFamily: fonts.heading,
    color: C.amber,
    fontSize: 28,
    lineHeight: 36,
    marginRight: 2,
    marginTop: 6,
  },
  xpValue: {
    fontFamily: fonts.heading,
    color: C.amber,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -1.5,
    textShadowColor: 'rgba(240,181,66,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  xpLabel: {
    ...t.microLabel,
    color: C.t3,
    marginTop: 2,
  },

  // ── Neural Map (session summary) ─────────────────────────────────
  neuralMapWrap: {
    alignItems: 'center',
    marginVertical: space.lg,
    gap: space.sm,
  },
  neuralMapLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Streak ───────────────────────────────────────────────────────
  streakArea: {
    alignItems: 'center',
    marginBottom: space.xxxl, // 40px gap to first game card
  },
  streakText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 18,
    letterSpacing: 0.3,
    ...glow(C.amber, 10, 0.25),
  },
  areasRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  areaPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  areaPillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // ── Game result cards ────────────────────────────────────────────
  gamesSection: {
    gap: space.md,
  },
  gameCard: {
    borderRadius: radii.lg,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    paddingVertical: space.md,
    paddingHorizontal: space.md + 2,
    paddingLeft: space.md - 1, // tighter on accent-bar side
    gap: space.xs + 2,
    // Asymmetric margin set per-card via style prop (summaryStagger).
    ...shadows.subtle,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameCardName: {
    fontFamily: fonts.headingMed,
    color: C.t1,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  gameCardAccuracy: {
    fontFamily: fonts.bodyBold,
    color: C.t2,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  accuracyBar: {
    height: 3,
    backgroundColor: C.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  accuracyBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  framingText: {
    fontFamily: fonts.kova,
    color: C.t2,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 2,
  },

  // ── Coins ────────────────────────────────────────────────────────
  coinCard: {
    borderRadius: radii.md,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: C.border,
    padding: space.md,
    gap: 4,
    marginTop: space.xl,
  },
  coinTotal: {
    fontFamily: fonts.bodyBold,
    color: C.peach,
    fontSize: 18,
    marginBottom: 2,
  },
  coinDetail: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
  },

  // ── Quote card ───────────────────────────────────────────────────
  quoteCard: {
    borderRadius: radii.md,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    borderLeftColor: C.purple,
    padding: space.md,
    marginTop: space.lg,
  },
  quoteText: {
    fontFamily: fonts.kova,
    color: C.t1,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontFamily: fonts.bodySemi,
    color: C.purple,
    fontSize: 11,
    marginTop: 8,
    letterSpacing: 0.3,
  },

  // ── Coach insight wrap ───────────────────────────────────────────
  coachWrap: {
    marginTop: space.lg,
  },

  // ── Actions ──────────────────────────────────────────────────────
  actions: {
    gap: space.sm,
    marginTop: space.xxl,
  },
  primaryRow: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
  },
  doneBtn: {
    flex: 1,
    height: pillButton.height,
    borderRadius: pillButton.borderRadius,
    borderWidth: 1.5,
    borderColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...accentGlow(C.green, 14, 0.25),
  },
  doneBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.green,
    fontSize: 17,
    letterSpacing: 0.3,
  },
  shareBtn: {
    width: pillButton.height,
    height: pillButton.height,
    borderRadius: pillButton.borderRadius,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.t2,
    fontSize: 18,
  },
  offScreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
  bonusBtn: {
    backgroundColor: C.amberTint,
    borderRadius: radii.full,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.3)',
  },
  bonusBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
