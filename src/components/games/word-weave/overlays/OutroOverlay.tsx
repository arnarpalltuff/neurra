import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay,
  FadeIn, FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { tapMedium, success } from '../../../../utils/haptics';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Outro score text — rolls up from 0 on mount
// ─────────────────────────────────────────────────────────────
function OutroScoreText({ target, style }: { target: number; style: StyleProp<TextStyle> }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const duration = 1200;
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t >= 1) clearInterval(id);
    }, 24);
    return () => clearInterval(id);
  }, [target]);
  return <Text style={style}>{display}</Text>;
}

// ─────────────────────────────────────────────────────────────
// Outro stat count-up — delayed roll-up for summary stats
// ─────────────────────────────────────────────────────────────
function OutroCountUp({
  target, delay, format, style,
}: {
  target: number;
  delay: number;
  format: 'int' | 'float' | 'intX';
  style: StyleProp<TextStyle>;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const duration = 900;
      const id = setInterval(() => {
        const t = Math.min(1, (Date.now() - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(target * eased);
        if (t >= 1) clearInterval(id);
      }, 24);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  const text =
    format === 'float' ? display.toFixed(1) :
    format === 'intX' ? `${Math.round(display)}×` :
    `${Math.round(display)}`;
  return <Text style={style}>{text}</Text>;
}

// ─────────────────────────────────────────────────────────────
// Outro overlay: summary card with best word highlighted
// ─────────────────────────────────────────────────────────────
export function OutroOverlay({
  score, wordCount, bestWord, bestWordPoints, maxCombo, avgLen, onDone,
}: {
  score: number;
  wordCount: number;
  bestWord: string | null;
  bestWordPoints: number;
  maxCombo: number;
  avgLen: number;
  onDone: () => void;
}) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const bestRowScale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 300 });
    bestRowScale.value = withDelay(
      400,
      withSpring(1, { damping: 8, stiffness: 140 }),
    );
    tapMedium();
    setTimeout(() => { success(); }, 500);
    const done = setTimeout(onDone, 2600);
    return () => clearTimeout(done);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const bestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bestRowScale.value }],
    opacity: bestRowScale.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(260)}
      style={styles.overlay}
      pointerEvents="auto"
    >
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(7,8,15,0.60)' },
        ]}
      />
      <Animated.View style={[styles.outroCard, cardStyle]}>
        <View style={styles.outroHeader}>
          <View style={styles.outroStripe} />
          <Text style={styles.outroLabel}>TIME</Text>
          <View style={styles.outroStripe} />
        </View>

        <Text style={styles.outroScoreLabel}>FINAL SCORE</Text>
        <OutroScoreText target={score} style={styles.outroScore} />

        {bestWord && (
          <Animated.View style={[styles.bestRow, bestStyle]}>
            <Text style={styles.bestLabel}>BEST WORD</Text>
            <Text style={styles.bestWord}>{bestWord.toUpperCase()}</Text>
            <Text style={styles.bestPoints}>+{bestWordPoints}</Text>
          </Animated.View>
        )}

        <View style={styles.outroStatsRow}>
          <View style={styles.outroStat}>
            <OutroCountUp
              target={wordCount}
              delay={400}
              format="int"
              style={styles.outroStatValue}
            />
            <Text style={styles.outroStatLabel}>WORDS</Text>
          </View>
          <View style={styles.outroStatDivider} />
          <View style={styles.outroStat}>
            <OutroCountUp
              target={maxCombo}
              delay={550}
              format="intX"
              style={styles.outroStatValue}
            />
            <Text style={styles.outroStatLabel}>BEST COMBO</Text>
          </View>
          <View style={styles.outroStatDivider} />
          <View style={styles.outroStat}>
            <OutroCountUp
              target={avgLen}
              delay={700}
              format="float"
              style={styles.outroStatValue}
            />
            <Text style={styles.outroStatLabel}>AVG LENGTH</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
