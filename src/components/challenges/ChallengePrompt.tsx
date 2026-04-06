import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { glow } from '../../utils/glow';
import PressableScale from '../ui/PressableScale';
import type { Challenge } from '../../constants/challenges';

interface ChallengePromptProps {
  challenge: Challenge;
  storyMode: boolean;
  onAccept: () => void;
  onSkip: () => void;
}

export default function ChallengePrompt({
  challenge,
  storyMode,
  onAccept,
  onSkip,
}: ChallengePromptProps) {
  const description = storyMode && challenge.storyFraming
    ? challenge.storyFraming
    : challenge.description;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.card}>
        <Text style={styles.badge}>REAL-LIFE CHALLENGE</Text>
        <Text style={styles.icon}>{challenge.icon}</Text>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.time}>~{challenge.estimatedTime} seconds</Text>

        <PressableScale style={styles.acceptBtn} onPress={onAccept}>
          <Text style={styles.acceptText}>Let's Do It</Text>
        </PressableScale>

        <PressableScale onPress={onSkip}>
          <Text style={styles.skipText}>Maybe Later</Text>
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
    gap: 12,
    maxWidth: 340,
  },
  badge: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 4,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 22,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  time: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 13,
  },
  acceptBtn: {
    backgroundColor: C.amber,
    borderRadius: 26,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 12,
    ...glow(C.amber),
  },
  acceptText: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
    fontSize: 16,
  },
  skipText: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 14,
    marginTop: 8,
  },
});
