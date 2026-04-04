import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, Switch, Alert, TextInput,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { C, colors } from '../src/constants/colors';
import { fonts } from '../src/constants/typography';
import { selection } from '../src/utils/haptics';
import { playToggle } from '../src/utils/sound';
import { useUserStore } from '../src/stores/userStore';
import { useSettingsStore } from '../src/stores/settingsStore';

// ── Reusable Components ──────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function ToggleRow({ label, value, onChange, disabled }: {
  label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  const handleChange = (v: boolean) => {
    selection();
    playToggle();
    onChange(v);
  };
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={[styles.rowLabel, disabled && styles.rowLabelDisabled]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{ false: C.bg5, true: C.green }}
        thumbColor="#FFF"
      />
    </View>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
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

  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled);
  const dailyReminder = useSettingsStore(s => s.dailyReminder);
  const streakProtectionAlert = useSettingsStore(s => s.streakProtectionAlert);
  const reminderTime = useSettingsStore(s => s.reminderTime);
  const difficultyPref = useSettingsStore(s => s.difficultyPref);
  const theme = useSettingsStore(s => s.theme);
  const leaguesEnabled = useSettingsStore(s => s.leaguesEnabled);

  const setSoundEnabled = useSettingsStore(s => s.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore(s => s.setHapticsEnabled);
  const setDailyReminder = useSettingsStore(s => s.setDailyReminder);
  const setStreakProtectionAlert = useSettingsStore(s => s.setStreakProtectionAlert);
  const setDifficultyPref = useSettingsStore(s => s.setDifficultyPref);
  const setTheme = useSettingsStore(s => s.setTheme);
  const setLeaguesEnabled = useSettingsStore(s => s.setLeaguesEnabled);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  const handleSaveName = useCallback(() => {
    setName(nameInput.trim());
    setEditingName(false);
  }, [nameInput, setName]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This will permanently remove all your data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ],
    );
  }, []);

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

        {/* NOTIFICATIONS */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.card}>
          <ToggleRow label="Daily reminder" value={dailyReminder} onChange={setDailyReminder} />
          <Divider />
          <ToggleRow label="Streak protection" value={streakProtectionAlert} onChange={setStreakProtectionAlert} />
          <Divider />
          <SettingRow label="Reminder time" value={reminderTime} />
        </View>

        {/* SOUND */}
        <SectionHeader title="SOUND" />
        <View style={styles.card}>
          <ToggleRow label="Game sounds" value={soundEnabled} onChange={setSoundEnabled} />
          <Divider />
          <ToggleRow label="Haptics" value={hapticsEnabled} onChange={setHapticsEnabled} />
        </View>

        {/* SESSION */}
        <SectionHeader title="SESSION" />
        <View style={styles.card}>
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
        </View>

        {/* APPEARANCE */}
        <SectionHeader title="APPEARANCE" />
        <View style={styles.card}>
          <SegmentRow
            label="Theme"
            value={theme}
            options={[
              { key: 'dark', label: 'Dark' },
              { key: 'light', label: 'Light' },
              { key: 'auto', label: 'Auto' },
            ]}
            onChange={setTheme}
          />
        </View>

        {/* COMPETITION */}
        <SectionHeader title="COMPETITION" />
        <View style={styles.card}>
          <ToggleRow label="Leagues" value={leaguesEnabled} onChange={setLeaguesEnabled} />
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
          <DangerRow label="Delete account" onPress={handleDeleteAccount} />
        </View>

        {/* ABOUT */}
        <SectionHeader title="ABOUT" />
        <View style={styles.card}>
          <SettingRow label="Version" value="1.0.0" />
          <Divider />
          <SettingRow label="The science" onPress={() => router.push('/science')} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg2 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  backText: {
    fontFamily: fonts.bodySemi,
    color: C.blue,
    fontSize: 15,
  },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 20,
    letterSpacing: -0.3,
  },

  sectionHeader: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 28,
    marginBottom: 10,
    paddingLeft: 4,
  },

  card: {
    backgroundColor: C.bg3,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: C.border,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  rowPressed: { opacity: 0.7 },
  rowDisabled: { opacity: 0.4 },
  rowLabel: {
    fontFamily: fonts.body,
    color: C.t1,
    fontSize: 15,
    flex: 1,
  },
  rowLabelDisabled: { color: C.t3 },
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

  divider: { height: 0.5, backgroundColor: C.border, marginLeft: 0 },

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
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: C.green },
  segmentText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 12,
  },
  segmentTextActive: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
  },

  // Name edit
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
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
