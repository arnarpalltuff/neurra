import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { selection } from '../../utils/haptics';
import { navigate } from '../../utils/navigate';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii } from '../../constants/design';
import { useGroveStore, GROVE_THEMES } from '../../stores/groveStore';
import type { BrainArea } from '../../constants/gameConfigs';
import { GROVE_PALETTES } from '../../constants/groveThemes';
import PressableScale from '../ui/PressableScale';
import SectionHeader from '../home/SectionHeader';

const AREAS: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];

export default React.memo(function GrovePreview() {
  const activeTheme = useGroveStore(s => s.activeTheme);
  const zoneGrowths = useGroveStore(s => s.zoneGrowths);
  const placedDecorations = useGroveStore(s => s.placedDecorations);
  const giftFlowers = useGroveStore(s => s.giftFlowers);
  const unlockedVisitors = useGroveStore(s => s.unlockedVisitors);

  const palette = GROVE_PALETTES[activeTheme] ?? GROVE_PALETTES['floating-isle'];
  const themeMeta = GROVE_THEMES.find(t => t.id === activeTheme);

  const thrivingCount = useMemo(
    () =>
      AREAS.filter(a => {
        const z = zoneGrowths[a];
        return z && !z.isWilting && z.currentGrowth >= 6;
      }).length,
    [zoneGrowths],
  );

  const handleOpen = () => {
    selection();
    navigate('/(tabs)/grove');
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(600).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <SectionHeader
        eyebrow="YOUR GROVE"
        actionLabel="Visit →"
        onAction={handleOpen}
      />

      <PressableScale onPress={handleOpen} style={styles.card}>
        <LinearGradient
          colors={[palette.skyTop, palette.skyBottom, palette.groundBase]}
          locations={[0, 0.55, 1]}
          style={styles.strip}
        >
          <View style={[styles.orb, { backgroundColor: palette.crystalGlow, opacity: 0.35 }]} />
          <View style={[styles.orb2, { backgroundColor: palette.particleColor, opacity: 0.5 }]} />

          <View style={styles.stripOverlay}>
            <Text style={styles.themeName}>{themeMeta?.name ?? 'Grove'}</Text>
            <Text style={styles.thrivingText}>
              {thrivingCount}<Text style={styles.thrivingMax}>/5</Text> zones thriving
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatPill
            icon={<MaterialCommunityIcons name="flower-tulip" size={12} color={C.peach} />}
            value={placedDecorations.length}
            label="decorations"
          />
          <View style={styles.divider} />
          <StatPill
            icon={<Ionicons name="paw" size={12} color={C.blue} />}
            value={unlockedVisitors.length}
            label="visitors"
          />
          <View style={styles.divider} />
          <StatPill
            icon={<MaterialCommunityIcons name="gift" size={12} color={C.green} />}
            value={giftFlowers.length}
            label="gifts"
          />
        </View>
      </PressableScale>
    </Animated.View>
  );
});

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.pill}>
      {icon}
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  strip: {
    height: 120,
    padding: space.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -20,
    right: -10,
  },
  orb2: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    top: 40,
    left: 24,
  },
  stripOverlay: {
    gap: 2,
  },
  themeName: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  thrivingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  thrivingMax: {
    color: 'rgba(255,255,255,0.6)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.sm + 2,
    justifyContent: 'space-around',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: C.t1,
  },
  pillLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t3,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
