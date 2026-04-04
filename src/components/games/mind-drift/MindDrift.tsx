import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { success as hapticSuccess } from '../../../utils/haptics';
import { colors } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import { updateDifficulty, getDifficulty, mindDriftParams } from '../../../utils/difficultyEngine';
import { pickRandom } from '../../../utils/arrayUtils';
import ProgressBar from '../../ui/ProgressBar';

const { width: W } = Dimensions.get('window');
const GRID_SIZE = W - 60;

interface MindDriftProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type Phase = 'showing' | 'tracing' | 'result';

interface HexCell {
  row: number;
  col: number;
  cx: number;
  cy: number;
}

function buildHexGrid(rows: number, cols: number, size: number): HexCell[] {
  const hexR = size / (cols * 2 + 1);
  const hexH = hexR * Math.sqrt(3);
  const cells: HexCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offset = r % 2 === 1 ? hexR : 0;
      cells.push({
        row: r,
        col: c,
        cx: hexR + c * hexR * 2 + offset,
        cy: hexH * 0.6 + r * hexH * 0.9,
      });
    }
  }
  return cells;
}

function getNeighbors(cell: HexCell, grid: HexCell[]): HexCell[] {
  return grid.filter(other => {
    if (other.row === cell.row && other.col === cell.col) return false;
    const dx = Math.abs(other.cx - cell.cx);
    const dy = Math.abs(other.cy - cell.cy);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hexR = GRID_SIZE / 9;
    return dist < hexR * 2.2;
  });
}

function generatePath(grid: HexCell[], length: number): HexCell[] {
  const start = pickRandom(grid);
  const path: HexCell[] = [start];
  const visited = new Set<string>();
  visited.add(`${start.row},${start.col}`);

  for (let i = 1; i < length; i++) {
    const current = path[path.length - 1];
    const neighbors = getNeighbors(current, grid).filter(
      n => !visited.has(`${n.row},${n.col}`)
    );
    if (neighbors.length === 0) break;
    const next = pickRandom(neighbors);
    path.push(next);
    visited.add(`${next.row},${next.col}`);
  }
  return path;
}

export default function MindDrift({ onComplete, initialLevel = 1 }: MindDriftProps) {
  const diff = getDifficulty('mind-drift', 0);
  const level = Math.max(initialLevel, diff.level);
  const params = useMemo(() => mindDriftParams(level), [level]);

  const grid = useMemo(
    () => buildHexGrid(params.gridRows, params.gridCols, GRID_SIZE),
    [params.gridRows, params.gridCols],
  );

  const [phase, setPhase] = useState<Phase>('showing');
  const [path, setPath] = useState<HexCell[]>([]);
  const [litIndex, setLitIndex] = useState(-1);
  const [tapped, setTapped] = useState<HexCell[]>([]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const roundRef = useRef(1);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const roundStartRef = useRef(Date.now());
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    pendingTimers.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => { pendingTimers.current.forEach(clearTimeout); };
  }, []);

  const startRound = useCallback(() => {
    const newPath = generatePath(grid, params.pathLength);
    setPath(newPath);
    setTapped([]);
    setPhase('showing');
    setLitIndex(-1);
    roundStartRef.current = Date.now();

    let i = 0;
    const show = () => {
      if (i < newPath.length) {
        setLitIndex(i);
        i++;
        safeTimeout(show, params.showDelay);
      } else {
        safeTimeout(() => {
          setLitIndex(-1);
          setPhase('tracing');
        }, 400);
      }
    };
    safeTimeout(show, 500);
  }, [grid, params, safeTimeout]);

  useEffect(() => {
    startRound();
  }, []);

  const advanceRound = useCallback(() => {
    roundRef.current += 1;
    setRound(roundRef.current);
    if (roundRef.current > params.totalRounds) {
      const acc = correctRef.current / params.totalRounds;
      onComplete(scoreRef.current, acc);
    } else {
      startRound();
    }
  }, [params, startRound, onComplete]);

  const handleHexTap = useCallback((cell: HexCell) => {
    if (phase !== 'tracing') return;
    const expectedIdx = tapped.length;
    const expected = path[expectedIdx];
    if (!expected) return;

    const isCorrect = cell.row === expected.row && cell.col === expected.col;

    if (isCorrect) {
      burstCorrect({ x: cell.cx + 30, y: cell.cy + 100 });
      const newTapped = [...tapped, cell];
      setTapped(newTapped);
      updateDifficulty('mind-drift', true);

      if (newTapped.length === path.length) {
        correctRef.current += 1;
        const elapsed = (Date.now() - roundStartRef.current) / 1000;
        const speedBonus = elapsed < 5 ? 50 : 0;
        const pts = 100 * path.length + speedBonus;
        scoreRef.current += pts;
        setScore(scoreRef.current);
        setFeedback('correct');
        hapticSuccess();
        safeTimeout(() => { setFeedback(null); advanceRound(); }, 800);
      }
    } else {
      burstWrong({ x: cell.cx + 30, y: cell.cy + 100 });
      updateDifficulty('mind-drift', false);
      setFeedback('wrong');
      safeTimeout(() => { setFeedback(null); advanceRound(); }, 1200);
    }
  }, [phase, tapped, path, safeTimeout, advanceRound]);

  const pathSet = useMemo(() => {
    const s = new Set<string>();
    path.forEach(c => s.add(`${c.row},${c.col}`));
    return s;
  }, [path]);

  // Cache path index per cell to avoid repeated findIndex in render
  const pathIndexMap = useMemo(() => {
    const m = new Map<string, number>();
    path.forEach((c, i) => m.set(`${c.row},${c.col}`, i));
    return m;
  }, [path]);

  const tappedSet = useMemo(() => {
    const s = new Set<string>();
    tapped.forEach(c => s.add(`${c.row},${c.col}`));
    return s;
  }, [tapped]);

  const hexR = GRID_SIZE / (params.gridCols * 2 + 1);

  return (
    <View style={styles.container}>
      <FeedbackBurst {...burstFeedback} />
      <View style={styles.header}>
        <Text style={styles.roundText}>Path {round}/{params.totalRounds}</Text>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
      <ProgressBar value={round - 1} max={params.totalRounds} style={{ marginBottom: 12 }} />

      {phase === 'showing' && (
        <Text style={styles.phaseText}>Watch the path...</Text>
      )}
      {phase === 'tracing' && (
        <Text style={styles.phaseText}>Trace it back — {tapped.length}/{path.length}</Text>
      )}

      <View style={[styles.gridContainer, { width: GRID_SIZE, height: GRID_SIZE * 0.85 }]}>
        {grid.map((cell) => {
          const key = `${cell.row},${cell.col}`;
          const isLit = litIndex >= 0 && path[litIndex] &&
            cell.row === path[litIndex].row && cell.col === path[litIndex].col;
          const isTapped = tappedSet.has(key);
          const pathIdx = pathIndexMap.get(key) ?? -1;
          const isOnPath = phase === 'showing' && litIndex >= 0 && pathIdx >= 0 && pathIdx <= litIndex;
          const showWrong = feedback === 'wrong' && pathSet.has(key) && !tappedSet.has(key);

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.hex,
                {
                  left: cell.cx - hexR * 0.8,
                  top: cell.cy - hexR * 0.8,
                  width: hexR * 1.6,
                  height: hexR * 1.6,
                  borderRadius: hexR * 0.8,
                },
                isLit && styles.hexLit,
                isOnPath && styles.hexPath,
                isTapped && styles.hexTapped,
                showWrong && styles.hexMissed,
              ]}
              onPress={() => handleHexTap(cell)}
              activeOpacity={0.7}
              disabled={phase !== 'tracing' || isTapped}
              accessibilityLabel={`Hex ${cell.row}-${cell.col}`}
            />
          );
        })}
      </View>

      {feedback === 'correct' && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Text style={styles.correctText}>Perfect trace!</Text>
        </Animated.View>
      )}
      {feedback === 'wrong' && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Text style={styles.wrongText}>Wrong step — path shown</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roundText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  scoreText: { color: colors.warm, fontSize: 18, fontWeight: '800' },
  phaseText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  gridContainer: { alignSelf: 'center', position: 'relative' },
  hex: { position: 'absolute', backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.border },
  hexLit: { backgroundColor: colors.growth, borderColor: colors.growth, shadowColor: colors.growth, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 12, elevation: 6 },
  hexPath: { backgroundColor: colors.growthDim, borderColor: colors.growth },
  hexTapped: { backgroundColor: colors.growth, borderColor: colors.growth, opacity: 0.9 },
  hexMissed: { backgroundColor: colors.coral, borderColor: colors.coral, opacity: 0.6 },
  correctText: { color: colors.growth, fontSize: 18, fontWeight: '800', textAlign: 'center', marginTop: 16 },
  wrongText: { color: colors.coral, fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 16 },
});
