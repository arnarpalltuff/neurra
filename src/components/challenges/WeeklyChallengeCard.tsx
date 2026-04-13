import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts, type as t } from '../../constants/typography';
import { space, radii, shadows } from '../../constants/design';
import { AREA_ACCENT } from '../../constants/gameConfigs';
import { useWeeklyChallengeStore } from '../../stores/weeklyChallengeStore';
import { useProgressStore } from '../../stores/progressStore';
import { useCoinStore } from '../../stores/coinStore';
import { tapMedium, success } from '../../utils/haptics';

interface Props {
  delay?: number;
}

/**
 * Home screen card showing the active weekly skill challenge.
 *
 * Displays: name, description, progress bar, target. If complete and
 * unclaimed, shows a Claim button that awards XP + coins.
 */
export default function WeeklyChallengeCard({ delay = 0 }: Props) {
  // Subscribe to progress so the bar re-renders when sessions update it.
  const progress = useWeeklyChallengeStore((s) => s.progress);
  const claimed = useWeeklyChallengeStore((s) => s.claimed);
  const active = useWeeklyChallengeStore((s) => s.getActive());
  const markClaimed = useWeeklyChallengeStore((s) => s.markClaimed);

  const addXP = useProgressStore((s) => s.addXP);
  const earnCoins = useCoinStore((s) => s.earnCoins);

  if (claimed) return null; // Already collected this week.

  const accent = AREA_ACCENT[active.brainArea];
  const ratio = Math.min(1, progress / active.targetSessions);
  const isComplete = progress >= active.targetSessions;

  const handleClaim = () => {
    if (!isComplete) return;
    tapMedium();
    success();
    addXP(active.reward.xp);
    earnCoins(active.reward.coins, `weekly-challenge-${active.id}`);
    markClaimed();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(450)}
      style={[styles.card, { borderLeftColor: accent }]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>WEEKLY CHALLENGE</Text>
        <Text style={[styles.areaTag, { color: accent }]}>{active.brainArea.toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{active.name}</Text>
      <Text style={styles.desc}>{active.description}</Text>

      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${ratio * 100}%`, backgroundColor: accent },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progress}/{active.targetSessions}
        </Text>
      </View>

      <View style={styles.rewardRow}>
        <Text style={styles.rewardText}>
          Reward · +{active.reward.xp} XP · +{active.reward.coins} 🪙
        </Text>
        {isComplete && (
          <Pressable
            style={[styles.claimBtn, { backgroundColor: accent }]}
            onPress={handleClaim}
          >
            <Text style={styles.claimBtnText}>Claim</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    paddingVertical: space.md,
    paddingHorizontal: space.md + 2,
    paddingLeft: space.md - 1,
    gap: space.xs + 2,
    ...shadows.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...t.sectionHeader,
    color: C.t3,
  },
  areaTag: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: C.t1,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  desc: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 13,
    lineHeight: 19,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: C.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: fonts.bodyBold,
    color: C.t2,
    fontSize: 12,
    minWidth: 32,
    textAlign: 'right',
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  rewardText: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
  },
  claimBtn: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radii.full,
  },
  claimBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
