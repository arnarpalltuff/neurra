import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withSpring, withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import Kova from '../../components/kova/Kova';
import Button from '../../components/ui/Button';
import FloatingParticles from '../../components/ui/FloatingParticles';

const { width } = Dimensions.get('window');

interface IntroProps {
  onNext: () => void;
}

export default function Intro({ onNext }: IntroProps) {
  const kovaGlow = useSharedValue(0);
  const bubbleScale = useSharedValue(0.9);

  useEffect(() => {
    kovaGlow.value = withDelay(300, withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
    bubbleScale.value = withDelay(400, withSpring(1, { damping: 10, stiffness: 120 }));
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: kovaGlow.value * 0.6,
    transform: [{ scale: 1 + kovaGlow.value * 0.08 }],
  }));
  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bubbleScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[C.bg1, '#0A0E1A', C.bg1]}
        style={StyleSheet.absoluteFillObject}
      />
      <FloatingParticles count={8} color="rgba(110,207,154,0.15)" />
      <FloatingParticles count={5} color="rgba(155,114,224,0.12)" />

      {/* Kova with ambient glow */}
      <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.kovaArea}>
        <Animated.View style={[styles.kovaGlow, glowStyle]} />
        <Kova
          stage={1}
          emotion="curious"
          size={150}
          showSpeechBubble={false}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500).springify().damping(14)} style={styles.content}>
        <Animated.View style={[styles.bubble, bubbleStyle]}>
          <LinearGradient
            colors={['rgba(19,24,41,0.92)', 'rgba(12,15,26,0.95)']}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
          />
          <Text style={styles.bubbleText}>
            Hi. I'm Kova.{'\n'}I'm small now... but I grow when you do.
          </Text>
        </Animated.View>
        <Text style={styles.description}>
          Kova is your brain training companion.{'\n'}
          The more you train, the more Kova evolves.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(500).springify().damping(16)} style={styles.stepsPreview}>
        <LinearGradient
          colors={['rgba(19,24,41,0.92)', 'rgba(12,15,26,0.95)']}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
        />
        <LinearGradient
          colors={['rgba(110,207,154,0.06)', 'transparent']}
          style={styles.stepsTopGlow}
        />
        <Text style={styles.stepsTitle}>Here's what's next (~2 min)</Text>
        {[
          { icon: '🧠', label: 'Quick brain assessment', color: C.blue },
          { icon: '📊', label: 'Your brain profile', color: C.purple },
          { icon: '✨', label: 'Personalize your experience', color: C.amber },
        ].map((item, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.delay(700 + i * 100).duration(400)}
            style={styles.stepRow}
          >
            <View style={[styles.stepIconWrap, { shadowColor: item.color }]}>
              <Text style={styles.stepIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.stepText}>{item.label}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(900).duration(400)} style={styles.btnArea}>
        <Button
          label="Nice to meet you, Kova"
          onPress={onNext}
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
    paddingVertical: 70,
    paddingHorizontal: 28,
  },
  kovaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kovaGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(110,207,154,0.12)',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    gap: 18,
  },
  bubble: {
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(110,207,154,0.2)',
    overflow: 'hidden',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
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
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsPreview: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    shadowColor: '#9B72E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  stepsTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  stepsTitle: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepIcon: { fontSize: 18 },
  stepText: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 14,
  },
  btnArea: {
    width: '100%',
    marginTop: 28,
  },
  btn: {
    width: '100%',
    shadowColor: '#6ECF9A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
