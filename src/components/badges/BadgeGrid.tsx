import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../../constants/colors';
import { fonts, type as t } from '../../constants/typography';
import { space, radii, shadows } from '../../constants/design';
import { BADGES } from '../../constants/badges';
import { useAchievementStore } from '../../stores/achievementStore';

/**
 * Profile-tab badge gallery. Renders all 25 badges in a grid; locked
 * badges are shown as dim silhouettes with `???`.
 */
export default function BadgeGrid() {
  const unlocked = useAchievementStore((s) => s.unlocked);
  const unlockedSet = new Set(unlocked.map((u) => u.id));
  const totalCount = BADGES.length;
  const unlockedCount = unlocked.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>BADGES</Text>
        <Text style={styles.count}>
          {unlockedCount}/{totalCount}
        </Text>
      </View>
      <View style={styles.grid}>
        {BADGES.map((badge) => {
          const isUnlocked = unlockedSet.has(badge.id);
          return (
            <View
              key={badge.id}
              style={[styles.tile, !isUnlocked && styles.tileLocked]}
            >
              <Text style={[styles.icon, !isUnlocked && styles.iconLocked]}>
                {isUnlocked ? badge.icon : '🔒'}
              </Text>
              <Text style={[styles.name, !isUnlocked && styles.nameLocked]} numberOfLines={1}>
                {isUnlocked ? badge.name : '???'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm + 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 2,
  },
  label: {
    ...t.sectionHeader,
    color: C.t3,
  },
  count: {
    fontFamily: fonts.bodyBold,
    color: C.t2,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  tile: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xs,
    gap: 2,
    ...shadows.subtle,
  },
  tileLocked: {
    backgroundColor: C.bg1,
    opacity: 0.5,
  },
  icon: {
    fontSize: 26,
  },
  iconLocked: {
    fontSize: 18,
    opacity: 0.5,
  },
  name: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 9,
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  nameLocked: {
    color: C.t4,
  },
});
