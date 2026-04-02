import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../constants/colors';

interface RewardedAdPromptProps {
  visible: boolean;
  type: 'bonus' | 'coins';
  onWatch: () => void;
  onDecline: () => void;
}

const PROMPTS = {
  bonus: {
    title: 'Unlock Bonus Round',
    description: 'Watch a short video to unlock today\'s bonus round. Your XP will be doubled!',
    watchLabel: 'Watch (5 seconds)',
    declineLabel: 'No thanks',
  },
  coins: {
    title: 'Earn 15 Coins',
    description: 'Watch a short video and earn 15 Kova Coins.',
    watchLabel: 'Watch video',
    declineLabel: 'No thanks',
  },
};

/**
 * Modal prompt before showing a rewarded ad.
 * In production, onWatch triggers the actual rewarded ad SDK,
 * and the reward is granted in the onAdDismissed callback.
 */
export default function RewardedAdPrompt({
  visible,
  type,
  onWatch,
  onDecline,
}: RewardedAdPromptProps) {
  const prompt = PROMPTS[type];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <Pressable style={styles.backdrop} onPress={onDecline}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Animated.View entering={FadeInDown.duration(200)}>
            <Text style={styles.emoji}>{type === 'bonus' ? '⚡' : '🪙'}</Text>
            <Text style={styles.title}>{prompt.title}</Text>
            <Text style={styles.description}>{prompt.description}</Text>
            <View style={styles.buttons}>
              <Pressable style={styles.watchBtn} onPress={onWatch}>
                <Text style={styles.watchText}>{prompt.watchLabel}</Text>
              </Pressable>
              <Pressable style={styles.declineBtn} onPress={onDecline}>
                <Text style={styles.declineText}>{prompt.declineLabel}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  emoji: { fontSize: 40, marginBottom: 12 },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttons: { width: '100%', gap: 10 },
  watchBtn: {
    backgroundColor: colors.growth,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  watchText: { color: colors.bgPrimary, fontSize: 16, fontWeight: '700' },
  declineBtn: {
    backgroundColor: colors.bgTertiary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  declineText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
