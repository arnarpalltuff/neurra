import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space } from '../../constants/design';

interface SectionHeaderProps {
  eyebrow: string;
  actionLabel?: string;
  onAction?: () => void;
  paddingHorizontal?: number;
}

export default React.memo(function SectionHeader({
  eyebrow, actionLabel, onAction, paddingHorizontal = space.lg,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, { paddingHorizontal }]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.linkText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: space.sm,
  },
  eyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.t3,
    textTransform: 'uppercase',
  },
  linkText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: C.green,
  },
});
