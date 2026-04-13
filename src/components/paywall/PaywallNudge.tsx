import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';

interface PaywallNudgeProps {
  onUpgrade: () => void;
  onDismiss: () => void;
}

export default function PaywallNudge({ onUpgrade, onDismiss }: PaywallNudgeProps) {
  return (
    <Animated.View entering={FadeInDown.delay(400).duration(400)}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Go Pro</Text>
          <Pressable onPress={onDismiss} hitSlop={12}>
            <Text style={styles.dismiss}>X</Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          Unlimited sessions, zero ads, full brain insights.
        </Text>

        <View style={styles.highlights}>
          <Text style={styles.bullet}>♾️ Train as much as you want</Text>
          <Text style={styles.bullet}>🚫 Remove all ads</Text>
          <Text style={styles.bullet}>📊 Unlock brain map history</Text>
        </View>

        <Pressable style={styles.ctaBtn} onPress={onUpgrade}>
          <Text style={styles.ctaText}>See Plans</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 20,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#9B72E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.heading,
    color: C.purple,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  dismiss: {
    fontFamily: fonts.bodyBold,
    color: C.t3,
    fontSize: 14,
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 14,
    backgroundColor: C.bg4,
    overflow: 'hidden',
  },
  subtitle: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 14,
    lineHeight: 20,
  },
  highlights: {
    gap: 6,
  },
  bullet: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 13,
  },
  ctaBtn: {
    backgroundColor: C.purple,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 14,
  },
});
