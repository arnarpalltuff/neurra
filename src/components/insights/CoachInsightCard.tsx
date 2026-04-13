import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';

interface CoachInsightCardProps {
  insight: string;
  delay?: number;
}

export default function CoachInsightCard({ insight, delay = 0 }: CoachInsightCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.card}>
      <View style={styles.leftBorder} />
      <View style={styles.content}>
        <Text style={styles.label}>🧠 AI Coach</Text>
        <Text style={styles.insightText}>{insight}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#9B72E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  leftBorder: {
    width: 3,
    backgroundColor: C.purple,
  },
  content: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
    gap: 4,
  },
  label: {
    fontFamily: fonts.bodySemi,
    color: C.purple,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  insightText: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 14,
    lineHeight: 20,
  },
});
