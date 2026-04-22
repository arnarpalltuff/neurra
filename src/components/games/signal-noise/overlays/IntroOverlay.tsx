import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, withSequence,
  FadeIn, FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { tapMedium, success } from '../../../../utils/haptics';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Intro overlay — clean sensor boot-up feel
// ─────────────────────────────────────────────────────────────
export function IntroOverlay({ onDone }: { onDone: () => void }) {
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
