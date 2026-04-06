import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import type { PlanDef } from '../../stores/proStore';

interface PlanCardProps {
  plan: PlanDef;
  selected: boolean;
  onSelect: () => void;
}

export default function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onSelect}
    >
      {plan.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{plan.badge}</Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.radio}>
          {selected && <View style={styles.radioInner} />}
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{plan.name}</Text>
          <Text style={styles.price}>{plan.price}</Text>
          {!!plan.priceSubtext && (
            <Text style={styles.subtext}>{plan.priceSubtext}</Text>
          )}
          {plan.trialDays > 0 && (
            <Text style={styles.trial}>
              {plan.trialDays}-day free trial
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.bg3,
    borderRadius: 18,
    padding: 18,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  cardSelected: {
    borderColor: C.green,
    borderWidth: 1.5,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: C.green,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.green,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.headingMed,
    color: C.t1,
    fontSize: 17,
  },
  price: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 15,
  },
  subtext: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 12,
  },
  trial: {
    fontFamily: fonts.bodySemi,
    color: C.green,
    fontSize: 12,
    marginTop: 2,
  },
});
