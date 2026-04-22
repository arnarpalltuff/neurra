import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, withDelay, withRepeat, FadeIn, FadeOut,
  Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { tapLight, tapMedium, success } from '../../utils/haptics';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { Reward, RARITY_COLORS, rollReward, useRewardStore } from '../../stores/rewardStore';
import { useKovaStore, pickDialogue } from '../../stores/kovaStore';
import { useProgressStore } from '../../stores/progressStore';
import { playConfetti, playPerfect, playCorrect, playTap } from '../../utils/sound';

const { width: W, height: H } = Dimensions.get('window');

type Phase = 'orb' | 'anticipation' | 'reveal' | 'display';

interface RewardChestProps {
  visible: boolean;
  onDismiss: () => void;
}

// ─────────────────────────────────────────────────────────────
// Shard — fragment that flies outward when the orb breaks
// ─────────────────────────────────────────────────────────────
function Shard({ index, color }: { index: number; color: string }) {
  const prog = useSharedValue(0);
  const angle = (360 / 8) * index + (Math.random() - 0.5) * 30;
  const dist = 60 + Math.random() * 80;

  useEffect(() => {
    prog.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);

  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    return {
      opacity: interpolate(prog.value, [0, 0.1, 0.7, 1], [0, 1, 0.6, 0]),
      transform: [
        { translateX: Math.cos(rad) * dist * prog.value },
        { translateY: Math.sin(rad) * dist * prog.value },
        { rotate: `${prog.value * 360}deg` },
        { scale: interpolate(prog.value, [0, 0.3, 1], [1, 1.2, 0.3]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: 8 + Math.random() * 8,
        height: 6 + Math.random() * 6,
        borderRadius: 3,
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 4,
      }, style]}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Reveal particle — burst of color on reveal
// ─────────────────────────────────────────────────────────────
function RevealParticle({ index, color, count }: { index: number; color: string; count: number }) {
  const prog = useSharedValue(0);
  const angle = (360 / count) * index + (Math.random() - 0.5) * 25;
  const dist = 40 + Math.random() * 80;

  useEffect(() => {
    prog.value = withDelay(
      Math.random() * 100,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    return {
      opacity: interpolate(prog.value, [0, 0.1, 0.7, 1], [0, 1, 0.5, 0]),
      transform: [
        { translateX: Math.cos(rad) * dist * prog.value },
        { translateY: Math.sin(rad) * dist * prog.value + prog.value * prog.value * 40 },
      ],
    };
  });

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: 3 + Math.random() * 3,
        height: 3 + Math.random() * 3,
        borderRadius: 3,
        backgroundColor: color,
      }, style]}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function RewardChest({ visible, onDismiss }: RewardChestProps) {
  const [phase, setPhase] = useState<Phase>('orb');
  const [reward, setReward] = useState<Reward | null>(null);
  const ownedCosmetics = useKovaStore(s => s.unlockedCosmetics);
  const addCosmetic = useKovaStore(s => s.addCosmetic);
  const setEmotion = useKovaStore(s => s.setEmotion);
  const applyReward = useRewardStore(s => s.applyReward);
  const addXP = useProgressStore(s => s.addXP);
  const addStreakFreeze = useProgressStore(s => s.addStreakFreeze);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // Orb animation
  const orbPulse = useSharedValue(1);
  const orbGlow = useSharedValue(0.3);

  // Anticipation
  const shake = useSharedValue(0);
  const crackGlow = useSharedValue(0);

  // Reveal
  const revealScale = useSharedValue(0);
  const revealOpacity = useSharedValue(0);
  const colorFlood = useSharedValue(0);

  // Display
  const itemScale = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      setPhase('orb');
      setReward(null);
      return;
    }
    // Orb entrance pulse
    orbPulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.94, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
    orbGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.25, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, [visible]);

  const handleTapOrb = useCallback(() => {
    if (phase !== 'orb') return;
    playTap();
    tapLight();

    // Roll the reward
    const rolled = rollReward(ownedCosmetics);
    setReward(rolled);
    setPhase('anticipation');

    // Anticipation: shake + crack glow
    shake.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 40 }),
        withTiming(3, { duration: 40 }),
      ), 4, true,
    );
    crackGlow.value = withTiming(1, { duration: 800, easing: Easing.in(Easing.cubic) });

    // After 800ms → reveal
    timersRef.current.push(setTimeout(() => {
      setPhase('reveal');
      const color = RARITY_COLORS[rolled.rarity];

      // Color flood
      colorFlood.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });

      // Haptics by rarity
      if (rolled.rarity === 'legendary' || rolled.rarity === 'rare') {
        success();
        playPerfect();
      } else {
        tapMedium();
        playCorrect();
      }
      if (rolled.rarity === 'legendary') playConfetti();

      // Item appearance
      itemScale.value = withDelay(300, withSequence(
        withSpring(1.15, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10 }),
      ));

      // Transition to display
      timersRef.current.push(setTimeout(() => {
        setPhase('display');
        setEmotion('excited');

        // Apply the reward
        applyReward(rolled);
        if (rolled.type === 'xp_flat' && rolled.value) {
          addXP(rolled.value);
        }
        if (rolled.type === 'cosmetic' && rolled.kovaCosmetic) {
          addCosmetic(rolled.kovaCosmetic.id);
        }
        if (rolled.type === 'streak_shield') {
          addStreakFreeze(1);
        }
      }, 600));
    }, 800));
  }, [phase, ownedCosmetics]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: orbPulse.value },
      { translateX: phase === 'anticipation' ? shake.value : 0 },
    ],
  }));
  const orbGlowStyle = useAnimatedStyle(() => ({
    opacity: orbGlow.value,
  }));
  const crackStyle = useAnimatedStyle(() => ({
    opacity: crackGlow.value,
    transform: [{ scale: 1 + crackGlow.value * 0.2 }],
  }));
  const colorFloodStyle = useAnimatedStyle(() => ({
    opacity: colorFlood.value * 0.7,
    transform: [{ scale: colorFlood.value * 3 }],
  }));
  const itemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: itemScale.value }],
    opacity: itemScale.value > 0.1 ? 1 : 0,
  }));

  if (!visible) return null;

  const rarityColor = reward ? RARITY_COLORS[reward.rarity] : '#FFFFFF';
  const particleCount = reward?.rarity === 'legendary' ? 30 : reward?.rarity === 'rare' ? 20 : 15;
  const kovaLine = pickDialogue('excited');

  const rarityLabel =
    reward?.rarity === 'legendary' ? '✨ LEGENDARY ✨' :
    reward?.rarity === 'rare' ? 'RARE ✨' :
    reward?.rarity === 'uncommon' ? 'UNCOMMON' :
    'COMMON';

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5,7,14,0.5)' }]} />

      {/* Legendary shimmer */}
      {phase === 'display' && reward?.rarity === 'legendary' && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(240,181,66,0.06)' }]} />
      )}

      {/* ── ORB PHASE ─────────────────────── */}
      {(phase === 'orb' || phase === 'anticipation') && (
        <Pressable onPress={handleTapOrb} style={styles.orbArea}>
          <Animated.View style={[styles.orbGlow, orbGlowStyle]} />
          <Animated.View style={[styles.orb, orbStyle]}>
            <LinearGradient
              colors={['rgba(180,220,255,0.3)', 'rgba(110,207,154,0.15)', 'rgba(155,114,224,0.1)']}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 50 }]}
            />
            {/* Inner light core */}
            <View style={styles.orbCore} />
            {/* Crack glow during anticipation */}
            {phase === 'anticipation' && (
              <Animated.View style={[styles.orbCrack, crackStyle]}>
                <View style={styles.crackLine1} />
                <View style={styles.crackLine2} />
                <View style={styles.crackLine3} />
              </Animated.View>
            )}
          </Animated.View>
          {phase === 'orb' && (
            <Animated.Text
              entering={FadeIn.delay(300).duration(400)}
              style={styles.tapText}
            >
              Tap to reveal
            </Animated.Text>
          )}
        </Pressable>
      )}

      {/* ── REVEAL PHASE ──────────────────── */}
      {(phase === 'reveal' || phase === 'display') && reward && (
        <View style={styles.revealArea}>
          {/* Color flood circle */}
          <Animated.View style={[styles.colorFlood, { backgroundColor: rarityColor }, colorFloodStyle]} />

          {/* Shards */}
          {phase === 'reveal' && Array.from({ length: 8 }, (_, i) => (
            <Shard key={i} index={i} color={rarityColor} />
          ))}

          {/* Particle burst */}
          {Array.from({ length: particleCount }, (_, i) => (
            <RevealParticle key={i} index={i} color={rarityColor} count={particleCount} />
          ))}

          {/* Reward item */}
          <Animated.View style={[styles.rewardCard, { borderColor: `${rarityColor}60`, shadowColor: rarityColor }, itemStyle]}>
            <Text style={styles.rewardName}>{reward.name}</Text>
            <Text style={[styles.rarityLabel, { color: rarityColor }]}>{rarityLabel}</Text>
            {reward.description ? (
              <Text style={styles.rewardDesc}>{reward.description}</Text>
            ) : null}
          </Animated.View>
        </View>
      )}

      {/* ── DISPLAY PHASE ─────────────────── */}
      {phase === 'display' && reward && (
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.bottomArea}>
          <Text style={styles.kovaLine}>"{kovaLine}"</Text>
          <Pressable
            style={[styles.continueBtn, { backgroundColor: `${rarityColor}25`, borderColor: `${rarityColor}60` }]}
            onPress={onDismiss}
          >
            <Text style={[styles.continueBtnText, { color: rarityColor }]}>Continue</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 150,
  },
  orbArea: {
    alignItems: 'center',
    gap: 20,
  },
  orbGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(180,220,255,0.12)',
    shadowColor: '#B4DCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 10,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(200,230,255,0.3)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  orbCrack: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crackLine1: {
    position: 'absolute',
    width: 2,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.6)',
    transform: [{ rotate: '30deg' }],
  },
  crackLine2: {
    position: 'absolute',
    width: 2,
    height: 35,
    backgroundColor: 'rgba(255,255,255,0.5)',
    transform: [{ rotate: '-45deg' }],
  },
  crackLine3: {
    position: 'absolute',
    width: 2,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ rotate: '80deg' }],
  },
  tapText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  revealArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 300,
  },
  colorFlood: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  rewardCard: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(10,14,26,0.92)',
    paddingHorizontal: 32,
    paddingVertical: 28,
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
    minWidth: 220,
  },
  rewardName: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: C.t1,
    textAlign: 'center',
  },
  rarityLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: -2,
  },
  rewardDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.t3,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  kovaLine: {
    fontFamily: fonts.kova,
    fontSize: 16,
    color: C.t2,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  continueBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 180,
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
