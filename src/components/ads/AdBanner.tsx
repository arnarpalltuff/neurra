import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../../constants/colors';
import { useProStatus } from '../../stores/proStore';
import { useProgressStore } from '../../stores/progressStore';
import { canShowBanner, recordBannerImpression, shouldSuppressForStreak, reportBadAd } from '../../utils/adManager';

interface AdBannerProps {
  sessionAccuracy?: number;
}

/**
 * Adaptive banner ad for the session summary screen.
 * - Only appears for free users
 * - Loads 2 seconds after mount (doesn't block content)
 * - Max 3 impressions per day
 * - 3-minute cooldown between ads
 * - Suppressed after frustrating sessions (<40% accuracy)
 * - Suppressed on streak milestone days
 * - Blends with app design
 *
 * In production, replace the placeholder with:
 *   import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
 */
export default function AdBanner({ sessionAccuracy }: AdBannerProps) {
  const { isPro } = useProStatus();
  const streak = useProgressStore(s => s.streak);
  const [visible, setVisible] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (isPro) return;

    // Suppress on streak milestones
    if (shouldSuppressForStreak(streak)) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const allowed = await canShowBanner(sessionAccuracy);
      if (cancelled) return;
      if (allowed) {
        await recordBannerImpression();
        if (!cancelled) setVisible(true);
      }
    }, 2000); // 2s delay — never blocks content

    return () => { cancelled = true; clearTimeout(timer); };
  }, [isPro, streak, sessionAccuracy]);

  const handleReport = useCallback(async () => {
    await reportBadAd('user-dismissed');
    setReported(true);
    setVisible(false);
  }, []);

  if (isPro || !visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.separator} />
      {/* Placeholder — replace with BannerAd in production */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Ad</Text>
        <Pressable style={styles.reportBtn} onPress={handleReport} hitSlop={8}>
          <Text style={styles.reportText}>✕</Text>
        </Pressable>
      </View>
      {reported && (
        <Text style={styles.reportedText}>Thanks for the feedback</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  separator: {
    width: '90%',
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  banner: {
    width: '100%',
    height: 50,
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  bannerText: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.5,
  },
  reportBtn: {
    position: 'absolute',
    top: 4,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  reportedText: {
    color: colors.textTertiary,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
