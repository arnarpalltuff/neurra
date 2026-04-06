import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { GROVE_SKY, KOVA_GROVE_LINES } from '../../constants/groveScene';
import { getTimeOfDay } from '../../utils/timeUtils';
import { useGroveStore, ZoneConfig } from '../../stores/groveStore';
import Kova from '../kova/Kova';
import { playTap, playSwipe } from '../../utils/sound';

const { width: W, height: H } = Dimensions.get('window');
const SCENE_W = W * 1.4;
const SCENE_H = H * 1.15;

function slotStyle(position: ZoneConfig['position']) {
  const pad = 24;
  switch (position) {
    case 'northwest':
      return { left: pad, top: H * 0.14, position: 'absolute' as const };
    case 'northeast':
      return { right: pad, top: H * 0.14, position: 'absolute' as const };
    case 'south':
      return { left: SCENE_W / 2 - 70, bottom: pad + 40, position: 'absolute' as const };
    case 'southwest':
      return { left: pad, bottom: H * 0.22, position: 'absolute' as const };
    case 'southeast':
      return { right: pad, bottom: H * 0.22, position: 'absolute' as const };
    default:
      return { left: pad, top: pad, position: 'absolute' as const };
  }
}

function TreePlaceholder({
  stage,
  wilting,
  sparkle,
  onPress,
}: {
  stage: number;
  wilting: boolean;
  sparkle: boolean;
  onPress: () => void;
}) {
  const t = Math.min(1, stage / 12);
  const size = 28 + t * 44;
  const leafShake = useSharedValue(0);
  const opacity = wilting ? 0.72 : 1;

  const handlePress = useCallback(() => {
    leafShake.value = withSequence(
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 70 }),
      withTiming(-4, { duration: 60 }),
      withTiming(0, { duration: 50 }),
    );
    onPress();
  }, [leafShake, onPress]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: leafShake.value }],
  }));

  return (
    <Pressable onPress={handlePress} hitSlop={12} style={[styles.zoneHit, { opacity }]}>
      <Animated.View style={anim}>
        <View
          style={[
            styles.treeCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: wilting ? '#5A8A5A' : C.green,
              shadowColor: C.green,
              shadowOpacity: sparkle ? 0.9 : wilting ? 0.15 : 0.45,
              shadowRadius: sparkle ? 18 : 8,
            },
          ]}
        />
        {sparkle && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.sparkleTag}>
            <Text style={styles.sparkleText}>✨</Text>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function CrystalPlaceholder({ stage, wilting }: { stage: number; wilting: boolean }) {
  const t = Math.min(1, stage / 12);
  const h = 36 + t * 52;
  const w = 28 + t * 8;
  const opacity = wilting ? 0.7 : 1;
  return (
    <View style={[styles.zoneHit, { opacity, alignItems: 'center' }]}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: w / 2,
          borderRightWidth: w / 2,
          borderBottomWidth: h,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: wilting ? '#6B8AAA' : C.blue,
          shadowColor: C.blue,
          shadowOpacity: wilting ? 0.12 : 0.5,
          shadowRadius: 10,
        }}
      />
    </View>
  );
}

function StreamPlaceholder({ stage, wilting, onRipple }: { stage: number; wilting: boolean; onRipple: () => void }) {
  const t = Math.min(1, stage / 12);
  const barW = 80 + t * 120;
  const opacity = (0.35 + t * 0.55) * (wilting ? 0.75 : 1);
  return (
    <Pressable onPress={onRipple} style={[styles.zoneHit, { alignItems: 'center' }]}>
      <View style={[styles.streamBar, { width: barW, opacity, backgroundColor: wilting ? '#4A6A88' : C.blue }]} />
    </Pressable>
  );
}

function GardenPlaceholder({ stage, wilting }: { stage: number; wilting: boolean }) {
  const n = Math.max(1, Math.round((stage / 12) * 8));
  const dots = useMemo(() => Array.from({ length: n }, (_, i) => i), [n]);
  const opacity = wilting ? 0.75 : 1;
  const palette = wilting
    ? ['#6B6570', '#5A555E', '#7A7280']
    : [C.peach, C.amber, C.coral, C.purple];
  return (
    <View style={[styles.gardenCluster, { opacity }]}>
      {dots.map((i) => (
        <View
          key={i}
          style={[
            styles.gardenDot,
            {
              backgroundColor: palette[i % palette.length],
              marginLeft: (i % 3) * 10 - 10,
              marginTop: Math.floor(i / 3) * 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

function MushroomPlaceholder({ stage, wilting, sparkle }: { stage: number; wilting: boolean; sparkle: boolean }) {
  const n = Math.max(1, Math.round((stage / 12) * 7));
  const opacity = wilting ? 0.72 : 1;
  return (
    <View style={[styles.mushCluster, { opacity }]}>
      {Array.from({ length: n }, (_, i) => (
        <View
          key={i}
          style={[
            styles.mushDot,
            {
              backgroundColor: wilting ? '#6A5A78' : C.purple,
              shadowOpacity: sparkle ? 0.85 : wilting ? 0.1 : 0.55,
            },
          ]}
        />
      ))}
    </View>
  );
}

interface GroveSceneProps {
  zones: ZoneConfig[];
  onZonePress: (zone: ZoneConfig) => void;
  onKovaPress: () => void;
}

export default function GroveScene({ zones, onZonePress, onKovaPress }: GroveSceneProps) {
  const [tod, setTod] = useState(getTimeOfDay());
  const zoneGrowths = useGroveStore((s) => s.zoneGrowths);
  const revivedSparkleArea = useGroveStore((s) => s.revivedSparkleArea);
  const clearRevivedSparkle = useGroveStore((s) => s.clearRevivedSparkle);

  useEffect(() => {
    const id = setInterval(() => setTod(getTimeOfDay()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!revivedSparkleArea) return;
    const t = setTimeout(() => clearRevivedSparkle(), 2200);
    return () => clearTimeout(t);
  }, [revivedSparkleArea, clearRevivedSparkle]);

  const sky = GROVE_SKY[tod];
  const showStars = tod === 'lateNight';

  const renderZone = (zone: ZoneConfig) => {
    const zg = zoneGrowths[zone.area];
    const stage = Math.round(zg.currentGrowth);
    const wilting = zg.isWilting;
    const sparkle = revivedSparkleArea === zone.area;

    const inner = (() => {
      switch (zone.area) {
        case 'memory':
          return (
            <TreePlaceholder
              stage={stage}
              wilting={wilting}
              sparkle={sparkle}
              onPress={() => {
                playTap();
                onZonePress(zone);
              }}
            />
          );
        case 'focus':
          return <CrystalPlaceholder stage={stage} wilting={wilting} />;
        case 'speed':
          return (
            <StreamPlaceholder
              stage={stage}
              wilting={wilting}
              onRipple={() => {
                playSwipe();
                onZonePress(zone);
              }}
            />
          );
        case 'flexibility':
          return <GardenPlaceholder stage={stage} wilting={wilting} />;
        case 'creativity':
          return <MushroomPlaceholder stage={stage} wilting={wilting} sparkle={sparkle} />;
        default:
          return null;
      }
    })();

    if (zone.area === 'speed') {
      return <View key={zone.area} style={slotStyle(zone.position)}>{inner}</View>;
    }

    if (zone.area === 'memory') {
      return (
        <View key={zone.area} style={slotStyle(zone.position)}>
          {inner}
        </View>
      );
    }

    return (
      <Pressable key={zone.area} style={slotStyle(zone.position)} onPress={() => onZonePress(zone)}>
        {inner}
      </Pressable>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ width: SCENE_W, height: SCENE_H }}
      contentOffset={{ x: (SCENE_W - W) / 2, y: 0 }}
      decelerationRate="fast"
    >
      <LinearGradient colors={sky} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />

      {showStars && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.star,
                {
                  left: (i * 73) % (SCENE_W - 20),
                  top: 20 + (i * 41) % (H * 0.35),
                  opacity: 0.2 + (i % 4) * 0.15,
                },
              ]}
            />
          ))}
        </View>
      )}

      {zones.map((z) => renderZone(z))}

      <Pressable style={styles.kovaWrap} onPress={onKovaPress}>
        <Kova size={100} emotion="zen" showSpeechBubble={false} />
      </Pressable>
    </ScrollView>
  );
}

export function KovaGroveDialogueModal({ visible, line, onClose }: { visible: boolean; line: string; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.kovaModalBackdrop} onPress={onClose}>
        <Pressable style={styles.kovaModalCard} onPress={() => {}}>
          <Text style={styles.kovaModalText}>{line}</Text>
          <Pressable style={styles.kovaModalBtn} onPress={onClose}>
            <Text style={styles.kovaModalBtnText}>Nice</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function pickGroveLine(): string {
  return KOVA_GROVE_LINES[Math.floor(Math.random() * KOVA_GROVE_LINES.length)]!;
}

const styles = StyleSheet.create({
  zoneHit: {
    minWidth: 72,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeCircle: {
    elevation: 4,
  },
  sparkleTag: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  sparkleText: { fontSize: 18 },
  streamBar: {
    height: 10,
    borderRadius: 5,
  },
  gardenCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 56,
    justifyContent: 'center',
  },
  gardenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  mushCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 64,
    justifyContent: 'center',
    gap: 6,
  },
  mushDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: C.purple,
    shadowRadius: 8,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFF',
  },
  kovaWrap: {
    position: 'absolute',
    left: SCENE_W / 2 - 50,
    top: H * 0.38,
    width: 100,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kovaModalBackdrop: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  kovaModalCard: {
    backgroundColor: C.bg3,
    borderRadius: 20,
    padding: 22,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  kovaModalText: {
    fontFamily: fonts.kova,
    fontSize: 20,
    color: C.t1,
    lineHeight: 28,
    marginBottom: 18,
  },
  kovaModalBtn: {
    alignSelf: 'flex-end',
    backgroundColor: C.green,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  kovaModalBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
    fontSize: 15,
  },
});
