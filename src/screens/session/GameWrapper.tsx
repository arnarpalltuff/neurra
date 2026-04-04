import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Animated, {
  FadeIn, FadeOut, FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { success as hapticSuccess } from '../../utils/haptics';
import { playGameComplete, playPersonalBest } from '../../utils/sound';
import Celebration from '../../components/ui/Celebration';
import { C, colors } from '../../constants/colors';
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
import Button from '../../components/ui/Button';
import AccuracyRing from '../../components/ui/AccuracyRing';
import CountUpText from '../../components/ui/CountUpText';
import SessionProgressBar from '../../components/ui/SessionProgressBar';
import ShootingStar from '../../components/ui/ShootingStar';
import { pickRandom } from '../../utils/arrayUtils';

// Per-game background gradients
const gameBg: Record<string, [string, string]> = {
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
}

type WrapperState = 'intro' | 'playing' | 'result';

const TRANSITION_MESSAGES = [
  "Ready? Let's go.",
  "Nice one. Next up: something different.",
  "One more. Finish strong.",
];

export default function GameWrapper({ gameId, gameIndex, totalGames, onGameComplete }: GameWrapperProps) {
  const [state, setState] = useState<WrapperState>('intro');
  const [finalScore, setFinalScore] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const config = gameConfigs[gameId];
  const levels = useProgressStore(s => s.gameLevels);
  const level = levels[gameId] ?? 1;
  const relaxedMode = useSettingsStore(s => s.relaxedMode);
  const personalBests = useProgressStore(s => s.personalBests);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);

  if (!config) {
    onGameComplete(0, 0);
    return null;
  }

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

      {state === 'intro' && (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.introContainer}>
          <View style={styles.introBadge}>
            <Text style={styles.gameNumber}>{gameIndex + 1} of {totalGames}</Text>
          </View>
          <View style={[styles.gameIconContainer, { backgroundColor: `${config.color}15` }]}>
            <Text style={styles.gameIcon}>{config.icon}</Text>
          </View>
          <Text style={styles.gameName}>{config.name}</Text>
          <Text style={styles.gameDesc}>{config.description}</Text>
          {relaxedMode && (
            <View style={styles.relaxedBadge}>
              <Text style={styles.relaxedBadgeText}>Relaxed Mode</Text>
            </View>
          )}
          <Kova
            size={80}
            emotion="curious"
            showSpeechBubble={false}
            dialogueContext="newGame"
          />
          <Text style={styles.transMsg}>{TRANSITION_MESSAGES[gameIndex] ?? "Let's go!"}</Text>
          <Button
            label="Start"
            onPress={() => setState('playing')}
            size="lg"
            style={styles.startBtn}
          />
        </Animated.View>
      )}

      {state === 'playing' && (
        <View style={styles.gameContainer}>
          {/* Session progress bar */}
          <View style={styles.progressHeader}>
            <SessionProgressBar
              currentIndex={gameIndex}
              totalGames={totalGames}
            />
          </View>
          {/* Daily surprise */}
          <ShootingStar enabled={gameIndex > 0 && gameIndex < totalGames - 1} />

          {/* Game — key forces full unmount/remount between games */}
          <View style={styles.gameArea}>
            {renderGame(gameId, handleGameComplete, level)}
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
            {pickRandom(config.realWorldFraming ?? []) ?? 'Great work!'}
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
    backgroundColor: C.bg2,
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
    backgroundColor: 'rgba(110,207,154,0.08)',
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
    borderWidth: 0.5,
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
  transMsg: {
    fontFamily: fonts.kova,
    color: C.t2,
    fontSize: 18,
    textAlign: 'center',
  },
  startBtn: {
    width: '100%',
    marginTop: 8,
  },
  relaxedBadge: {
    backgroundColor: 'rgba(107,168,224,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 0.5,
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
  progressHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
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
    backgroundColor: 'rgba(240,181,66,0.08)',
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
    borderWidth: 0.5,
    borderColor: C.border,
    backgroundColor: C.bg3,
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
});
