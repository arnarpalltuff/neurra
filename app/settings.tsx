import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, Switch, Alert, TextInput,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { colors } from '../src/constants/colors';
import { useUserStore } from '../src/stores/userStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useProStatus, useProStore } from '../src/stores/proStore';
import type { BrainArea } from '../src/constants/gameConfigs';

// ── Reusable Components ──────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
        {onPress && <Text style={styles.rowArrow}>›</Text>}
      </View>
    </Pressable>
  );
}

function ToggleRow({ label, value, onChange, disabled }: {
  label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={[styles.rowLabel, disabled && styles.rowLabelDisabled]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.bgTertiary, true: colors.growth }}
        thumbColor={value ? '#FFF' : colors.textTertiary}
      />
    </View>
  );
}

function SegmentRow<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { key: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmentRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.segmentGroup}>
        {options.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.segment, value === opt.key && styles.segmentActive]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.segmentText, value === opt.key && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
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
  const { isPro, plan } = useProStatus();
  const expirationDate = useProStore(s => s.expirationDate);

  // Settings — select individual slices to avoid re-rendering entire screen
  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const musicEnabled = useSettingsStore(s => s.musicEnabled);
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled);
  const dailyReminder = useSettingsStore(s => s.dailyReminder);
  const reminderTime = useSettingsStore(s => s.reminderTime);
  const streakProtectionAlert = useSettingsStore(s => s.streakProtectionAlert);
  const leagueUpdates = useSettingsStore(s => s.leagueUpdates);
  const friendActivity = useSettingsStore(s => s.friendActivity);
  const sessionLength = useSettingsStore(s => s.sessionLength);
  const focusAreas = useSettingsStore(s => s.focusAreas);
  const difficultyPref = useSettingsStore(s => s.difficultyPref);
  const zenFlowInclusion = useSettingsStore(s => s.zenFlowInclusion);
  const leaguesEnabled = useSettingsStore(s => s.leaguesEnabled);
  const friendActivityEnabled = useSettingsStore(s => s.friendActivityEnabled);
  const allowFriendRequests = useSettingsStore(s => s.allowFriendRequests);
  const showOnLeaderboards = useSettingsStore(s => s.showOnLeaderboards);
  const theme = useSettingsStore(s => s.theme);
  const kovaSize = useSettingsStore(s => s.kovaSize);
  const reduceAnimations = useSettingsStore(s => s.reduceAnimations);
  const textSize = useSettingsStore(s => s.textSize);
  const highContrast = useSettingsStore(s => s.highContrast);
  const screenReaderOptimized = useSettingsStore(s => s.screenReaderOptimized);
  const reduceMotion = useSettingsStore(s => s.reduceMotion);
  const colorBlindMode = useSettingsStore(s => s.colorBlindMode);
  const tapTargetSize = useSettingsStore(s => s.tapTargetSize);

  // Setters
  const setSoundEnabled = useSettingsStore(s => s.setSoundEnabled);
  const setMusicEnabled = useSettingsStore(s => s.setMusicEnabled);
  const setHapticsEnabled = useSettingsStore(s => s.setHapticsEnabled);
  const setDailyReminder = useSettingsStore(s => s.setDailyReminder);
  const setStreakProtectionAlert = useSettingsStore(s => s.setStreakProtectionAlert);
  const setLeagueUpdates = useSettingsStore(s => s.setLeagueUpdates);
  const setFriendActivityNotif = useSettingsStore(s => s.setFriendActivityNotif);
  const setSessionLength = useSettingsStore(s => s.setSessionLength);
  const setFocusArea = useSettingsStore(s => s.setFocusArea);
  const setDifficultyPref = useSettingsStore(s => s.setDifficultyPref);
  const setZenFlowInclusion = useSettingsStore(s => s.setZenFlowInclusion);
  const setLeaguesEnabled = useSettingsStore(s => s.setLeaguesEnabled);
  const setFriendActivityEnabled = useSettingsStore(s => s.setFriendActivityEnabled);
  const setAllowFriendRequests = useSettingsStore(s => s.setAllowFriendRequests);
  const setShowOnLeaderboards = useSettingsStore(s => s.setShowOnLeaderboards);
  const setTheme = useSettingsStore(s => s.setTheme);
  const setKovaSize = useSettingsStore(s => s.setKovaSize);
  const setReduceAnimations = useSettingsStore(s => s.setReduceAnimations);
  const setTextSize = useSettingsStore(s => s.setTextSize);
  const setHighContrast = useSettingsStore(s => s.setHighContrast);
  const setScreenReaderOptimized = useSettingsStore(s => s.setScreenReaderOptimized);
  const setReduceMotion = useSettingsStore(s => s.setReduceMotion);
  const setColorBlindMode = useSettingsStore(s => s.setColorBlindMode);
  const setTapTargetSize = useSettingsStore(s => s.setTapTargetSize);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  const handleSaveName = useCallback(() => {
    setName(nameInput.trim());
    setEditingName(false);
  }, [nameInput, setName]);

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      'Clear game history?',
      'This resets all scores but keeps your level, XP, streak, and Kova.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          // Would reset gameHistory and personalBests in progressStore
        }},
      ],
    );
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.prompt?.(
      'Delete account',
      'Type DELETE to permanently remove your account and all data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: (text?: string) => {
          if (text === 'DELETE') {
            // Would clear all stores and navigate to onboarding
          }
        }},
      ],
      'plain-text',
    );
  }, []);

  const brainAreas: { key: BrainArea; label: string }[] = [
    { key: 'memory', label: 'Memory' },
    { key: 'focus', label: 'Focus' },
    { key: 'speed', label: 'Speed' },
    { key: 'flexibility', label: 'Flexibility' },
    { key: 'creativity', label: 'Creativity' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* ACCOUNT */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                maxLength={20}
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable onPress={handleSaveName}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <SettingRow label="Display name" value={name || 'Not set'} onPress={() => setEditingName(true)} />
          )}
          <Divider />
          <SettingRow label="Email" value="Not set" onPress={() => {}} />
          <Divider />
          <DangerRow label="Delete account" onPress={handleDeleteAccount} />
        </View>

        {/* SUBSCRIPTION */}
        <SectionHeader title="Subscription" />
        <View style={styles.card}>
          <SettingRow label="Current plan" value={isPro ? `Pro ${plan ?? ''}` : 'Free'} />
          <Divider />
          <SettingRow label="Status" value={isPro ? 'Active' : 'Free'} />
          {isPro && expirationDate && (
            <>
              <Divider />
              <SettingRow label="Next billing" value={expirationDate} />
            </>
          )}
          <Divider />
          <SettingRow label="Manage subscription" onPress={() => {}} />
          <Divider />
          <SettingRow label="Restore purchases" onPress={() => {}} />
        </View>

        {/* NOTIFICATIONS */}
        <SectionHeader title="Notifications" />
        <View style={styles.card}>
          <ToggleRow label="Daily reminder" value={dailyReminder} onChange={setDailyReminder} />
          <Divider />
          <SettingRow label="Reminder time" value={reminderTime} onPress={() => {}} />
          <Divider />
          <ToggleRow label="Streak protection alert" value={streakProtectionAlert} onChange={setStreakProtectionAlert} />
          <Divider />
          <ToggleRow label="League updates" value={leagueUpdates} onChange={setLeagueUpdates} />
          <Divider />
          <ToggleRow label="Friend activity" value={friendActivity} onChange={setFriendActivityNotif} />
        </View>

        {/* SESSION PREFERENCES */}
        <SectionHeader title="Session Preferences" />
        <View style={styles.card}>
          <SegmentRow
            label="Session length"
            value={String(sessionLength) as '3' | '5'}
            options={[
              { key: '3', label: '3 games' },
              { key: '5', label: `5 games ${!isPro ? '(Pro)' : ''}` },
            ]}
            onChange={(v) => {
              const n = Number(v) as 3 | 5;
              if (n === 5 && !isPro) return;
              setSessionLength(n);
            }}
          />
          <Divider />
          <Text style={styles.subLabel}>Focus areas</Text>
          {brainAreas.map((area) => (
            <ToggleRow
              key={area.key}
              label={area.label}
              value={focusAreas[area.key]}
              onChange={(v) => setFocusArea(area.key, v)}
            />
          ))}
          <Divider />
          <SegmentRow
            label="Difficulty"
            value={difficultyPref}
            options={[
              { key: 'adaptive', label: 'Adaptive' },
              { key: 'challenge', label: 'Challenge' },
              { key: 'easy', label: 'Easy' },
            ]}
            onChange={setDifficultyPref}
          />
          <Divider />
          <SegmentRow
            label="Zen Flow"
            value={zenFlowInclusion}
            options={[
              { key: 'always', label: 'Always' },
              { key: 'sometimes', label: 'Sometimes' },
              { key: 'never', label: 'Never' },
            ]}
            onChange={setZenFlowInclusion}
          />
        </View>

        {/* SOUND & HAPTICS */}
        <SectionHeader title="Sound & Haptics" />
        <View style={styles.card}>
          <ToggleRow label="Game sounds" value={soundEnabled} onChange={setSoundEnabled} />
          <Divider />
          <ToggleRow label="Music" value={musicEnabled} onChange={setMusicEnabled} />
          <Divider />
          <ToggleRow label="Haptic feedback" value={hapticsEnabled} onChange={setHapticsEnabled} />
        </View>

        {/* COMPETITION */}
        <SectionHeader title="Competition" />
        <View style={styles.card}>
          <ToggleRow label="Leagues" value={leaguesEnabled} onChange={setLeaguesEnabled} />
          <Divider />
          <ToggleRow label="Show friend activity" value={friendActivityEnabled} onChange={setFriendActivityEnabled} disabled={!leaguesEnabled} />
          <Divider />
          <ToggleRow label="Allow friend requests" value={allowFriendRequests} onChange={setAllowFriendRequests} />
          <Divider />
          <ToggleRow label="Show on leaderboards" value={showOnLeaderboards} onChange={setShowOnLeaderboards} disabled={!leaguesEnabled} />
        </View>

        {/* APPEARANCE */}
        <SectionHeader title="Appearance" />
        <View style={styles.card}>
          <SegmentRow
            label="Theme"
            value={theme}
            options={[
              { key: 'auto', label: 'Auto' },
              { key: 'dark', label: 'Dark' },
              { key: 'light', label: 'Light' },
            ]}
            onChange={setTheme}
          />
          <Divider />
          <SegmentRow
            label="Kova size"
            value={kovaSize}
            options={[
              { key: 'small', label: 'S' },
              { key: 'medium', label: 'M' },
              { key: 'large', label: 'L' },
            ]}
            onChange={setKovaSize}
          />
          <Divider />
          <ToggleRow label="Reduce animations" value={reduceAnimations} onChange={setReduceAnimations} />
        </View>

        {/* ACCESSIBILITY */}
        <SectionHeader title="Accessibility" />
        <View style={styles.card}>
          <SegmentRow
            label="Text size"
            value={textSize}
            options={[
              { key: 'system', label: 'Sys' },
              { key: 'small', label: 'S' },
              { key: 'medium', label: 'M' },
              { key: 'large', label: 'L' },
              { key: 'xlarge', label: 'XL' },
            ]}
            onChange={setTextSize}
          />
          <Divider />
          <ToggleRow label="High contrast" value={highContrast} onChange={setHighContrast} />
          <Divider />
          <ToggleRow label="Screen reader optimized" value={screenReaderOptimized} onChange={setScreenReaderOptimized} />
          <Divider />
          <ToggleRow label="Reduce motion" value={reduceMotion} onChange={setReduceMotion} />
          <Divider />
          <SegmentRow
            label="Color blind mode"
            value={colorBlindMode}
            options={[
              { key: 'off', label: 'Off' },
              { key: 'deuteranopia', label: 'Deut' },
              { key: 'protanopia', label: 'Prot' },
              { key: 'tritanopia', label: 'Trit' },
            ]}
            onChange={setColorBlindMode}
          />
          <Divider />
          <SegmentRow
            label="Tap targets"
            value={tapTargetSize}
            options={[
              { key: 'standard', label: 'Standard' },
              { key: 'large', label: 'Large (48pt)' },
            ]}
            onChange={setTapTargetSize}
          />
        </View>

        {/* DATA & PRIVACY */}
        <SectionHeader title="Data & Privacy" />
        <View style={styles.card}>
          <SettingRow label="Export my data" onPress={() => {}} />
          <Divider />
          <DangerRow label="Clear game history" onPress={handleClearHistory} />
          <Divider />
          <SettingRow label="Privacy policy" onPress={() => {}} />
          <Divider />
          <SettingRow label="Terms of service" onPress={() => {}} />
        </View>

        {/* ABOUT */}
        <SectionHeader title="About" />
        <View style={styles.card}>
          <SettingRow label="App version" value="1.0.0" />
          <Divider />
          <SettingRow label="The science behind Neurra" onPress={() => router.push('/science')} />
          <Divider />
          <SettingRow label="Contact support" value="support@neurra.app" />
          <Divider />
          <SettingRow label="Rate Neurra" onPress={() => {}} />
          <Divider />
          <SettingRow label="Share Neurra with a friend" onPress={() => {}} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backText: { color: colors.sky, fontSize: 16, fontWeight: '600' },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },

  sectionHeader: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    paddingLeft: 4,
  },

  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowDisabled: { opacity: 0.4 },
  rowLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
  rowLabelDisabled: { color: colors.textTertiary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { color: colors.textTertiary, fontSize: 14 },
  rowArrow: { color: colors.textTertiary, fontSize: 18, fontWeight: '600' },

  dangerLabel: { color: '#FF4444', fontSize: 15, fontWeight: '600' },

  divider: { height: 1, backgroundColor: colors.border, marginLeft: 0 },

  subLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 8,
    paddingBottom: 4,
  },

  // Segment controls
  segmentRow: {
    paddingVertical: 12,
    gap: 8,
  },
  segmentGroup: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.growth },
  segmentText: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
  segmentTextActive: { color: colors.bgPrimary, fontWeight: '700' },

  // Name edit
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 15,
  },
  saveText: { color: colors.growth, fontSize: 15, fontWeight: '700' },
});
