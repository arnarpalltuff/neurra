import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { success as hapticSuccess } from '../../../utils/haptics';
import { colors } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import { updateDifficulty, getDifficulty, chainReactionParams } from '../../../utils/difficultyEngine';
import { shuffle, pickRandom } from '../../../utils/arrayUtils';
import ProgressBar from '../../ui/ProgressBar';

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

export default function ChainReaction({ onComplete, initialLevel = 1 }: ChainReactionProps) {
  const diff = getDifficulty('chain-reaction', 0);
  const level = Math.max(initialLevel, diff.level);
  const params = useMemo(() => chainParams(level), [level]);

  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [sequence, setSequence] = useState<OrbColor[]>([]);
  const [seqIndex, setSeqIndex] = useState(0);
  const [chainCount, setChainCount] = useState(0);
  const [score, setScore] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [noMissRun, setNoMissRun] = useState(0);
  const comboRef = useRef(0);
  const noMissRef = useRef(0);
  const [feedback, setFeedback] = useState<'correct' | 'chain' | 'wrong' | null>(null);
  const [chainStartTime, setChainStartTime] = useState(Date.now());

  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const scoreRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const chainCountRef = useRef(0);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      setOrbs(prev => prev.map(orb => {
        if (!orb.alive) return orb;
        let nx = orb.x + orb.vx;
        let ny = orb.y + orb.vy;
        let nvx = orb.vx;
        let nvy = orb.vy;
        if (nx < 20 || nx > PLAY_W - 20) nvx = -nvx;
        if (ny < 20 || ny > PLAY_H - 20) nvy = -nvy;
        return { ...orb, x: nx, y: ny, vx: nvx, vy: nvy };
      }));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const handleOrbTap = useCallback((orb: Orb) => {
    const expectedColor = sequence[seqIndex];
    if (!expectedColor) return;

    if (orb.color === expectedColor) {
      burstCorrect({ x: orb.x + 20, y: orb.y + 100 });
      const nextIdx = seqIndex + 1;
      const pts = 30;
      scoreRef.current += pts;
      setScore(s => s + pts);

      setOrbs(prev => prev.map(o => o.id === orb.id ? { ...o, alive: false } : o));
      safeTimeout(() => {
        setOrbs(prev => prev.map(o => o.id === orb.id ? {
          ...o,
          alive: true,
          color: pickRandom(params.colorPool),
          x: 30 + Math.random() * (PLAY_W - 60),
          y: 30 + Math.random() * (PLAY_H - 60),
        } : o));
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
        setNoMissRun(noMissRef.current);
        if (noMissRef.current % 3 === 0 && noMissRef.current > 0) {
          scoreRef.current += 300;
          setScore(s => s + 300);
        }

        chainCountRef.current += 1;
        setChainCount(chainCountRef.current);
        setFeedback('chain');
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
        safeTimeout(() => setFeedback(null), 300);
      }
    } else {
      comboRef.current = Math.max(0, comboRef.current - 1);
      setComboCount(comboRef.current);
      noMissRef.current = 0;
      setNoMissRun(0);
      setFeedback('wrong');
      updateDifficulty('chain-reaction', false);
      burstWrong({ x: orb.x + 20, y: orb.y + 100 });
      safeTimeout(() => setFeedback(null), 400);
    }
  }, [sequence, seqIndex, chainStartTime, params, generateSequence, onComplete, safeTimeout]);

  const progress = chainCount / params.totalChains;

  return (
    <View style={styles.container}>
      <FeedbackBurst {...burstFeedback} />
      <View style={styles.header}>
        <Text style={styles.chainText}>Chain {chainCount}/{params.totalChains}</Text>
        <Text style={styles.scoreText}>{score}</Text>
        {comboCount > 1 && <Text style={styles.comboText}>{comboCount}×</Text>}
      </View>
      <ProgressBar value={chainCount} max={params.totalChains} style={{ marginBottom: 12 }} />

      <View style={styles.seqRow}>
        {sequence.map((color, i) => (
          <View key={i} style={[styles.seqDot, {
            backgroundColor: ORB_COLORS[color],
            opacity: i < seqIndex ? 0.3 : 1,
            borderWidth: i === seqIndex ? 2 : 0,
            borderColor: '#FFF',
          }]} />
        ))}
      </View>

      <View style={styles.playField}>
        {orbs.filter(o => o.alive).map(orb => (
          <TouchableOpacity
            key={orb.id}
            style={[styles.orb, {
              left: orb.x - 22,
              top: orb.y - 22,
              backgroundColor: ORB_COLORS[orb.color],
              shadowColor: ORB_COLORS[orb.color],
            }]}
            onPress={() => handleOrbTap(orb)}
            activeOpacity={0.7}
            accessibilityLabel={`${orb.color} orb`}
          />
        ))}
      </View>

      {feedback === 'chain' && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.chainFeedback}>
          <Text style={styles.chainFeedbackText}>⚡ CHAIN COMPLETE!</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chainText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  scoreText: { color: colors.warm, fontSize: 18, fontWeight: '800' },
  comboText: { color: colors.streak, fontSize: 16, fontWeight: '800' },
  seqRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12 },
  seqDot: { width: 28, height: 28, borderRadius: 14 },
  playField: { width: PLAY_W, height: PLAY_H, backgroundColor: colors.bgSecondary, borderRadius: 24, position: 'relative', alignSelf: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  orb: { position: 'absolute', width: 44, height: 44, borderRadius: 22, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 },
  chainFeedback: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' },
  chainFeedbackText: { color: colors.streak, fontSize: 22, fontWeight: '900', letterSpacing: 1 },
});
