import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay,
  FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { Svg, Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { colors } from '../../constants/colors';
import Kova from '../../components/kova/Kova';
import Button from '../../components/ui/Button';

const { width } = Dimensions.get('window');

interface BrainProfileProps {
  scores: { memory: number; focus: number; creativity: number };
  onNext: () => void;
}

function scoreToText(score: number, area: string): string {
  if (area === 'memory') {
    if (score >= 80) return "You catch things others miss.";
    if (score >= 60) return "Your memory is solid. Let's make it sharper.";
    return "Your memory is ready to grow.";
  }
  if (area === 'focus') {
    if (score >= 80) return "Good focus! Especially for a first try.";
    if (score >= 60) return "Your attention is there — let's sharpen it.";
    return "Focus is a skill. You're building it now.";
  }
  if (area === 'creativity') {
    if (score >= 80) return "Your verbal fluency is strong.";
    if (score >= 60) return "Good creative thinking. Lots of room to grow.";
    return "Creativity grows with practice.";
  }
  return '';
}

interface PetalProps {
  score: number;
  angle: number; // degrees
  label: string;
  subtext: string;
  color: string;
  delay: number;
}

function Petal({ score, angle, label, subtext, color, delay }: PetalProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 8, stiffness: 100 });
    }, delay);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const size = 90 + (score / 100) * 30;
  const opacity = 0.4 + (score / 100) * 0.6;

  return (
    <Animated.View style={[styles.petal, style, { transform: [{ rotate: `${angle}deg` }] }]}>
      <View style={[styles.petalShape, { width: size, height: size * 1.4, backgroundColor: color, opacity, borderRadius: size * 0.5 }]} />
    </Animated.View>
  );
}

export default function BrainProfile({ scores, onNext }: BrainProfileProps) {
  const areas = [
    { key: 'memory', label: 'Noticing Details', score: scores.memory, color: colors.growth, angle: -90 },
    { key: 'focus', label: 'Staying Focused', score: scores.focus, color: colors.sky, angle: 30 },
    { key: 'creativity', label: 'Remembering Things', score: scores.creativity, color: colors.lavender, angle: 150 },
  ];

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeIn.delay(100)} style={styles.title}>
        Your Starting Point
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(200)} style={styles.subtitle}>
        Not a grade — a beginning.
      </Animated.Text>

      {/* Petal visualization */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.petalContainer}>
        {areas.map((area, i) => (
          <Petal
            key={area.key}
            score={area.score}
            angle={area.angle}
            label={area.label}
            subtext={scoreToText(area.score, area.key)}
            color={area.color}
            delay={400 + i * 200}
          />
        ))}
        <View style={styles.petalCenter}>
          <Kova size={50} emotion="proud" showSpeechBubble={false} />
        </View>
      </Animated.View>

      {/* Score cards */}
      <View style={styles.scoreCards}>
        {areas.map((area, i) => (
          <Animated.View entering={FadeInDown.delay(500 + i * 100)} key={area.key} style={styles.scoreCard}>
            <View style={[styles.scoreBar, { backgroundColor: colors.surfaceDim }]}>
              <View style={[styles.scoreFill, { width: `${area.score}%`, backgroundColor: area.color }]} />
            </View>
            <Text style={styles.scoreAreaLabel}>{area.label}</Text>
            <Text style={styles.scoreAreaText}>{scoreToText(area.score, area.key)}</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(900)} style={styles.btnArea}>
        <Text style={styles.kovaLine}>I can already see you growing.</Text>
        <Button label="Start training" onPress={onNext} size="lg" style={styles.btn} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    color: colors.textHero,
    fontSize: 28,
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Caveat_400Regular',
    color: colors.textTertiary,
    fontSize: 18,
  },
  petalContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  petal: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 120,
    height: 120,
  },
  petalShape: {
    transform: [{ translateY: -30 }],
  },
  petalCenter: {
    position: 'absolute',
    zIndex: 10,
  },
  scoreCards: {
    width: '100%',
    gap: 10,
  },
  scoreCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  scoreBar: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 999,
  },
  scoreAreaLabel: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textPrimary,
    fontSize: 14,
  },
  scoreAreaText: {
    fontFamily: 'Caveat_400Regular',
    color: colors.textSecondary,
    fontSize: 15,
  },
  btnArea: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  kovaLine: {
    fontFamily: 'Caveat_700Bold',
    color: colors.growth,
    fontSize: 18,
    textAlign: 'center',
  },
  btn: { width: '100%' },
});
