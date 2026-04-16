import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, Switch, Alert, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../src/constants/colors';
import { fonts, type as t } from '../src/constants/typography';
import { space, radii, shadows } from '../src/constants/design';
import Kova from '../src/components/kova/Kova';
import { selection } from '../src/utils/haptics';
import { playToggle } from '../src/utils/sound';
import { useUserStore } from '../src/stores/userStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useProStore, PLAN_DEFS } from '../src/stores/proStore';
import { restorePurchases, openManageSubscriptions } from '../src/utils/purchaseSdk';
import PaywallFull from '../src/components/paywall/PaywallFull';

// ── Reusable Components ──────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function ToggleRow({ label, value, onChange, hint }: {
  label: string; value: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  const handleChange = (v: boolean) => {
    selection();
    playToggle();
    onChange(v);
  };
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Switch
          value={value}
          onValueChange={handleChange}
          trackColor={{ false: C.bg5, true: C.green }}
          thumbColor={C.t1}
        />
      </View>
      {hint ? <Text style={styles.settingHint}>{hint}</Text> : null}
    </View>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
      onPress={() => { selection(); onPress?.(); }}
      disabled={!onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
        {onPress && <Text style={styles.rowArrow}>›</Text>}
      </View>
    </Pressable>
  );
}

function DangerRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.dangerLabel}>{label}</Text>
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ── Main Screen ──────────────────────────────────────

export default function SettingsScreen() {
  const name = useUserStore(s => s.name);
  const setName = useUserStore(s => s.setName);

  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled);
  const dailyReminder = useSettingsStore(s => s.dailyReminder);

  const setSoundEnabled = useSettingsStore(s => s.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore(s => s.setHapticsEnabled);
  const setDailyReminder = useSettingsStore(s => s.setDailyReminder);

  const aiKovaEnabled = useSettingsStore(s => s.aiKovaEnabled);
  const setAiKovaEnabled = useSettingsStore(s => s.setAiKovaEnabled);
  const anthropicApiKey = useSettingsStore(s => s.anthropicApiKey);
  const setAnthropicApiKey = useSettingsStore(s => s.setAnthropicApiKey);
  const [apiKeyInput, setApiKeyInput] = useState(anthropicApiKey);
  const neuralMapEnabled = useSettingsStore(s => s.neuralMapEnabled);
  const setNeuralMapEnabled = useSettingsStore(s => s.setNeuralMapEnabled);

  // Subscription
  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  const debugSimulatePro = useProStore(s => s.debugSimulatePro);
  const setDebugSimulatePro = useProStore(s => s.setDebugSimulatePro);
  const plan = useProStore(s => s.plan);
  const syncFromRevenueCat = useProStore(s => s.syncFromRevenueCat);
  const [showPaywall, setShowPaywall] = useState(false);

  const planLabel = plan
    ? PLAN_DEFS.find(p => p.plan === plan)?.name ?? plan
    : null;

  const handleRestore = useCallback(async () => {
    try {
      const info = await restorePurchases();
      syncFromRevenueCat(info);
      const restored = useProStore.getState().isPro;
      Alert.alert(
        restored ? 'Restored' : 'No Subscription Found',
        restored
          ? 'Your Pro subscription has been restored.'
          : 'We could not find an active subscription for this account.',
      );
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message ?? 'Please try again.');
    }
  }, [syncFromRevenueCat]);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  const handleSaveName = useCallback(() => {
    setName(nameInput.trim());
    setEditingName(false);
  }, [nameInput, setName]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete all data?',
      'This will permanently erase your progress, streak, scores, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              router.replace('/onboarding');
            } catch {
              Alert.alert('Error', 'Could not clear data. Try again.');
            }
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* Kova + title */}
        <View style={styles.kovaArea}>
          <Kova size={64} emotion="curious" showSpeechBubble={false} />
        </View>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerDivider} />

        {/* NOTIFICATIONS */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.card}>
          <ToggleRow
            label="Daily reminder"
            value={dailyReminder}
            onChange={setDailyReminder}
            hint="A short nudge at your usual training time"
          />
        </View>

        {/* AI KOVA */}
        <SectionHeader title="AI KOVA" />
        <View style={styles.card}>
          <ToggleRow label="AI-powered Kova" value={aiKovaEnabled} onChange={setAiKovaEnabled} />
          <Divider />
          <View style={styles.apiKeyRow}>
            <Text style={styles.apiKeyLabel}>Anthropic API Key</Text>
            <TextInput
              style={styles.apiKeyInput}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              onBlur={() => setAnthropicApiKey(apiKeyInput)}
              placeholder="sk-ant-..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* APPEARANCE */}
        <SectionHeader title="APPEARANCE" />
        <View style={styles.card}>
          <ToggleRow
            label="Neural Map in games"
            value={neuralMapEnabled}
            onChange={setNeuralMapEnabled}
          />
          <Text style={styles.toggleDescription}>
            Shows brain activity visualization during gameplay
          </Text>
        </View>

        {/* SOUND & HAPTICS */}
        <SectionHeader title="SOUND & HAPTICS" />
        <View style={styles.card}>
          <ToggleRow label="Game sounds" value={soundEnabled} onChange={setSoundEnabled} />
          <Divider />
          <ToggleRow label="Haptic feedback" value={hapticsEnabled} onChange={setHapticsEnabled} />
        </View>

        {/* SUBSCRIPTION */}
        <SectionHeader title="SUBSCRIPTION" />
        <View style={styles.card}>
          {isPro ? (
            <>
              <SettingRow label="Plan" value={`Pro ${planLabel}`} />
              <Divider />
              <SettingRow label="Manage subscription" onPress={openManageSubscriptions} />
            </>
          ) : (
            <SettingRow label="Upgrade to Pro" onPress={() => setShowPaywall(true)} />
          )}
          <Divider />
          <SettingRow label="Restore purchases" onPress={handleRestore} />
        </View>

        {/* ACCOUNT */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.card}>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                maxLength={20}
                placeholderTextColor={C.t3}
              />
              <Pressable onPress={handleSaveName}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <SettingRow label="Display name" value={name || 'Not set'} onPress={() => setEditingName(true)} />
          )}
          <Divider />
          <DangerRow label="Delete all data" onPress={handleDeleteAccount} />
        </View>

        {/* LEGAL */}
        <SectionHeader title="LEGAL" />
        <View style={styles.card}>
          <SettingRow
            label="Privacy policy"
            onPress={() => router.push('/privacy' as unknown as Parameters<typeof router.push>[0])}
          />
          <Divider />
          <SettingRow
            label="Terms of service"
            onPress={() => router.push('/terms' as unknown as Parameters<typeof router.push>[0])}
          />
        </View>

        {/* ABOUT */}
        <SectionHeader title="ABOUT" />
        <View style={styles.card}>
          <SettingRow label="Version" value="1.0.0" />
          <Divider />
          <SettingRow label="The science" onPress={() => router.push('/science')} />
        </View>

        {/* DEV — only visible in development */}
        {__DEV__ && (
          <>
            <SectionHeader title="DEVELOPER" />
            <View style={styles.card}>
              <ToggleRow
                label="Simulate Pro"
                value={debugSimulatePro}
                onChange={setDebugSimulatePro}
              />
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <PaywallFull visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg1 },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.xxxl,
  },

  // ── Header ─────────────────────────────────────────────────
  backRow: {
    paddingVertical: space.sm + 2,
  },
  backText: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 14,
  },
  kovaArea: {
    alignItems: 'center',
    marginTop: space.xs,
    marginBottom: space.md,
  },
  title: {
    ...t.pageTitle,
    color: C.t1,
    marginBottom: space.md,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginBottom: space.xl,
  },

  // ── Sections ───────────────────────────────────────────────
  sectionHeader: {
    ...t.sectionHeader,
    color: C.t3,
    marginTop: space.xxl,
    marginBottom: space.sm,
    paddingLeft: 4,
  },

  toggleDescription: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t3,
    paddingHorizontal: 14,
    paddingBottom: 12,
    marginTop: -6,
    lineHeight: 16,
  },

  apiKeyRow: {
    paddingVertical: 12,
    gap: 6,
  },
  apiKeyLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: C.t2,
  },
  apiKeyInput: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.t1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...shadows.subtle,
  },

  // ── Rows ───────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowPressed: { opacity: 0.7 },
  rowLabel: {
    fontFamily: fonts.body,
    color: C.t1,
    fontSize: 15,
    flex: 1,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 14,
  },
  rowArrow: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 20,
  },

  dangerLabel: {
    fontFamily: fonts.bodySemi,
    color: C.coral,
    fontSize: 15,
  },

  settingHint: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
    paddingBottom: 12,
    paddingTop: 0,
    marginTop: -8,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginLeft: space.md,
  },

  // ── Name edit ──────────────────────────────────────────────
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: C.t1,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  saveText: {
    fontFamily: fonts.bodyBold,
    color: C.green,
    fontSize: 15,
  },
});
