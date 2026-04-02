import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { useProStore } from '../../stores/proStore';

interface PaywallWeeklyProps {
  visible: boolean;
  areaName: string;
  improvement: number; // percentage
  onGoToPro: () => void;
  onClose: () => void;
}

export default function PaywallWeekly({
  visible,
  areaName,
  improvement,
  onGoToPro,
  onClose,
}: PaywallWeeklyProps) {
  const { recordWeeklyPaywall } = useProStore();

  const handleGoToPro = () => {
    recordWeeklyPaywall();
    onGoToPro();
  };

  const handleClose = () => {
    recordWeeklyPaywall();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Animated.View entering={FadeInDown.duration(300)}>
            {/* Frosted overlay simulation */}
            <View style={styles.frosted}>
              <Text style={styles.frostedText}>📊</Text>
            </View>
            <Text style={styles.title}>
              Your {areaName} improved {improvement}% this week
            </Text>
            <Text style={styles.subtitle}>
              Want to see your journey from day 1?
            </Text>
            <Pressable style={styles.proBtn} onPress={handleGoToPro}>
              <Text style={styles.proBtnText}>Unlock with Pro</Text>
            </Pressable>
            <Pressable style={styles.laterBtn} onPress={handleClose}>
              <Text style={styles.laterText}>Maybe later</Text>
            </Pressable>
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
  frosted: {
    width: '100%',
    height: 80,
    backgroundColor: colors.bgTertiary,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  frostedText: { fontSize: 36, opacity: 0.4 },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  proBtn: {
    backgroundColor: colors.growth,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  proBtnText: { color: colors.bgPrimary, fontSize: 16, fontWeight: '700' },
  laterBtn: {
    paddingVertical: 12,
  },
  laterText: { color: colors.textTertiary, fontSize: 14, fontWeight: '600' },
});
