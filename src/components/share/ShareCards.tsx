import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Share, Pressable, Alert } from 'react-native';
import { colors } from '../../constants/colors';
import { useProgressStore, BrainScores } from '../../stores/progressStore';
import { stageFromXP, stageNames } from '../kova/KovaStates';
import Kova from '../kova/Kova';

const CARD_W = Dimensions.get('window').width - 48;
const CARD_H = CARD_W * (1920 / 1080);

// ── Session Card ─────────────────────────────────────

interface SessionCardProps {
  score: number;
  accuracy: number;
  gameName: string;
  gameIcon: string;
  streak: number;
  date: string;
}

export function SessionShareCard({ score, accuracy, gameName, gameIcon, streak, date }: SessionCardProps) {
  const { xp } = useProgressStore();
  const stage = stageFromXP(xp);

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        <Text style={styles.logo}>NEURRA</Text>

        <View style={styles.kovaCenter}>
          <Kova stage={stage} emotion="proud" size={80} showSpeechBubble={false} />
        </View>

        <View style={styles.streakBig}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>

        <View style={styles.highlightCard}>
          <Text style={styles.highlightIcon}>{gameIcon}</Text>
          <View style={styles.highlightInfo}>
            <Text style={styles.highlightName}>{gameName}</Text>
            <Text style={styles.highlightScore}>{score} pts · {Math.round(accuracy * 100)}%</Text>
          </View>
        </View>

        <Text style={styles.date}>{date}</Text>
        <Text style={styles.watermark}>neurra.app</Text>
      </View>
    </View>
  );
}

// ── Weekly Report Card ───────────────────────────────

interface WeeklyCardProps {
  daysActive: boolean[]; // Mon-Sun
  bestArea: string;
  improvement: number;
  streak: number;
  league: string;
}

export function WeeklyShareCard({ daysActive, bestArea, improvement, streak, league }: WeeklyCardProps) {
  const { xp } = useProgressStore();
  const stage = stageFromXP(xp);

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        <Text style={styles.logo}>NEURRA</Text>
        <Text style={styles.weeklyTitle}>My week in Neurra</Text>

        <View style={styles.kovaCenter}>
          <Kova stage={stage} emotion="happy" size={70} showSpeechBubble={false} />
        </View>

        {/* Calendar heatmap */}
        <View style={styles.heatmap}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <View key={i} style={styles.heatmapDay}>
              <View style={[styles.heatmapDot, daysActive[i] && styles.heatmapDotActive]} />
              <Text style={styles.heatmapLabel}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.weeklyStats}>
          <View style={styles.weeklyStatItem}>
            <Text style={styles.weeklyStatValue}>+{improvement}%</Text>
            <Text style={styles.weeklyStatLabel}>{bestArea}</Text>
          </View>
          <View style={styles.weeklyStatDivider} />
          <View style={styles.weeklyStatItem}>
            <Text style={styles.weeklyStatValue}>{streak}d</Text>
            <Text style={styles.weeklyStatLabel}>Streak</Text>
          </View>
          <View style={styles.weeklyStatDivider} />
          <View style={styles.weeklyStatItem}>
            <Text style={styles.weeklyStatValue}>{league}</Text>
            <Text style={styles.weeklyStatLabel}>League</Text>
          </View>
        </View>

        <Text style={styles.watermark}>neurra.app</Text>
      </View>
    </View>
  );
}

// ── Milestone Card ───────────────────────────────────

interface MilestoneCardProps {
  type: 'streak' | 'level' | 'league' | 'evolution';
  value: string;
  subtitle: string;
}

export function MilestoneShareCard({ type, value, subtitle }: MilestoneCardProps) {
  const { xp } = useProgressStore();
  const stage = stageFromXP(xp);

  const emojis: Record<string, string> = {
    streak: '🔥',
    level: '⬆️',
    league: '🏆',
    evolution: '✨',
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        <Text style={styles.logo}>NEURRA</Text>

        <View style={styles.kovaCenter}>
          <Kova stage={stage} emotion="proud" size={90} showSpeechBubble={false} />
        </View>

        <Text style={styles.milestoneEmoji}>{emojis[type]}</Text>
        <Text style={styles.milestoneValue}>{value}</Text>
        <Text style={styles.milestoneSubtitle}>{subtitle}</Text>

        <Text style={styles.watermark}>neurra.app</Text>
      </View>
    </View>
  );
}

// ── Share Button ─────────────────────────────────────

interface ShareButtonProps {
  message: string;
}

export function ShareButton({ message }: ShareButtonProps) {
  const handleShare = useCallback(async () => {
    try {
      // In production: capture card as image with react-native-view-shot
      // then share the image. For now, share text.
      await Share.share({
        message: `${message}\n\nTrain your brain with Neurra — neurra.app`,
      });
    } catch {
      // User cancelled share
    }
  }, [message]);

  return (
    <Pressable style={styles.shareBtn} onPress={handleShare}>
      <Text style={styles.shareBtnText}>Share</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Card base
  card: {
    width: CARD_W,
    aspectRatio: 1080 / 1920,
    maxHeight: 400,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInner: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: colors.growth,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  kovaCenter: {
    alignItems: 'center',
    marginVertical: 8,
  },
  watermark: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.5,
  },

  // Session card
  streakBig: { alignItems: 'center', gap: 2 },
  streakNumber: { color: colors.streak, fontSize: 36, fontWeight: '900' },
  streakLabel: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
  },
  highlightIcon: { fontSize: 24 },
  highlightInfo: { flex: 1 },
  highlightName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  highlightScore: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
  date: { color: colors.textTertiary, fontSize: 11 },

  // Weekly card
  weeklyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  heatmap: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
  },
  heatmapDay: { alignItems: 'center', gap: 4 },
  heatmapDot: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.bgTertiary,
  },
  heatmapDotActive: { backgroundColor: colors.growth },
  heatmapLabel: { color: colors.textTertiary, fontSize: 10, fontWeight: '600' },
  weeklyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  weeklyStatItem: { alignItems: 'center', gap: 2 },
  weeklyStatValue: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  weeklyStatLabel: { color: colors.textTertiary, fontSize: 10, fontWeight: '600' },
  weeklyStatDivider: { width: 1, height: 24, backgroundColor: colors.border },

  // Milestone card
  milestoneEmoji: { fontSize: 40 },
  milestoneValue: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '900',
  },
  milestoneSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Share button
  shareBtn: {
    backgroundColor: colors.sky,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  shareBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
