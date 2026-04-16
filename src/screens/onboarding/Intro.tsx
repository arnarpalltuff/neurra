import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import Kova from '../../components/kova/Kova';
import Button from '../../components/ui/Button';
import FloatingParticles from '../../components/ui/FloatingParticles';
import { tapLight } from '../../utils/haptics';
import { useTypewriter } from '../../hooks/useTypewriter';

interface IntroProps {
  onNext: () => void;
}

const GREETING = "Hey there. I'm Kova.\nI've been waiting to meet you.";

export default function Intro({ onNext }: IntroProps) {
  const kovaScale = useSharedValue(0.5);
  const kovaOpacity = useSharedValue(0);
  const kovaGlow = useSharedValue(0);
  const kovaWiggle = useSharedValue(1);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Soft haptic every 4th character — felt but not annoying.
  const handleTick = useCallback((charCount: number) => {
    if (charCount % 4 === 0) tapLight();
  }, []);
  const speech = useTypewriter(GREETING, { startDelayMs: 900, charMs: 42, onTick: handleTick });

  useEffect(() => {
    // Kova materializes from the light left behind by Awakening.
    kovaOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    kovaScale.value = withSpring(1, { damping: 12, stiffness: 80 });

    // Ambient breathing glow around Kova.
    kovaGlow.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [kovaOpacity, kovaScale, kovaGlow]);

  const kovaStyle = useAnimatedStyle(() => ({
    opacity: kovaOpacity.value,
    transform: [{ scale: kovaScale.value * kovaWiggle.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: kovaGlow.value * 0.6,
    transform: [{ scale: 1 + kovaGlow.value * 0.08 }],
  }));

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  const handlePress = () => {
    // Excited Kova reaction before navigating — makes the transition feel alive.
    kovaWiggle.value = withSequence(
      withSpring(1.12, { damping: 10, stiffness: 220 }),
      withSpring(1, { damping: 12, stiffness: 180 }),
    );
    navTimerRef.current = setTimeout(onNext, 260);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[C.bg1, '#0A0E1A', C.bg1]}
        style={StyleSheet.absoluteFillObject}
      />
      <FloatingParticles count={6} color="rgba(110,207,154,0.18)" />
      <FloatingParticles count={3} color="rgba(224,155,107,0.14)" />

      <Animated.View style={[styles.kovaArea, kovaStyle]}>
        <Animated.View style={[styles.kovaGlow, glowStyle]} />
        <Kova
          stage={1}
          emotion="curious"
          size={150}
          showSpeechBubble={false}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(700).duration(500).springify().damping(14)}
        style={styles.content}
      >
        <View style={styles.bubble}>
          <LinearGradient
            colors={['rgba(19,24,41,0.92)', 'rgba(12,15,26,0.95)']}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
          />
          {/* Fixed-height container so the button doesn't jump as chars reveal. */}
          <Text style={styles.bubbleText}>
            {speech || ' '}
          </Text>
        </View>
        <Text style={styles.description}>
          Let's see what your brain can do.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(2400).duration(500)}
        style={styles.btnArea}
      >
        <Button
          label="Let's go"
          onPress={handlePress}
          size="lg"
          style={styles.btn}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 90,
    paddingHorizontal: 28,
  },
  kovaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  kovaGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(110,207,154,0.14)',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 50,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  bubble: {
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(110,207,154,0.22)',
    overflow: 'hidden',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    minHeight: 90,
    minWidth: '85%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontFamily: fonts.kova,
    color: C.t1,
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 30,
  },
  description: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnArea: {
    width: '100%',
  },
  btn: {
    width: '100%',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
});
