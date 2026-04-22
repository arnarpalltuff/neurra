import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeIn, FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { C } from '../../../../constants/colors';
import { tapMedium, tapHeavy, success } from '../../../../utils/haptics';
import { styles } from '../styles';
import { ConfettiPiece, CONFETTI_COLORS } from '../effects/Confetti';

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

export function OutroOverlay({
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
