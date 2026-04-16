import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../ui/FloatingParticles';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { useProgressStore } from '../../stores/progressStore';
import { useEnergyStore, maxHeartsFor } from '../../stores/energyStore';
import { useProStore } from '../../stores/proStore';

interface HomeAmbientRailsProps {
  /** Tint layer color, typically from brain-weather classification. */
  weatherTint: string;
}

/**
 * Top-of-home ambient layer: bg gradient, weather tint, floating particles,
 * coin pill (with +N float on gain), and hearts pill. Owns its own store
 * subscriptions so the composer doesn't need to care.
 */
export default React.memo(function HomeAmbientRails({ weatherTint }: HomeAmbientRailsProps) {
  const insets = useSafeAreaInsets();
  const coins = useProgressStore(s => s.coins);
  const hearts = useEnergyStore(s => s.hearts);
  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  const heartMax = maxHeartsFor(isPro);
  const heartsClamped = Math.min(hearts, heartMax);

  const prevCoinsRef = useRef<number | null>(null);
  const [coinFloat, setCoinFloat] = useState<{ amount: number; key: number } | null>(null);
  useEffect(() => {
    const prev = prevCoinsRef.current;
    prevCoinsRef.current = coins;
    if (prev !== null && coins > prev) {
      setCoinFloat({ amount: coins - prev, key: Date.now() });
      const t = setTimeout(() => setCoinFloat(null), 1800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [coins]);

  return (
    <>
      <LinearGradient
        colors={[C.bg1, C.bg2, C.bg1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: weatherTint }]}
      />
      <FloatingParticles count={5} color="rgba(155,114,224,0.12)" />

      <View style={[styles.coinRow, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.coinPillBg} />
        <View style={styles.coinIcon} />
        <Text style={styles.coinBalance}>{coins}</Text>
        {coinFloat && (
          <Animated.Text
            key={coinFloat.key}
            entering={FadeInDown.duration(280)}
            exiting={FadeOut.duration(350)}
            style={styles.coinFloat}
          >
            +{coinFloat.amount}
          </Animated.Text>
        )}
      </View>

      <View style={[styles.heartsRow, { top: insets.top + 8 }]} pointerEvents="none">
        <View style={styles.heartsPillBg} />
        {Array.from({ length: heartMax }).map((_, i) => (
          <Text
            key={i}
            style={[styles.heartIcon, i >= heartsClamped && styles.heartIconSpent]}
          >
            ♥
          </Text>
        ))}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  coinRow: {
    position: 'absolute', left: 16, zIndex: 30,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  coinPillBg: {
    position: 'absolute', top: -6, left: -10, right: -10, bottom: -6,
    borderRadius: 999,
    backgroundColor: 'rgba(10,12,20,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(240,181,66,0.12)',
  },
  coinIcon: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.amber,
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 6,
  },
  coinBalance: {
    fontFamily: fonts.bodyBold, fontSize: 14, color: C.amber,
    textShadowColor: 'rgba(240,181,66,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  coinFloat: {
    position: 'absolute', left: 26, top: -22,
    fontFamily: fonts.bodyBold, fontSize: 13, color: C.amber,
  },
  heartsRow: {
    position: 'absolute', right: 16, zIndex: 30,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  heartsPillBg: {
    position: 'absolute', top: -6, left: -10, right: -10, bottom: -6,
    borderRadius: 999,
    backgroundColor: 'rgba(10,12,20,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(232,112,126,0.12)',
  },
  heartIcon: {
    fontSize: 18, color: C.coral,
    textShadowColor: 'rgba(232,112,126,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heartIconSpent: {
    color: C.t4, textShadowColor: 'transparent',
  },
});
