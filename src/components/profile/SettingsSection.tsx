import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { selection } from '../../utils/haptics';
import { navigate, navigateReplace } from '../../utils/navigate';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii } from '../../constants/design';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUserStore } from '../../stores/userStore';
import { useProStore } from '../../stores/proStore';
import { restorePurchases } from '../../utils/purchaseSdk';
import SectionHeader from '../home/SectionHeader';

interface SettingsSectionProps {
  onOpenPaywall: () => void;
}

type SessionLength = 'quick' | 'standard' | 'deep';

const SESSION_OPTIONS: Array<{ value: SessionLength; label: string }> = [
  { value: 'quick', label: 'Quick' },
  { value: 'standard', label: 'Standard' },
  { value: 'deep', label: 'Deep' },
];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const handle = (v: boolean) => {
    selection();
    onChange(v);
  };
  return (
    <View style={styles.row}>
      {icon && <Ionicons name={icon} size={16} color={C.t3} style={styles.rowIcon} />}
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={handle}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: C.green }}
        thumbColor={C.t1}
      />
    </View>
  );
}

function NavRow({
  label,
  value,
  onPress,
  icon,
  danger,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        selection();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={danger ? C.coral : C.t3}
          style={styles.rowIcon}
        />
      )}
      <Text style={[styles.rowLabel, danger && { color: C.coral }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {!danger && <Ionicons name="chevron-forward" size={14} color={C.t4} />}
      </View>
    </Pressable>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              selection();
              onChange(o.value);
            }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default React.memo(function SettingsSection({ onOpenPaywall }: SettingsSectionProps) {
  const aiKovaEnabled = useSettingsStore(s => s.aiKovaEnabled);
  const setAiKovaEnabled = useSettingsStore(s => s.setAiKovaEnabled);
  const neuralMapEnabled = useSettingsStore(s => s.neuralMapEnabled);
  const setNeuralMapEnabled = useSettingsStore(s => s.setNeuralMapEnabled);
  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const setSoundEnabled = useSettingsStore(s => s.setSoundEnabled);
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore(s => s.setHapticsEnabled);
  const dailyReminder = useSettingsStore(s => s.dailyReminder);
  const setDailyReminder = useSettingsStore(s => s.setDailyReminder);

  const sessionLength = useUserStore(s => s.sessionLength) as SessionLength;
  const setSessionLength = useUserStore(s => s.setSessionLength);

  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  const debugSimulatePro = useProStore(s => s.debugSimulatePro);
  const setDebugSimulatePro = useProStore(s => s.setDebugSimulatePro);
  const syncFromRevenueCat = useProStore(s => s.syncFromRevenueCat);

  const handleRestore = useCallback(async () => {
    try {
      const info = await restorePurchases();
      syncFromRevenueCat(info);
      const restored = useProStore.getState().isPro;
      Alert.alert(
        restored ? 'Restored' : 'No subscription found',
        restored
          ? 'Your Pro subscription has been restored.'
          : 'No active subscription for this account.',
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Please try again.';
      Alert.alert('Restore failed', msg);
    }
  }, [syncFromRevenueCat]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete all data?',
      'Erases progress, streak, scores, and settings. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigateReplace('/onboarding');
            } catch {
              Alert.alert('Error', 'Could not clear data. Try again.');
            }
          },
        },
      ],
    );
  }, []);

  return (
    <Animated.View
      entering={FadeInDown.delay(800).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <SectionHeader eyebrow="SETTINGS" />

      <Group title="Experience">
        <ToggleRow label="AI-powered Kova" value={aiKovaEnabled} onChange={setAiKovaEnabled} icon="sparkles" />
        <Divider />
        <ToggleRow label="Neural Map in games" value={neuralMapEnabled} onChange={setNeuralMapEnabled} icon="pulse" />
        <Divider />
        <ToggleRow label="Sound" value={soundEnabled} onChange={setSoundEnabled} icon="volume-medium" />
        <Divider />
        <ToggleRow label="Haptics" value={hapticsEnabled} onChange={setHapticsEnabled} icon="phone-portrait" />
      </Group>

      <Group title="Preferences">
        <View style={styles.rowStack}>
          <View style={styles.rowHeader}>
            <Ionicons name="timer" size={16} color={C.t3} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>Session length</Text>
          </View>
          <Segmented
            options={SESSION_OPTIONS}
            value={sessionLength}
            onChange={setSessionLength}
          />
        </View>
        <Divider />
        <ToggleRow label="Daily reminder" value={dailyReminder} onChange={setDailyReminder} icon="notifications" />
      </Group>

      <Group title="Account">
        <NavRow
          label="Subscription"
          value={isPro ? 'Pro' : 'Free'}
          onPress={isPro ? () => navigate('/settings') : onOpenPaywall}
          icon="card"
        />
        <Divider />
        <NavRow label="Restore purchases" onPress={handleRestore} icon="refresh" />
      </Group>

      <Group title="About">
        <NavRow label="The science" onPress={() => navigate('/science')} icon="flask" />
        <Divider />
        <NavRow label="Privacy policy" onPress={() => navigate('/privacy')} icon="shield-checkmark" />
        <Divider />
        <NavRow label="Terms of service" onPress={() => navigate('/terms')} icon="document-text" />
      </Group>

      <Group title="Danger zone">
        <NavRow label="Delete all data" onPress={handleDelete} icon="trash" danger />
      </Group>

      {__DEV__ && (
        <Group title="Developer">
          <ToggleRow
            label="Simulate Pro"
            value={debugSimulatePro}
            onChange={setDebugSimulatePro}
            icon="bug"
          />
        </Group>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  group: {
    marginBottom: space.md,
  },
  groupTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.t3,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: space.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  rowIcon: {
    marginRight: space.sm,
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: C.t1,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.t3,
  },
  rowStack: {
    paddingVertical: 12,
    gap: space.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: space.md + 16,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.pill,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  segmentActive: {
    backgroundColor: `${C.green}33`,
  },
  segmentText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: C.t3,
  },
  segmentTextActive: {
    color: C.green,
  },
});
