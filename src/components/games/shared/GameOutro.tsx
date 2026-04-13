import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeIn, FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { C } from '../../../constants/colors';
import { success, tapMedium } from '../../../utils/haptics';

interface GameOutroProps {
  score: number;
  accuracy: number;
  accentColor?: string;
  onDone: () => void;
}

function CountUp({ target, delay, style: s }: { target: number; delay: number; style: any }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const id = setInterval(() => {
        const t = Math.min(1, (Date.now() - startTime) / 1000);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(target * eased));
        if (t >= 1) clearInterval(id);
      }, 24);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return <Text style={s}>{display}</Text>;
}

export default function GameOutro({
  score, accuracy, accentColor = C.green, onDone,
}: GameOutroProps) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 300 });
    tapMedium();
    setTimeout(() => success(), 500);
    const done = setTimeout(onDone, 3000);
    return () => clearTimeout(done);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const accPct = Math.round(accuracy * 100);

  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(260)} style={styles.overlay} pointerEvents="auto">
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5,7,14,0.60)' }]} />
      <Animated.View style={[styles.card, { borderColor: `${accentColor}40`, shadowColor: accentColor }, cardStyle]}>
        <Text style={styles.label}>COMPLETE</Text>
        <CountUp target={score} delay={200} style={styles.score} />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: accPct >= 80 ? C.green : accPct >= 50 ? C.amber : C.coral }]}>
              {accPct}%
            </Text>
            <Text style={styles.statLabel}>ACCURACY</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 30,
    borderRadius: 28,
    backgroundColor: 'rgba(10,16,30,0.92)',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 12,
    minWidth: 280,
  },
  label: {
    color: C.t3,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  score: {
    color: C.peach,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 60,
    textShadowColor: 'rgba(224,155,107,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  stat: { alignItems: 'center' },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: C.t3,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
});
