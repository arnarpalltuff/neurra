import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, withDelay, FadeIn, FadeOut, Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { success, warning } from '../../utils/haptics';
import { stageConfigFor, KovaStageConfig, pickDialogue } from '../../stores/kovaStore';
import { fonts } from '../../constants/typography';
import { C } from '../../constants/colors';

const { width: W, height: H } = Dimensions.get('window');

interface KovaEvolutionAnimationProps {
  fromStage: number;
  toStage: number;
  isDeEvolution: boolean;
  onComplete: () => void;
}

/**
 * Full-screen overlay that plays when Kova evolves or de-evolves.
 *
 * Evolution: glow intensifies → particle burst → color transition → flash → speech
 * De-evolution: glow dims → shrink → color desaturates → speech
 */
export default function KovaEvolutionAnimation({
  fromStage, toStage, isDeEvolution, onComplete,
}: KovaEvolutionAnimationProps) {
  const config = stageConfigFor(toStage);
  const flash = useSharedValue(0);
  const glowScale = useSharedValue(isDeEvolution ? 1.2 : 0.5);
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.8);

  useEffect(() => {
    if (isDeEvolution) {
      // De-evolution: dim, shrink
      glowOpacity.value = withTiming(0.4, { duration: 400 });
      glowScale.value = withTiming(0.6, { duration: 800, easing: Easing.out(Easing.cubic) });
      textOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
      textScale.value = withDelay(600, withSpring(1, { damping: 10 }));
      warning();
    } else {
      // Evolution: intensify → burst → flash
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 300, easing: Easing.in(Easing.cubic) }),
        withTiming(1, { duration: 200 }),
        withTiming(0.6, { duration: 500 }),
      );
      glowScale.value = withSequence(
        withTiming(1.5, { duration: 500, easing: Easing.out(Easing.cubic) }),
        withSpring(1.1, { damping: 12, stiffness: 100 }),
      );
      flash.value = withDelay(500, withSequence(
        withTiming(0.2, { duration: 100 }),
        withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
      ));
      textOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
      textScale.value = withDelay(900, withSpring(1, { damping: 10, stiffness: 120 }));
      success();
    }

    const timer = setTimeout(onComplete, isDeEvolution ? 2500 : 3000);
    return () => clearTimeout(timer);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  const dialogue = isDeEvolution
    ? pickDialogue('sad')
    : config.description;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(400)}
      style={styles.overlay}
      pointerEvents="auto"
    >
      {/* Background dim */}
      <View style={styles.dimBg} />

      {/* Central glow */}
      <Animated.View style={[styles.glow, {
        backgroundColor: isDeEvolution ? 'rgba(100,100,100,0.3)' : `${config.primaryColor}40`,
        shadowColor: config.primaryColor,
      }, glowStyle]} />

      {/* White flash */}
      <Animated.View style={[styles.flash, flashStyle]} />

      {/* Stage name + description */}
      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={[styles.stageLabel, { color: isDeEvolution ? C.t3 : config.primaryColor }]}>
          {isDeEvolution ? 'KOVA DIMMED' : `STAGE ${toStage}`}
        </Text>
        <Text style={[styles.stageName, { color: isDeEvolution ? C.t2 : config.primaryColor }]}>
          {config.name}
        </Text>
        <Text style={styles.description}>{dialogue}</Text>
      </Animated.View>

      {/* Particle burst for evolution */}
      {!isDeEvolution && (
        <View style={styles.particleBurst}>
          {Array.from({ length: 20 }, (_, i) => (
            <EvolutionParticle key={i} index={i} color={config.primaryColor} />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

function EvolutionParticle({ index, color }: { index: number; color: string }) {
  const prog = useSharedValue(0);
  const angle = (360 / 20) * index + (Math.random() - 0.5) * 20;
  const dist = 80 + Math.random() * 100;

  useEffect(() => {
    prog.value = withDelay(
      500 + Math.random() * 200,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * dist * prog.value;
    const dy = Math.sin(rad) * dist * prog.value;
    return {
      opacity: interpolate(prog.value, [0, 0.15, 0.8, 1], [0, 1, 0.5, 0]),
      transform: [{ translateX: dx }, { translateY: dy }],
    };
  });

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: color,
        elevation: 2,
      }, style]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  dimBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,7,14,0.7)',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
    elevation: 20,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  textWrap: {
    alignItems: 'center',
    gap: 8,
    marginTop: 80,
  },
  stageLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  stageName: {
    fontFamily: fonts.heading,
    fontSize: 36,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: fonts.kova,
    fontSize: 18,
    color: C.t2,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 280,
    marginTop: 8,
  },
  particleBurst: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    marginTop: -40,
  },
});
