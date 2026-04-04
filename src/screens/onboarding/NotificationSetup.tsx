import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import Kova from '../../components/kova/Kova';
import Button from '../../components/ui/Button';

interface NotificationSetupProps {
  onEnable: () => void;
  onSkip: () => void;
}

export default function NotificationSetup({ onEnable, onSkip }: NotificationSetupProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100)} style={styles.kovaArea}>
        <Kova size={120} emotion="curious" showSpeechBubble={false} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300)} style={styles.content}>
        <Text style={styles.title}>Stay on track</Text>
        <Text style={styles.description}>
          I'll remind you once a day when it's training time.{'\n'}
          Just once — I'm not annoying.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500)} style={styles.actions}>
        <Button
          label="Sure, remind me"
          onPress={onEnable}
          size="lg"
          style={styles.btn}
        />
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn} accessibilityLabel="Maybe later">
          <Text style={styles.skipText}>Maybe later</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 28,
    paddingVertical: 70,
  },
  kovaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 14,
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    color: colors.textHero,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  btn: { width: '100%' },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 15,
  },
});
