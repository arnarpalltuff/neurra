import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { C } from '../src/constants/colors';
import { fonts } from '../src/constants/typography';

const BODY = `TERMS OF USE — NEURRA

Neurra provides brain-training-style games for entertainment and self-improvement. It is not medical advice.

SUBSCRIPTIONS
• Paid plans are billed through the Apple App Store or Google Play. Refunds and cancellations follow the store’s rules.

ACCOUNT & DATA
• You may request deletion of your data where the app provides that option in Settings.

CHANGES
• We may update these terms; continued use after an update means you accept the new terms.

DISCLAIMERS
• Results vary. Neurra does not guarantee specific cognitive outcomes.`;

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Terms</Text>
        <View style={{ width: 56 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.body}>{BODY}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg2 },
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
