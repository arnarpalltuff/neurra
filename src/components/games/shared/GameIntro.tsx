import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, withSequence, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { C } from '../../../constants/colors';
import { success, tapMedium } from '../../../utils/haptics';
import { playRoundStart } from '../../../utils/sound';

interface GameIntroProps {
  name: string;
  subtitle: string;
  accentColor?: string;
  onDone: () => void;
}

export default function GameIntro({
  name, subtitle, accentColor = C.green, onDone,
}: GameIntroProps) {
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
    const goHaptic = setTimeout(() => { success(); playRoundStart(); }, 900);
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
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5,7,14,0.45)' }]} />
      <View style={styles.center}>
        <Animated.Text style={[styles.title, { textShadowColor: `${accentColor}bb` }, titleStyle]}>
          {name}
        </Animated.Text>
        <Animated.Text style={[styles.sub, subStyle]}>{subtitle}</Animated.Text>
        <Animated.Text style={[styles.go, { color: accentColor, textShadowColor: `${accentColor}cc` }, goStyle]}>
          GO
        </Animated.Text>
      </View>
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
  center: { alignItems: 'center', gap: 16 },
  title: {
    color: '#F2EDE4',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sub: {
    color: C.t2,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  go: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 12,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
});
