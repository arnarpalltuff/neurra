import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts, type as t } from '../../constants/typography';
import { space, radii, shadows } from '../../constants/design';
import { useJournalStore, JournalMood } from '../../stores/journalStore';
import { tapLight, success } from '../../utils/haptics';

interface Props {
  /** Best game score from the session (for journaling context). */
  topScore?: number;
  bestGameName?: string;
  /** Optional callback fired after the user logs (or skips) the entry. */
  onLogged?: () => void;
  delay?: number;
}

const MOODS: { value: JournalMood; emoji: string; label: string; color: string }[] = [
  { value: 'up', emoji: '👍', label: 'good', color: C.green },
  { value: 'neutral', emoji: '😐', label: 'okay', color: C.t3 },
  { value: 'down', emoji: '👎', label: 'rough', color: C.amber },
];

/**
 * Post-session journal prompt. Asks "How did that feel?" with three quick
 * buttons and an optional 140-char note. Renders inline inside PostSession,
 * before the Done button. Auto-hides after the user logs an entry.
 *
 * If the user has already journaled today, the component returns null.
 */
export default function JournalPrompt({ topScore, bestGameName, onLogged, delay = 0 }: Props) {
  const addEntry = useJournalStore((s) => s.addEntry);
  const alreadyLogged = useJournalStore((s) => s.hasEntryToday());
  const [pickedMood, setPickedMood] = useState<JournalMood | null>(null);
  const [note, setNote] = useState('');
  const [hidden, setHidden] = useState(false);

  if (alreadyLogged || hidden) return null;

  const handlePickMood = (m: JournalMood) => {
    tapLight();
    setPickedMood(m);
  };

  const handleSave = () => {
    if (!pickedMood) return;
    addEntry({ mood: pickedMood, note: note.trim() || undefined, topScore, bestGameName });
    success();
    setHidden(true);
    onLogged?.();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(450)}
      exiting={FadeOut.duration(200)}
      style={styles.card}
    >
      <Text style={styles.label}>JOURNAL</Text>
      <Text style={styles.question}>How did that feel?</Text>

      <View style={styles.moodRow}>
        {MOODS.map((m) => {
          const active = pickedMood === m.value;
          return (
            <Pressable
              key={m.value}
              onPress={() => handlePickMood(m.value)}
              style={[
                styles.moodBtn,
                active && { borderColor: m.color, backgroundColor: `${m.color}15` },
              ]}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, active && { color: m.color }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {pickedMood && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <TextInput
            style={styles.input}
            placeholder="Add a note (optional)…"
            placeholderTextColor={C.t4}
            value={note}
            onChangeText={(v) => setNote(v.slice(0, 140))}
            maxLength={140}
            multiline
          />
          <View style={styles.saveRow}>
            <Text style={styles.charCount}>{note.length}/140</Text>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
    gap: space.sm,
    marginTop: space.xl,
    ...shadows.subtle,
  },
  label: {
    ...t.sectionHeader,
    color: C.t3,
  },
  question: {
    fontFamily: fonts.kova,
    fontSize: 19,
    color: C.t1,
    lineHeight: 24,
  },
  moodRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: 4,
  },
  moodBtn: {
    flex: 1,
    paddingVertical: space.sm + 2,
    borderRadius: radii.md,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 4,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  input: {
    marginTop: space.sm,
    backgroundColor: C.bg1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.sm,
    color: C.t1,
    fontFamily: fonts.body,
    fontSize: 14,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  saveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.xs,
  },
  charCount: {
    fontFamily: fonts.body,
    color: C.t4,
    fontSize: 11,
  },
  saveBtn: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radii.full,
    backgroundColor: C.green,
  },
  saveBtnText: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
