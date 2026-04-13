import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { C } from '../src/constants/colors';
import { fonts } from '../src/constants/typography';

const BODY = `Neurra is built to respect your privacy.

WHAT WE COLLECT
• Display name you choose in the app
• Game scores, accuracy, and session history (stored on your device)
• Basic device info the OS provides to the app for stability

WHAT WE DO NOT COLLECT
• Precise location
• Contacts, photos, or microphone (unless you explicitly use a feature that needs them in a future version — we will ask first)
• Data sold to third parties for advertising

WHERE DATA LIVES
• Progress, scores, and preferences are stored locally on your device (and in your personal iCloud/Google backup if your phone backs up that way).

SUBSCRIPTIONS
• If you subscribe to Pro, payment is handled by Apple or Google. We do not receive your full card number.

QUESTIONS
• You can clear local data by deleting the app or using account deletion when available in Settings.
• For privacy questions, contact us at support@neurra.app

Last updated: April 2026`;

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Privacy</Text>
        <View style={{ width: 56 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.body}>{BODY}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { fontFamily: fonts.bodySemi, color: C.blue, fontSize: 15 },
  title: { fontFamily: fonts.heading, color: C.t1, fontSize: 18 },
  scroll: { padding: 20, paddingBottom: 48 },
  body: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 15,
    lineHeight: 24,
  },
});
