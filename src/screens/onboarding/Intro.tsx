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

      <Animated.View entering={FadeInDown.delay(600)} style={styles.stepsPreview}>
        <Text style={styles.stepsTitle}>Here's what's next (~2 min)</Text>
        {[
          { icon: '🧠', label: 'Quick brain assessment' },
          { icon: '📊', label: 'Your brain profile' },
          { icon: '✨', label: 'Personalize your experience' },
        ].map((item, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepIcon}>{item.icon}</Text>
            <Text style={styles.stepText}>{item.label}</Text>
          </View>
        ))}
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
    paddingVertical: 70,
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
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  bubbleText: {
    fontFamily: 'Caveat_400Regular',
    color: colors.textHero,
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 28,
  },
  description: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsPreview: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    width: '100%',
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  stepsTitle: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: { fontSize: 18 },
  stepText: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    fontSize: 14,
  },
  btnArea: {
    width: '100%',
    marginTop: 24,
  },
  btn: {
    width: '100%',
  },
});
