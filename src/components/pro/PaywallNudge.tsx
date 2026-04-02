import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { useProStore } from '../../stores/proStore';

interface PaywallNudgeProps {
  visible: boolean;
  title: string;
  description: string;
  onLearnMore: () => void;
  onClose: () => void;
}

export default function PaywallNudge({
  visible,
  title,
  description,
  onLearnMore,
  onClose,
}: PaywallNudgeProps) {
  const { recordNudge } = useProStore();

  const handleLearnMore = () => {
    recordNudge();
    onLearnMore();
  };

  const handleClose = () => {
    recordNudge();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Animated.View entering={FadeInDown.duration(200)}>
            <View style={styles.handle} />
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            <View style={styles.buttons}>
              <Pressable style={styles.learnMoreBtn} onPress={handleLearnMore}>
                <Text style={styles.learnMoreText}>Learn more</Text>
              </Pressable>
              <Pressable style={styles.notNowBtn} onPress={handleClose}>
                <Text style={styles.notNowText}>Not now</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  proBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  proText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  learnMoreBtn: {
    flex: 1,
    backgroundColor: colors.growth,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  learnMoreText: { color: colors.bgPrimary, fontSize: 15, fontWeight: '700' },
  notNowBtn: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  notNowText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
