import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { tapLight } from '../../utils/haptics';
import { colors } from '../../constants/colors';
import { useTranslation } from '../../i18n';

type Mood = 'great' | 'good' | 'okay' | 'low' | 'rough';

interface MoodCheckInProps {
  onSelect: (mood: Mood) => void;
  onDismiss?: () => void;
}

export default function MoodCheckIn({ onSelect, onDismiss }: MoodCheckInProps) {
  const t = useTranslation();

  const MOODS = useMemo<{ key: Mood; emoji: string; label: string }[]>(() => [
    { key: 'great', emoji: '😊', label: t.moodGreat },
    { key: 'good', emoji: '🙂', label: t.moodGood },
    { key: 'okay', emoji: '😐', label: t.moodOkay },
    { key: 'low', emoji: '😔', label: t.moodLow },
    { key: 'rough', emoji: '😣', label: t.moodRough },
  ], [t]);
  const handleSelect = (mood: Mood) => {
    tapLight();
    onSelect(mood);
  };

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.container}>
      <Text style={styles.title}>{t.howAreYouFeeling}</Text>
      <Text style={styles.subtitle}>This stays private and helps track your wellbeing.</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => (
          <Pressable
            key={m.key}
            style={styles.moodBtn}
            onPress={() => handleSelect(m.key)}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
            <Text style={styles.moodLabel}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={12}>
          <Text style={styles.dismissText}>{t.skip}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  title: { fontFamily: 'Quicksand_700Bold', color: colors.textPrimary, fontSize: 17 },
  subtitle: { fontFamily: 'Nunito_400Regular', color: colors.textTertiary, fontSize: 12, textAlign: 'center' },
  moodRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  moodBtn: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceDim,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flex: 1,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontFamily: 'Nunito_600SemiBold', color: colors.textSecondary, fontSize: 10 },
  dismissText: { fontFamily: 'Nunito_600SemiBold', color: colors.textTertiary, fontSize: 13, paddingVertical: 4 },
});
