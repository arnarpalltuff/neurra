import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { tapLight } from '../../utils/haptics';
import { colors } from '../../constants/colors';
import { BrainArea } from '../../constants/gameConfigs';
import Card from './Card';

interface GoalPickerProps {
  selected: BrainArea[];
  onChange: (goals: BrainArea[]) => void;
  maxGoals?: number;
}

const GOALS: { area: BrainArea; icon: string; label: string; desc: string }[] = [
  { area: 'memory', icon: '🧠', label: 'Memory', desc: 'Remember more, forget less' },
  { area: 'focus', icon: '🎯', label: 'Focus', desc: 'Stay sharp and attentive' },
  { area: 'speed', icon: '⚡', label: 'Speed', desc: 'Think and react faster' },
  { area: 'flexibility', icon: '🔄', label: 'Flexibility', desc: 'Adapt to new challenges' },
  { area: 'creativity', icon: '✨', label: 'Creativity', desc: 'Find patterns and connections' },
];

export default function GoalPicker({ selected, onChange, maxGoals = 3 }: GoalPickerProps) {
  const handleToggle = (area: BrainArea) => {
    tapLight();
    if (selected.includes(area)) {
      onChange(selected.filter(a => a !== area));
    } else if (selected.length < maxGoals) {
      onChange([...selected, area]);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(100)}>
      <View style={styles.header}>
        <Text style={styles.title}>Improvement Goals</Text>
        <Text style={styles.subtitle}>Pick up to {maxGoals}. Sessions will focus on these.</Text>
      </View>
      <View style={styles.list}>
        {GOALS.map((g) => {
          const isSelected = selected.includes(g.area);
          return (
            <Pressable
              key={g.area}
              style={[styles.goalRow, isSelected && styles.goalRowSelected]}
              onPress={() => handleToggle(g.area)}
            >
              <Text style={styles.goalIcon}>{g.icon}</Text>
              <View style={styles.goalInfo}>
                <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected]}>{g.label}</Text>
                <Text style={styles.goalDesc}>{g.desc}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, marginBottom: 12 },
  title: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 12,
  },
  list: { gap: 8 },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
  },
  goalRowSelected: {
    borderColor: colors.borderAccent,
    backgroundColor: colors.growthTint,
  },
  goalIcon: { fontSize: 22 },
  goalInfo: { flex: 1, gap: 2 },
  goalLabel: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textPrimary,
    fontSize: 15,
  },
  goalLabelSelected: { color: colors.growth },
  goalDesc: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 12,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.growth,
    borderColor: colors.growth,
  },
  checkmark: {
    fontFamily: 'Nunito_700Bold',
    color: '#FFF',
    fontSize: 14,
  },
});
