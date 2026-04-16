import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii, accentGlow } from '../../constants/design';
import Kova from '../kova/Kova';
import { useKovaStore } from '../../stores/kovaStore';
import { useProgressStore } from '../../stores/progressStore';
import { STORE_EMOTION_TO_VISUAL, clampStage } from '../../utils/kovaMapping';
import {
  getKovaInsight,
  type BrainTrendResult,
} from '../../utils/insightsEngine';

interface KovaBrainCoachProps {
  trend: BrainTrendResult;
}

export default React.memo(function KovaBrainCoach({ trend }: KovaBrainCoachProps) {
  const brainScores = useProgressStore(s => s.brainScores);
  const sessions = useProgressStore(s => s.sessions);
  const streak = useProgressStore(s => s.streak);
  const gameHistory = useProgressStore(s => s.gameHistory);
  const currentStage = useKovaStore(s => s.currentStage);
  const currentEmotion = useKovaStore(s => s.currentEmotion);

  const insight = useMemo(
    () => getKovaInsight({ brainScores, sessions, streak, gameHistory, trend }),
    [brainScores, sessions, streak, gameHistory, trend],
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(150).duration(450).springify().damping(16)}
      style={[styles.card, accentGlow(C.peach, 16, 0.22)]}
    >
      <Kova
        stage={clampStage(currentStage)}
        emotion={STORE_EMOTION_TO_VISUAL[currentEmotion] ?? 'idle'}
        size={48}
        showSpeechBubble={false}
      />
      <View style={styles.textCol}>
        <Text style={styles.speech}>{insight.text}</Text>
        <Text style={styles.basedOn}>{insight.basedOn}</Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm + 2,
    padding: space.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(26,34,53,0.92)',
    borderWidth: 1,
    borderColor: `${C.peach}1A`,
  },
  textCol: {
    flex: 1,
    gap: 6,
  },
  speech: {
    fontFamily: fonts.kova,
    fontSize: 16,
    color: C.t1,
    lineHeight: 22,
  },
  basedOn: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t4,
    letterSpacing: 0.2,
  },
});
