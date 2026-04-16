import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii, accentGlow } from '../../constants/design';
import { useProgressStore } from '../../stores/progressStore';
import {
  getPersonalBests,
  type PersonalBest,
} from '../../utils/insightsEngine';

const CARD_W = 110;
const CARD_GAP = 10;

function formatBestValue(pb: PersonalBest): string {
  switch (pb.metric) {
    case 'accuracy':
      return `${Math.round(pb.bestValue)}%`;
    case 'duration':
      return `${Math.round(pb.bestValue)}s`;
    case 'points':
    default:
      return pb.bestValue >= 1000
        ? `${(pb.bestValue / 1000).toFixed(1)}k`
        : `${Math.round(pb.bestValue)}`;
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

const keyExtractor = (item: PersonalBest) => item.gameId;
const Separator = () => <View style={{ width: CARD_GAP }} />;

const BestCard = React.memo(function BestCard({ pb }: { pb: PersonalBest }) {
  return (
    <View
      style={[
        styles.card,
        accentGlow(pb.accent, 10, 0.18),
        { borderColor: `${pb.accent}33` },
      ]}
    >
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {formatBestValue(pb)}
      </Text>
      <Text style={styles.metric}>{pb.metricLabel}</Text>
      <Text style={[styles.gameName, { color: pb.accent }]} numberOfLines={1}>
        {pb.gameName}
      </Text>
      <Text style={styles.date}>{formatDate(pb.date)}</Text>
      {pb.isRecent && (
        <View style={styles.newBadge}>
          <Text style={styles.newText}>NEW</Text>
        </View>
      )}
    </View>
  );
});

function Ghost() {
  return (
    <View style={styles.ghostRow}>
      {[0, 1, 2].map(i => (
        <View key={i} style={styles.ghostCard} />
      ))}
    </View>
  );
}

export default React.memo(function PersonalBests() {
  const gameHistory = useProgressStore(s => s.gameHistory);

  const bests = useMemo(() => getPersonalBests(gameHistory), [gameHistory]);
  const recentCount = useMemo(() => bests.filter(b => b.isRecent).length, [bests]);

  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <Text style={styles.eyebrow}>PERSONAL BESTS</Text>

      {bests.length === 0 ? (
        <>
          <Ghost />
          <Text style={styles.empty}>Play games to start setting records.</Text>
        </>
      ) : (
        <>
          <FlatList
            horizontal
            data={bests}
            keyExtractor={keyExtractor}
            renderItem={({ item }) => <BestCard pb={item} />}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + CARD_GAP}
            decelerationRate="fast"
            ItemSeparatorComponent={Separator}
            contentContainerStyle={styles.listContent}
          />
          {recentCount > 0 && (
            <Text style={styles.summary}>
              {recentCount} new personal best{recentCount === 1 ? '' : 's'} this week
            </Text>
          )}
        </>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.t3,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingVertical: 4,
    paddingRight: 20,
  },
  card: {
    width: CARD_W,
    height: 130,
    borderRadius: radii.md,
    backgroundColor: 'rgba(19,24,41,0.9)',
    borderWidth: 1,
    padding: space.sm + 2,
    justifyContent: 'space-between',
  },
  value: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: C.t1,
    letterSpacing: -0.6,
  },
  metric: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t3,
    marginTop: -2,
  },
  gameName: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.1,
    marginTop: 4,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: C.t4,
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: C.green,
  },
  newText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    color: '#0C1018',
    letterSpacing: 0.8,
  },
  summary: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: C.t3,
  },
  ghostRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  ghostCard: {
    width: CARD_W,
    height: 130,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
  },
});
