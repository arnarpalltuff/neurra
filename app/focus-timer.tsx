import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { C } from '../src/constants/colors';
import { fonts, type as t } from '../src/constants/typography';
import { space, radii, accentGlow, pillButton } from '../src/constants/design';
import Kova from '../src/components/kova/Kova';
import { useProgressStore } from '../src/stores/progressStore';
import { tapLight, tapMedium, success } from '../src/utils/haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DURATION_OPTIONS = [15, 25, 45] as const;
type DurationMin = typeof DURATION_OPTIONS[number];

const RING_SIZE = 240;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Focus Timer mode — pomodoro-style focus session with Kova as companion.
 *
 * Three phases: select duration → running → complete. Awards 1 XP per
 * minute on completion. No game logic — pure presence + breathing.
 */
export default function FocusTimerScreen() {
  const [phase, setPhase] = useState<'select' | 'running' | 'done'>('select');
  const [duration, setDuration] = useState<DurationMin>(25);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const ringProgress = useSharedValue(0);

  const addXP = useProgressStore((s) => s.addXP);

  // Cleanup — clear interval and flip mounted flag so any in-flight tick
  // can't setState after unmount.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const totalSeconds = duration * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);

  const startTimer = () => {
    tapMedium();
    setPhase('running');
    setElapsed(0);
    ringProgress.value = withTiming(1, {
      duration: totalSeconds * 1000,
      easing: Easing.linear,
    });
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          handleComplete();
        }
        return next;
      });
    }, 1000);
  };

  const handleComplete = () => {
    if (!mountedRef.current) return;
    success();
    addXP(duration); // 1 XP per minute
    setPhase('done');
  };

  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    tapLight();
    router.back();
  };

  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - ringProgress.value),
  }));

  // ── Phase: select duration ──────────────────────────────────────────
  if (phase === 'select') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.selectContent}>
          <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.kovaArea}>
            <Kova size={140} emotion="zen" showSpeechBubble={false} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.label}>
            FOCUS TIMER
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(280).duration(500)} style={styles.title}>
            How long do you want to focus?
          </Animated.Text>

          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((d, i) => (
              <Animated.View
                key={d}
                entering={FadeInDown.delay(360 + i * 80).duration(400)}
              >
                <Pressable
                  style={[
                    styles.durationBtn,
                    duration === d && styles.durationBtnActive,
                  ]}
                  onPress={() => {
                    tapLight();
                    setDuration(d);
                  }}
                >
                  <Text style={[styles.durationNumber, duration === d && styles.durationNumberActive]}>
                    {d}
                  </Text>
                  <Text style={styles.durationUnit}>min</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={FadeInDown.delay(640).duration(400)} style={styles.actionRow}>
            <Pressable style={styles.startBtn} onPress={startTimer}>
              <Text style={styles.startBtnText}>Begin</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Phase: running ──────────────────────────────────────────────────
  if (phase === 'running') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.runningContent}>
          <Text style={styles.runningLabel}>FOCUSING</Text>

          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              {/* Background track */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={C.surface}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              {/* Progress ring — animated */}
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={C.green}
                strokeWidth={RING_STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                animatedProps={ringAnimatedProps}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>

            {/* Centered Kova + time */}
            <View style={styles.ringCenter}>
              <Kova size={90} emotion="zen" showSpeechBubble={false} />
              <Text style={styles.timeText}>{formatTime(remaining)}</Text>
            </View>
          </View>

          <Text style={styles.runningHint}>Stay with it. Kova's right here.</Text>

          <Pressable style={styles.endBtn} onPress={handleCancel}>
            <Text style={styles.endBtnText}>End Early</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Phase: done ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.doneContent}>
        <Animated.View entering={FadeIn.delay(100).duration(500)}>
          <Kova size={140} emotion="proud" showSpeechBubble={false} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(250).duration(500)} style={styles.doneTitle}>
          Done.
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(330).duration(500)} style={styles.doneSubtitle}>
          {duration} minutes of pure focus. That counts for a lot.
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(410).duration(500)} style={styles.doneXp}>
          +{duration} XP
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Pressable style={styles.startBtn} onPress={() => router.back()}>
            <Text style={styles.startBtnText}>Done</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg1,
  },

  // ── Select phase ────────────────────────────────────────────────
  selectContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.xl,
  },
  kovaArea: {
    alignItems: 'center',
  },
  label: {
    ...t.sectionHeader,
    color: C.t3,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: C.t1,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: -space.md,
  },
  durationRow: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.sm,
  },
  durationBtn: {
    width: 88,
    height: 88,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  durationBtnActive: {
    borderColor: C.green,
    backgroundColor: 'rgba(110,207,154,0.08)',
  },
  durationNumber: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: C.t2,
    letterSpacing: -1,
  },
  durationNumberActive: {
    color: C.green,
  },
  durationUnit: {
    ...t.microLabel,
    color: C.t3,
  },
  actionRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
  startBtn: {
    backgroundColor: C.green,
    paddingHorizontal: 48,
    height: pillButton.height,
    borderRadius: pillButton.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    ...accentGlow(C.green, 16, 0.4),
  },
  startBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
    fontSize: 17,
    letterSpacing: 0.3,
  },
  cancelBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  cancelBtnText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 14,
  },

  // ── Running phase ────────────────────────────────────────────────
  runningContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.xl,
  },
  runningLabel: {
    ...t.sectionHeader,
    color: C.t3,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  timeText: {
    fontFamily: fonts.heading,
    fontSize: 44,
    color: C.t1,
    letterSpacing: -1.2,
    marginTop: space.sm,
  },
  runningHint: {
    fontFamily: fonts.kova,
    fontSize: 17,
    color: C.t2,
    textAlign: 'center',
  },
  endBtn: {
    paddingHorizontal: space.xl,
    paddingVertical: space.sm + 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: C.border,
  },
  endBtnText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // ── Done phase ───────────────────────────────────────────────────
  doneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.lg,
  },
  doneTitle: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: C.t1,
    letterSpacing: -0.8,
  },
  doneSubtitle: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
  doneXp: {
    fontFamily: fonts.heading,
    fontSize: 44,
    color: C.amber,
    letterSpacing: -1.2,
    textShadowColor: 'rgba(240,181,66,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    marginVertical: space.sm,
  },
});
