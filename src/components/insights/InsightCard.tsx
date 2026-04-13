import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import type { Insight } from '../../utils/insightsEngine';

interface InsightCardProps {
  insight: Insight;
  index: number;
  compact?: boolean;
}

export default function InsightCard({ insight, index, compact = false }: InsightCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 80).duration(400)}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <View style={[styles.accentBar, { backgroundColor: insight.accent }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{insight.icon}</Text>
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={compact ? 1 : 2}>
            {insight.title}
          </Text>
        </View>
        <Text style={[styles.body, compact && styles.bodyCompact]} numberOfLines={compact ? 2 : 4}>
          {insight.body}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: `${insight.accent}12` }]}>
          <Text style={[styles.typeText, { color: insight.accent }]}>
            {TYPE_LABELS[insight.type]}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const TYPE_LABELS: Record<string, string> = {
  pulse: 'Score',
  pattern: 'Pattern',
  trend: 'Trend',
  correlation: 'Link',
  milestone: 'Milestone',
  tip: 'Tip',
  discovery: 'Discovery',
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#9B72E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardCompact: {
    borderRadius: 14,
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontFamily: fonts.headingMed,
    color: C.t1,
    fontSize: 16,
    flex: 1,
    letterSpacing: -0.2,
  },
  titleCompact: {
    fontSize: 14,
  },
  body: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 14,
    lineHeight: 21,
  },
  bodyCompact: {
    fontSize: 13,
    lineHeight: 19,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
