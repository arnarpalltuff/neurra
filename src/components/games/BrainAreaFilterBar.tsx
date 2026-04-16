import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { AREA_LABELS, AREA_ACCENT, type BrainArea } from '../../constants/gameConfigs';
import PressableScale from '../ui/PressableScale';
import { selection } from '../../utils/haptics';
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
            <PressableScale
              key={f.key}
              scaleDown={0.94}
              onPress={() => { selection(); onSelect(f.key); }}
              style={[
                styles.pill,
                { borderColor: `${f.accent}${active ? '88' : '40'}` },
                active && {
                  backgroundColor: `${f.accent}22`,
                  shadowColor: f.accent,
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                },
              ]}
            >
              {active && <View style={[styles.dot, { backgroundColor: f.accent }]} />}
              <Text
                style={[
                  styles.text,
                  { color: active ? f.accent : C.t3 },
                  active && { fontFamily: fonts.bodyBold },
                ]}
              >
                {f.label}
              </Text>
            </PressableScale>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
