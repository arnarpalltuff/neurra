import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Circle, Rect, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { GROVE_PALETTES, getTimeOfDaySky } from '../../constants/groveThemes';
import { useGroveStore, ZONE_CONFIGS, ZoneConfig, VisitorId } from '../../stores/groveStore';
import { useProgressStore, BrainScores } from '../../stores/progressStore';
import { stageFromXP } from '../kova/KovaStates';
import GrowthZone from './GrowthZone';
import Kova from '../kova/Kova';
import type { BrainArea } from '../../constants/gameConfigs';

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
  memory: { x: 0.65, y: 0.25 },      // NE
  focus: { x: 0.25, y: 0.25 },       // NW
  speed: { x: 0.45, y: 0.72 },       // S
  flexibility: { x: 0.72, y: 0.50 }, // E
  creativity: { x: 0.18, y: 0.50 },  // W
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
    Array.from({ length: 15 }).map((_, i) => ({
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
  const { activeTheme, zoneGrowths, placedDecorations, unlockedVisitors, giftFlowers } = useGroveStore();
  const { xp, brainScores } = useProgressStore();
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
    >
      {/* Layer 0: Sky gradient */}
      <LinearGradient
        colors={[skyTop, skyBottom]}
        style={[StyleSheet.absoluteFill, { width: ISLAND_W, height: ISLAND_H }]}
      />

      {/* Layer 1: Stars/clouds (night = stars, day = clouds) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
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

      {/* Layer 3-5: Growth zones */}
      {ZONE_CONFIGS.map((zone) => {
        const pos = ZONE_POSITIONS[zone.area];
        const zoneGrowth = zoneGrowths[zone.area];
        return (
          <TouchableOpacity
            key={zone.area}
            style={[styles.zoneContainer, {
              left: pos.x * ISLAND_W - ZONE_SIZE / 2,
              top: pos.y * ISLAND_H - ZONE_SIZE / 2,
            }]}
            onPress={() => onZoneTap(zone)}
            activeOpacity={0.8}
            accessibilityLabel={`${zone.name} — ${zone.area} zone`}
          >
            <GrowthZone
              zone={zone}
              growth={zoneGrowth.currentGrowth}
              isWilting={zoneGrowth.isWilting}
              palette={palette}
              size={ZONE_SIZE}
            />
            {/* Wilting indicator */}
            {zoneGrowth.isWilting && (
              <View style={styles.wiltBadge}>
                <Text style={styles.wiltIcon}>💧</Text>
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
    height: ZONE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wiltBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wiltIcon: { fontSize: 12 },
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
    color: colors.textTertiary,
    fontSize: 8,
    fontWeight: '600',
    backgroundColor: colors.bgElevated + 'CC',
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
