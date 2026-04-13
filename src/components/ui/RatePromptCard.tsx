import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { success as hapticSuccess } from '../../utils/haptics';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { shouldShowRatePrompt, recordRatePromptShown, recordRated } from '../../utils/ratePrompt';

interface RatePromptCardProps {
  totalSessions: number;
  streak: number;
  sessionAccuracy: number;
}

/**
 * Rate prompt card that slides in after a good session.
 * Only shows when ALL conditions are met.
 * Uses native StoreReview API in production.
 */
export default function RatePromptCard({
  totalSessions,
  streak,
  sessionAccuracy,
}: RatePromptCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    shouldShowRatePrompt({ totalSessions, streak, sessionAccuracy }).then((show) => {
      if (!cancelled && show) setVisible(true);
    });
    return () => { cancelled = true; };
  }, [totalSessions, streak, sessionAccuracy]);

  const handleRate = async () => {
    await recordRated();
    setVisible(false);
    hapticSuccess();

    // In production: use expo-store-review
    // import * as StoreReview from 'expo-store-review';
    // if (await StoreReview.isAvailableAsync()) {
    //   await StoreReview.requestReview();
    // }
  };

  const handleNotNow = async () => {
    await recordRatePromptShown();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Animated.View entering={FadeInDown.delay(1000).duration(300)} style={styles.card}>
      <Text style={styles.emoji}>⭐</Text>
      <View style={styles.textArea}>
        <Text style={styles.title}>Enjoying Neurra?</Text>
        <Text style={styles.subtitle}>A quick rating helps others find us.</Text>
      </View>
      <View style={styles.buttons}>
        <Pressable style={styles.rateBtn} onPress={handleRate}>
          <Text style={styles.rateBtnText}>Rate Neurra</Text>
        </Pressable>
        <Pressable style={styles.notNowBtn} onPress={handleNotNow}>
          <Text style={styles.notNowText}>Not now</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  emoji: { fontSize: 24 },
  textArea: { gap: 2 },
  title: { fontFamily: fonts.bodyBold, color: C.t1, fontSize: 15 },
  subtitle: { fontFamily: fonts.body, color: C.t3, fontSize: 13 },
  buttons: { flexDirection: 'row', gap: 10 },
  rateBtn: {
    flex: 1,
    backgroundColor: C.green,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  rateBtnText: { fontFamily: fonts.bodyBold, color: C.bg2, fontSize: 14 },
  notNowBtn: {
    flex: 1,
    backgroundColor: C.surface,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  notNowText: { fontFamily: fonts.bodySemi, color: C.t2, fontSize: 14 },
});
