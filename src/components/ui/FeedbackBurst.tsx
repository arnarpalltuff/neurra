import React, { useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withDelay, withSequence, Easing, runOnJS,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import MysteryOrb from './MysteryOrb';
import { useProgressStore } from '../../stores/progressStore';
import { useCoinStore } from '../../stores/coinStore';

// ── Types ────────────────────────────────────────────────
export type FeedbackType = 'correct' | 'wrong';

interface FeedbackBurstProps {
  /** 'correct' or 'wrong' */
  type: FeedbackType;
  /** Current combo count (1 = first correct in a row) */
  combo: number;
  /** Screen position where the tap happened */
  position: { x: number; y: number };
  /** Unique key to re-trigger (increment on each event) */
  trigger: number;
  /** Mystery orb visibility (5% chance on correct, from useGameFeedback) */
  mysteryOrbVisible?: boolean;
  mysteryOrbPosition?: { x: number; y: number };
  onDismissOrb?: () => void;
}

// ── Particle ─────────────────────────────────────────────
interface ParticleConfig {
  angle: number;
  distance: number;
  delay: number;
  color: string;
  size: number;
}

function Particle({ config, trigger }: { config: ParticleConfig; trigger: number }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    const rad = (config.angle * Math.PI) / 180;
    const dx = Math.cos(rad) * config.distance;
    const dy = Math.sin(rad) * config.distance;

    opacity.value = 1;
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;

    translateX.value = withDelay(config.delay, withTiming(dx, { duration: 500, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(config.delay, withTiming(dy + 20, { duration: 500, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(config.delay, withDelay(200, withTiming(0, { duration: 300 })));
    scale.value = withDelay(config.delay, withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(0, { duration: 400 }),
    ));
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      width: config.size,
      height: config.size,
      borderRadius: config.size / 2,
      backgroundColor: config.color,
    }, style]} />
  );
}

// ── XP Popup ─────────────────────────────────────────────
function XPPopup({ combo, trigger }: { combo: number; trigger: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  const xpAmount = combo >= 10 ? 50 : combo >= 5 ? 30 : combo >= 3 ? 20 : 10;
  const fontSize = combo >= 10 ? 18 : combo >= 5 ? 16 : combo >= 3 ? 15 : 14;

  useEffect(() => {
    if (trigger === 0) return;
    translateY.value = 0;
    opacity.value = 1;
    scale.value = 0;

    scale.value = withSpring(1, { damping: 8, stiffness: 300 });
    translateY.value = withDelay(300, withTiming(-60, { duration: 600, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(500, withTiming(0, { duration: 400 }));
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.xpPopup, style]}>
      <Animated.Text style={[styles.xpText, { fontSize }]}>
        +{xpAmount} XP
      </Animated.Text>
    </Animated.View>
  );
}

// ── Combo Badge ──────────────────────────────────────────
function ComboBadge({ combo, trigger }: { combo: number; trigger: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0 || combo < 2) return;
    scale.value = 0;
    opacity.value = 1;
    scale.value = withSpring(1, { damping: 6, stiffness: 400 });
    opacity.value = withDelay(800, withTiming(0, { duration: 300 }));
  }, [trigger, combo]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (combo < 2) return null;

  const badgeColor = combo >= 10 ? C.amber : combo >= 5 ? C.peach : C.green;
  const label = combo >= 10 ? `x${combo} BLAZING!` : `x${combo}`;

  return (
    <Animated.View style={[styles.comboBadge, { backgroundColor: badgeColor + '30', borderColor: badgeColor }, style]}>
      <Animated.Text style={[styles.comboText, { color: badgeColor }]}>{label}</Animated.Text>
    </Animated.View>
  );
}

// ── Screen Edge Glow ─────────────────────────────────────
function EdgeGlow({ combo, trigger }: { combo: number; trigger: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0 || combo < 3) return;
    const pulses = combo >= 5 ? 2 : 1;
    const hold = combo >= 10 ? 1000 : 200;

    opacity.value = 0;
    if (pulses === 1) {
      opacity.value = withSequence(
        withTiming(0.4, { duration: 100 }),
        withDelay(hold, withTiming(0, { duration: 300 })),
      );
    } else {
      opacity.value = withSequence(
        withTiming(0.4, { duration: 100 }),
        withTiming(0.1, { duration: 150 }),
        withTiming(0.5, { duration: 100 }),
        withDelay(hold, withTiming(0, { duration: 400 })),
      );
    }
  }, [trigger, combo]);

  const glowColor = combo >= 5 ? C.amber : C.green;

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (combo < 3) return null;

  return (
    <Animated.View style={[styles.edgeGlow, { shadowColor: glowColor, borderColor: glowColor }, style]}
      pointerEvents="none"
    />
  );
}

// ── Correct Answer Glow ─────────────────────────────────
function CorrectGlow({ combo, trigger }: { combo: number; trigger: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = 0.2;
    opacity.value = 0.5;
    scale.value = withTiming(1.5, { duration: 400, easing: Easing.out(Easing.cubic) });
    opacity.value = withDelay(100, withTiming(0, { duration: 300 }));
  }, [trigger]);

  const glowColor = combo >= 10 ? C.amber : combo >= 5 ? C.peach : C.green;

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: glowColor,
      marginLeft: -30,
      marginTop: -30,
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 15,
    }, style]} />
  );
}

// ── Wrong Answer Shake ───────────────────────────────────
function WrongShake({ trigger }: { trigger: number }) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    opacity.value = 0.15;
    translateX.value = withSequence(
      withTiming(-3, { duration: 40 }),
      withTiming(3, { duration: 40 }),
      withTiming(-2, { duration: 40 }),
      withTiming(2, { duration: 40 }),
      withTiming(0, { duration: 40 }),
    );
    opacity.value = withDelay(200, withTiming(0, { duration: 200 }));
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.wrongOverlay, style]} pointerEvents="none" />
  );
}

// ── Main Component ───────────────────────────────────────
export default function FeedbackBurst({
  type, combo, position, trigger,
  mysteryOrbVisible, mysteryOrbPosition, onDismissOrb,
}: FeedbackBurstProps) {
  const addXP = useProgressStore(s => s.addXP);
  const earnCoins = useCoinStore(s => s.earnCoins);

  const handleOrbReward = useCallback((reward: { xp: number; coins: number }) => {
    if (reward.xp > 0) addXP(reward.xp);
    if (reward.coins > 0) earnCoins(reward.coins, 'Mystery orb');
  }, [addXP, earnCoins]);
  const particles = useMemo(() => {
    if (type === 'wrong') return [];
    const count = combo >= 10 ? 10 : combo >= 5 ? 8 : combo >= 3 ? 6 : combo >= 2 ? 5 : 4;
    const particleColors = combo >= 5
      ? [C.green, C.amber, '#FFD700']
      : combo >= 3
        ? [C.green, C.amber]
        : [C.green];

    return Array.from({ length: count }, (_, i) => ({
      angle: (360 / count) * i + (Math.random() - 0.5) * 30,
      distance: 30 + Math.random() * 40,
      delay: Math.random() * 80,
      color: particleColors[i % particleColors.length],
      size: combo >= 10 ? 6 + Math.random() * 4 : 4 + Math.random() * 3,
    }));
  }, [trigger, type, combo]);

  if (trigger === 0) return null;

  return (
    <>
      {/* Edge glow (behind everything, full screen) */}
      <EdgeGlow combo={combo} trigger={trigger} />

      {/* Positioned at tap point */}
      <View style={[styles.burstContainer, { left: position.x, top: position.y }]} pointerEvents="none">
        {type === 'correct' && (
          <>
            <CorrectGlow combo={combo} trigger={trigger} />
            {particles.map((p, i) => (
              <Particle key={`${trigger}-${i}`} config={p} trigger={trigger} />
            ))}
            <XPPopup combo={combo} trigger={trigger} />
            <ComboBadge combo={combo} trigger={trigger} />
          </>
        )}
      </View>

      {/* Wrong answer overlay */}
      {type === 'wrong' && <WrongShake trigger={trigger} />}

      {/* Mystery orb (5% chance on correct answer) */}
      {mysteryOrbVisible && onDismissOrb && mysteryOrbPosition && (
        <MysteryOrb
          position={mysteryOrbPosition}
          onDismiss={onDismissOrb}
          onReward={handleOrbReward}
        />
      )}
    </>
  );
}

// ── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  burstContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: 999,
  },
  xpPopup: {
    position: 'absolute',
    alignSelf: 'center',
    top: -30,
    left: -40,
    width: 80,
    alignItems: 'center',
  },
  xpText: {
    color: C.amber,
    fontWeight: '900',
    textShadowColor: '#00000060',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  comboBadge: {
    position: 'absolute',
    top: -55,
    left: -30,
    width: 60,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  comboText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  edgeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
    zIndex: 998,
  },
  wrongOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.coral,
    zIndex: 998,
  },
});
