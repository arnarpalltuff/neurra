import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { selection } from '../../utils/haptics';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii, accentGlow } from '../../constants/design';
import { BADGES, type BadgeDef } from '../../constants/badges';
import { useAchievementStore, type UnlockedBadge } from '../../stores/achievementStore';
import PressableScale from '../ui/PressableScale';
import SectionHeader from '../home/SectionHeader';

const TILE_W = 72;
const TILE_H = 80;
const TILE_GAP = 16;
const SNAP = TILE_W + TILE_GAP;

const CATEGORY_ACCENT: Record<BadgeDef['category'], string> = {
  milestone: C.green,
  streak: C.amber,
  mastery: C.purple,
  exploration: C.blue,
  special: C.peach,
};

function relativeTime(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface Tile {
  badge: BadgeDef;
  unlocked: boolean;
  unlockedAt?: number;
}

const keyExtractor = (item: Tile) => item.badge.id;
const TileSeparator = () => <View style={{ width: TILE_GAP }} />;

const BadgeTile = React.memo(function BadgeTile({
  tile,
  onPress,
  active,
}: {
  tile: Tile;
  onPress: (id: string) => void;
  active: boolean;
}) {
  const accent = CATEGORY_ACCENT[tile.badge.category];
  return (
    <PressableScale
      onPress={() => onPress(tile.badge.id)}
      style={[
        styles.tile,
        tile.unlocked
          ? [accentGlow(accent, 10, 0.2), { borderColor: `${accent}55` }]
          : styles.tileLocked,
        active && { borderColor: accent },
      ]}
    >
      <Text style={[styles.icon, !tile.unlocked && styles.iconLocked]}>
        {tile.badge.icon}
      </Text>
      <Text
        style={[
          styles.tileName,
          { color: tile.unlocked ? C.t2 : C.t4 },
        ]}
        numberOfLines={1}
      >
        {tile.badge.name}
      </Text>
      {!tile.unlocked && (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={8} color={C.t4} />
        </View>
      )}
    </PressableScale>
  );
});

export default React.memo(function AchievementShowcase() {
  const unlocked = useAchievementStore(s => s.unlocked);
  const [activeId, setActiveId] = useState<string | null>(null);

  const unlockedMap = useMemo(() => {
    const m = new Map<string, UnlockedBadge>();
    unlocked.forEach(u => m.set(u.id, u));
    return m;
  }, [unlocked]);

  const tiles = useMemo<Tile[]>(() => {
    const earned: Tile[] = [];
    const locked: Tile[] = [];
    BADGES.forEach(b => {
      const u = unlockedMap.get(b.id);
      if (u) earned.push({ badge: b, unlocked: true, unlockedAt: u.unlockedAt });
      else locked.push({ badge: b, unlocked: false });
    });
    earned.sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0));
    return [...earned, ...locked];
  }, [unlockedMap]);

  const latest = useMemo(() => tiles.find(t => t.unlocked) ?? null, [tiles]);
  const tileById = useMemo(() => {
    const m = new Map<string, Tile>();
    tiles.forEach(t => m.set(t.badge.id, t));
    return m;
  }, [tiles]);
  const activeTile = activeId ? tileById.get(activeId) ?? null : null;

  const handleTap = useCallback((id: string) => {
    selection();
    setActiveId(prev => (prev === id ? null : id));
  }, []);

  const earnedCount = unlocked.length;

  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <SectionHeader
        eyebrow="ACHIEVEMENTS"
        actionLabel={`${earnedCount}/${BADGES.length}`}
      />

      {latest && latest.unlockedAt && (
        <View style={styles.latestRow}>
          <Ionicons name="trophy" size={12} color={C.amber} />
          <Text style={styles.latestText}>
            Latest: <Text style={styles.latestName}>{latest.badge.name}</Text>
          </Text>
          <Text style={styles.latestTime}>· {relativeTime(latest.unlockedAt)}</Text>
        </View>
      )}

      <FlatList
        horizontal
        data={tiles}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <BadgeTile
            tile={item}
            active={activeId === item.badge.id}
            onPress={handleTap}
          />
        )}
        extraData={activeId}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={TileSeparator}
      />

      {activeTile && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={styles.toast}
        >
          <Text style={styles.toastName}>{activeTile.badge.name}</Text>
          <Text style={styles.toastDesc}>{activeTile.badge.description}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.lg,
  },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  latestText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
  },
  latestName: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
  },
  latestTime: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t4,
  },
  listContent: {
    paddingHorizontal: space.lg,
    paddingVertical: 4,
  },
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: radii.md,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  tileLocked: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
  },
  icon: {
    fontSize: 28,
    marginBottom: 4,
  },
  iconLocked: {
    opacity: 0.28,
  },
  tileName: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  lockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    marginHorizontal: space.lg,
    marginTop: space.sm,
    padding: space.sm + 2,
    borderRadius: radii.md,
    backgroundColor: 'rgba(19,24,41,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toastName: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: C.t1,
    marginBottom: 2,
  },
  toastDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
    lineHeight: 16,
  },
});
