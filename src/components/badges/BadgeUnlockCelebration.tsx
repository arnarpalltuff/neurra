import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts, type as t } from '../../constants/typography';
import { space, radii } from '../../constants/design';
import { getBadge } from '../../constants/badges';
import { tapHeavy } from '../../utils/haptics';
import Celebration from '../ui/Celebration';

const { width, height } = Dimensions.get('window');

interface Props {
  badgeId: string | null;
  onDismiss: () => void;
}

/**
 * Full-screen celebration shown when a new achievement badge unlocks.
 *
 * The badge icon zooms in from the center with a spring, name and
 * description appear below, confetti fires, and a heavy haptic plays.
 * Tap anywhere to dismiss.
 */
export default function BadgeUnlockCelebration({ badgeId, onDismiss }: Props) {
  const badge = badgeId ? getBadge(badgeId) : null;
  const scale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  // Increment-based trigger for the Celebration confetti so each new badge
  // in the unlock queue actually fires confetti (not just the first).
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // All hooks must run on every render — keep them above any early return.
  useEffect(() => {
    if (!badge) {
      // Reset for next unlock.
      scale.value = 0;
      textOpacity.value = 0;
      return;
    }
    tapHeavy();
    scale.value = withSpring(1, { damping: 9, stiffness: 110 });
    textOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
    setConfettiTrigger((c) => c + 1);
  }, [badgeId]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  if (!badge) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={styles.overlay}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
        <View style={styles.content}>
          <Text style={styles.label}>BADGE UNLOCKED</Text>
          <Animated.View style={[styles.iconRing, iconStyle]}>
            <Text style={styles.icon}>{badge.icon}</Text>
          </Animated.View>
          <Animated.View style={[styles.textBlock, textStyle]}>
            <Text style={styles.name}>{badge.name}</Text>
            <Text style={styles.description}>{badge.description}</Text>
          </Animated.View>
          <Animated.Text style={[styles.dismissHint, textStyle]}>TAP TO CONTINUE</Animated.Text>
        </View>
      </Pressable>
      <Celebration type="confetti_gold" trigger={confettiTrigger} origin={{ x: width / 2, y: height / 2 - 80 }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,7,16,0.92)',
    zIndex: 9998,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
    gap: space.xl,
  },
  label: {
    ...t.sectionHeader,
    color: C.amber,
  },
  iconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(240,181,66,0.10)',
    borderWidth: 2,
    borderColor: 'rgba(240,181,66,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
  },
  icon: {
    fontSize: 72,
  },
  textBlock: {
    alignItems: 'center',
    gap: space.xs + 2,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: C.t1,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: C.t2,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
  dismissHint: {
    ...t.microLabel,
    color: C.t4,
  },
});
