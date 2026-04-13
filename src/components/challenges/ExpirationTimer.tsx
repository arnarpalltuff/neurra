import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, Easing,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { formatCountdown, msUntilMidnight } from '../../utils/timeUtils';
import { useDailyChallengeStore } from '../../stores/dailyChallengeStore';

/**
 * Countdown timer showing when today's challenges expire.
 * Updates every minute (or every second when under 10 minutes).
 * Color and urgency scale with remaining time.
 */
export default function ExpirationTimer() {
  const getExpirationMs = useDailyChallengeStore(s => s.getExpirationMs);
  const [remaining, setRemaining] = useState(getExpirationMs());

  const pulse = useSharedValue(1);

  useEffect(() => {
    const tick = () => setRemaining(getExpirationMs());
    const interval = remaining < 10 * 60 * 1000
      ? setInterval(tick, 1000)
      : setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [remaining < 10 * 60 * 1000]);

  // Urgency pulse for < 1 hour
  useEffect(() => {
    if (remaining < 60 * 60 * 1000 && remaining > 0) {
      const speed = remaining < 10 * 60 * 1000 ? 600 : 1200;
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: speed, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.95, { duration: speed, easing: Easing.inOut(Easing.sin) }),
        ), -1, true,
      );
    } else {
      pulse.value = 1;
    }
  }, [remaining < 60 * 60 * 1000, remaining < 10 * 60 * 1000]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (remaining <= 0) return null;

  const hours = remaining / (1000 * 60 * 60);
  const color =
    hours > 12 ? C.t3 :
    hours > 6 ? C.t2 :
    hours > 1 ? C.amber :
    C.coral;

  const text =
    hours > 12 ? 'Challenges refresh tomorrow' :
    `Expires in ${formatCountdown(remaining)}`;

  const glowRadius = hours <= 1 ? 8 : 0;

  return (
    <Animated.View style={pulseStyle}>
      <Text style={[
        styles.text,
        { color },
        glowRadius > 0 && {
          textShadowColor: color,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: glowRadius,
        },
      ]}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
