import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withSequence, withDelay, FadeIn, FadeOut, FadeInDown, FadeOutUp,
  Easing, interpolate, Extrapolation, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Defs, RadialGradient, Stop, Ellipse, Rect, Line } from 'react-native-svg';
import { C } from '../../../constants/colors';
import { updateDifficulty, getDifficulty, signalNoiseParams } from '../../../utils/difficultyEngine';
import { pickRandom } from '../../../utils/arrayUtils';
import { useGameFeedback } from '../../../hooks/useGameFeedback';
import FeedbackBurst from '../../ui/FeedbackBurst';
import FloatingParticles from '../../ui/FloatingParticles';
import {
  selection, success, error as hapticError, tapMedium, tapLight, tapHeavy,
} from '../../../utils/haptics';
import {
  playCorrect, playWrong, playComboHit, playRoundStart, playRoundEnd,
  playConfetti, playPerfect, playTap, playStreak,
} from '../../../utils/sound';
import { useEnergyStore, maxHeartsFor } from '../../../stores/energyStore';
import { useProStore } from '../../../stores/proStore';

const { width: W, height: H } = Dimensions.get('window');
const SCENE_SIZE = W - 40;

interface SignalNoiseProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
}

type ShapeType = 'circle' | 'square' | 'rounded';
type GameState = 'intro' | 'playing' | 'outro';

interface SceneShape {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
  shapeType: ShapeType;
}

const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'rounded'];

const PALETTE = [
  '#4A90D9', '#D94A6B', '#5CC99A', '#D9A84A', '#9A5CC9', '#C95C5C',
  '#5CAAC9', '#D96BA8', '#6BD96B', '#C9985C', '#7A6BD9', '#D9C95C',
];

const CONFETTI_COLORS = [C.blue, C.green, C.amber, C.purple, '#5CAAC9', C.peach];

const CORRECT_TEXTS = [
  '✦ Sharp eye',
  '✦ Eagle vision',
  '✦ Quick scan',
  '✦ Locked on',
  '✦ Signal found',
  '✦ Target acquired',
];

function generateScene(count: number): SceneShape[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * (SCENE_SIZE - 80),
    y: 40 + Math.random() * (SCENE_SIZE - 80),
    r: 24 + Math.random() * 44,
    color: pickRandom(PALETTE),
    opacity: 0.5 + Math.random() * 0.4,
    shapeType: pickRandom(SHAPE_TYPES),
  }));
}

// ─────────────────────────────────────────────────────────────
// SVG sensor background — deep blue tactical backdrop
// ─────────────────────────────────────────────────────────────
const BG_DOTS = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  cx: Math.random() * 100,
  cy: Math.random() * 200,
  r: 0.12 + Math.random() * 0.4,
  op: 0.2 + Math.random() * 0.5,
}));

function SensorBackground() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 200"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="sBase" cx="50%" cy="42%" rx="110%" ry="90%">
          <Stop offset="0%" stopColor="#0C1628" stopOpacity="1" />
          <Stop offset="55%" stopColor="#060C1A" stopOpacity="1" />
          <Stop offset="100%" stopColor="#030610" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="sTeal" cx="65%" cy="30%" rx="55%" ry="45%">
          <Stop offset="0%" stopColor="#1A5C78" stopOpacity="0.45" />
          <Stop offset="60%" stopColor="#0C2838" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#041420" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="sBlue" cx="28%" cy="72%" rx="60%" ry="50%">
          <Stop offset="0%" stopColor="#2A50A0" stopOpacity="0.4" />
          <Stop offset="55%" stopColor="#142848" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="#080E24" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="sCore" cx="50%" cy="50%" rx="30%" ry="28%">
          <Stop offset="0%" stopColor="#5CAAC9" stopOpacity="0.14" />
          <Stop offset="100%" stopColor="#5CAAC9" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="sVig" cx="50%" cy="50%" rx="85%" ry="85%">
          <Stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </RadialGradient>
      </Defs>
      <Ellipse cx={50} cy={100} rx={500} ry={500} fill="url(#sBase)" />
      <Ellipse cx={65} cy={60} rx={70} ry={60} fill="url(#sTeal)" />
      <Ellipse cx={28} cy={144} rx={75} ry={65} fill="url(#sBlue)" />
      <Ellipse cx={50} cy={100} rx={40} ry={40} fill="url(#sCore)" />
      {BG_DOTS.map((d) => (
        <Circle key={d.id} cx={d.cx} cy={d.cy} r={d.r} fill="#A0D4FF" opacity={d.op} />
      ))}
      <Ellipse cx={50} cy={100} rx={500} ry={500} fill="url(#sVig)" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Intro overlay — clean sensor boot-up feel
// ─────────────────────────────────────────────────────────────
function IntroOverlay({ onDone }: { onDone: () => void }) {
  const titleScale = useSharedValue(0.7);
  const titleOpacity = useSharedValue(0);
  const subOpacity = useSharedValue(0);
  const goScale = useSharedValue(0);
  const goOpacity = useSharedValue(0);

  useEffect(() => {
    titleScale.value = withSpring(1, { damping: 10, stiffness: 140 });
    titleOpacity.value = withTiming(1, { duration: 300 });
    subOpacity.value = withDelay(400, withTiming(1, { duration: 280 }));
    goScale.value = withDelay(900, withSequence(
      withSpring(1.2, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 10 }),
    ));
    goOpacity.value = withDelay(900, withTiming(1, { duration: 140 }));
    tapMedium();
    const goHaptic = setTimeout(() => success(), 900);
    const done = setTimeout(onDone, 1600);
    return () => { clearTimeout(goHaptic); clearTimeout(done); };
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subOpacity.value }));
  const goStyle = useAnimatedStyle(() => ({
    transform: [{ scale: goScale.value }],
    opacity: goOpacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(260)} style={styles.overlay} pointerEvents="auto">
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(4,8,16,0.45)' }]} />
      <View style={styles.introCenter}>
        <Animated.Text style={[styles.introTitle, titleStyle]}>Signal & Noise</Animated.Text>
        <Animated.Text style={[styles.introSub, subStyle]}>Spot the shape that changes</Animated.Text>
        <Animated.Text style={[styles.introGo, goStyle]}>SCAN</Animated.Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Outro overlay — summary card with count-up
// ─────────────────────────────────────────────────────────────
function OutroCountUp({
  target, delay, format, style: s,
}: { target: number; delay: number; format: 'int' | 'pct' | 'float'; style: any }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const dur = 900;
      const id = setInterval(() => {
        const t = Math.min(1, (Date.now() - startTime) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(target * eased);
        if (t >= 1) clearInterval(id);
      }, 24);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  const text = format === 'pct' ? `${Math.round(display)}%`
    : format === 'float' ? display.toFixed(1)
    : `${Math.round(display)}`;
  return <Text style={s}>{text}</Text>;
}

function OutroOverlay({
  score, accuracy, bestStreak, totalChanges, onDone,
}: {
  score: number; accuracy: number; bestStreak: number; totalChanges: number; onDone: () => void;
}) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const isPerfect = accuracy >= 0.99;
  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 300 });
    tapMedium();
    if (isPerfect) {
      setTimeout(() => { tapHeavy(); setTimeout(tapHeavy, 80); setTimeout(tapMedium, 160); }, 400);
    } else {
      setTimeout(() => success(), 500);
    }
    const done = setTimeout(onDone, 3200);
    return () => clearTimeout(done);
  }, []);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(260)} style={styles.overlay} pointerEvents="auto">
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(4,8,16,0.60)' }]} />
      {isPerfect && (
        <View style={styles.confettiOrigin} pointerEvents="none">
          {Array.from({ length: 40 }, (_, i) => (
            <ConfettiPiece
              key={i}
              angle={-90 + (Math.random() - 0.5) * 160}
              dist={90 + Math.random() * 180}
              rotate={(Math.random() - 0.5) * 900}
              delay={200 + Math.random() * 200}
              color={CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]}
            />
          ))}
        </View>
      )}
      <Animated.View style={[styles.outroCard, isPerfect && styles.outroCardPerfect, cardStyle]}>
        <Text style={[styles.outroLabel, isPerfect && { color: C.amber }]}>
          {isPerfect ? '★ PERFECT SCAN ★' : 'SCAN COMPLETE'}
        </Text>
        {!isPerfect && (
          <Text style={styles.outroSubLabel}>
            {accuracy >= 0.9 ? 'Exceptional detection' :
             accuracy >= 0.7 ? 'Great scan — keep sharpening' :
             accuracy >= 0.5 ? 'Good effort — room to improve' :
             'Keep training — you\'ll get sharper'}
          </Text>
        )}
        <View style={styles.outroRankBadge}>
          <Text style={[styles.outroRankText, {
            color: isPerfect ? C.amber :
              accuracy >= 0.9 ? '#A0D4FF' :
              accuracy >= 0.7 ? C.green :
              accuracy >= 0.5 ? C.peach : C.t3,
          }]}>
            {isPerfect ? 'ELITE' :
             accuracy >= 0.9 ? 'EXPERT' :
             accuracy >= 0.7 ? 'AGENT' :
             accuracy >= 0.5 ? 'CADET' : 'NOVICE'}
          </Text>
        </View>
        <OutroCountUp target={score} delay={200} format="int" style={styles.outroScore} />
        <View style={styles.outroStatsRow}>
          <View style={styles.outroStat}>
            <OutroCountUp target={Math.round(accuracy * 100)} delay={500} format="pct" style={styles.outroStatValue} />
            <Text style={styles.outroStatLabel}>ACCURACY</Text>
          </View>
          <View style={styles.outroStatDivider} />
          <View style={styles.outroStat}>
            <OutroCountUp target={bestStreak} delay={650} format="int" style={styles.outroStatValue} />
            <Text style={styles.outroStatLabel}>BEST STREAK</Text>
          </View>
          <View style={styles.outroStatDivider} />
          <View style={styles.outroStat}>
            <OutroCountUp target={totalChanges} delay={800} format="int" style={styles.outroStatValue} />
            <Text style={styles.outroStatLabel}>CHANGES</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Animated score — odometer roll-up
// ─────────────────────────────────────────────────────────────
function AnimatedScore({ value, style: s }: { value: number; style: any }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current;
    const target = value;
    if (start === target) return;
    const startTime = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startTime) / 500);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (t >= 1) { clearInterval(id); prev.current = target; }
    }, 24);
    return () => clearInterval(id);
  }, [value]);
  return <Text style={s}>{display}</Text>;
}

// ─────────────────────────────────────────────────────────────
// SVG shape orb — glass-orb with radial gradient + breathing
// ─────────────────────────────────────────────────────────────
function ShapeOrb({ shape, index, justChanged }: { shape: SceneShape; index: number; justChanged: boolean }) {
  const sz = shape.r * 2;
  const cr = shape.shapeType === 'circle' ? shape.r
    : shape.shapeType === 'rounded' ? shape.r * 0.3
    : 4;
  const orbId = `orb${shape.id}`;
  const shineId = `shine${shape.id}`;

  const breath = useSharedValue(1);
  const entry = useSharedValue(0);
  const changePulse = useSharedValue(1);
  const breathDur = useMemo(() => 2800 + Math.random() * 1600, []);

  useEffect(() => {
    entry.value = withDelay(
      index * 50,
      withSpring(1, { damping: 12, stiffness: 120 }),
    );
    breath.value = withDelay(
      index * 80 + 600,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: breathDur, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.95, { duration: breathDur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true,
      ),
    );
  }, []);

  useEffect(() => {
    if (justChanged) {
      changePulse.value = withSequence(
        withTiming(1.18, { duration: 150, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 8, stiffness: 160 }),
      );
    }
  }, [justChanged]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value * changePulse.value * (0.3 + 0.7 * entry.value) }],
    opacity: shape.opacity * entry.value,
  }));

  return (
    <Animated.View
      style={[styles.shapeWrap, {
        left: shape.x - shape.r,
        top: shape.y - shape.r,
        width: sz,
        height: sz,
        borderRadius: cr,
        shadowColor: shape.color,
      }, animStyle]}
    >
      <Svg width={sz} height={sz} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id={orbId} cx="35%" cy="28%" rx="80%" ry="80%" fx="35%" fy="28%">
            <Stop offset="0%" stopColor={shape.color} stopOpacity="1" />
            <Stop offset="55%" stopColor={shape.color} stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#0A0E18" stopOpacity="0.85" />
          </RadialGradient>
          <RadialGradient id={shineId} cx="32%" cy="24%" rx="42%" ry="42%" fx="32%" fy="24%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {shape.shapeType === 'circle' ? (
          <>
            <Circle cx={shape.r} cy={shape.r} r={shape.r - 1} fill={`url(#${orbId})`} />
            <Circle cx={shape.r} cy={shape.r} r={shape.r - 3} fill={`url(#${shineId})`} />
          </>
        ) : (
          <>
            <Rect x={1} y={1} width={sz - 2} height={sz - 2} rx={cr} fill={`url(#${orbId})`} />
            <Rect x={3} y={3} width={sz - 6} height={sz - 6} rx={Math.max(0, cr - 2)} fill={`url(#${shineId})`} />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Scene grid — subtle radar-style grid inside the scene
// ─────────────────────────────────────────────────────────────
function SceneGrid() {
  const lines = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const step = SCENE_SIZE / 6;
    for (let i = 1; i < 6; i++) {
      result.push({ x1: i * step, y1: 0, x2: i * step, y2: SCENE_SIZE });
      result.push({ x1: 0, y1: i * step, x2: SCENE_SIZE, y2: i * step });
    }
    return result;
  }, []);
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {lines.map((l, i) => (
        <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="rgba(92,170,201,0.06)" strokeWidth={0.8} />
      ))}
      <Circle cx={SCENE_SIZE / 2} cy={SCENE_SIZE / 2} r={SCENE_SIZE * 0.35}
        stroke="rgba(92,170,201,0.05)" strokeWidth={0.8} fill="none" />
      <Circle cx={SCENE_SIZE / 2} cy={SCENE_SIZE / 2} r={SCENE_SIZE * 0.18}
        stroke="rgba(92,170,201,0.04)" strokeWidth={0.8} fill="none" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Radar ping — circular wave from center of the scene
// ─────────────────────────────────────────────────────────────
function RadarPing() {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.out(Easing.cubic) }),
      -1, false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.05, 0.6, 1], [0, 0.3, 0.1, 0]),
    transform: [{ scale: interpolate(prog.value, [0, 1], [0.05, 2.2]) }],
  }));
  return (
    <Animated.View style={[styles.radarPing, style]} pointerEvents="none" />
  );
}

// ─────────────────────────────────────────────────────────────
// Corner bracket idle breathing
// ─────────────────────────────────────────────────────────────
function CornerBreathing() {
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    borderColor: `rgba(92,170,201,${0.3 + breath.value * 0.35})`,
  }));
  return (
    <>
      <Animated.View style={[styles.corner, styles.cornerTL, styles.cornerBreath, style]} />
      <Animated.View style={[styles.corner, styles.cornerTR, styles.cornerBreath, style]} />
      <Animated.View style={[styles.corner, styles.cornerBL, styles.cornerBreath, style]} />
      <Animated.View style={[styles.corner, styles.cornerBR, styles.cornerBreath, style]} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Active scan indicator — pulsing dot in scene corner when scanning
// ─────────────────────────────────────────────────────────────
function ScanIndicator({ active }: { active: boolean }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        ), -1, true,
      );
    } else {
      pulse.value = withTiming(0.15, { duration: 300 });
    }
  }, [active]);
  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.8 + pulse.value * 0.3 }],
  }));
  return (
    <Animated.View style={[styles.scanIndicator, style]} pointerEvents="none">
      <View style={[styles.scanIndicatorDot, { backgroundColor: active ? '#5CAAC9' : C.t3 }]} />
      <Text style={[styles.scanIndicatorText, { color: active ? '#5CAAC9' : C.t3 }]}>
        {active ? 'SCANNING' : 'IDLE'}
      </Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Scene border heartbeat — subtle ambient pulse
// ─────────────────────────────────────────────────────────────
function SceneBorderHeartbeat() {
  const beat = useSharedValue(0);
  useEffect(() => {
    beat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withDelay(200, withTiming(0.6, { duration: 100, easing: Easing.out(Easing.cubic) })),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
        withDelay(1200, withTiming(0, { duration: 0 })),
      ), -1, false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    borderColor: `rgba(92,170,201,${beat.value * 0.2})`,
    shadowOpacity: beat.value * 0.3,
  }));
  return (
    <Animated.View style={[styles.sceneHeartbeat, style]} pointerEvents="none" />
  );
}

// ─────────────────────────────────────────────────────────────
// Correct sparkle — particles burst from the found shape
// ─────────────────────────────────────────────────────────────
function CorrectSparkle({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const particles = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    angle: (360 / 8) * i + (Math.random() - 0.5) * 30,
    dist: 25 + Math.random() * 35,
  })), []);
  useEffect(() => {
    const t = setTimeout(onDone, 800);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      {particles.map((p, i) => (
        <SparkleParticle key={i} x={x} y={y} angle={p.angle} dist={p.dist} />
      ))}
    </>
  );
}

function SparkleParticle({ x, y, angle, dist }: { x: number; y: number; angle: number; dist: number }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);
  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const dx = x + Math.cos(rad) * dist * prog.value - 3;
    const dy = y + Math.sin(rad) * dist * prog.value - 3;
    return {
      transform: [{ translateX: dx }, { translateY: dy }],
      opacity: interpolate(prog.value, [0, 0.15, 0.8, 1], [0, 1, 0.5, 0]),
      width: interpolate(prog.value, [0, 0.3, 1], [2, 6, 2]),
      height: interpolate(prog.value, [0, 0.3, 1], [2, 6, 2]),
    };
  });
  return (
    <Animated.View style={[styles.sparkleParticle, style]} pointerEvents="none" />
  );
}

// ─────────────────────────────────────────────────────────────
// Scan sweep — horizontal line sweeping down the scene
// ─────────────────────────────────────────────────────────────
function ScanSweep() {
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    top: interpolate(sweep.value, [0, 1], [0, SCENE_SIZE]),
    opacity: interpolate(sweep.value, [0, 0.05, 0.5, 0.95, 1], [0, 0.5, 0.35, 0.5, 0]),
  }));
  return (
    <Animated.View style={[styles.scanSweep, style]} pointerEvents="none" />
  );
}

// ─────────────────────────────────────────────────────────────
// Countdown ring — shrinking ring during the response window
// ─────────────────────────────────────────────────────────────
function CountdownRing({ x, y, duration }: { x: number; y: number; duration: number }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration, easing: Easing.linear });
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.1, 0.85, 1], [0, 0.45, 0.45, 0]),
    transform: [{ scale: interpolate(prog.value, [0, 1], [1.8, 0.4]) }],
    borderColor: `rgba(92,170,201,${interpolate(prog.value, [0, 0.7, 1], [0.5, 0.5, 0.1])})`,
  }));
  return (
    <Animated.View
      style={[styles.countdownRing, { left: x - 36, top: y - 36 }, style]}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Tap crosshair — brief crosshair flash where the player tapped
// ─────────────────────────────────────────────────────────────
function TapCrosshair({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) },
      (done) => { if (done) runOnJS(onDone)(); });
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.1, 0.7, 1], [0, 1, 0.6, 0]),
    transform: [{ scale: interpolate(prog.value, [0, 0.15, 1], [0.5, 1.1, 0.9]) }],
  }));
  return (
    <Animated.View style={[styles.tapCrosshair, { left: x - 18, top: y - 18 }, style]} pointerEvents="none">
      <View style={styles.crossH} />
      <View style={styles.crossV} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Combo multiplier display — floating "1.5×" label
// ─────────────────────────────────────────────────────────────
function ComboMultiplier({ streak }: { streak: number }) {
  const mult = (1 + streak * 0.25).toFixed(2).replace(/\.?0+$/, '');
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 10 }),
    );
  }, [streak]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={[styles.comboMultWrap, style]}>
      <Text style={styles.comboMultText}>{mult}×</Text>
      <Text style={styles.comboMultLabel}>MULTIPLIER</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Parallax sensor text — drifting "SCANNING" background glyphs
// ─────────────────────────────────────────────────────────────
function SensorGlyphs() {
  const g1 = useSharedValue(0);
  const g2 = useSharedValue(0);
  const g3 = useSharedValue(0);
  useEffect(() => {
    const loop = (dur: number) => withRepeat(
      withSequence(
        withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: dur, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
    g1.value = loop(16000);
    g2.value = withDelay(3000, loop(18000));
    g3.value = withDelay(6000, loop(20000));
  }, []);
  const s1 = useAnimatedStyle(() => ({
    opacity: interpolate(g1.value, [0, 1], [0.012, 0.035], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g1.value, [0, 1], [0, -16]) }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: interpolate(g2.value, [0, 1], [0.01, 0.03], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g2.value, [0, 1], [0, 14]) }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: interpolate(g3.value, [0, 1], [0.015, 0.04], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g3.value, [0, 1], [0, -12]) }],
  }));
  return (
    <>
      <Animated.Text style={[styles.sensorGlyph, { top: H * 0.15, left: -10 }, s1]}>SCAN</Animated.Text>
      <Animated.Text style={[styles.sensorGlyph, { top: H * 0.50, right: -20 }, s2]}>DETECT</Animated.Text>
      <Animated.Text style={[styles.sensorGlyph, { bottom: H * 0.12, left: W * 0.15 }, s3]}>FOCUS</Animated.Text>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Background pulse — brief brightness on shape change
// ─────────────────────────────────────────────────────────────
function useBgPulse() {
  const bgPulse = useSharedValue(0);
  const fire = useCallback(() => {
    bgPulse.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: bgPulse.value * 0.15,
  }));
  return { fireBgPulse: fire, bgPulseStyle: style };
}

// ─────────────────────────────────────────────────────────────
// Scan reticle — rotating targeting scope, speeds up with streak
// ─────────────────────────────────────────────────────────────
function ScanReticle({ streak }: { streak: number }) {
  const rot = useSharedValue(0);
  const speed = useSharedValue(1);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1, false,
    );
  }, []);
  useEffect(() => {
    speed.value = withTiming(Math.min(3.5, 1 + streak * 0.2), { duration: 400 });
  }, [streak]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360 * speed.value}deg` }],
  }));
  return (
    <Animated.View style={[styles.scanReticle, style]} pointerEvents="none">
      <View style={styles.scanLine} />
      <View style={styles.scanLineCross} />
      <View style={styles.scanLineDiag} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Detection ring — expanding ring on correct tap
// ─────────────────────────────────────────────────────────────
function DetectionRing({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) },
      (done) => { if (done) runOnJS(onDone)(); });
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.1, 1], [0, 0.9, 0]),
    transform: [{ scale: interpolate(prog.value, [0, 1], [0.3, 2.8]) }],
  }));
  return (
    <Animated.View
      style={[styles.detectionRing, { left: x - 40, top: y - 40 }, style]}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Signal lock — targeting brackets closing in on the change
// ─────────────────────────────────────────────────────────────
function SignalLock({ x, y }: { x: number; y: number }) {
  const prog = useSharedValue(0);
  const breathe = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    breathe.value = withDelay(800, withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
  }, []);

  const topLeft = useAnimatedStyle(() => {
    const offset = interpolate(prog.value, [0, 1], [60, 0]);
    const op = interpolate(prog.value, [0, 0.2, 1], [0, 0.7, 0.55 + breathe.value * 0.25]);
    return { transform: [{ translateX: -offset }, { translateY: -offset }], opacity: op };
  });
  const topRight = useAnimatedStyle(() => {
    const offset = interpolate(prog.value, [0, 1], [60, 0]);
    const op = interpolate(prog.value, [0, 0.2, 1], [0, 0.7, 0.55 + breathe.value * 0.25]);
    return { transform: [{ translateX: offset }, { translateY: -offset }], opacity: op };
  });
  const botLeft = useAnimatedStyle(() => {
    const offset = interpolate(prog.value, [0, 1], [60, 0]);
    const op = interpolate(prog.value, [0, 0.2, 1], [0, 0.7, 0.55 + breathe.value * 0.25]);
    return { transform: [{ translateX: -offset }, { translateY: offset }], opacity: op };
  });
  const botRight = useAnimatedStyle(() => {
    const offset = interpolate(prog.value, [0, 1], [60, 0]);
    const op = interpolate(prog.value, [0, 0.2, 1], [0, 0.7, 0.55 + breathe.value * 0.25]);
    return { transform: [{ translateX: offset }, { translateY: offset }], opacity: op };
  });

  return (
    <View style={[styles.signalLockWrap, { left: x - 28, top: y - 28 }]} pointerEvents="none">
      <Animated.View style={[styles.lockBracket, styles.lockTL, topLeft]} />
      <Animated.View style={[styles.lockBracket, styles.lockTR, topRight]} />
      <Animated.View style={[styles.lockBracket, styles.lockBL, botLeft]} />
      <Animated.View style={[styles.lockBracket, styles.lockBR, botRight]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Change glow — pulse at the changed shape position
// ─────────────────────────────────────────────────────────────
function ChangeGlow({ x, y }: { x: number; y: number }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: pulse.value * 0.6,
    transform: [{ scale: 0.8 + pulse.value * 0.4 }],
  }));
  return (
    <Animated.View
      style={[styles.changeGlow, { left: x - 35, top: y - 35 }, style]}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Float score text rising from a position
// ─────────────────────────────────────────────────────────────
function FloatScore({ x, y, points }: { x: number; y: number; points: number }) {
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
      { translateY: interpolate(rise.value, [0, 1], [0, -70]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.5, 1.3, 1]) },
    ],
  }));
  return (
    <Animated.Text
      style={[styles.floatScore, { left: x - 30, top: y - 24 }, style]}
      pointerEvents="none"
    >
      +{points}
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────────────────────
// Precision label — BULLSEYE / SHARP / SPOTTED
// ─────────────────────────────────────────────────────────────
function PrecisionLabel({ dist, onDone }: { dist: number; onDone: () => void }) {
  const text = dist < 20 ? 'BULLSEYE' : dist < 40 ? 'SHARP' : 'SPOTTED';
  const color = dist < 20 ? C.amber : dist < 40 ? C.green : C.blue;
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rise = useSharedValue(0);
  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 6, stiffness: 220 }),
      withSpring(1, { damping: 10 }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(500, withTiming(0, { duration: 300 })),
    );
    rise.value = withTiming(-40, { duration: 900, easing: Easing.out(Easing.cubic) });
    const t = setTimeout(onDone, 950);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: rise.value }],
    opacity: opacity.value,
  }));
  return (
    <View style={styles.precisionWrap} pointerEvents="none">
      <Animated.Text style={[styles.precisionText, { color, textShadowColor: `${color}cc` }, style]}>
        {text}
      </Animated.Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Miss indicator — arrow/line from wrong tap to actual change
// ─────────────────────────────────────────────────────────────
function MissIndicator({
  tapX, tapY, targetX, targetY,
}: { tapX: number; tapY: number; targetX: number; targetY: number }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withSequence(
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
      withDelay(600, withTiming(0, { duration: 300 })),
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: prog.value * 0.7 }));
  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Line
          x1={tapX} y1={tapY} x2={targetX} y2={targetY}
          stroke="rgba(232,112,126,0.6)" strokeWidth={1.5} strokeDasharray="6,4"
        />
        <Circle cx={targetX} cy={targetY} r={8}
          stroke="rgba(232,112,126,0.8)" strokeWidth={1.5} fill="none" />
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Streak fire — glowing halo on the streak pill at high streaks
// ─────────────────────────────────────────────────────────────
function StreakFire({ streak }: { streak: number }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: glow.value * (streak >= 8 ? 0.9 : streak >= 5 ? 0.7 : 0.5),
  }));
  const color = streak >= 8 ? C.amber : streak >= 5 ? C.peach : '#5CAAC9';
  return (
    <Animated.View style={[styles.streakFire, { backgroundColor: color, shadowColor: color }, style]} pointerEvents="none" />
  );
}

// ─────────────────────────────────────────────────────────────
// Missed pulse — persistent pulsing ring at the missed location
// ─────────────────────────────────────────────────────────────
function MissedPulse({ x, y }: { x: number; y: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
      -1, false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.2, 1], [0, 0.85, 0]),
    transform: [{ scale: interpolate(p.value, [0, 1], [0.5, 2.4]) }],
  }));
  return (
    <Animated.View
      style={[styles.missedPulse, { left: x - 30, top: y - 30 }, style]}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Confetti burst for streak milestones
// ─────────────────────────────────────────────────────────────
function ConfettiPiece({
  angle, dist, rotate, delay, color,
}: { angle: number; dist: number; rotate: number; delay: number; color: string }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withDelay(delay, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, []);
  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * dist * prog.value;
    const dy = Math.sin(rad) * dist * prog.value + prog.value * prog.value * 200;
    return {
      transform: [{ translateX: dx }, { translateY: dy }, { rotate: `${rotate * prog.value * 4}deg` }],
      opacity: interpolate(prog.value, [0, 0.08, 0.85, 1], [0, 1, 1, 0]),
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', width: 7, height: 12, backgroundColor: color, borderRadius: 2 }, style]}
      pointerEvents="none"
    />
  );
}

function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const pieces = useMemo(() => Array.from({ length: 36 }, () => ({
    angle: -90 + (Math.random() - 0.5) * 160,
    dist: 80 + Math.random() * 160,
    rotate: (Math.random() - 0.5) * 900,
    delay: Math.random() * 120,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  })), []);
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.confettiOrigin} pointerEvents="none">
      {pieces.map((p, i) => <ConfettiPiece key={i} {...p} />)}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Score trail — ghost +N flying from tap to score display
// ─────────────────────────────────────────────────────────────
function ScoreTrail({ startX, startY, points, onDone }: {
  startX: number; startY: number; points: number; onDone: () => void;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 600, easing: Easing.inOut(Easing.cubic) },
      (done) => { if (done) runOnJS(onDone)(); });
  }, []);
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const tx = startX + (W / 2 - 20 - startX) * t;
    const ty = startY + (20 - startY) * t - Math.sin(t * Math.PI) * 40;
    return {
      transform: [{ translateX: tx }, { translateY: ty },
        { scale: interpolate(t, [0, 0.2, 0.9, 1], [0.4, 1, 0.8, 0.3]) }],
      opacity: interpolate(t, [0, 0.12, 0.85, 1], [0, 1, 1, 0]),
    };
  });
  return (
    <Animated.Text style={[styles.scoreTrail, style]} pointerEvents="none">
      +{points}
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────────────────────
// Correct shape highlight — brief green ring on the identified shape
// ─────────────────────────────────────────────────────────────
function ShapeHighlight({ x, y, r, onDone }: { x: number; y: number; r: number; onDone: () => void }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) },
      (done) => { if (done) runOnJS(onDone)(); });
  }, []);
  const sz = r * 2 + 12;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.1, 0.7, 1], [0, 0.85, 0.6, 0]),
    transform: [{ scale: interpolate(prog.value, [0, 0.2, 1], [0.8, 1.1, 1.05]) }],
  }));
  return (
    <Animated.View
      style={[styles.shapeHighlight, {
        left: x - sz / 2,
        top: y - sz / 2,
        width: sz,
        height: sz,
        borderRadius: sz / 2,
      }, style]}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Corner bracket glow — flashes on correct
// ─────────────────────────────────────────────────────────────
function CornerGlow({ trigger }: { trigger: number }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    if (trigger === 0) return;
    glow.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
  }, [trigger]);
  const style = useAnimatedStyle(() => ({
    borderColor: `rgba(92,170,201,${0.6 + glow.value * 0.4})`,
    shadowOpacity: glow.value,
  }));
  return (
    <>
      <Animated.View style={[styles.corner, styles.cornerTL, style]} />
      <Animated.View style={[styles.corner, styles.cornerTR, style]} />
      <Animated.View style={[styles.corner, styles.cornerBL, style]} />
      <Animated.View style={[styles.corner, styles.cornerBR, style]} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main game
// ─────────────────────────────────────────────────────────────
export default function SignalNoise({ onComplete, initialLevel = 1 }: SignalNoiseProps) {
  const diff = getDifficulty('signal-noise', 0);
  const level = Math.max(initialLevel, diff.level);
  const params = useMemo(() => signalNoiseParams(level), [level]);

  const hearts = useEnergyStore(s => s.hearts);
  const isPro = useProStore(s => s.isPro);
  const maxHearts = maxHeartsFor(isPro);

  const [gameState, setGameState] = useState<GameState>('intro');
  const [shapes, setShapes] = useState<SceneShape[]>([]);
  const [changePos, setChangePos] = useState<{ x: number; y: number } | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'missed' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [floatScores, setFloatScores] = useState<{ id: number; x: number; y: number; points: number }[]>([]);
  const [detectionRings, setDetectionRings] = useState<{ id: number; x: number; y: number }[]>([]);
  const [scoreTrails, setScoreTrails] = useState<{ id: number; startX: number; startY: number; points: number }[]>([]);
  const [confettiBursts, setConfettiBursts] = useState<number[]>([]);
  const [precisionEvent, setPrecisionEvent] = useState<{ id: number; dist: number } | null>(null);
  const [tapCrosshairs, setTapCrosshairs] = useState<{ id: number; x: number; y: number }[]>([]);
  const [wrongTap, setWrongTap] = useState<{ tapX: number; tapY: number; targetX: number; targetY: number } | null>(null);
  const [speedBonus, setSpeedBonus] = useState<{ id: number } | null>(null);
  const [scoreMilestone, setScoreMilestone] = useState<{ id: number; value: number } | null>(null);
  const [changedShapeId, setChangedShapeId] = useState<number | null>(null);
  const [shapeHighlights, setShapeHighlights] = useState<{ id: number; x: number; y: number; r: number }[]>([]);
  const highlightIdRef = useRef(0);
  const sceneExitScale = useSharedValue(1);
  const sceneExitOpacity = useSharedValue(1);
  const changeTimeRef = useRef(0);
  const speedIdRef = useRef(0);
  const milestoneIdRef = useRef(0);
  const lastMilestoneRef = useRef(0);
  const streakBrokenRef = useRef(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [resultHistory, setResultHistory] = useState<('correct' | 'wrong' | 'missed')[]>([]);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const sparkleIdRef = useRef(0);
  const { feedback: burstFeedback, fireCorrect: burstCorrect, fireWrong: burstWrong } = useGameFeedback();
  const { fireBgPulse, bgPulseStyle } = useBgPulse();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const roundRef = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const waitingRef = useRef(false);
  const changePosRef = useRef<{ x: number; y: number } | null>(null);
  const shapesRef = useRef<SceneShape[]>([]);
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const paramsRef = useRef(params);
  const floatIdRef = useRef(0);
  const ringIdRef = useRef(0);
  const trailIdRef = useRef(0);
  const confettiIdRef = useRef(0);
  const precIdRef = useRef(0);
  const correctTrigger = useRef(0);
  const crosshairIdRef = useRef(0);
  onCompleteRef.current = onComplete;
  paramsRef.current = params;

  // Animation primitives
  const scorePulse = useSharedValue(1);
  const rootShake = useSharedValue(0);
  const punchScale = useSharedValue(1);
  const screenFlash = useSharedValue(0);
  const comboAura = useSharedValue(0);
  const sceneBorderGlow = useSharedValue(0);
  const dangerTint = useSharedValue(0);
  const sceneZoomX = useSharedValue(0);
  const sceneZoomY = useSharedValue(0);
  const sceneZoomScale = useSharedValue(1);

  const [cornerTrigger, setCornerTrigger] = useState(0);

  useEffect(() => {
    const initial = generateScene(params.numShapes);
    setShapes(initial);
    shapesRef.current = initial;
  }, [params.numShapes]);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  const finishGame = useCallback(() => {
    sceneExitScale.value = withTiming(0.92, { duration: 600, easing: Easing.inOut(Easing.cubic) });
    sceneExitOpacity.value = withTiming(0.5, { duration: 600, easing: Easing.inOut(Easing.cubic) });
    setTimeout(() => { setGameState('outro'); playRoundEnd(); }, 650);
  }, []);

  const handleOutroDone = useCallback(() => {
    const p = paramsRef.current;
    const acc = p.totalChanges > 0 ? correctRef.current / p.totalChanges : 1;
    onCompleteRef.current(scoreRef.current, acc);
  }, []);

  const scheduleChange = useCallback(() => {
    if (cancelledRef.current) return;
    const p = paramsRef.current;
    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      if (roundRef.current >= p.totalChanges) {
        finishGame();
        return;
      }

      const currentShapes = shapesRef.current;
      const targetIdx = Math.floor(Math.random() * currentShapes.length);
      const target = currentShapes[targetIdx];
      const newColor = pickRandom(PALETTE.filter(c => c !== target.color));

      const updated = currentShapes.map((s, i) =>
        i === targetIdx ? { ...s, color: newColor, opacity: Math.min(0.9, s.opacity + 0.1 - p.subtlety * 0.1) } : s
      );
      if (cancelledRef.current) return;
      setShapes(updated);
      shapesRef.current = updated;
      setChangedShapeId(target.id);

      const pos = { x: target.x, y: target.y };
      setChangePos(pos);
      changePosRef.current = pos;
      waitingRef.current = true;
      fireBgPulse();
      changeTimeRef.current = Date.now();

      // Camera zoom toward change location
      const offsetX = (pos.x - SCENE_SIZE / 2) * 0.03;
      const offsetY = (pos.y - SCENE_SIZE / 2) * 0.03;
      sceneZoomX.value = withTiming(offsetX, { duration: 800, easing: Easing.out(Easing.cubic) });
      sceneZoomY.value = withTiming(offsetY, { duration: 800, easing: Easing.out(Easing.cubic) });
      sceneZoomScale.value = withTiming(1.03, { duration: 800, easing: Easing.out(Easing.cubic) });
      roundRef.current += 1;
      setRound(roundRef.current);

      // Danger zone — last 3 rounds
      const remaining = p.totalChanges - roundRef.current;
      if (remaining <= 2) {
        dangerTint.value = withTiming(Math.min(1, (3 - remaining) / 3), { duration: 600 });
      }

      tapTimerRef.current = setTimeout(() => {
        if (cancelledRef.current) return;
        if (waitingRef.current) {
          waitingRef.current = false;
          setFeedback('missed');
          setResultHistory(prev => [...prev.slice(-11), 'missed']);
          if (streakRef.current >= 3) streakBrokenRef.current = true;
          streakRef.current = 0;
          setStreak(0);
          comboAura.value = withTiming(0, { duration: 400 });
          sceneZoomX.value = withSpring(0, { damping: 10 });
          sceneZoomY.value = withSpring(0, { damping: 10 });
          sceneZoomScale.value = withSpring(1, { damping: 10 });
          updateDifficulty('signal-noise', false);
          hapticError();
          feedbackTimerRef.current = setTimeout(() => {
            if (cancelledRef.current) return;
            setFeedback(null);
            scheduleChange();
          }, 800);
        }
      }, 2500);
    }, p.changeInterval);
  }, [finishGame]);

  const scenReady = shapes.length > 0;
  useEffect(() => {
    if (!scenReady || gameState !== 'playing') return;
    cancelledRef.current = false;
    const initial = setTimeout(() => scheduleChange(), 1500);
    return () => {
      cancelledRef.current = true;
      clearTimeout(initial);
      clearAllTimers();
    };
  }, [scenReady, gameState, scheduleChange, clearAllTimers]);

  const handleTap = useCallback((tapX: number, tapY: number) => {
    if (cancelledRef.current || gameState !== 'playing') return;
    if (!waitingRef.current || !changePosRef.current) return;
    waitingRef.current = false;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    const pos = changePosRef.current;
    const dist = Math.sqrt((tapX - pos.x) ** 2 + (tapY - pos.y) ** 2);
    const isClose = dist < 80;
    const p = paramsRef.current;

    // Reset camera zoom
    sceneZoomX.value = withSpring(0, { damping: 10 });
    sceneZoomY.value = withSpring(0, { damping: 10 });
    sceneZoomScale.value = withSpring(1, { damping: 10 });

    // Crosshair at tap point
    crosshairIdRef.current += 1;
    const chId = crosshairIdRef.current;
    setTapCrosshairs(prev => [...prev, { id: chId, x: tapX, y: tapY }]);

    // Speed bonus check
    const reactionTime = Date.now() - changeTimeRef.current;
    const isFast = reactionTime < 800;

    if (isClose) {
      correctRef.current += 1;
      streakRef.current += 1;
      if (streakRef.current > bestStreakRef.current) bestStreakRef.current = streakRef.current;
      setStreak(streakRef.current);
      const precisionBonus = dist < 20 ? 80 : dist < 40 ? 40 : 0;
      const speedBonus = 30;
      const mult = 1 + streakRef.current * 0.25;
      const pts = Math.round((100 + precisionBonus + speedBonus) * mult);
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setFeedback('correct');
      updateDifficulty('signal-noise', true);

      // Haptics by precision
      if (dist < 20) { tapHeavy(); setTimeout(tapMedium, 80); }
      else if (dist < 40) tapMedium();
      else { success(); }

      // Screen punch
      punchScale.value = withSequence(
        withTiming(1.06, { duration: 100, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 7, stiffness: 160 }),
      );

      // Screen flash on high precision
      if (dist < 30) {
        screenFlash.value = withSequence(
          withTiming(0.4, { duration: 50 }),
          withTiming(0, { duration: 340 }),
        );
      }

      // Score animations
      scorePulse.value = withSequence(
        withSpring(1.25, { damping: 6 }),
        withSpring(1, { damping: 10 }),
      );

      // Corner bracket glow + green border glow
      correctTrigger.current += 1;
      setCornerTrigger(correctTrigger.current);
      sceneBorderGlow.value = withSequence(
        withTiming(-1, { duration: 80 }),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
      );

      // Combo aura
      comboAura.value = withTiming(
        Math.min(1, Math.max(0, (streakRef.current - 2) / 5)),
        { duration: 500 },
      );

      // Detection ring
      ringIdRef.current += 1;
      const rid = ringIdRef.current;
      setDetectionRings(prev => [...prev, { id: rid, x: tapX, y: tapY }]);

      // Shape highlight ring + sparkles on the changed shape
      const changedShape = shapesRef.current.find(s => s.id === changedShapeId);
      if (changedShape) {
        highlightIdRef.current += 1;
        const hid = highlightIdRef.current;
        setShapeHighlights(prev => [...prev, { id: hid, x: changedShape.x, y: changedShape.y, r: changedShape.r }]);

        sparkleIdRef.current += 1;
        const sid = sparkleIdRef.current;
        setSparkles(prev => [...prev, { id: sid, x: changedShape.x, y: changedShape.y }]);
      }

      // Float score
      floatIdRef.current += 1;
      const fid = floatIdRef.current;
      setFloatScores(prev => [...prev, { id: fid, x: tapX, y: tapY, points: pts }]);
      setTimeout(() => {
        if (!cancelledRef.current) setFloatScores(prev => prev.filter(f => f.id !== fid));
      }, 1200);

      // Score trail
      trailIdRef.current += 1;
      const tid = trailIdRef.current;
      setScoreTrails(prev => [...prev, { id: tid, startX: tapX + 20, startY: tapY + 180, points: pts }]);

      // Precision label
      precIdRef.current += 1;
      setPrecisionEvent({ id: precIdRef.current, dist });

      // Speed bonus
      if (isFast) {
        speedIdRef.current += 1;
        const sid = speedIdRef.current;
        setSpeedBonus({ id: sid });
        setTimeout(() => {
          if (!cancelledRef.current) setSpeedBonus((cur) => cur?.id === sid ? null : cur);
        }, 800);
      }

      // Streak recovery check
      const wasRecovery = streakBrokenRef.current;
      setIsRecovery(wasRecovery);
      streakBrokenRef.current = false;
      setResultHistory(prev => [...prev.slice(-11), 'correct']);

      // Score milestone check (500, 1000, 2000, 3000)
      const milestones = [500, 1000, 2000, 3000];
      for (const m of milestones) {
        if (scoreRef.current >= m && lastMilestoneRef.current < m) {
          lastMilestoneRef.current = m;
          milestoneIdRef.current += 1;
          const mid = milestoneIdRef.current;
          setScoreMilestone({ id: mid, value: m });
          setTimeout(() => {
            if (!cancelledRef.current) setScoreMilestone((cur) => cur?.id === mid ? null : cur);
          }, 1200);
          break;
        }
      }

      // Confetti on streak milestones
      if ([3, 5, 8, 12].includes(streakRef.current)) {
        confettiIdRef.current += 1;
        const cid = confettiIdRef.current;
        setConfettiBursts(prev => [...prev, cid]);
        playStreak();
      }

      playCorrect();
      if (streakRef.current >= 3) playComboHit();
      burstCorrect({ x: tapX + 20, y: tapY + 180 });
    } else {
      setFeedback('wrong');
      if (streakRef.current >= 3) streakBrokenRef.current = true;
      streakRef.current = 0;
      setStreak(0);
      comboAura.value = withTiming(0, { duration: 400 });
      updateDifficulty('signal-noise', false);
      hapticError();
      rootShake.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      sceneBorderGlow.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
      );
      playWrong();
      burstWrong({ x: tapX + 20, y: tapY + 180 });
      setWrongTap({ tapX, tapY, targetX: pos.x, targetY: pos.y });
      setIsRecovery(false);
      setResultHistory(prev => [...prev.slice(-11), 'wrong']);
    }

    feedbackTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setFeedback(null);
      setChangePos(null);
      changePosRef.current = null;
      setWrongTap(null);
      setChangedShapeId(null);
      if (roundRef.current < p.totalChanges) {
        scheduleChange();
      } else {
        finishGame();
      }
    }, 600);
  }, [gameState, scheduleChange, finishGame]);

  // Animated styles
  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rootShake.value }, { scale: punchScale.value }],
  }));
  const screenFlashStyle = useAnimatedStyle(() => ({
    opacity: screenFlash.value,
  }));
  const comboAuraStyle = useAnimatedStyle(() => ({
    opacity: comboAura.value * 0.35,
  }));
  const sceneBorderStyle = useAnimatedStyle(() => {
    const v = sceneBorderGlow.value;
    const isCorrect = v < 0;
    const abs = Math.abs(v);
    return {
      borderColor: isCorrect
        ? `rgba(110,207,154,${abs * 0.7})`
        : `rgba(232,112,126,${abs * 0.7})`,
      shadowColor: isCorrect ? '#6ECF9A' : '#E8707E',
      shadowOpacity: abs * 0.8,
    };
  });
  const dangerStyle = useAnimatedStyle(() => ({
    opacity: dangerTint.value * 0.2,
  }));
  const sceneZoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sceneZoomX.value },
      { translateY: sceneZoomY.value },
      { scale: sceneZoomScale.value * sceneExitScale.value },
    ],
    opacity: sceneExitOpacity.value,
  }));

  const progress = round / params.totalChanges;
  const accuracy = round > 0 ? correctRef.current / round : 1;

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      {/* Background */}
      <View style={styles.bgLayer} pointerEvents="none">
        <SensorBackground />
      </View>

      {/* Combo aura */}
      <Animated.View style={[StyleSheet.absoluteFillObject, comboAuraStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(92,170,201,0.28)', 'rgba(74,144,217,0.12)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Background pulse on shape change */}
      <Animated.View style={[StyleSheet.absoluteFillObject, bgPulseStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(92,170,201,0.4)', 'rgba(74,144,217,0.2)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <SensorGlyphs />
      {/* Temperature gradient — cools blue to warm as rounds progress */}
      {progress > 0.5 && (
        <Animated.View
          entering={FadeIn.duration(800)}
          style={[StyleSheet.absoluteFillObject, { opacity: (progress - 0.5) * 0.3 }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['rgba(217,74,107,0.15)', 'rgba(217,168,74,0.08)', 'rgba(0,0,0,0)']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}

      <FloatingParticles count={8} color="rgba(107,168,224,0.3)" />
      <FloatingParticles count={5} color="rgba(92,170,201,0.2)" />
      <FeedbackBurst {...burstFeedback} />

      {/* Hearts bar */}
      <View style={styles.heartsRow}>
        {Array.from({ length: maxHearts }, (_, i) => (
          <Text
            key={i}
            style={[styles.heartIcon, i >= hearts && styles.heartDepleted]}
          >
            {i < hearts ? '♥' : '♡'}
          </Text>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>SCAN</Text>
          <Text style={styles.pillText}>{round}<Text style={styles.pillTextDim}>/{params.totalChanges}</Text></Text>
        </View>
        <Animated.View style={scorePulseStyle}>
          <AnimatedScore value={score} style={styles.scoreText} />
          <Text style={styles.scoreLabel}>POINTS</Text>
        </Animated.View>
        <View style={styles.streakSlot}>
          {streak > 2 && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.streakPill}>
              {streak >= 3 && <StreakFire streak={streak} />}
              <Text style={styles.streakText}>{streak}×</Text>
              <Text style={styles.streakLabel}>STREAK</Text>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Accuracy mini display */}
      {round > 0 && gameState === 'playing' && (
        <View style={styles.accuracyRow}>
          <View style={[styles.accuracyDot, { backgroundColor: accuracy >= 0.8 ? C.green : accuracy >= 0.5 ? C.amber : C.coral }]} />
          <Text style={styles.accuracyText}>{Math.round(accuracy * 100)}% accuracy</Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <LinearGradient
          colors={progress > 0.7 ? ['#D9A84A', '#D94A6B'] : ['#5CAAC9', '#4A90D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]}
        />
      </View>

      {/* Scene */}
      <View style={styles.sceneFrame}>
        <CornerBreathing />
        <CornerGlow trigger={cornerTrigger} />

        {/* Scene border glow on wrong */}
        <Animated.View
          style={[styles.sceneBorderGlow, sceneBorderStyle]}
          pointerEvents="none"
        />

        {/* Danger zone tint */}
        <Animated.View style={[styles.dangerOverlay, dangerStyle]} pointerEvents="none" />

        <Animated.View style={[{ width: '100%', height: '100%' }, sceneZoomStyle]}>
        <Pressable
          style={styles.scene}
          onPress={(e) => handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        >
          <LinearGradient
            colors={['#0C1220', '#080E18']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Scene vignette */}
          <View style={styles.sceneVignette} pointerEvents="none">
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
          {/* Scene inner glow */}
          <View style={styles.sceneInnerGlow} pointerEvents="none" />

          {/* Scene border heartbeat */}
          <SceneBorderHeartbeat />

          {/* Active scan indicator */}
          <ScanIndicator active={!!changePos && !feedback} />

          <SceneGrid />
          <RadarPing />
          <ScanSweep />

          {/* In-scene particles */}
          <FloatingParticles count={4} color="rgba(92,170,201,0.18)" />

          {/* Center dot */}
          <View style={styles.centerDot} pointerEvents="none" />

          {/* Analyzing text during idle */}
          {!changePos && !feedback && gameState === 'playing' && round > 0 && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.analyzingWrap}>
              <Text style={styles.analyzingText}>ANALYZING...</Text>
            </Animated.View>
          )}

          {/* Atmospheric data readout */}
          {gameState === 'playing' && (
            <View style={styles.dataReadout}>
              <Text style={styles.dataReadoutText}>
                SIG:{round > 0 ? 'ACTIVE' : 'STANDBY'} | ACC:{Math.round(accuracy * 100)}%
              </Text>
            </View>
          )}

          {/* Round label */}
          {round > 0 && gameState === 'playing' && (
            <View style={styles.roundLabel}>
              <Text style={styles.roundLabelText}>
                ROUND {round}/{params.totalChanges}
              </Text>
            </View>
          )}

          {gameState === 'playing' && <ScanReticle streak={streak} />}

          {shapes.map((shape, i) => (
            <ShapeOrb key={shape.id} shape={shape} index={i} justChanged={shape.id === changedShapeId} />
          ))}

          {/* Countdown ring during response window */}
          {changePos && !feedback && (
            <CountdownRing x={changePos.x} y={changePos.y} duration={2500} />
          )}

          {/* Tap crosshairs */}
          {tapCrosshairs.map(ch => (
            <TapCrosshair
              key={ch.id}
              x={ch.x}
              y={ch.y}
              onDone={() => setTapCrosshairs(prev => prev.filter(c => c.id !== ch.id))}
            />
          ))}

          {/* Signal lock + change glow at changed position */}
          {changePos && !feedback && (
            <>
              <SignalLock x={changePos.x} y={changePos.y} />
              <ChangeGlow x={changePos.x} y={changePos.y} />
            </>
          )}

          {/* Detection rings on correct */}
          {detectionRings.map(r => (
            <DetectionRing
              key={r.id}
              x={r.x}
              y={r.y}
              onDone={() => setDetectionRings(prev => prev.filter(d => d.id !== r.id))}
            />
          ))}

          {feedback === 'correct' && changePos && (
            <Animated.View
              entering={FadeIn.duration(120)}
              exiting={FadeOut.duration(220)}
              style={[styles.correctRipple, { left: changePos.x - 40, top: changePos.y - 40 }]}
            />
          )}

          {/* Scene feedback overlays */}
          {feedback === 'correct' && (
            <Animated.View entering={FadeIn.duration(60)} exiting={FadeOut.duration(300)}
              style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(110,207,154,0.08)' }]}
              pointerEvents="none" />
          )}
          {feedback === 'wrong' && (
            <Animated.View entering={FadeIn.duration(60)} exiting={FadeOut.duration(300)}
              style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(232,112,126,0.10)' }]}
              pointerEvents="none" />
          )}

          {feedback === 'missed' && changePos && (
            <MissedPulse x={changePos.x} y={changePos.y} />
          )}

          {/* Miss indicator — dashed line from wrong tap to actual change */}
          {feedback === 'wrong' && wrongTap && (
            <MissIndicator
              tapX={wrongTap.tapX}
              tapY={wrongTap.tapY}
              targetX={wrongTap.targetX}
              targetY={wrongTap.targetY}
            />
          )}

          {/* Shape highlights on correct */}
          {shapeHighlights.map(h => (
            <ShapeHighlight
              key={h.id}
              x={h.x}
              y={h.y}
              r={h.r}
              onDone={() => setShapeHighlights(prev => prev.filter(s => s.id !== h.id))}
            />
          ))}

          {/* Correct sparkle particles */}
          {sparkles.map(s => (
            <CorrectSparkle
              key={s.id}
              x={s.x}
              y={s.y}
              onDone={() => setSparkles(prev => prev.filter(sp => sp.id !== s.id))}
            />
          ))}

          {floatScores.map(f => (
            <FloatScore key={f.id} x={f.x} y={f.y} points={f.points} />
          ))}
        </Pressable>
        </Animated.View>
      </View>

      {/* Speed bonus label */}
      {speedBonus && (
        <Animated.View
          key={speedBonus.id}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(200)}
          style={styles.speedBonusWrap}
        >
          <Text style={styles.speedBonusText}>⚡ FAST</Text>
        </Animated.View>
      )}

      {/* Score trails */}
      {scoreTrails.map(t => (
        <ScoreTrail
          key={t.id}
          startX={t.startX}
          startY={t.startY}
          points={t.points}
          onDone={() => setScoreTrails(prev => prev.filter(x => x.id !== t.id))}
        />
      ))}

      {/* Precision label */}
      {precisionEvent && (
        <PrecisionLabel
          key={precisionEvent.id}
          dist={precisionEvent.dist}
          onDone={() => setPrecisionEvent(null)}
        />
      )}

      {/* Confetti */}
      {confettiBursts.map(cid => (
        <ConfettiBurst
          key={cid}
          onDone={() => setConfettiBursts(prev => prev.filter(x => x !== cid))}
        />
      ))}

      {/* Score milestone */}
      {scoreMilestone && (
        <Animated.View
          key={scoreMilestone.id}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutUp.duration(300)}
          style={styles.milestoneWrap}
        >
          <Text style={styles.milestoneText}>{scoreMilestone.value}!</Text>
        </Animated.View>
      )}

      {/* Screen flash */}
      <Animated.View style={[styles.screenFlash, screenFlashStyle]} pointerEvents="none" />

      {/* Combo multiplier */}
      {streak >= 2 && gameState === 'playing' && (
        <ComboMultiplier key={streak} streak={streak} />
      )}

      {/* Final scan announcement */}
      {round === params.totalChanges - 1 && gameState === 'playing' && !feedback && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.finalScanWrap}>
          <Text style={styles.finalScanText}>FINAL SCAN</Text>
        </Animated.View>
      )}

      {/* Result history dots */}
      {resultHistory.length > 0 && gameState === 'playing' && (
        <View style={styles.historyRow}>
          {resultHistory.slice(-12).map((r, i) => (
            <View
              key={i}
              style={[styles.historyDot, {
                backgroundColor: r === 'correct' ? C.green : r === 'wrong' ? C.coral : C.t3,
                opacity: 0.4 + (i / 12) * 0.6,
              }]}
            />
          ))}
        </View>
      )}

      {/* Bottom hint */}
      <View style={styles.bottomSlot}>
        {feedback === 'correct' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.correctText}>
            {isRecovery ? '✦ Back on track!' : CORRECT_TEXTS[Math.floor(Math.random() * CORRECT_TEXTS.length)]}
          </Animated.Text>
        )}
        {feedback === 'missed' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.missedText}>
            Too slow — it changed there
          </Animated.Text>
        )}
        {feedback === 'wrong' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.wrongText}>
            {streakBrokenRef.current ? 'Streak broken — stay focused' : 'Close, but not it'}
          </Animated.Text>
        )}
        {!feedback && round === 0 && gameState === 'playing' && (
          <Text style={styles.hintText}>Watch the shapes. Something will change…</Text>
        )}
        {!feedback && round > 0 && round < params.totalChanges - 1 && gameState === 'playing' && (
          <Text style={styles.hintText}>
            {streak >= 5 ? 'On fire — keep scanning!' :
             streak >= 3 ? 'Building momentum.' :
             'Stay focused. Spot the next change.'}
          </Text>
        )}
        {!feedback && round === params.totalChanges - 1 && gameState === 'playing' && (
          <Text style={[styles.hintText, { color: C.coral }]}>Last change — make it count.</Text>
        )}
      </View>

      {/* Intro */}
      {gameState === 'intro' && <IntroOverlay onDone={() => { setGameState('playing'); playRoundStart(); }} />}

      {/* Outro */}
      {gameState === 'outro' && (
        <OutroOverlay
          score={score}
          accuracy={params.totalChanges > 0 ? correctRef.current / params.totalChanges : 1}
          bestStreak={bestStreakRef.current}
          totalChanges={params.totalChanges}
          onDone={handleOutroDone}
        />
      )}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030610',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  bgLayer: {
    position: 'absolute',
    top: -20,
    left: -40,
    right: -40,
    bottom: -20,
  },

  heartsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginBottom: 6,
  },
  heartIcon: {
    fontSize: 18,
    color: '#E8707E',
    textShadowColor: 'rgba(232,112,126,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heartDepleted: {
    color: C.t4,
    textShadowColor: 'transparent',
  },

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
    textShadowColor: 'rgba(224,155,107,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  scoreLabel: {
    color: C.t3,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.4,
    marginTop: -1,
  },
  streakSlot: {
    width: 76,
    alignItems: 'flex-end',
  },
  streakPill: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(240,181,66,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.5)',
  },
  streakFire: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  streakText: {
    color: C.amber,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  streakLabel: {
    color: C.amber,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  progressBar: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },

  sceneFrame: {
    width: SCENE_SIZE,
    height: SCENE_SIZE,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(92,170,201,0.65)',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 6,
  },

  scene: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(92,170,201,0.22)',
  },

  shapeWrap: {
    position: 'absolute',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },

  scanReticle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: SCENE_SIZE - 40,
    height: SCENE_SIZE - 40,
    marginLeft: -(SCENE_SIZE - 40) / 2,
    marginTop: -(SCENE_SIZE - 40) / 2,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 1.5,
    height: '50%',
    backgroundColor: 'rgba(92,170,201,0.35)',
  },
  scanLineCross: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: '50%',
    height: 1.5,
    backgroundColor: 'rgba(92,170,201,0.2)',
  },
  scanLineDiag: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    width: 1,
    height: '35%',
    backgroundColor: 'rgba(92,170,201,0.15)',
    transform: [{ rotate: '45deg' }],
  },

  // Shape highlight — green ring on identified shape
  shapeHighlight: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: 'rgba(110,207,154,0.85)',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
  },

  changeGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(92,170,201,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(92,170,201,0.4)',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 10,
  },

  detectionRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#5CAAC9',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 10,
  },

  correctRipple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
  },

  missedPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: C.coral,
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },

  floatScore: {
    position: 'absolute',
    color: C.peach,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(224,155,107,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },

  scoreTrail: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontSize: 22,
    fontWeight: '900',
    color: C.peach,
    textShadowColor: 'rgba(224,155,107,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    zIndex: 80,
  },

  precisionWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 92,
  },
  precisionText: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 36,
  },

  confettiOrigin: {
    position: 'absolute',
    top: H * 0.45,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 95,
  },

  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 88,
  },

  // Scene border glow on wrong
  sceneBorderGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#E8707E',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
    zIndex: 5,
  },

  // Danger zone
  dangerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(232,112,126,0.5)',
    backgroundColor: 'rgba(232,112,126,0.05)',
    zIndex: 5,
  },

  // Accuracy
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginBottom: 4,
  },
  accuracyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  accuracyText: {
    color: C.t3,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Scan sweep line
  scanSweep: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(92,170,201,0.35)',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },

  // Countdown ring
  countdownRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
  },

  // Tap crosshair
  tapCrosshair: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossH: {
    position: 'absolute',
    width: 36,
    height: 1.5,
    backgroundColor: 'rgba(92,170,201,0.7)',
  },
  crossV: {
    position: 'absolute',
    width: 1.5,
    height: 36,
    backgroundColor: 'rgba(92,170,201,0.7)',
  },

  // Combo multiplier
  comboMultWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(92,170,201,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(92,170,201,0.35)',
    marginTop: 6,
  },
  comboMultText: {
    color: '#5CAAC9',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  comboMultLabel: {
    color: C.t3,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Sensor glyphs
  sensorGlyph: {
    position: 'absolute',
    fontSize: 120,
    fontWeight: '900',
    color: '#A0D4FF',
    letterSpacing: -4,
  },

  // Signal lock brackets
  signalLockWrap: {
    position: 'absolute',
    width: 56,
    height: 56,
  },
  lockBracket: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: 'rgba(92,170,201,0.85)',
  },
  lockTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 3,
  },
  lockTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 3,
  },
  lockBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 3,
  },
  lockBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 3,
  },

  // Radar ping
  radarPing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: SCENE_SIZE * 0.7,
    height: SCENE_SIZE * 0.7,
    marginLeft: -SCENE_SIZE * 0.35,
    marginTop: -SCENE_SIZE * 0.35,
    borderRadius: SCENE_SIZE * 0.35,
    borderWidth: 1,
    borderColor: 'rgba(92,170,201,0.3)',
  },

  // Corner breathing overlay
  cornerBreath: {
    zIndex: 8,
  },

  // Speed bonus
  speedBonusWrap: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(240,181,66,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.6)',
    marginTop: 6,
  },
  speedBonusText: {
    color: C.amber,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Scene vignette
  sceneVignette: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  // Score milestone
  milestoneWrap: {
    position: 'absolute',
    top: H * 0.25,
    alignSelf: 'center',
    zIndex: 93,
  },
  milestoneText: {
    fontSize: 56,
    fontWeight: '900',
    color: C.amber,
    letterSpacing: -1,
    textShadowColor: 'rgba(240,181,66,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },

  // Scan indicator
  scanIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 10,
  },
  scanIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  scanIndicatorText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Scene border heartbeat
  sceneHeartbeat: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 4,
    zIndex: 1,
  },

  // Sparkle particle
  sparkleParticle: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#5CAAC9',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },

  // Data readout
  dataReadout: {
    position: 'absolute',
    top: 10,
    left: 14,
    zIndex: 10,
  },
  dataReadoutText: {
    color: 'rgba(92,170,201,0.35)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
  },

  // Analyzing text
  analyzingWrap: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  analyzingText: {
    color: 'rgba(92,170,201,0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
  },

  // Center dot
  centerDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    marginTop: -3,
    backgroundColor: 'rgba(92,170,201,0.35)',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },

  // Round label inside scene
  roundLabel: {
    position: 'absolute',
    top: 10,
    right: 14,
    zIndex: 10,
  },
  roundLabelText: {
    color: 'rgba(92,170,201,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Scene inner glow — soft light bleeding from edges
  sceneInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: 'rgba(92,170,201,0.06)',
  },

  // Final scan announcement
  finalScanWrap: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(232,112,126,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232,112,126,0.5)',
    marginTop: 8,
  },
  finalScanText: {
    color: C.coral,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // Result history dots
  historyRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 4,
    marginTop: 10,
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  bottomSlot: {
    minHeight: 28,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctText: {
    color: C.green,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(125,211,168,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  missedText: {
    color: C.coral,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  wrongText: {
    color: C.t3,
    fontSize: 13,
    fontWeight: '700',
  },
  hintText: {
    color: C.t3,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  introCenter: {
    alignItems: 'center',
    gap: 16,
  },
  introTitle: {
    color: '#A0D4FF',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(92,170,201,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  introSub: {
    color: C.t2,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  introGo: {
    fontSize: 50,
    fontWeight: '900',
    color: '#5CAAC9',
    letterSpacing: 6,
    marginTop: 12,
    textShadowColor: 'rgba(92,170,201,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },

  outroCard: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 30,
    borderRadius: 28,
    backgroundColor: 'rgba(10,16,30,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(92,170,201,0.4)',
    shadowColor: '#5CAAC9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 12,
    minWidth: 300,
  },
  outroCardPerfect: {
    borderColor: 'rgba(240,181,66,0.7)',
    shadowColor: C.amber,
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  outroLabel: {
    color: '#5CAAC9',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  outroSubLabel: {
    color: C.t2,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: -4,
  },
  outroRankBadge: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(92,170,201,0.4)',
    backgroundColor: 'rgba(92,170,201,0.08)',
    marginTop: 2,
  },
  outroRankText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  outroScore: {
    color: C.peach,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 60,
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  outroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
  },
  outroStat: {
    alignItems: 'center',
    flex: 1,
  },
  outroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  outroStatValue: {
    color: C.t1,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  outroStatLabel: {
    color: C.t3,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
});
