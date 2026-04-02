import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import Kova from '../../components/kova/Kova';
import Button from '../../components/ui/Button';

interface IntroProps {
  onNext: () => void;
}

export default function Intro({ onNext }: IntroProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.delay(200)} style={styles.kovaArea}>
        <Kova
          stage={1}
          emotion="curious"
          size={130}
          showSpeechBubble={false}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)} style={styles.content}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            Hi. I'm Kova.{'\n'}I'm small now... but I grow when you do.
          </Text>
        </View>
        <Text style={styles.description}>
          Kova is your brain training companion.{'\n'}
          The more you train, the more Kova evolves.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(700)} style={styles.btnArea}>
        <Button
          label="Nice to meet you, Kova"
          onPress={onNext}
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
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 28,
  },
  kovaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  bubble: {
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  btnArea: {
    width: '100%',
    marginTop: 24,
  },
  btn: {
    width: '100%',
  },
});
