import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { colors } from '../../src/constants/colors';
import Kova from '../../src/components/kova/Kova';
import Card from '../../src/components/ui/Card';
import { useUserStore } from '../../src/stores/userStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { stageFromXP, stageNames } from '../../src/components/kova/KovaStates';

export default function ProfileScreen() {
  const { name } = useUserStore();
  const { xp, level, streak, longestStreak, totalSessions, coins } = useProgressStore();
  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const setSoundEnabled = useSettingsStore(s => s.setSoundEnabled);
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore(s => s.setHapticsEnabled);
  const stage = stageFromXP(xp);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.profileHeader}>
          <Kova stage={stage} emotion="happy" size={90} showSpeechBubble={false} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name || 'Trainer'}</Text>
            <Text style={styles.profileLevel}>Level {level}</Text>
            <Text style={styles.profileStage}>Kova: {stageNames[stage]}</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.statsGrid}>
            {[
              { label: 'Total XP', value: xp.toLocaleString(), color: colors.warm },
              { label: 'Sessions', value: totalSessions.toString(), color: colors.sky },
              { label: 'Best Streak', value: `${longestStreak}d`, color: colors.streak },
              { label: 'Kova Coins', value: coins.toString(), color: colors.lavender },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Quick settings + full settings link */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          <Card>
            <ToggleRow
              label="Sound Effects"
              value={soundEnabled}
              onToggle={() => setSoundEnabled(!soundEnabled)}
            />
            <View style={styles.divider} />
            <ToggleRow
              label="Haptic Feedback"
              value={hapticsEnabled}
              onToggle={() => setHapticsEnabled(!hapticsEnabled)}
            />
            <View style={styles.divider} />
            <TouchableOpacity style={styles.allSettingsRow} onPress={() => router.push('/settings')}>
              <Text style={styles.allSettingsText}>All Settings</Text>
              <Text style={styles.allSettingsArrow}>›</Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Shop link */}
        <Animated.View entering={FadeInDown.delay(350)}>
          <TouchableOpacity style={styles.shopLink} onPress={() => router.push('/shop')}>
            <Text style={styles.shopLinkEmoji}>🏪</Text>
            <Text style={styles.shopLinkText}>Kova Shop</Text>
            <Text style={styles.allSettingsArrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Does brain training work?</Text>
            <Text style={styles.aboutText}>
              Brain training games exercise specific cognitive skills. Regular mental exercise, like physical exercise, is part of a healthy lifestyle.{'\n\n'}
              We don't claim to increase your IQ or prevent cognitive decline. What we do: help you build a daily habit of challenging your brain — and that's worth doing.
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450)}>
          <Card>
            <Text style={styles.versionText}>Neurra v1.0.0 — Built with care</Text>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onToggle} accessibilityLabel={label} accessibilityRole="switch">
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 20, paddingBottom: 100, gap: 16 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileInfo: { gap: 3 },
  profileName: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  profileLevel: { color: colors.warm, fontSize: 14, fontWeight: '700' },
  profileStage: { color: colors.growth, fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  statItem: { width: '50%', alignItems: 'center', paddingVertical: 14, gap: 3 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.textTertiary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  divider: { height: 1, backgroundColor: colors.divider },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  toggleLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: colors.bgTertiary, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: colors.growth },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.textSecondary },
  toggleThumbOn: { backgroundColor: colors.textInverse, transform: [{ translateX: 20 }] },
  allSettingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  allSettingsText: { color: colors.sky, fontSize: 15, fontWeight: '600' },
  allSettingsArrow: { color: colors.textTertiary, fontSize: 18, fontWeight: '600' },
  shopLink: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shopLinkEmoji: { fontSize: 22 },
  shopLinkText: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 },
  aboutCard: { gap: 8 },
  aboutTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  aboutText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  versionText: { color: colors.textTertiary, fontSize: 12, textAlign: 'center', paddingVertical: 4 },
});
