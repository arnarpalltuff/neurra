import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { useProStatus } from '../../stores/proStore';
import { canShowBanner, recordBannerImpression } from '../../utils/adManager';

/**
 * Adaptive banner ad for the session summary screen.
 * - Only appears for free users
 * - Loads 2 seconds after mount (doesn't block content)
 * - Max 3 impressions per day
 * - Blends with app design
 *
 * In production, replace the placeholder with:
 *   import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
 */
export default function AdBanner() {
  const { isPro } = useProStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isPro) return;

    const timer = setTimeout(async () => {
      const allowed = await canShowBanner();
      if (allowed) {
        await recordBannerImpression();
        setVisible(true);
      }
    }, 2000); // 2s delay — never blocks content

    return () => clearTimeout(timer);
  }, [isPro]);

  if (isPro || !visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.separator} />
      {/* Placeholder — replace with BannerAd in production */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Ad</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
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
  },
  bannerText: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.5,
  },
});
