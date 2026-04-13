import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn, FadeOut, FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { success as hapticSuccess } from '../../utils/haptics';
import { playGameComplete, playPersonalBest } from '../../utils/sound';
import Celebration from '../../components/ui/Celebration';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { GameId, gameConfigs } from '../../constants/gameConfigs';
import GhostKitchen from '../../components/games/ghost-kitchen/GhostKitchen';
import Pulse from '../../components/games/pulse/Pulse';
import WordWeave from '../../components/games/word-weave/WordWeave';
import FacePlace from '../../components/games/face-place/FacePlace';
import SignalNoise from '../../components/games/signal-noise/SignalNoise';
import ChainReaction from '../../components/games/chain-reaction/ChainReaction';
import MindDrift from '../../components/games/mind-drift/MindDrift';
import Rewind from '../../components/games/rewind/Rewind';
import Mirrors from '../../components/games/mirrors/Mirrors';
import ZenFlow from '../../components/games/zen-flow/ZenFlow';
import SplitFocus from '../../components/games/split-focus/SplitFocus';
import Kova from '../../components/kova/Kova';
import { useProgressStore } from '../../stores/progressStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { applySessionWarmup, primeSessionDifficulty } from '../../utils/difficultyEngine';
import Button from '../../components/ui/Button';
import AccuracyRing from '../../components/ui/AccuracyRing';
import CountUpText from '../../components/ui/CountUpText';
import SessionProgressBar from '../../components/ui/SessionProgressBar';
import ShootingStar from '../../components/ui/ShootingStar';
import { pickRandom } from '../../utils/arrayUtils';
import { getFramingText } from '../../constants/framingText';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import { AREA_LABELS, AREA_ACCENT } from '../../constants/gameConfigs';
import { getRandomQuote } from '../../constants/quotes';

// Per-game background gradients
const gameBg: Partial<Record<GameId, [string, string]>> = {
  'ghost-kitchen': ['#1A1208', '#0C0804'],
  'pulse': ['#0A0618', '#04020C'],
  'word-weave': ['#08101A', '#04080E'],
  'chain-reaction': ['#120818', '#08040E'],
  'signal-noise': ['#0A1210', '#060A08'],
  'mind-drift': ['#101008', '#080604'],
  'face-place': ['#100C14', '#08060C'],
  'rewind': ['#0E1018', '#06080E'],
  'mirrors': ['#0C0810', '#060408'],
  'zen-flow': ['#060818', '#04060E'],
  'split-focus': ['#0A0C14', '#06080E'],
};

interface GameWrapperProps {
  gameId: GameId;
  gameIndex: number;
  totalGames: number;
  onGameComplete: (score: number, accuracy: number) => void;
  /** Running average accuracy from previous games in this session (0-1). */
  sessionAccuracy?: number;
  /** Running total score from previous games. */
  sessionScore?: number;
}

type WrapperState = 'intro' | 'playing' | 'result';

// Context-aware transition messages. Each slot has multiple variants
// so the session feels different every time.
const FIRST_GAME_MESSAGES = [
  "Let's warm up.",
  "First one. Easy does it.",
  "Here we go.",
  "Starting with something good.",
];
const MID_GAME_MESSAGES = [
  "Nice. Keep that momentum.",
  "Next up: something different.",
  "Switching gears. Stay sharp.",
  "You're in the zone. Keep going.",
  "Mixing it up now.",
];
const LAST_GAME_MESSAGES = [
  "One more. Finish strong.",
  "Final push. Make it count.",
  "Last one. You've got this.",
  "Almost done. End on a high note.",
];
const DOING_GREAT = [
  "You're crushing it.",
  "Seriously impressive.",
  "Kova's watching. Kova's proud.",
];
const KEEP_GOING = [
  "Every session counts.",
  "It's about showing up.",
  "You're here. That's what matters.",
];

function getTransitionMessage(gameIndex: number, totalGames: number, avgAccuracy: number): string {
  if (gameIndex === 0) return pickRandom(FIRST_GAME_MESSAGES);
  if (gameIndex >= totalGames - 1) return pickRandom(LAST_GAME_MESSAGES);
  const base = pickRandom(MID_GAME_MESSAGES);
  // Add an encouraging kicker based on how the session is going
  if (avgAccuracy >= 0.85) return `${base} ${pickRandom(DOING_GREAT)}`;
  if (avgAccuracy < 0.5 && gameIndex > 0) return `${base} ${pickRandom(KEEP_GOING)}`;
  return base;
}

function getIntroEmotion(gameIndex: number, avgAccuracy: number): 'curious' | 'excited' | 'encouraging' | 'happy' {
  if (gameIndex === 0) return 'curious';
  if (avgAccuracy >= 0.85) return 'excited';
  if (avgAccuracy < 0.5) return 'encouraging';
  return 'happy';
}

export default function GameWrapper({ gameId, gameIndex, totalGames, onGameComplete, sessionAccuracy = 0, sessionScore = 0 }: GameWrapperProps) {
  const [state, setState] = useState<WrapperState>('intro');
  const [finalScore, setFinalScore] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const config = gameConfigs[gameId];
  const levels = useProgressStore(s => s.gameLevels);
  const baseLevel = levels[gameId] ?? 1;
  // Smart difficulty warmup: first game in session is 15% easier (easy win),
  // last game is 10% harder (stretch goal). Middle games stay at base level.
  const level = applySessionWarmup(baseLevel, gameIndex, totalGames);
  const relaxedMode = useSettingsStore(s => s.relaxedMode);
  const personalBests = useProgressStore(s => s.personalBests);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);

  useEffect(() => {
    if (!config) onGameComplete(0, 0);
  }, [config, onGameComplete]);

  // Seed the session difficulty cache ONCE per game mount with the warmup
  // level. After this, the in-game difficulty engine evolves the cache
  // freely — we must NOT re-prime when the persisted level changes mid-game,
  // because doing so would clobber the engine's accumulated rollingAccuracy /
  // streak counters every time it adjusted level. Read fresh state inside
  // the effect (not from the closure) and depend only on `gameId`.
  useEffect(() => {
    if (!config) return;
    const startBase = useProgressStore.getState().gameLevels[gameId] ?? 1;
    const startLevel = applySessionWarmup(startBase, gameIndex, totalGames);
    primeSessionDifficulty(gameId, startLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  if (!config) return null;

  const bg = gameBg[gameId] ?? [C.bg2, C.bg1];

  const handleGameComplete = (score: number, accuracy: number) => {
    setFinalScore(score);
    setFinalAccuracy(accuracy);
    setState('result');
    hapticSuccess();
    playGameComplete();

    const prevBest = personalBests[gameId] ?? 0;
    if (score > 0 && score >= prevBest) {
      setTimeout(() => {
        playPersonalBest();
        setCelebrationTrigger(t => t + 1);
      }, 500);
    }
  };

  const handleContinue = () => {
    onGameComplete(finalScore, finalAccuracy);
  };

  const accuracyPercent = Math.round(finalAccuracy * 100);
  const pats = accuracyPercent >= 90 ? 'Excellent!' : accuracyPercent >= 70 ? 'Good work!' : 'Nice try!';
  const isPB = finalScore > 0 && (personalBests[gameId] ?? 0) <= finalScore;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={bg} style={StyleSheet.absoluteFillObject} />

      {state === 'intro' && (() => {
        const brainArea = config.brainArea;
        const areaColor = AREA_ACCENT[brainArea] ?? C.green;
        const areaLabel = AREA_LABELS[brainArea] ?? brainArea;
        const emotion = getIntroEmotion(gameIndex, sessionAccuracy);
        const msg = getTransitionMessage(gameIndex, totalGames, sessionAccuracy);

        return (
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.introContainer}>
            <View style={styles.introBadge}>
              <Text style={styles.gameNumber}>{gameIndex + 1} of {totalGames}</Text>
            </View>
            <View style={[styles.gameIconContainer, { backgroundColor: `${config.color}20` }]}>
              <Text style={styles.gameIcon}>{config.icon}</Text>
            </View>
            <Text style={styles.gameName}>{config.name}</Text>
            {/* Brain area badge */}
            <View style={[styles.areaPill, { backgroundColor: `${areaColor}18` }]}>
              <Text style={[styles.areaPillText, { color: areaColor }]}>
                {areaLabel.toUpperCase()}
              </Text>
            </View>
            {relaxedMode && (
              <View style={styles.relaxedBadge}>
                <Text style={styles.relaxedBadgeText}>Relaxed Mode</Text>
              </View>
            )}
            <Kova
              size={80}
              emotion={emotion}
              showSpeechBubble={false}
              dialogueContext="newGame"
            />
            <Text style={styles.transMsg}>{msg}</Text>
            {/* Session momentum — show running score after first game */}
            {gameIndex > 0 && sessionScore > 0 && (
              <Text style={styles.momentumText}>
                Session score: {sessionScore}
              </Text>
            )}
            {/* A thought between games */}
            {gameIndex > 0 && (() => {
              const q = getRandomQuote();
              return (
                <View style={styles.miniQuote}>
                  <Text style={styles.miniQuoteText}>"{q.text}"</Text>
                  <Text style={styles.miniQuoteAuthor}>— {q.author}</Text>
                </View>
              );
            })()}
            <Button
              label="Start"
              onPress={() => setState('playing')}
              size="lg"
              style={styles.startBtn}
            />
          </Animated.View>
        );
      })()}

      {state === 'playing' && (
        <View style={styles.gameContainer}>
          {/* Floating session progress pill — translucent so the game owns the screen */}
          <View style={styles.floatingProgress} pointerEvents="none">
            <SessionProgressBar
              currentIndex={gameIndex}
              totalGames={totalGames}
            />
          </View>
          {/* Daily surprise */}
          <ShootingStar enabled={gameIndex > 0 && gameIndex < totalGames - 1} />

          {/* Game — key forces full unmount/remount between games */}
          <View style={styles.gameArea}>
            <ErrorBoundary
              fallback={
                <View style={styles.gameErrorFallback}>
                  <Text style={styles.gameErrorText}>This game hit a snag.</Text>
                  <Pressable style={styles.gameErrorBtn} onPress={() => onGameComplete(0, 0)}>
                    <Text style={styles.gameErrorBtnText}>Skip Game</Text>
                  </Pressable>
                </View>
              }
            >
              {renderGame(gameId, handleGameComplete, level)}
            </ErrorBoundary>
          </View>
        </View>
      )}

      {state === 'result' && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.resultContainer}>
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            <Kova
              size={90}
              emotion={accuracyPercent >= 80 ? 'proud' : accuracyPercent >= 60 ? 'happy' : 'encouraging'}
              showSpeechBubble={false}
            />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(150).duration(400)} style={styles.resultTitle}>
            {pats}
          </Animated.Text>

          {isPB && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.pbBannerWrap}>
              <Text style={styles.pbBanner}>NEW PERSONAL BEST</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.resultStats}>
            <View style={styles.resultStatsInner}>
              <View style={styles.resultStat}>
                <CountUpText
                  value={finalScore}
                  duration={1200}
                  delay={400}
                  style={styles.statValue}
                />
                <Text style={styles.statLabel}>Score</Text>
              </View>
              <View style={styles.resultStatDivider} />
              <View style={styles.resultStat}>
                <AccuracyRing
                  accuracy={finalAccuracy}
                  size={90}
                  strokeWidth={6}
                  delay={500}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(600).duration(400)} style={styles.realWorldText}>
            {getFramingText({ gameId, score: finalScore, accuracy: finalAccuracy })}
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(800).duration(400)} style={{ width: '100%' }}>
            <Button
              label={gameIndex + 1 < totalGames ? 'Next Game' : 'See Results'}
              onPress={handleContinue}
              size="lg"
              style={styles.continueBtn}
            />
          </Animated.View>
        </Animated.View>
      )}

      <Celebration type="particles_stars" trigger={celebrationTrigger} />
    </SafeAreaView>
  );
}

function renderGame(gameId: GameId, onComplete: (score: number, accuracy: number) => void, level: number) {
  const props = { onComplete, initialLevel: level };
  switch (gameId) {
    case 'ghost-kitchen': return <GhostKitchen {...props} />;
    case 'pulse': return <Pulse {...props} />;
    case 'word-weave': return <WordWeave {...props} />;
    case 'face-place': return <FacePlace {...props} />;
    case 'signal-noise': return <SignalNoise {...props} />;
    case 'chain-reaction': return <ChainReaction {...props} />;
    case 'mind-drift': return <MindDrift {...props} />;
    case 'rewind': return <Rewind {...props} />;
    case 'mirrors': return <Mirrors {...props} />;
    case 'zen-flow': return <ZenFlow {...props} />;
    case 'split-focus': return <SplitFocus {...props} />;
    default: return null;
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg1,
  },

  // Intro
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  introBadge: {
    backgroundColor: C.greenTint,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
  },
  gameNumber: {
    fontFamily: fonts.bodyBold,
    color: C.green,
    fontSize: 12,
    letterSpacing: 1,
  },
  gameIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  gameIcon: {
    fontSize: 36,
  },
  gameName: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  gameDesc: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 15,
    textAlign: 'center',
  },
  areaPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 2,
  },
  areaPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  transMsg: {
    fontFamily: fonts.kova,
    color: C.t2,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  momentumText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  miniQuote: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  miniQuoteText: {
    fontFamily: fonts.kova,
    color: C.t3,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  miniQuoteAuthor: {
    fontFamily: fonts.bodySemi,
    color: C.t4,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  startBtn: {
    width: '100%',
    marginTop: 8,
  },
  relaxedBadge: {
    backgroundColor: C.blueTint,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(107,168,224,0.2)',
  },
  relaxedBadgeText: {
    fontFamily: fonts.bodyBold,
    color: C.blue,
    fontSize: 12,
  },

  // Playing
  gameContainer: {
    flex: 1,
  },
  floatingProgress: {
    position: 'absolute',
    top: 14,
    left: 24,
    right: 24,
    zIndex: 50,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gameArea: { flex: 1 },

  // Result
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 16,
  },
  resultTitle: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  pbBannerWrap: {
    backgroundColor: C.amberTint,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pbBanner: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  resultStats: {
    borderRadius: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'rgba(19,24,41,0.85)',
    overflow: 'hidden',
  },
  resultStatsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  resultStat: {
    flex: 1,
    alignItems: 'center',
  },
  resultStatDivider: {
    width: 0.5,
    height: 40,
    backgroundColor: C.border,
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  realWorldText: {
    fontFamily: fonts.kova,
    color: C.t2,
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  continueBtn: {
    width: '100%',
    marginTop: 8,
  },

  // Game error fallback
  gameErrorFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  gameErrorText: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 16,
    textAlign: 'center',
  },
  gameErrorBtn: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
  },
  gameErrorBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.coral,
    fontSize: 14,
  },
});
