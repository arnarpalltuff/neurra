import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  FadeIn, FadeOut, FadeInDown, useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, withSpring, withDelay,
  Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { success as hapticSuccess, tapMedium, error as hapticError, selection } from '../../../utils/haptics';
import { playCorrect, playWrong, playRoundEnd } from '../../../utils/sound';
import { C } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { updateDifficulty, getDifficulty, chainReactionParams } from '../../../utils/difficultyEngine';
import { pickRandom } from '../../../utils/arrayUtils';
import GameIntro from '../shared/GameIntro';

const { width: W, height: H } = Dimensions.get('window');
const PLAY_W = W - 40;
const PLAY_H = H * 0.5;

interface ChainReactionProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type OrbColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'cyan';

const ORB_COLORS: Record<OrbColor, string> = {
  red: '#E87C8A', blue: '#7CB8E8', green: '#7DD3A8',
  yellow: '#FBBF24', purple: '#A87CE8', cyan: '#4ECDC4',
};
const ORB_LIGHTS: Record<OrbColor, string> = {
  red: '#FFC2CB', blue: '#C2DEFF', green: '#B7F0CE',
  yellow: '#FFE08A', purple: '#D7BFFF', cyan: '#9CECE4',
};
const ALL_COLORS: OrbColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'];

interface Orb {
  id: number;
  color: OrbColor;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
}

function chainParams(level: number) {
  const base = chainReactionParams(level);
  return {
    ...base,
    colorPool: ALL_COLORS.slice(0, base.numColors),
  };
}

function generateOrbs(count: number, colorPool: OrbColor[], speed: number): Orb[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: pickRandom(colorPool),
    x: 30 + Math.random() * (PLAY_W - 60),
    y: 30 + Math.random() * (PLAY_H - 60),
    vx: (Math.random() - 0.5) * speed,
    vy: (Math.random() - 0.5) * speed,
    alive: true,
  }));
}

// ─────────────────────────────────────────────────────────────
// Float "+N" score
// ─────────────────────────────────────────────────────────────
function FloatScore({ x, y, points, color }: { x: number; y: number; points: number; color: string }) {
  const rise = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    rise.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    fade.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(300, withTiming(0, { duration: 450 })),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateY: interpolate(rise.value, [0, 1], [0, -50]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.6, 1.2, 1]) },
    ],
  }));
  return (
    <Animated.Text
      style={[styles.floatScore, { left: x - 25, top: y - 30, color }, style]}
      pointerEvents="none"
    >
      +{points}
    </Animated.Text>
  );
}

export default function ChainReaction({ onComplete, initialLevel = 1 }: ChainReactionProps) {
  const diff = getDifficulty('chain-reaction', 0);
  const level = Math.max(initialLevel, diff.level);
  const params = useMemo(() => chainParams(level), [level]);

  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [_introShown, _setIntroShown] = React.useState(false);
  const [sequence, setSequence] = useState<OrbColor[]>([]);
  const [seqIndex, setSeqIndex] = useState(0);
  const [chainCount, setChainCount] = useState(0);
  const [score, setScore] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [floatScores, setFloatScores] = useState<{ id: number; x: number; y: number; points: number; color: string }[]>([]);
  const comboRef = useRef(0);
  const noMissRef = useRef(0);
  const [feedback, setFeedback] = useState<'correct' | 'chain' | 'wrong' | null>(null);
  const [chainStartTime, setChainStartTime] = useState(Date.now());

  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const scoreRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const chainCountRef = useRef(0);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const floatIdRef = useRef(0);

  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);
  const chainFlash = useSharedValue(0);

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    pendingTimers.current.push(id);
    return id;
  }, []);

  useEffect(() => {

    return () => { pendingTimers.current.forEach(clearTimeout); };
  }, []);


  useEffect(() => {
    const newOrbs = generateOrbs(params.numOrbs, params.colorPool, params.driftSpeed);
    setOrbs(newOrbs);
    generateSequence();
  }, []);

  const generateSequence = useCallback(() => {
    const seq = Array.from({ length: params.seqLength }, () => pickRandom(params.colorPool));
    setSequence(seq);
    setSeqIndex(0);
    setChainStartTime(Date.now());
  }, [params]);

  const orbsRef = useRef<Orb[]>([]);
  orbsRef.current = orbs;
  const lastSyncRef = useRef(0);

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const current = orbsRef.current;
      let changed = false;
      const updated = current.map(orb => {
        if (!orb.alive) return orb;
        changed = true;
        let nx = orb.x + orb.vx;
        let ny = orb.y + orb.vy;
        let nvx = orb.vx;
        let nvy = orb.vy;
        if (nx < 20 || nx > PLAY_W - 20) nvx = -nvx;
        if (ny < 20 || ny > PLAY_H - 20) nvy = -nvy;
        return { ...orb, x: nx, y: ny, vx: nvx, vy: nvy };
      });
      orbsRef.current = updated;

      const now = performance.now();
      if (changed && now - lastSyncRef.current >= 50) {
        lastSyncRef.current = now;
        setOrbs(updated);
      }

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const handleOrbTap = useCallback((orb: Orb) => {
    const expectedColor = sequence[seqIndex];
    if (!expectedColor) return;

    if (orb.color === expectedColor) {
      const tapPos = { x: orb.x, y: orb.y + 140 };
      playCorrect(); burstCorrect(tapPos);
      const nextIdx = seqIndex + 1;
      const pts = 30;
      scoreRef.current += pts;
      setScore(s => s + pts);

      tapMedium();
      scorePulse.value = withSequence(
        withSpring(1.18, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );

      floatIdRef.current += 1;
      const fid = floatIdRef.current;
      setFloatScores(prev => [...prev, { id: fid, x: orb.x, y: orb.y + 140, points: pts, color: ORB_COLORS[orb.color] }]);
      safeTimeout(() => {
        setFloatScores(prev => prev.filter(f => f.id !== fid));
      }, 900);

      const killed = orbsRef.current.map(o => o.id === orb.id ? { ...o, alive: false } : o);
      orbsRef.current = killed;
      setOrbs(killed);
      safeTimeout(() => {
        const respawned = orbsRef.current.map(o => o.id === orb.id ? {
          ...o,
          alive: true,
          color: pickRandom(params.colorPool),
          x: 30 + Math.random() * (PLAY_W - 60),
          y: 30 + Math.random() * (PLAY_H - 60),
        } : o);
        orbsRef.current = respawned;
        setOrbs(respawned);
      }, 800);

      if (nextIdx >= sequence.length) {
        const elapsed = (Date.now() - chainStartTime) / 1000;
        comboRef.current += 1;
        setComboCount(comboRef.current);
        const speedBonus = elapsed < 3 ? 2 : 1;
        const chainPts = 150 * comboRef.current * speedBonus;
        scoreRef.current += chainPts;
        setScore(s => s + chainPts);

        noMissRef.current += 1;
        if (noMissRef.current % 3 === 0 && noMissRef.current > 0) {
          scoreRef.current += 300;
          setScore(s => s + 300);
        }

        chainCountRef.current += 1;
        setChainCount(chainCountRef.current);
        setFeedback('chain');
        chainFlash.value = withSequence(
          withTiming(1, { duration: 120 }),
          withTiming(0, { duration: 500 }),
        );
        updateDifficulty('chain-reaction', true);
        hapticSuccess();

        safeTimeout(() => {
          setFeedback(null);
          if (chainCountRef.current >= params.totalChains) {
            const acc = Math.min(1, comboRef.current / params.totalChains + 0.5);
            onComplete(scoreRef.current, acc);
          } else {
            generateSequence();
          }
        }, 800);
      } else {
        setSeqIndex(nextIdx);
        setFeedback('correct');
        selection();
        safeTimeout(() => setFeedback(null), 300);
      }
    } else {
      comboRef.current = Math.max(0, comboRef.current - 1);
      setComboCount(comboRef.current);
      noMissRef.current = 0;
      setFeedback('wrong');
      updateDifficulty('chain-reaction', false);
      playWrong(); burstWrong({ x: orb.x, y: orb.y + 140 });
      hapticError();
      rootShake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      safeTimeout(() => setFeedback(null), 400);
    }
  }, [sequence, seqIndex, chainStartTime, params, generateSequence, onComplete, safeTimeout]);

  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }],
  }));
  const chainFlashStyle = useAnimatedStyle(() => ({
    opacity: chainFlash.value * 0.4,
  }));

  const progress = chainCount / params.totalChains;
  const expectedColor = sequence[seqIndex];

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      <LinearGradient
        colors={['#0A0F1E', '#080C18', '#050810']}
        style={StyleSheet.absoluteFillObject}
      />
      <FloatingParticles count={6} color="rgba(126,200,232,0.3)" />

      {/* Chain complete flash */}
      <Animated.View
        style={[styles.flashOverlay, chainFlashStyle, { backgroundColor: C.amber }]}
        pointerEvents="none"
      />

      <FeedbackBurst {...burstFeedback} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>CHAIN</Text>
          <Text style={styles.pillText}>{chainCount}<Text style={styles.pillTextDim}>/{params.totalChains}</Text></Text>
        </View>
        <Animated.View style={scorePulseStyle}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreLabel}>POINTS</Text>
        </Animated.View>
        <View style={styles.comboSlot}>
          {comboCount > 1 && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.comboPill}>
              <Text style={styles.comboText}>{comboCount}×</Text>
              <Text style={styles.comboLabel}>COMBO</Text>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <LinearGradient
          colors={['#7CB8E8', '#4ECDC4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]}
        />
      </View>

      {/* Sequence display */}
      <View style={styles.seqWrap}>
        <Text style={styles.seqLabel}>TAP THIS SEQUENCE</Text>
        <View style={styles.seqRow}>
          {sequence.map((color, i) => {
            const done = i < seqIndex;
            const active = i === seqIndex;
            return (
              <View
                key={`${i}-${color}`}
                style={[
                  styles.seqDotWrap,
                  active && { borderColor: ORB_COLORS[color], shadowColor: ORB_COLORS[color] },
                ]}
              >
                <View
                  style={[
                    styles.seqDot,
                    {
                      backgroundColor: ORB_COLORS[color],
                      opacity: done ? 0.25 : 1,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Play field */}
      <View style={styles.playFieldWrap}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        <View style={styles.playField}>
          <LinearGradient
            colors={['#0E1424', '#080C18']}
            style={StyleSheet.absoluteFillObject}
          />

          {orbs.filter(o => o.alive).map(orb => {
            const c = ORB_COLORS[orb.color];
            const lc = ORB_LIGHTS[orb.color];
            const isExpected = orb.color === expectedColor;
            return (
              <Pressable
                key={orb.id}
                style={[styles.orbWrap, { left: orb.x - 26, top: orb.y - 26 }]}
                onPress={() => handleOrbTap(orb)}
                accessibilityLabel={`${orb.color} orb`}
              >
                {isExpected && (
                  <View style={[styles.orbHalo, { backgroundColor: c + '40' }]} />
                )}
                <View style={[styles.orb, { backgroundColor: c, shadowColor: c }]}>
                  <View style={[styles.orbHighlight, { backgroundColor: lc }]} />
                </View>
              </Pressable>
            );
          })}

          {floatScores.map(f => (
            <FloatScore key={f.id} x={f.x} y={f.y - 100} points={f.points} color={f.color} />
          ))}
        </View>
      </View>

      {/* Chain complete banner */}
      {feedback === 'chain' && (
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOut.duration(220)}
          style={styles.chainBanner}
        >
          <Text style={styles.chainBannerText}>⚡ CHAIN COMPLETE</Text>
        </Animated.View>
      )}
      {!_introShown && <GameIntro name="Chain Reaction" subtitle="Tap the color sequence" accentColor={C.amber} onDone={() => _setIntroShown(true)} />}
    </Animated.View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050810',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillLabel: {
    color: C.t3,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pillText: {
    color: C.t1,
    fontSize: 16,
    fontWeight: '900',
  },
  pillTextDim: {
    color: C.t3,
    fontWeight: '700',
  },
  scoreText: {
    color: C.peach,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(224,155,107,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  scoreLabel: {
    color: C.t3,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.4,
    marginTop: -1,
  },
  comboSlot: {
    width: 70,
    alignItems: 'flex-end',
  },
  comboPill: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(240,181,66,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.45)',
  },
  comboText: {
    color: C.amber,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  comboLabel: {
    color: C.amber,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Sequence
  seqWrap: {
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  seqLabel: {
    color: C.t3,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  seqRow: {
    flexDirection: 'row',
    gap: 10,
  },
  seqDotWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  seqDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },

  // Play field
  playFieldWrap: {
    width: PLAY_W,
    height: PLAY_H,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: 'rgba(126,200,232,0.55)',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 6,
  },
  playField: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(126,200,232,0.18)',
  },
  orbWrap: {
    position: 'absolute',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbHalo: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  orb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
    elevation: 8,
    overflow: 'hidden',
  },
  orbHighlight: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.55,
  },
  floatScore: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Chain banner
  chainBanner: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  chainBannerText: {
    color: C.amber,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(240,181,66,0.15)',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.amber,
    textShadowColor: 'rgba(240,181,66,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    overflow: 'hidden',
  },
});
