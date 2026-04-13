import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  FadeIn, FadeOut, useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence, withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Circle as SvgCircle } from 'react-native-svg';
import { success as hapticSuccess, tapMedium, error as hapticError } from '../../../utils/haptics';
import { playCorrect, playWrong, playRoundEnd } from '../../../utils/sound';
import { C } from '../../../constants/colors';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import { updateDifficulty, getDifficulty, mindDriftParams } from '../../../utils/difficultyEngine';
import { pickRandom } from '../../../utils/arrayUtils';
import GameIntro from '../shared/GameIntro';

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

// Float score
function FloatScore({ points }: { points: number }) {
  const rise = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    rise.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    fade.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(350, withTiming(0, { duration: 500 })),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateY: interpolate(rise.value, [0, 1], [0, -80]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.6, 1.2, 1]) },
    ],
  }));
  return (
    <Animated.Text style={[styles.floatScore, style]} pointerEvents="none">
      +{points}
    </Animated.Text>
  );
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
  const [_introShown, _setIntroShown] = React.useState(false);
  const [path, setPath] = useState<HexCell[]>([]);
  const [litIndex, setLitIndex] = useState(-1);
  const [tapped, setTapped] = useState<HexCell[]>([]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [floatScores, setFloatScores] = useState<{ id: number; points: number }[]>([]);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const roundRef = useRef(1);
  const floatIdRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const roundStartRef = useRef(Date.now());
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);

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
      playCorrect(); burstCorrect({ x: cell.cx + 30, y: cell.cy + 100 });
      tapMedium();
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
        scorePulse.value = withSequence(
          withSpring(1.22, { damping: 6 }),
          withSpring(1, { damping: 10 }),
        );
        floatIdRef.current += 1;
        const fid = floatIdRef.current;
        setFloatScores(prev => [...prev, { id: fid, points: pts }]);
        safeTimeout(() => {
          setFloatScores(prev => prev.filter(f => f.id !== fid));
        }, 1200);
        hapticSuccess();
        safeTimeout(() => { setFeedback(null); advanceRound(); }, 800);
      }
    } else {
      playWrong(); burstWrong({ x: cell.cx + 30, y: cell.cy + 100 });
      hapticError();
      rootShake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
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
  const gridH = GRID_SIZE * 0.85;

  // Path lines for SVG layer
  const showingLines = useMemo(() => {
    if (phase !== 'showing' || litIndex < 1) return [];
    return path.slice(0, litIndex + 1).map((c, i, arr) => {
      if (i === 0) return null;
      return { x1: arr[i - 1].cx, y1: arr[i - 1].cy, x2: c.cx, y2: c.cy };
    }).filter(Boolean);
  }, [phase, litIndex, path]);

  const tappedLines = useMemo(() => {
    return tapped.map((c, i, arr) => {
      if (i === 0) return null;
      return { x1: arr[i - 1].cx, y1: arr[i - 1].cy, x2: c.cx, y2: c.cy };
    }).filter(Boolean);
  }, [tapped]);

  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }],
  }));

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      <LinearGradient
        colors={['#0A0E1F', '#070A18', '#040710']}
        style={StyleSheet.absoluteFillObject}
      />
      <FloatingParticles count={10} color="rgba(155,114,224,0.4)" />

      <FeedbackBurst {...burstFeedback} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>PATH</Text>
          <Text style={styles.pillText}>{round}<Text style={styles.pillTextDim}>/{params.totalRounds}</Text></Text>
        </View>
        <Animated.View style={scorePulseStyle}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreLabel}>POINTS</Text>
        </Animated.View>
        <View style={{ width: 70 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <LinearGradient
          colors={['#A87CE8', '#7CB8E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.min(100, ((round - 1) / params.totalRounds) * 100)}%` }]}
        />
      </View>

      {/* Phase label */}
      <View style={styles.phaseSlot}>
        {phase === 'showing' && (
          <Text style={styles.phaseText}>WATCH THE PATH…</Text>
        )}
        {phase === 'tracing' && (
          <Text style={styles.phaseText}>
            TRACE IT BACK · {tapped.length}/{path.length}
          </Text>
        )}
      </View>

      {/* Grid */}
      <View style={[styles.gridContainer, { width: GRID_SIZE, height: gridH }]}>
        {/* Star-field background under the grid */}
        <View style={styles.gridBg} pointerEvents="none">
          <LinearGradient
            colors={['rgba(155,114,224,0.06)', 'rgba(0,0,0,0)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* SVG connecting lines */}
        <Svg width={GRID_SIZE} height={gridH} style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {showingLines.map((l, i) => l && (
            <Line
              key={`s-${i}`}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#A87CE8" strokeWidth={2} strokeLinecap="round" opacity={0.7}
            />
          ))}
          {tappedLines.map((l, i) => l && (
            <Line
              key={`t-${i}`}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#7DD3A8" strokeWidth={2.5} strokeLinecap="round" opacity={0.9}
            />
          ))}
        </Svg>

        {grid.map((cell) => {
          const key = `${cell.row},${cell.col}`;
          const isLit = litIndex >= 0 && path[litIndex] &&
            cell.row === path[litIndex].row && cell.col === path[litIndex].col;
          const isTapped = tappedSet.has(key);
          const pathIdx = pathIndexMap.get(key) ?? -1;
          const isOnPath = phase === 'showing' && litIndex >= 0 && pathIdx >= 0 && pathIdx <= litIndex;
          const showWrong = feedback === 'wrong' && pathSet.has(key) && !tappedSet.has(key);

          return (
            <Pressable
              key={key}
              style={[
                styles.hex,
                {
                  left: cell.cx - hexR * 0.85,
                  top: cell.cy - hexR * 0.85,
                  width: hexR * 1.7,
                  height: hexR * 1.7,
                  borderRadius: hexR * 0.85,
                },
                isLit && styles.hexLit,
                isOnPath && !isLit && styles.hexPath,
                isTapped && styles.hexTapped,
                showWrong && styles.hexMissed,
              ]}
              onPress={() => handleHexTap(cell)}
              disabled={phase !== 'tracing' || isTapped}
              accessibilityLabel={`Hex ${cell.row}-${cell.col}`}
            >
              <View
                style={[
                  styles.hexCore,
                  isLit && styles.hexCoreLit,
                  isTapped && styles.hexCoreTapped,
                  showWrong && styles.hexCoreMissed,
                  isOnPath && !isLit && styles.hexCorePath,
                ]}
              />
            </Pressable>
          );
        })}

        {floatScores.map(f => <FloatScore key={f.id} points={f.points} />)}
      </View>

      {/* Bottom feedback */}
      <View style={styles.bottomSlot}>
        {feedback === 'correct' && (
          <Animated.Text entering={FadeIn.duration(160)} exiting={FadeOut.duration(220)} style={styles.correctText}>
            ✦ Perfect trace
          </Animated.Text>
        )}
        {feedback === 'wrong' && (
          <Animated.Text entering={FadeIn.duration(160)} exiting={FadeOut.duration(220)} style={styles.wrongText}>
            Wrong step — path shown
          </Animated.Text>
        )}
      </View>
      {!_introShown && <GameIntro name="Mind Drift" subtitle="Trace the path" accentColor={C.green} onDone={() => _setIntroShown(true)} />}
    </Animated.View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040710',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
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

  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  phaseSlot: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  phaseText: {
    color: C.t2,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
  },

  gridContainer: {
    alignSelf: 'center',
    position: 'relative',
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
  },

  hex: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexCore: {
    width: '70%',
    height: '70%',
    borderRadius: 999,
    backgroundColor: 'rgba(155,114,224,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(155,114,224,0.25)',
  },
  hexLit: {
    shadowColor: '#A87CE8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 12,
  },
  hexCoreLit: {
    backgroundColor: '#A87CE8',
    borderColor: '#D7BFFF',
    borderWidth: 2,
  },
  hexPath: {},
  hexCorePath: {
    backgroundColor: 'rgba(168,124,232,0.35)',
    borderColor: '#A87CE8',
  },
  hexTapped: {
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  hexCoreTapped: {
    backgroundColor: C.green,
    borderColor: '#B7F0CE',
    borderWidth: 2,
  },
  hexMissed: {
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  hexCoreMissed: {
    backgroundColor: 'rgba(232,112,126,0.45)',
    borderColor: C.coral,
  },

  floatScore: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    color: C.peach,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  bottomSlot: {
    minHeight: 28,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctText: {
    color: C.green,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(125,211,168,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  wrongText: {
    color: C.coral,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
