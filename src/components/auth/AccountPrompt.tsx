import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { useAuthStore, AuthProvider } from '../../stores/authStore';
import { useProgressStore } from '../../stores/progressStore';
import Kova from '../kova/Kova';
import { stageFromXP } from '../kova/KovaStates';

interface AccountPromptProps {
  visible: boolean;
  onClose: () => void;
}

export default function AccountPrompt({ visible, onClose }: AccountPromptProps) {
  const { xp, streak } = useProgressStore();
  const { signIn, dismissAccountPrompt } = useAuthStore();
  const stage = stageFromXP(xp);

  const handleAuth = (provider: AuthProvider) => {
    // In production: trigger Google/Apple OAuth or email signup flow
    // On success, call signIn with the returned user
    signIn({
      id: `local-${Date.now()}`,
      email: null,
      displayName: null,
      provider,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  const handleDismiss = () => {
    dismissAccountPrompt();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Animated.View entering={FadeInDown.duration(300)}>
            {/* Kova with life preserver */}
            <View style={styles.kovaArea}>
              <Kova stage={stage} emotion="encouraging" size={80} showSpeechBubble={false} />
            </View>

            <Text style={styles.title}>Save your progress</Text>
            <Text style={styles.subtitle}>
              You've got {xp.toLocaleString()} XP
              {streak > 0 ? `, a ${streak}-day streak,` : ''} and a growing Kova.
              Let's make sure you never lose them.
            </Text>

            {/* Auth buttons */}
            <View style={styles.authButtons}>
              <Pressable style={styles.authBtn} onPress={() => handleAuth('google')}>
                <Text style={styles.authBtnIcon}>G</Text>
                <Text style={styles.authBtnText}>Continue with Google</Text>
              </Pressable>

              <Pressable style={[styles.authBtn, styles.authBtnApple]} onPress={() => handleAuth('apple')}>
                <Text style={styles.authBtnIcon}></Text>
                <Text style={styles.authBtnText}>Continue with Apple</Text>
              </Pressable>

              <Pressable style={[styles.authBtn, styles.authBtnEmail]} onPress={() => handleAuth('email')}>
                <Text style={styles.authBtnIcon}>✉️</Text>
                <Text style={styles.authBtnText}>Sign up with email</Text>
              </Pressable>
            </View>

            {/* Dismiss */}
            <Pressable style={styles.dismissBtn} onPress={handleDismiss}>
              <Text style={styles.dismissText}>Maybe later</Text>
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
    padding: 24,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 24,
    padding: 24,
    width: '100%',
  },
  kovaArea: { alignItems: 'center', marginBottom: 12 },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  authButtons: { gap: 10 },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  authBtnApple: { backgroundColor: '#000' },
  authBtnEmail: { backgroundColor: colors.bgTertiary },
  authBtnIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  authBtnText: { color: '#333', fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'center' },
  dismissBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  dismissText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
});
