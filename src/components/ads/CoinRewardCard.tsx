import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import { useProStatus } from '../../stores/proStore';
import { useProgressStore } from '../../stores/progressStore';
import { canShowCoinRewardAd, coinRewardAdsRemaining, recordCoinRewardAd } from '../../utils/adManager';
import { REWARDED_AD_COINS } from '../../utils/coinRewards';
import RewardedAdPrompt from './RewardedAdPrompt';

/**
 * Card shown in the shop utilities section for earning coins via rewarded ads.
 * Hidden for Pro users. Max 3 per day.
 */
export default function CoinRewardCard() {
  const { isPro } = useProStatus();
  const { addCoins } = useProgressStore();
  const [remaining, setRemaining] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isPro) return;
    coinRewardAdsRemaining().then(setRemaining);
  }, [isPro]);

  const handleWatch = useCallback(async () => {
    setShowPrompt(false);
    // In production: show actual rewarded ad via SDK, then on success:
    await recordCoinRewardAd();
    addCoins(REWARDED_AD_COINS);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newRemaining = await coinRewardAdsRemaining();
    setRemaining(newRemaining);
  }, [addCoins]);

  const handleTap = useCallback(async () => {
    const canShow = await canShowCoinRewardAd();
    if (!canShow) return;
    setShowPrompt(true);
  }, []);

  if (isPro || remaining <= 0) return null;

  return (
    <>
      <Pressable style={styles.card} onPress={handleTap}>
        <View style={styles.iconArea}>
          <Text style={styles.icon}>🎬</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>Watch & Earn</Text>
          <Text style={styles.subtitle}>
            Watch a video, earn {REWARDED_AD_COINS} coins
          </Text>
          <Text style={styles.remaining}>{remaining} of 3 remaining today</Text>
        </View>
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>+{REWARDED_AD_COINS} 🪙</Text>
        </View>
      </Pressable>

      <RewardedAdPrompt
        visible={showPrompt}
        type="coins"
        onWatch={handleWatch}
        onDecline={() => setShowPrompt(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconArea: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  subtitle: { color: colors.textTertiary, fontSize: 12 },
  remaining: { color: colors.sky, fontSize: 11, fontWeight: '600' },
  rewardBadge: {
    backgroundColor: colors.warm + '22',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rewardText: { color: colors.warm, fontSize: 13, fontWeight: '800' },
});
