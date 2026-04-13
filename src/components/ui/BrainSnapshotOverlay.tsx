import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts, type as t } from '../../constants/typography';
import { space } from '../../constants/design';
import { AREA_ACCENT, BrainArea } from '../../constants/gameConfigs';
import { computeBrainSnapshot, SnapshotResult } from '../../utils/brainSnapshot';
import { useProgressStore } from '../../stores/progressStore';
import { useSnapshotStore } from '../../stores/snapshotStore';

/**
 * Brain Snapshot overlay — shown once per day on app open.
 *
 * 5 colored dots in a pentagon, each representing a brain area. Each dot
 * pulses in sequence over ~2 seconds. A single line of summary text
 * appears below. Auto-dismisses after 3 seconds total or on tap.
 *
 * Mounted at the root of `app/_layout.tsx`. Self-gates via snapshotStore;
 * also requires at least one session before it will render.
 */

const { width, height } = Dimensions.get('window');

// Pentagon coordinates (centered on origin, radius ~58).
// Order matches the canonical AREA order so deltas line up.
const PENTAGON_RADIUS = 56;
const PENTAGON_POSITIONS = (() => {
  const positions: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 5; i++) {
    // Start at top (-90°), go clockwise.
    const angle = (-90 + i * 72) * (Math.PI / 180);
    positions.push({
      x: Math.cos(angle) * PENTAGON_RADIUS,
      y: Math.sin(angle) * PENTAGON_RADIUS,
    });
  }
  return positions;
})();

const AUTO_DISMISS_MS = 3000;

interface DotProps {
  area: BrainArea;
  position: { x: number; y: number };
  pulseDelay: number;
}

function PulsingDot({ area, position, pulseDelay }: DotProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    scale.value = withDelay(
      pulseDelay,
      withSequence(
        withTiming(1.8, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 250, easing: Easing.inOut(Easing.sin) }),
      ),
    );
    opacity.value = withDelay(
      pulseDelay,
      withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(0.55, { duration: 250, easing: Easing.inOut(Easing.sin) }),
      ),
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const color = AREA_ACCENT[area];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        dotStyle,
        {
          left: width / 2 + position.x - 6,
          top: height / 2 + position.y - 80, // -80 lifts the constellation above center
          backgroundColor: color,
          shadowColor: color,
        },
      ]}
    />
  );
}

interface Props {
  /** Optional callback when the overlay finishes (auto or manual). */
  onDismiss?: () => void;
}

export default function BrainSnapshotOverlay({ onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [snapshot, setSnapshot] = useState<SnapshotResult | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // One-shot guard: this overlay is mounted at root and persists across the
  // entire app lifecycle. We must NOT re-fire mid-flow if totalSessions
  // crosses the 1-session threshold while the user is in a session. Only
  // check exactly once when the component first mounts (cold app start).
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    // Read all state once, here, on mount only — no subscriptions.
    const snapStore = useSnapshotStore.getState();
    const progress = useProgressStore.getState();
    if (!snapStore.shouldShowToday() || progress.totalSessions < 1) return;

    const computed = computeBrainSnapshot(progress.sessions);
    setSnapshot(computed);
    setVisible(true);
    snapStore.markShownToday();

    dismissTimerRef.current = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, AUTO_DISMISS_MS);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
    // Intentionally empty deps — this effect runs exactly once per cold start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setVisible(false);
    onDismiss?.();
  };

  if (!visible || !snapshot) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={styles.overlay}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
        <View style={styles.content}>
          {/* Constellation of dots — absolutely positioned via PulsingDot */}
          {snapshot.areaOrder.map((area, i) => (
            <PulsingDot
              key={area}
              area={area}
              position={PENTAGON_POSITIONS[i]}
              pulseDelay={i * 350}
            />
          ))}

          {/* Summary text */}
          <Animated.Text
            entering={FadeIn.delay(1700).duration(500)}
            style={styles.summary}
          >
            {snapshot.text}
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(2300).duration(400)}
            style={styles.dismissHint}
          >
            TAP TO CONTINUE
          </Animated.Text>
        </View>
      </Pressable>
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
    backgroundColor: '#050710',
    zIndex: 9999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: C.t2,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 40,
    maxWidth: 280,
  },
  dismissHint: {
    ...t.microLabel,
    color: C.t4,
    marginTop: space.xxxl,
  },
});
