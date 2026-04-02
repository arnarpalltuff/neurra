import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { useAuthStore, AuthProvider } from '../../stores/authStore';
import Kova from '../kova/Kova';
import AuthButtons from './AuthButtons';

interface LoginScreenProps {
  onLogin: () => void;
  onStartFresh: () => void;
}

/**
 * Shown on app launch when no local account is found.
 * In production, this checks for existing accounts on the server.
 */
export default function LoginScreen({ onLogin, onStartFresh }: LoginScreenProps) {
  const { signIn } = useAuthStore();

  const handleAuth = (provider: AuthProvider) => {
    // In production: trigger OAuth flow, check for existing account
    signIn({
      id: `user-${Date.now()}`,
      email: null,
      displayName: null,
      provider,
      createdAt: new Date().toISOString(),
    });
    onLogin();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.top}>
          <Kova stage={1} emotion="idle" size={120} showSpeechBubble={false} />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to restore your progress</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <AuthButtons onAuth={handleAuth} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)}>
          <Pressable style={styles.freshBtn} onPress={onStartFresh}>
            <Text style={styles.freshText}>Start fresh</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 32,
  },
  top: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  freshBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  freshText: {
    color: colors.textTertiary,
    fontSize: 15,
    fontWeight: '600',
  },
});
