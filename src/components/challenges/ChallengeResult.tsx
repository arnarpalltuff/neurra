import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { glow } from '../../utils/glow';
import PressableScale from '../ui/PressableScale';
import { CHALLENGE_XP_BONUS } from '../../constants/challenges';

interface ChallengeResultProps {
  score: number;
  total: number;
  realWorldFraming: string;
  onDone: () => void;
}

export default function ChallengeResult({
  score,
  total,
  realWorldFraming,
  onDone,
}: ChallengeResultProps) {
  const pct = Math.round((score / Math.max(total, 1)) * 100);
  const great = pct >= 80;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.card}>
        <Text style={styles.emoji}>{great ? '🎯' : '💪'}</Text>
        <Text style={styles.scoreText}>
          {score}/{total} correct
        </Text>
        <Text style={styles.framingText}>{realWorldFraming}</Text>

        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{CHALLENGE_XP_BONUS} bonus XP 🎯</Text>
        </View>

        <PressableScale style={styles.doneBtn} onPress={onDone}>
          <Text style={styles.doneBtnText}>Nice</Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: C.bg2,
  },
  card: {
    alignItems: 'center',
    gap: 16,
    maxWidth: 320,
  },
  emoji: {
    fontSize: 56,
  },
  scoreText: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 28,
  },
  framingText: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  xpBadge: {
    backgroundColor: 'rgba(240,181,66,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(240,181,66,0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  xpText: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 14,
  },
  doneBtn: {
    borderWidth: 1.5,
    borderColor: C.green,
    borderRadius: 24,
    paddingHorizontal: 40,
    paddingVertical: 12,
    marginTop: 12,
  },
  doneBtnText: {
    fontFamily: fonts.bodySemi,
    color: C.green,
    fontSize: 16,
  },
});
