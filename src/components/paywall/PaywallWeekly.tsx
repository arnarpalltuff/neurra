import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';

interface PaywallWeeklyProps {
  onUpgrade: () => void;
  onDismiss: () => void;
}

export default function PaywallWeekly({ onUpgrade, onDismiss }: PaywallWeeklyProps) {
  return (
    <Animated.View entering={FadeInDown.delay(300).duration(400)}>
      <View style={styles.card}>
        <View style={styles.lockIcon}>
          <Text style={styles.lockEmoji}>🔒</Text>
        </View>

        <Text style={styles.title}>Full Brain History</Text>
        <Text style={styles.subtitle}>
          See how your brain areas have improved over weeks, months, and years. Track trends. Spot strengths.
        </Text>

        <View style={styles.previewBars}>
          {['Memory', 'Focus', 'Speed'].map((label, i) => (
            <View key={label} style={styles.barRow}>
              <Text style={styles.barLabel}>{label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${40 + i * 15}%`, opacity: 0.3 }]} />
              </View>
            </View>
          ))}
          <View style={styles.blurOverlay}>
            <Text style={styles.blurText}>Upgrade to see full data</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.ctaBtn} onPress={onUpgrade}>
            <Text style={styles.ctaText}>Unlock with Pro</Text>
          </Pressable>
          <Pressable onPress={onDismiss}>
            <Text style={styles.dismissText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.bg3,
    borderRadius: 20,
    padding: 24,
    gap: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    alignItems: 'center',
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.bg4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: {
    fontSize: 24,
  },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  previewBars: {
    width: '100%',
    gap: 10,
    paddingVertical: 12,
    position: 'relative',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 12,
    width: 60,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: C.green,
    borderRadius: 3,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12,15,26,0.7)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurText: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 13,
  },
  actions: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  ctaBtn: {
    backgroundColor: C.purple,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 15,
  },
  dismissText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
  },
});
