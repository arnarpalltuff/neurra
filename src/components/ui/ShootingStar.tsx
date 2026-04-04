import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withDelay, Easing, runOnJS,
} from 'react-native-reanimated';
import { tapHeavy } from '../../utils/haptics';
import { playCoinEarned } from '../../utils/sound';
import { colors } from '../../constants/colors';
import { useProgressStore } from '../../stores/progressStore';

const { width: W } = Dimensions.get('window');

interface ShootingStarProps {
  /** Whether this game is eligible (not the first or last game) */
  enabled: boolean;
  /** Called when the star is caught */
  onCatch?: () => void;
}

/**
 * Daily Surprise — a shooting star that streaks across the screen once per day.
 * If tapped within 2 seconds, awards 25 XP + 10 coins.
 */
export default function ShootingStar({ enabled, onCatch }: ShootingStarProps) {
  const [visible, setVisible] = useState(false);
  const [caught, setCaught] = useState(false);
  const caughtRef = useRef(false);
  const spawnedRef = useRef(false);

  const starX = useSharedValue(-40);
  const starY = useSharedValue(30);
  const starOpacity = useSharedValue(0);
  const catchScale = useSharedValue(0);
  const catchOpacity = useSharedValue(0);

  const addXP = useProgressStore(s => s.addXP);
  const addCoins = useProgressStore(s => s.addCoins);

  useEffect(() => {
    if (!enabled || spawnedRef.current) return;
    spawnedRef.current = true;

    // Random delay 5-15 seconds into the game
    const delay = 5000 + Math.random() * 10000;

    const timer = setTimeout(() => {
      setVisible(true);

      // Animate streak across screen
      starOpacity.value = withTiming(1, { duration: 200 });
      starX.value = withTiming(W + 40, { duration: 2000, easing: Easing.linear });
      starY.value = withTiming(60 + Math.random() * 30, { duration: 2000, easing: Easing.linear });

      // After 2 seconds, hide
      setTimeout(() => {
        if (!caughtRef.current) {
          starOpacity.value = withTiming(0, { duration: 300 });
          setTimeout(() => setVisible(false), 300);
        }
      }, 2000);
    }, delay);

    return () => clearTimeout(timer);
  }, [enabled]);

  const handleCatch = useCallback(() => {
    if (caughtRef.current) return;
    caughtRef.current = true;
    setCaught(true);

    tapHeavy();
    playCoinEarned();

    // Award
    addXP(25);
    addCoins(10);

    // Catch animation
    starOpacity.value = withTiming(0, { duration: 200 });
    catchScale.value = withTiming(1, { duration: 300 });
    catchOpacity.value = withTiming(1, { duration: 200 });

    // Fade out
    setTimeout(() => {
      catchOpacity.value = withTiming(0, { duration: 500 });
      setTimeout(() => setVisible(false), 500);
    }, 1500);

    onCatch?.();
  }, [addXP, addCoins, onCatch]);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: starX.value }, { translateY: starY.value }],
    opacity: starOpacity.value,
  }));

  const catchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: catchScale.value }],
    opacity: catchOpacity.value,
  }));

  if (!visible) return null;

  return (
    <>
      {!caught && (
        <Pressable
          onPress={handleCatch}
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.star, starStyle]}>
            <Animated.Text style={styles.starText}>⭐</Animated.Text>
            <Animated.View style={styles.trail} />
          </Animated.View>
        </Pressable>
      )}

      {caught && (
        <Animated.View style={[styles.catchBadge, catchStyle]}>
          <Animated.Text style={styles.catchText}>⭐ +25 XP +10 🪙</Animated.Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 200,
    flexDirection: 'row',
    alignItems: 'center',
  },
  starText: {
    fontSize: 24,
  },
  trail: {
    width: 30,
    height: 2,
    backgroundColor: colors.streak,
    borderRadius: 1,
    opacity: 0.6,
    marginLeft: -4,
  },
  catchBadge: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  catchText: {
    color: colors.streak,
    fontSize: 16,
    fontWeight: '800',
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.streak,
  },
});
