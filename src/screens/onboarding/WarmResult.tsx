import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { glow } from '../../utils/glow';
import Kova from '../../components/kova/Kova';
import { KovaEmotion } from '../../components/kova/KovaStates';
import Button from '../../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../../components/ui/FloatingParticles';

interface WarmResultProps {
  accuracy: number;
  onNext: () => void;
}

export default function WarmResult({ accuracy, onNext }: WarmResultProps) {
  const pct = Math.round(accuracy * 100);

  let message: string;
  let emotion: KovaEmotion;
  if (pct >= 90) {
    message = `${pct}% on your first try? That's rare. Your reflexes are seriously fast.`;
    emotion = 'proud';
  } else if (pct >= 75) {
    message = "Sharp instincts. Most people score lower on their first round. You're ahead of the curve.";
    emotion = 'proud';
  } else if (pct >= 60) {
    message = "Solid start. Your brain picked up the pattern quickly — that's a good sign.";
    emotion = 'happy';
  } else if (pct >= 40) {
    message = "Not bad at all. This game gets easier as your brain learns the rhythm. You'll surprise yourself.";
    emotion = 'happy';
  } else {
    message = "That was just the warm-up. The real training starts now — and your brain will get faster every day.";
    emotion = 'encouraging';
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg1, '#0A0E1A', C.bg1]} style={StyleSheet.absoluteFillObject} />
      <FloatingParticles count={6} color="rgba(110,207,154,0.12)" />
      <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.kovaArea}>
        <Kova stage={1} emotion={emotion as KovaEmotion} size={120} showSpeechBubble={false} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.content}>
        <Text style={styles.scoreBig}>{pct}%</Text>
        <Text style={styles.scoreLabel}>accuracy</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.messageArea}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{message}</Text>
        </View>
        <Text style={styles.subText}>
          I'll grow stronger with every session you complete.{'\n'}
          Let's begin.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.btnArea}>
        <Button label="Let's go" onPress={onNext} size="lg" style={styles.btn} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 24,
  },
  kovaArea: {
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  scoreBig: {
    fontFamily: fonts.bodyBold,
    color: C.green,
    fontSize: 56,
    letterSpacing: -1,
    ...glow(C.green, 16, 0.3),
  },
  scoreLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -4,
  },
  messageArea: {
    alignItems: 'center',
    gap: 12,
  },
  bubble: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubbleText: {
    fontFamily: fonts.kova,
    color: C.t1,
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 28,
  },
  subText: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnArea: {
    width: '100%',
    marginTop: 8,
  },
  btn: { width: '100%' },
});
