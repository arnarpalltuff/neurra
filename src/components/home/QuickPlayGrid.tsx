import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii, accentGlow } from '../../constants/design';
import {
  AREA_LABELS,
  AREA_ACCENT,
  availableGames,
  type BrainArea,
} from '../../constants/gameConfigs';
import PressableScale from '../ui/PressableScale';
import SectionHeader from './SectionHeader';

type IconConfig =
  | { kind: 'ion'; name: keyof typeof Ionicons.glyphMap }
  | { kind: 'mc'; name: keyof typeof MaterialCommunityIcons.glyphMap };

interface AreaCardConfig {
  area: BrainArea;
  icon: IconConfig;
  flex: number;
  height: number;
  gradientCorner: 'tl' | 'tr' | 'bl' | 'br';
}

const ROW_GAP = 10;

// Asymmetric ratios chosen to break the "everything aligned" AI-generated grid look.
// Row 1 favors Memory (the most-used brain area), Row 2 favors Flexibility (visual variety).
const ROW_1: AreaCardConfig[] = [
  { area: 'memory',      icon: { kind: 'mc',  name: 'brain' },         flex: 60, height: 96, gradientCorner: 'tl' },
  { area: 'focus',       icon: { kind: 'ion', name: 'eye' },           flex: 40, height: 96, gradientCorner: 'br' },
];
const ROW_2: AreaCardConfig[] = [
  { area: 'speed',       icon: { kind: 'ion', name: 'flash' },         flex: 35, height: 88, gradientCorner: 'bl' },
  { area: 'flexibility', icon: { kind: 'ion', name: 'sync-circle' },   flex: 65, height: 88, gradientCorner: 'tr' },
];

// Available games are static for the app lifetime — count once at module load.
const GAME_COUNTS: Record<BrainArea, number> = (() => {
  const counts: Record<BrainArea, number> = {
    memory: 0, focus: 0, speed: 0, flexibility: 0, creativity: 0,
  };
  availableGames.forEach(g => { counts[g.brainArea] = (counts[g.brainArea] ?? 0) + 1; });
  return counts;
})();

function gradientCornerToStartEnd(corner: 'tl' | 'tr' | 'bl' | 'br') {
  switch (corner) {
    case 'tl': return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
    case 'tr': return { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } };
    case 'bl': return { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } };
    case 'br': return { start: { x: 1, y: 1 }, end: { x: 0, y: 0 } };
  }
}

const AreaCard = React.memo(function AreaCard({
  config,
  gameCount,
}: {
  config: AreaCardConfig;
  gameCount: number;
}) {
  const accent = AREA_ACCENT[config.area];
  const label = AREA_LABELS[config.area];
  const { start, end } = gradientCornerToStartEnd(config.gradientCorner);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(tabs)/games', params: { area: config.area } } as any);
  };

  return (
    <PressableScale
      onPress={handlePress}
      style={[
        styles.cardOuter,
        accentGlow(accent, 14, 0.18),
        { flex: config.flex, height: config.height, borderColor: `${accent}1F` },
      ]}
    >
      <LinearGradient
        colors={[`${accent}14`, 'transparent']}
        start={start}
        end={end}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.cardContent}>
        <View style={[styles.iconBubble, { backgroundColor: `${accent}1A` }]}>
          {config.icon.kind === 'mc' ? (
            <MaterialCommunityIcons name={config.icon.name} size={18} color={accent} />
          ) : (
            <Ionicons name={config.icon.name} size={18} color={accent} />
          )}
        </View>
        <View>
          <Text style={styles.cardTitle}>{label}</Text>
          <Text style={styles.cardCount}>{gameCount} {gameCount === 1 ? 'game' : 'games'}</Text>
        </View>
      </View>
    </PressableScale>
  );
});

/**
 * Asymmetric 2x2 bento grid for jumping straight into a brain area.
 * Tapping a card navigates to Games tab (filtered by area, if route supports it).
 */
export default React.memo(function QuickPlayGrid() {
  const handleSeeAll = () => {
    Haptics.selectionAsync();
    router.push('/(tabs)/games' as any);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(430).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <SectionHeader
        eyebrow="QUICK PLAY"
        actionLabel="All games →"
        onAction={handleSeeAll}
        paddingHorizontal={0}
      />

      <View style={styles.row}>
        {ROW_1.map(cfg => (
          <AreaCard key={cfg.area} config={cfg} gameCount={GAME_COUNTS[cfg.area]} />
        ))}
      </View>
      <View style={[styles.row, { marginTop: ROW_GAP }]}>
        {ROW_2.map(cfg => (
          <AreaCard key={cfg.area} config={cfg} gameCount={GAME_COUNTS[cfg.area]} />
        ))}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  row: {
    flexDirection: 'row',
    gap: ROW_GAP,
  },
  cardOuter: {
    borderRadius: radii.md + 2,
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    padding: space.sm + 2,
    justifyContent: 'space-between',
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: C.t1,
    letterSpacing: -0.2,
  },
  cardCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t3,
  },
});
