import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { tapLight } from '../../utils/haptics';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';

type Mood = 'great' | 'good' | 'okay' | 'low' | 'rough';

interface MoodCheckInProps {
  onSelect: (mood: Mood) => void;
  onDismiss?: () => void;
}

const MOODS: { key: Mood; emoji: string; label: string }[] = [
  { key: 'great', emoji: '😊', label: 'Great' },
  { key: 'good',  emoji: '🙂', label: 'Good' },
  { key: 'okay',  emoji: '😐', label: 'Okay' },
  { key: 'low',   emoji: '😔', label: 'Low' },
  { key: 'rough', emoji: '😣', label: 'Rough' },
];

export default function MoodCheckIn({ onSelect, onDismiss }: MoodCheckInProps) {
  const handleSelect = (mood: Mood) => {
    tapLight();
    onSelect(mood);
  };

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.container}>
      <Text style={styles.title}>How are you feeling?</Text>
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
          <Text style={styles.dismissText}>Skip</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(19,24,41,0.90)',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(155,114,224,0.15)',
    shadowColor: '#9B72E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  title: { fontFamily: fonts.heading, color: C.t1, fontSize: 18 },
  subtitle: { fontFamily: fonts.body, color: C.t3, fontSize: 12, textAlign: 'center' },
  moodRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  moodBtn: {
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  moodEmoji: {
    fontSize: 28,
    textShadowColor: 'rgba(155,114,224,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  moodLabel: { fontFamily: fonts.bodySemi, color: C.t2, fontSize: 10, letterSpacing: 0.3 },
  dismissText: { fontFamily: fonts.bodySemi, color: C.t3, fontSize: 13, paddingVertical: 6 },
});
