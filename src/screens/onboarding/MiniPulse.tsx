import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { tapLight, success as hapticSuccess } from '../../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../../components/ui/FloatingParticles';

const CIRCLE_SIZE = 100;
const TOTAL_ROUNDS = 8;
const SHOW_MS = 1200;

interface MiniPulseProps {
  onComplete: (accuracy: number) => void;
}

export default function MiniPulse({ onComplete }: MiniPulseProps) {
  const [round, setRound] = useState(0);
  const [isGreen, setIsGreen] = useState(true);
  const [tapped, setTapped] = useState(false);
  const hitsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const doneRef = useRef(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (doneRef.current) return;
    if (round >= TOTAL_ROUNDS) {
      doneRef.current = true;
      const accuracy = TOTAL_ROUNDS > 0 ? hitsRef.current / TOTAL_ROUNDS : 0;
      hapticSuccess();
      onComplete(accuracy);
      return;
    }
    const green = Math.random() > 0.35;
    setIsGreen(green);
    setTapped(false);

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      // Correctly ignored red = hit; missed green = no hit
      if (!green) hitsRef.current += 1;
      setRound(r => r + 1);
    }, SHOW_MS);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [round, onComplete]);

  const handleTap = () => {
    if (tapped) return;
    setTapped(true);
    tapLight();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isGreen) hitsRef.current += 1;

    tapTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setRound(r => r + 1);
    }, 150);
  };

  const scale = useSharedValue(1);
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = isGreen ? C.green : C.coral;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg1, '#0A0E1A', C.bg1]} style={StyleSheet.absoluteFillObject} />
      <FloatingParticles count={6} color="rgba(110,207,154,0.12)" />
      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <Text style={styles.title}>Quick! Tap the green circles.</Text>
        <Text style={styles.subtitle}>Ignore the red ones.</Text>
      </Animated.View>

      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < round && { backgroundColor: C.green },
              i === round && { backgroundColor: C.t1 },
            ]}
          />
        ))}
      </View>

      <View style={styles.circleArea}>
        {round < TOTAL_ROUNDS && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pressable
              onPress={handleTap}
              onPressIn={() => { scale.value = withSpring(0.9); }}
              onPressOut={() => { scale.value = withSpring(1); }}
            >
              <Animated.View
                style={[
                  styles.circle,
                  { backgroundColor: color },
                  circleStyle,
                  tapped && { opacity: 0.3 },
                ]}
              />
            </Pressable>
          </Animated.View>
        )}
      </View>

      <Text style={styles.hint}>This is how brain training feels.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 32,
  },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circleArea: {
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  hint: {
    fontFamily: fonts.kova,
    color: C.t3,
    fontSize: 16,
    textAlign: 'center',
  },
});
