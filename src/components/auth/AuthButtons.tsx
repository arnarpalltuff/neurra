import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../../constants/colors';
import { AuthProvider } from '../../stores/authStore';

interface AuthButtonsProps {
  onAuth: (provider: AuthProvider) => void;
  emailLabel?: string;
}

export default function AuthButtons({ onAuth, emailLabel = 'Sign in with email' }: AuthButtonsProps) {
  return (
    <View style={styles.authButtons}>
      <Pressable style={styles.authBtn} onPress={() => onAuth('google')}>
        <Text style={styles.authBtnIcon}>G</Text>
        <Text style={styles.authBtnText}>Continue with Google</Text>
      </Pressable>

      <Pressable style={[styles.authBtn, styles.authBtnApple]} onPress={() => onAuth('apple')}>
        <Text style={[styles.authBtnIcon, styles.appleIcon]}></Text>
        <Text style={[styles.authBtnText, styles.appleText]}>Continue with Apple</Text>
      </Pressable>

      <Pressable style={[styles.authBtn, styles.authBtnEmail]} onPress={() => onAuth('email')}>
        <Text style={styles.authBtnIcon}>✉️</Text>
        <Text style={styles.authBtnTextDark}>{emailLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  authBtnIcon: { fontSize: 18, width: 24, textAlign: 'center' as const },
  authBtnText: { color: '#333', fontSize: 15, fontWeight: '600' as const, flex: 1, textAlign: 'center' as const },
  authBtnTextDark: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' as const, flex: 1, textAlign: 'center' as const },
  appleIcon: { color: '#FFF' },
  appleText: { color: '#FFF' },
});
