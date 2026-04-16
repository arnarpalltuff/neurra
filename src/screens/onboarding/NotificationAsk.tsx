import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import Kova from '../../components/kova/Kova';
import Button from '../../components/ui/Button';
import { requestNotificationSetup, scheduleDefaultReminder } from '../../utils/notificationSchedule';
import FloatingParticles from '../../components/ui/FloatingParticles';
import ParticleBurst from '../../components/onboarding/ParticleBurst';
import { selection, tapMedium } from '../../utils/haptics';
import { useUserStore } from '../../stores/userStore';

interface Props {
  onDone: (enabled: boolean) => void;
}

// Full Neurra palette — revealed all at once only here, on the last screen.
const PALETTE = [C.green, C.amber, C.blue, C.purple, C.peach];

export default function NotificationAsk({ onDone }: Props) {
  const name = useUserStore(s => s.name);
  const [remindersOn, setRemindersOn] = useState(true);
  const [farewellTrigger, setFarewellTrigger] = useState(0);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, []);

  const toggleScale = useSharedValue(1);

  const toggleReminders = () => {
    selection();
    setRemindersOn(v => !v);
    toggleScale.value = withSequence(
      withSpring(1.04, { damping: 10, stiffness: 260 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
  };

  const toggleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: toggleScale.value }],
  }));

  const handleEnter = async () => {
    tapMedium();
    setFarewellTrigger(n => n + 1);

    let enabled = false;
    if (remindersOn) {
      try {
        const ok = await requestNotificationSetup();
        if (ok) await scheduleDefaultReminder();
        enabled = ok;
      } catch {
        enabled = false;
      }
    }

    // Let the particle burst play briefly before navigating away.
    doneTimerRef.current = setTimeout(() => onDone(enabled), 550);
  };

  const greeting = name ? `One last thing, ${name}.` : 'One last thing.';

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg1, '#0A0E1A', C.bg1]} style={StyleSheet.absoluteFillObject} />
      <FloatingParticles count={5} color="rgba(110,207,154,0.15)" />
      <FloatingParticles count={3} color="rgba(224,155,107,0.12)" />

      <Animated.View entering={FadeInDown.delay(80)} style={styles.kova}>
        <Kova size={110} emotion="happy" showSpeechBubble={false} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} style={styles.content}>
        <Text style={styles.title}>{greeting}</Text>
        <Text style={styles.speech}>
          Want me to nudge you when it's training time?
        </Text>

        <Animated.View style={[styles.toggleCard, toggleStyle, remindersOn && styles.toggleCardOn]}>
          <Pressable onPress={toggleReminders} style={styles.toggleInner}>
            <View style={[styles.toggleIconWrap, remindersOn && { backgroundColor: `${C.green}22` }]}>
              <Text style={[styles.toggleIcon, remindersOn && { color: C.green }]}>
                {remindersOn ? '●' : '○'}
              </Text>
            </View>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Remind me daily</Text>
              <Text style={styles.toggleSub}>A gentle nudge when it's training time</Text>
            </View>
          </Pressable>
        </Animated.View>

        <Pressable
          onPress={() => {
            selection();
            setRemindersOn(false);
          }}
          style={styles.maybeLater}
        >
          <Text style={styles.maybeLaterText}>Maybe later</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)} style={styles.btnArea}>
        {/* Particle burst anchored to button — the farewell celebration. */}
        <View style={styles.burstAnchor} pointerEvents="none">
          <ParticleBurst
            trigger={farewellTrigger}
            count={18}
            colors={PALETTE}
            spread={180}
            minSize={4}
            maxSize={9}
          />
        </View>
        <Button
          label="Enter Neurra"
          onPress={handleEnter}
          size="lg"
          style={styles.btn}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: C.bg1,
    gap: 20,
  },
  kova: {
    alignItems: 'center',
    marginBottom: 8,
  },
  content: {
    gap: 14,
  },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  speech: {
    fontFamily: fonts.kova,
    color: C.t2,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  toggleCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toggleCardOn: {
    borderColor: `${C.green}55`,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  toggleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  toggleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIcon: {
    fontSize: 16,
    color: C.t3,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 15,
  },
  toggleSub: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
    marginTop: 2,
  },
  maybeLater: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  maybeLaterText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
  },
  btnArea: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstAnchor: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 0,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    width: '100%',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 12,
  },
});
