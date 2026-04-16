import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { AREA_LABELS, AREA_ACCENT, type BrainArea } from '../../constants/gameConfigs';
import { useGamesSectionEntrance } from './gameCardStagger';

export type FilterArea = 'all' | BrainArea;

interface BrainAreaFilterBarProps {
  index: number;
  selected: FilterArea;
  onSelect: (area: FilterArea) => void;
}

const FILTERS: { key: FilterArea; label: string; accent: string }[] = [
  { key: 'all', label: 'All', accent: C.green },
  ...(Object.entries(AREA_LABELS) as Array<[BrainArea, string]>).map(([key, label]) => ({
    key: key as FilterArea,
    label,
    accent: AREA_ACCENT[key as BrainArea],
  })),
];

// PHASE 1 STUB — tactile states + press scale land in Phase 4.
export default React.memo(function BrainAreaFilterBar({
  index,
  selected,
  onSelect,
}: BrainAreaFilterBarProps) {
  const style = useGamesSectionEntrance(index);
  return (
    <Animated.View style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {FILTERS.map((f) => {
          const active = selected === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => onSelect(f.key)}
              style={[
                styles.pill,
                { borderColor: `${f.accent}${active ? '88' : '40'}` },
                active && { backgroundColor: `${f.accent}22` },
              ]}
            >
              <Text style={[styles.text, { color: active ? f.accent : C.t3 }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
