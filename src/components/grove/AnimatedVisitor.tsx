import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { VISITOR_DEFS, type VisitorId } from '../../stores/groveStore';

const { width: W } = Dimensions.get('window');

interface AnimatedVisitorProps {
  id: VisitorId;
  x: number;
  y: number;
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function FireflyLike({ id, x, y }: AnimatedVisitorProps) {
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const opacity = useSharedValue(0.6);
  const cycle = useMemo(() => ({
    xA: randBetween(-15, 15),
    xB: randBetween(-15, 15),
    yA: randBetween(-12, 12),
    yB: randBetween(-12, 12),
    xDurA: randBetween(3000, 5000),
    xDurB: randBetween(3000, 5000),
    yDurA: randBetween(2500, 4500),
    yDurB: randBetween(2500, 4500),
    flickA: randBetween(0.25, 0.5),
    flickB: randBetween(0.8, 1),
    flickDur: randBetween(1500, 3200),
    delay: randBetween(0, 2000),
  }), []);

  useEffect(() => {
    dx.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(cycle.xA, { duration: cycle.xDurA, easing: Easing.inOut(Easing.sin) }),
        withTiming(cycle.xB, { duration: cycle.xDurB, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
    dy.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(cycle.yA, { duration: cycle.yDurA, easing: Easing.inOut(Easing.sin) }),
        withTiming(cycle.yB, { duration: cycle.yDurB, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
    opacity.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(cycle.flickA, { duration: cycle.flickDur, easing: Easing.inOut(Easing.ease) }),
        withTiming(cycle.flickB, { duration: cycle.flickDur, easing: Easing.inOut(Easing.ease) }),
      ), -1, true,
    ));
    return () => {
      cancelAnimation(dx);
      cancelAnimation(dy);
      cancelAnimation(opacity);
    };
  }, [cycle, dx, dy, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: dx.value }, { translateY: dy.value }],
  }));
  const glowColor = VISITOR_DEFS[id].glow ?? '#F0B542';

  return (
    <Animated.View style={[styles.visitor, { left: x, top: y, shadowColor: glowColor }, style]}>
      <Text style={styles.emoji}>{VISITOR_DEFS[id].emoji}</Text>
    </Animated.View>
  );
}

function ButterflyLike({ id, x, y }: AnimatedVisitorProps) {
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const rot = useSharedValue(0);
  const cycle = useMemo(() => ({
    xA: randBetween(-22, -14),
    xB: randBetween(14, 22),
    yA: randBetween(10, 14),
    yB: randBetween(-14, -10),
    xDur: randBetween(4200, 5800),
    yDur: randBetween(2600, 3600),
    delay: randBetween(0, 2000),
  }), []);

  useEffect(() => {
    dx.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(cycle.xA, { duration: cycle.xDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(cycle.xB, { duration: cycle.xDur, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
    dy.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(cycle.yA, { duration: cycle.yDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(cycle.yB, { duration: cycle.yDur, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
    // Tilt into the turn.
    rot.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(-10, { duration: cycle.xDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(10, { duration: cycle.xDur, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
    return () => {
      cancelAnimation(dx);
      cancelAnimation(dy);
      cancelAnimation(rot);
    };
  }, [cycle, dx, dy, rot]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx.value },
      { translateY: dy.value },
      { rotate: `${rot.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.visitor, { left: x, top: y }, style]}>
      <Text style={styles.emoji}>{VISITOR_DEFS[id].emoji}</Text>
    </Animated.View>
  );
}

function BirdLike({ id, x, y }: AnimatedVisitorProps) {
  const tx = useSharedValue(-80);
  const ty = useSharedValue(0);
  const cycle = useMemo(() => ({
    dur: randBetween(25000, 35000),
    pause: randBetween(2000, 5000),
    delay: randBetween(0, 3000),
    travel: W + 160,
    sway: randBetween(4, 8),
    swayDur: randBetween(1600, 2400),
  }), []);

  useEffect(() => {
    tx.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(cycle.travel, { duration: cycle.dur, easing: Easing.inOut(Easing.sin) }),
        withDelay(cycle.pause, withTiming(-80, { duration: 0 })),
      ),
      -1,
      false,
    ));
    ty.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(-cycle.sway, { duration: cycle.swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(cycle.sway, { duration: cycle.swayDur, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
    return () => {
      cancelAnimation(tx);
      cancelAnimation(ty);
    };
  }, [cycle, tx, ty]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));
  const glowColor = VISITOR_DEFS[id].glow;

  return (
    <Animated.View
      style={[
        styles.visitor,
        { left: x, top: y },
        glowColor ? { shadowColor: glowColor } : null,
        style,
      ]}
    >
      <Text style={styles.emoji}>{VISITOR_DEFS[id].emoji}</Text>
    </Animated.View>
  );
}

/** Ground-dwellers — gentle breathing in place. */
function GroundLike({ id, x, y }: AnimatedVisitorProps) {
  const scale = useSharedValue(1);
  const cycle = useMemo(() => ({
    dur: randBetween(3500, 5500),
    delay: randBetween(0, 2000),
  }), []);

  useEffect(() => {
    scale.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(1.04, { duration: cycle.dur, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: cycle.dur, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
    return () => cancelAnimation(scale);
  }, [cycle, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.visitor, { left: x, top: y }, style]}>
      <Text style={styles.emoji}>{VISITOR_DEFS[id].emoji}</Text>
    </Animated.View>
  );
}

/** Hover creatures (koi, owl) — gentle vertical bob + drift. */
function HoverLike({ id, x, y }: AnimatedVisitorProps) {
  const dy = useSharedValue(0);
  const dx = useSharedValue(0);
  const cycle = useMemo(() => ({
    amp: randBetween(4, 8),
    dur: randBetween(2400, 3800),
    xAmp: randBetween(6, 12),
    xDur: randBetween(4000, 6000),
    delay: randBetween(0, 1500),
  }), []);

  useEffect(() => {
    dy.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(-cycle.amp, { duration: cycle.dur, easing: Easing.inOut(Easing.sin) }),
        withTiming(cycle.amp, { duration: cycle.dur, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
    dx.value = withDelay(cycle.delay, withRepeat(
      withSequence(
        withTiming(-cycle.xAmp, { duration: cycle.xDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(cycle.xAmp, { duration: cycle.xDur, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
    return () => {
      cancelAnimation(dx);
      cancelAnimation(dy);
    };
  }, [cycle, dx, dy]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.value }, { translateY: dy.value }],
  }));
  const glowColor = VISITOR_DEFS[id].glow;

  return (
    <Animated.View
      style={[
        styles.visitor,
        { left: x, top: y },
        glowColor ? { shadowColor: glowColor } : null,
        style,
      ]}
    >
      <Text style={styles.emoji}>{VISITOR_DEFS[id].emoji}</Text>
    </Animated.View>
  );
}

export default React.memo(function AnimatedVisitor({ id, x, y }: AnimatedVisitorProps) {
  const category = VISITOR_DEFS[id].category;
  switch (category) {
    case 'firefly': return <FireflyLike id={id} x={x} y={y} />;
    case 'butterfly': return <ButterflyLike id={id} x={x} y={y} />;
    case 'bird': return <BirdLike id={id} x={x} y={y} />;
    case 'ground': return <GroundLike id={id} x={x} y={y} />;
    case 'hover': return <HoverLike id={id} x={x} y={y} />;
    default: return <GroundLike id={id} x={x} y={y} />;
  }
});

const styles = StyleSheet.create({
  visitor: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  emoji: {
    fontSize: 18,
  },
});
