import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Circle, Rect, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { C } from '../../constants/colors';
import { GROVE_PALETTES, getTimeOfDaySky } from '../../constants/groveThemes';
import { useShallow } from 'zustand/react/shallow';
import { useGroveStore, ZONE_CONFIGS, ZoneConfig, VisitorId } from '../../stores/groveStore';
import { useProgressStore } from '../../stores/progressStore';
import { stageFromXP } from '../kova/KovaStates';
import GrowthZone from './GrowthZone';
import Kova from '../kova/Kova';
import { BrainArea, AREA_ACCENT, AREA_LABELS } from '../../constants/gameConfigs';
import { fonts } from '../../constants/typography';

const { width: W, height: H } = Dimensions.get('window');
const ISLAND_W = W * 2.2;
const ISLAND_H = H * 1.4;
const ZONE_SIZE = 100;

interface GroveIslandProps {
  onZoneTap: (zone: ZoneConfig) => void;
  onKovaTap: () => void;
}

// Zone positions on the island (relative to ISLAND_W/H)
const ZONE_POSITIONS: Record<BrainArea, { x: number; y: number }> = {
  memory: { x: 0.22, y: 0.22 },       // NW — tree
  focus: { x: 0.78, y: 0.22 },        // NE — crystal
  speed: { x: 0.5, y: 0.78 },         // S — stream
  flexibility: { x: 0.2, y: 0.62 },   // SW — garden
  creativity: { x: 0.8, y: 0.62 },    // SE — mushrooms
};

function VisitorSprite({ id, x, y }: { id: VisitorId; x: number; y: number }) {
  const emojis: Record<VisitorId, string> = {
    fireflies: '✨', butterfly: '🦋', bird: '🐦', fox: '🦊', koi: '🐟',
    owl: '🦉', deer: '🦌', dragonfly: '🪰', rabbits: '🐰', phoenix: '🔥',
  };
  return (
    <View style={[styles.visitor, { left: x, top: y }]}>
      <Text style={styles.visitorEmoji}>{emojis[id] || '✨'}</Text>
    </View>
  );
}

function ParticleLayer({ palette }: { palette: typeof GROVE_PALETTES['floating-isle'] }) {
  // Static decorative particles (fireflies/ambient)
  const particles = useMemo(() =>
    Array.from({ length: 10 }).map((_, i) => ({
      x: 50 + Math.random() * (ISLAND_W - 100),
      y: 80 + Math.random() * (ISLAND_H - 200),
      r: 1 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.4,
    })),
  []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <View
          key={i}
          style={[styles.particle, {
            left: p.x, top: p.y,
            width: p.r * 2, height: p.r * 2,
            borderRadius: p.r,
            backgroundColor: palette.particleColor,
            opacity: p.opacity,
          }]}
        />
      ))}
    </View>
  );
}

export default function GroveIsland({ onZoneTap, onKovaTap }: GroveIslandProps) {
  const { activeTheme, zoneGrowths, placedDecorations, unlockedVisitors, giftFlowers } = useGroveStore(
    useShallow((s) => ({
      activeTheme: s.activeTheme,
      zoneGrowths: s.zoneGrowths,
      placedDecorations: s.placedDecorations,
      unlockedVisitors: s.unlockedVisitors,
      giftFlowers: s.giftFlowers,
    })),
  );
  const xp = useProgressStore((s) => s.xp);
  const stage = stageFromXP(xp);
  const palette = GROVE_PALETTES[activeTheme];
  const timeSky = getTimeOfDaySky();

  // Use time-of-day sky for default theme, else theme's own sky
  const skyTop = activeTheme === 'floating-isle' ? timeSky.top : palette.skyTop;
  const skyBottom = activeTheme === 'floating-isle' ? timeSky.bottom : palette.skyBottom;

  const scrollRef = useRef<ScrollView>(null);

  // Visitor positions (fixed based on zone positions)
  const visitorPositions = useMemo(() => {
    const positions: { id: VisitorId; x: number; y: number }[] = [];
    const base = (id: VisitorId, zoneArea: BrainArea, offsetX = 0, offsetY = 0) => {
      if (unlockedVisitors.includes(id)) {
        const zp = ZONE_POSITIONS[zoneArea];
        positions.push({
          id,
          x: zp.x * ISLAND_W + offsetX,
          y: zp.y * ISLAND_H + offsetY,
        });
      }
    };
    base('fireflies', 'memory', -20, -40);
    base('butterfly', 'flexibility', 20, -30);
    base('bird', 'memory', 30, -60);
    base('fox', 'memory', -40, 50);
    base('koi', 'speed', -30, 10);
    base('owl', 'memory', 40, -70);
    base('deer', 'speed', 40, -20);
    base('dragonfly', 'speed', -10, -20);
    base('rabbits', 'flexibility', -20, 40);
    base('phoenix', 'focus', 0, -80);
    return positions;
  }, [unlockedVisitors]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      contentContainerStyle={{ width: ISLAND_W, height: ISLAND_H }}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bounces
      bouncesZoom
      maximumZoomScale={2}
      minimumZoomScale={0.5}
      contentOffset={{ x: (ISLAND_W - W) / 2, y: (ISLAND_H - H) / 4 }}
      decelerationRate="fast"
      style={{ backgroundColor: skyBottom }}
    >
      {/* Layer 0: Sky gradient */}
      <LinearGradient
        colors={[skyTop, skyBottom]}
        style={[StyleSheet.absoluteFill, { width: ISLAND_W, height: ISLAND_H }]}
      />

      {/* Layer 1: Stars/clouds (night = stars, day = clouds) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={i}
            style={[styles.star, {
              left: 30 + (i * 67) % (ISLAND_W - 60),
              top: 20 + (i * 43) % (ISLAND_H * 0.3),
              opacity: 0.3 + (i % 3) * 0.2,
            }]}
          />
        ))}
      </View>

      {/* Layer 2: Island base terrain */}
      <View style={styles.islandContainer}>
        <Svg width={ISLAND_W * 0.75} height={ISLAND_H * 0.55} viewBox="0 0 400 300">
          <Defs>
            <RadialGradient id="islandGrad" cx="50%" cy="45%" r="50%">
              <Stop offset="0%" stopColor={palette.groundHighlight} />
              <Stop offset="80%" stopColor={palette.groundBase} />
              <Stop offset="100%" stopColor={palette.islandEdge} />
            </RadialGradient>
          </Defs>
          {/* Island shape — organic blob */}
          <Path
            d="M50,150 Q80,60 200,50 Q320,40 360,140 Q380,200 320,250 Q240,290 140,270 Q50,250 50,150 Z"
            fill="url(#islandGrad)"
          />
          {/* Hills */}
          <Ellipse cx={130} cy={120} rx={60} ry={25} fill={palette.groundHighlight} opacity={0.5} />
          <Ellipse cx={280} cy={110} rx={50} ry={20} fill={palette.groundHighlight} opacity={0.4} />
          {/* Pond */}
          <Ellipse cx={200} cy={200} rx={35} ry={15} fill={palette.waterColor} opacity={0.5} />
          {/* Grass areas */}
          <Ellipse cx={160} cy={170} rx={40} ry={12} fill={palette.treeLeaf} opacity={0.15} />
          <Ellipse cx={250} cy={180} rx={35} ry={10} fill={palette.treeLeaf} opacity={0.12} />
        </Svg>
      </View>

      {/* Layer 3-5: Growth zones with labels */}
      {ZONE_CONFIGS.map((zone) => {
        const pos = ZONE_POSITIONS[zone.area];
        const zoneGrowth = zoneGrowths[zone.area];
        const growthPct = Math.round((zoneGrowth.currentGrowth / 12) * 100);
        const areaColor = AREA_ACCENT[zone.area] ?? C.green;
        const isNew = zoneGrowth.currentGrowth < 0.5;

        return (
          <TouchableOpacity
            key={zone.area}
            style={[styles.zoneContainer, {
              left: pos.x * ISLAND_W - ZONE_SIZE / 2,
              top: pos.y * ISLAND_H - ZONE_SIZE / 2,
            }]}
            onPress={() => onZoneTap(zone)}
            activeOpacity={0.8}
            accessibilityLabel={`${zone.name} — ${zone.area} zone — ${growthPct}% growth`}
          >
            <GrowthZone
              zone={zone}
              growth={zoneGrowth.currentGrowth}
              isWilting={zoneGrowth.isWilting}
              palette={palette}
              size={ZONE_SIZE}
            />

            {/* Zone label: name + growth % */}
            <View style={styles.zoneLabel} pointerEvents="none">
              <Text style={[styles.zoneLabelName, { color: areaColor }]} numberOfLines={1}>
                {zone.icon} {AREA_LABELS[zone.area] ?? zone.area}
              </Text>
              <View style={styles.zoneLabelBarTrack}>
                <View style={[styles.zoneLabelBarFill, { width: `${growthPct}%`, backgroundColor: areaColor }]} />
              </View>
              <Text style={styles.zoneLabelPct}>{growthPct}%</Text>
            </View>

            {/* Status indicators */}
            {zoneGrowth.isWilting && (
              <View style={styles.wiltBadge}>
                <Text style={styles.wiltIcon}>💧</Text>
                <Text style={styles.wiltText}>Needs care</Text>
              </View>
            )}
            {isNew && !zoneGrowth.isWilting && (
              <View style={styles.seedBadge}>
                <Text style={styles.seedText}>Tap to grow</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Layer 4: Kova at center */}
      <View style={[styles.kovaContainer, {
        left: ISLAND_W * 0.45 - 50,
        top: ISLAND_H * 0.42 - 50,
      }]}>
        <TouchableOpacity onPress={onKovaTap} activeOpacity={0.8}>
          <Kova stage={stage} emotion="zen" size={100} />
        </TouchableOpacity>
      </View>

      {/* Placed decorations */}
      {placedDecorations.map((dec, i) => (
        <View key={`dec-${i}`} style={[styles.decorationItem, { left: dec.x, top: dec.y }]}>
          <Text style={styles.decorationEmoji}>
            {/* Look up emoji from DECORATION_DEFS — inline for perf */}
            {dec.defId === 'paper-lantern' ? '🏮' :
             dec.defId === 'fairy-lights' ? '✨' :
             dec.defId === 'flower-pot-rose' ? '🌹' :
             dec.defId === 'wooden-bench' ? '🪑' :
             dec.defId === 'fountain' ? '⛲' :
             dec.defId === 'telescope' ? '🔭' :
             '🌿'}
          </Text>
        </View>
      ))}

      {/* Gift flowers */}
      {giftFlowers.map((gift, i) => (
        <View key={`gift-${i}`} style={[styles.giftFlower, { left: gift.x, top: gift.y }]}>
          <Text style={styles.giftEmoji}>🌸</Text>
          <Text style={styles.giftLabel}>From {gift.fromName}</Text>
        </View>
      ))}

      {/* Visitors */}
      {visitorPositions.map((v, i) => (
        <VisitorSprite key={`v-${i}`} id={v.id} x={v.x} y={v.y} />
      ))}

      {/* Layer 6: Particles */}
      <ParticleLayer palette={palette} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  islandContainer: {
    position: 'absolute',
    left: ISLAND_W * 0.12,
    top: ISLAND_H * 0.2,
    alignItems: 'center',
  },
  zoneContainer: {
    position: 'absolute',
    width: ZONE_SIZE,
    height: ZONE_SIZE + 52, // extra space for label below
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  // Zone label (name + mini progress bar + percentage)
  zoneLabel: {
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
    width: ZONE_SIZE + 20,
  },
  zoneLabelName: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  zoneLabelBarTrack: {
    width: 48,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  zoneLabelBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  zoneLabelPct: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },

  // Wilting badge
  wiltBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(240,181,66,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.4)',
  },
  wiltIcon: { fontSize: 10 },
  wiltText: {
    fontFamily: fonts.bodySemi,
    fontSize: 8,
    color: C.amber,
    letterSpacing: 0.3,
  },

  // Seed badge (new / untrained zone)
  seedBadge: {
    position: 'absolute',
    bottom: 48,
    backgroundColor: 'rgba(110,207,154,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(110,207,154,0.3)',
  },
  seedText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: C.green,
    letterSpacing: 0.3,
  },
  kovaContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorationItem: {
    position: 'absolute',
    alignItems: 'center',
  },
  decorationEmoji: { fontSize: 24 },
  giftFlower: {
    position: 'absolute',
    alignItems: 'center',
  },
  giftEmoji: { fontSize: 18 },
  giftLabel: {
    color: C.t3,
    fontSize: 8,
    fontWeight: '600',
    backgroundColor: C.bg4 + 'CC',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 1,
  },
  visitor: {
    position: 'absolute',
  },
  visitorEmoji: { fontSize: 18 },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFF',
  },
  particle: {
    position: 'absolute',
  },
});
