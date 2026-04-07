import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { BrainArea } from '../../constants/gameConfigs';

const { width: SCREEN_W } = Dimensions.get('window');

// Render at Instagram Story ratio (9:16) but screen-width for capture
const CARD_W = SCREEN_W - 48;
const CARD_H = CARD_W * (16 / 9);

export interface SessionShareData {
  type: 'session';
  streak: number;
  xpEarned: number;
  bestGameName: string;
  bestGameScore: number;
  framingText: string;
  brainScores: Record<BrainArea, number>;
  date: string;
}

export interface MilestoneShareData {
  type: 'milestone';
  kind: 'streak' | 'level' | 'league';
  value: string | number;
  subtitle: string;
}

export type ShareData = SessionShareData | MilestoneShareData;

const AREA_COLORS: Record<BrainArea, string> = {
  memory: C.green,
  focus: C.blue,
  speed: C.amber,
  flexibility: C.purple,
  creativity: C.peach,
};

const AREA_LABELS: Record<BrainArea, string> = {
  memory: 'MEM',
  focus: 'FOC',
  speed: 'SPD',
  flexibility: 'FLX',
  creativity: 'CRE',
};

function BrainBar({ area, score }: { area: BrainArea; score: number }) {
  const color = AREA_COLORS[area];
  const pct = Math.max(4, Math.min(100, score));
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{AREA_LABELS[area]}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={barStyles.score}>{score}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  label: { fontFamily: fonts.bodySemi, color: C.t3, fontSize: 9, width: 26, textAlign: 'right' },
  track: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  score: { fontFamily: fonts.bodyBold, color: C.t2, fontSize: 9, width: 20, textAlign: 'right' },
});

/**
 * Shareable progress card — capture with react-native-view-shot.
 * Use `ref` to point captureRef at this component's root View.
 */
const ShareCard = forwardRef<View, { data: ShareData }>(function ShareCard({ data }, ref) {
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (data.type === 'session') {
    const areas: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];
    return (
      <View ref={ref} style={[styles.card, { width: CARD_W, height: CARD_H }]} collapsable={false}>
        <LinearGradient colors={['#080C18', '#0C1020', '#060810']} style={StyleSheet.absoluteFill} />

        {/* Top logo */}
        <View style={styles.topRow}>
          <Text style={styles.logoText}>Neurra</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>

        {/* Kova placeholder (emoji stand-in for capture context) */}
        <View style={styles.kovaArea}>
          <Text style={styles.kovaEmoji}>🌿</Text>
        </View>

        {/* Streak */}
        <View style={styles.streakRow}>
          <Text style={styles.streakFlame}>🔥</Text>
          <Text style={styles.streakNum}>{data.streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>

        {/* Best game */}
        <View style={styles.gameCard}>
          <Text style={styles.gameTitle}>{data.bestGameName}</Text>
          <Text style={styles.gameScore}>{data.bestGameScore.toLocaleString()} pts</Text>
          {data.framingText ? <Text style={styles.framingText}>{data.framingText}</Text> : null}
        </View>

        {/* Brain bars */}
        <View style={styles.barsCard}>
          <Text style={styles.barsTitle}>Brain Map</Text>
          {areas.map(a => (
            <BrainBar key={a} area={a} score={Math.round(data.brainScores[a] ?? 0)} />
          ))}
        </View>

        {/* XP */}
        <View style={styles.xpRow}>
          <Text style={styles.xpText}>+{data.xpEarned} XP earned</Text>
        </View>

        {/* Watermark */}
        <Text style={styles.watermark}>neurra.app</Text>
      </View>
    );
  }

  // Milestone card
  const milestoneEmoji = data.kind === 'streak' ? '🔥' : data.kind === 'level' ? '⭐' : '🏆';
  const bg: [string, string] =
    data.kind === 'streak' ? ['#180A06', '#0C0402'] :
    data.kind === 'level' ? ['#181206', '#0C0A02'] :
    ['#100A18', '#080612'];

  return (
    <View ref={ref} style={[styles.card, { width: CARD_W, height: CARD_H }]} collapsable={false}>
      <LinearGradient colors={[...bg, '#050710']} style={StyleSheet.absoluteFill} />

      <View style={styles.topRow}>
        <Text style={styles.logoText}>Neurra</Text>
        <Text style={styles.dateText}>{today}</Text>
      </View>

      <View style={styles.milestoneCenter}>
        <Text style={styles.milestoneEmoji}>{milestoneEmoji}</Text>
        <Text style={styles.milestoneValue}>{data.value}</Text>
        <Text style={styles.milestoneSubtitle}>{data.subtitle}</Text>
      </View>

      <Text style={styles.watermark}>neurra.app</Text>
    </View>
  );
});

export default ShareCard;
export { CARD_W, CARD_H };

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: fonts.heading,
    color: C.green,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  dateText: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
  },
  kovaArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  kovaEmoji: { fontSize: 64 },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 12,
  },
  streakFlame: { fontSize: 28 },
  streakNum: {
    fontFamily: fonts.heading,
    color: C.amber,
    fontSize: 48,
    letterSpacing: -2,
  },
  streakLabel: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 14,
  },
  gameCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gameTitle: {
    fontFamily: fonts.headingMed,
    color: C.t2,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gameScore: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  framingText: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  barsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  barsTitle: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  xpRow: { alignItems: 'center' },
  xpText: {
    fontFamily: fonts.bodySemi,
    color: C.amber,
    fontSize: 14,
  },
  watermark: {
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.18)',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  // Milestone
  milestoneCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  milestoneEmoji: { fontSize: 80 },
  milestoneValue: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 52,
    letterSpacing: -2,
    textAlign: 'center',
  },
  milestoneSubtitle: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
});
