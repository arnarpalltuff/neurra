import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { tapLight } from '../../utils/haptics';
import { colors } from '../../constants/colors';
import { AgeGroup } from '../../stores/userStore';
import { AGE_GROUP_LABELS } from '../../utils/ageComparison';

interface AgeGroupPickerProps {
  onSelect: (ageGroup: AgeGroup) => void;
  onSkip: () => void;
}

const AGE_GROUPS: AgeGroup[] = ['under18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

export default function AgeGroupPicker({ onSelect, onSkip }: AgeGroupPickerProps) {
  const handleSelect = (ag: AgeGroup) => {
    tapLight();
    onSelect(ag);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.title}>How old are you?</Text>
          <Text style={styles.subtitle}>
            This helps us show how you compare to others your age. You can skip this.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250)} style={styles.grid}>
          {AGE_GROUPS.map((ag) => (
            <Pressable
              key={ag}
              style={({ pressed }) => [styles.ageBtn, pressed && styles.ageBtnPressed]}
              onPress={() => handleSelect(ag)}
            >
              <Text style={styles.ageBtnText}>{AGE_GROUP_LABELS[ag]}</Text>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Pressable style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  container: { flex: 1, padding: 28, justifyContent: 'center', gap: 32 },
  header: { alignItems: 'center', gap: 10 },
  title: {
    fontFamily: 'Quicksand_700Bold',
    color: colors.textHero,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  grid: { gap: 10 },
  ageBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  ageBtnPressed: {
    backgroundColor: colors.bgHover,
    borderColor: colors.borderLight,
  },
  ageBtnText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textPrimary,
    fontSize: 17,
  },
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  skipText: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 15,
  },
});
