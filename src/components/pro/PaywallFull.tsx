import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import Kova from '../kova/Kova';
import { useProStore, PLAN_DEFS, PRO_FEATURES, PlanDef } from '../../stores/proStore';

interface PaywallFullProps {
  onClose: () => void;
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PlanDef;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      style={[styles.planCard, selected && styles.planCardSelected]}
      onPress={onSelect}
    >
      {plan.badge && (
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{plan.badge}</Text>
        </View>
      )}
      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.planPrice}>{plan.price}</Text>
      {plan.priceSubtext ? (
        <Text style={styles.planSubtext}>{plan.priceSubtext}</Text>
      ) : null}
      {plan.trialDays > 0 && (
        <Text style={styles.planTrial}>{plan.trialDays}-day free trial</Text>
      )}
    </Pressable>
  );
}

export default function PaywallFull({ onClose }: PaywallFullProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanDef>(PLAN_DEFS[1]); // Default: yearly
  const { subscribe, recordFullPaywall } = useProStore();

  const handleSubscribe = () => {
    // In production, this would go through RevenueCat/StoreKit
    subscribe(selectedPlan.plan);
    recordFullPaywall();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const ctaText = selectedPlan.trialDays > 0
    ? 'Start free trial'
    : selectedPlan.plan === 'lifetime'
    ? 'Buy Lifetime'
    : 'Subscribe';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.Text entering={FadeIn.delay(100)} style={styles.header}>
          Unlock your full potential
        </Animated.Text>

        {/* Kova */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.kovaArea}>
          <Kova stage={5} emotion="proud" size={110} />
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.features}>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.description}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Plan cards */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plansRow}
          >
            {PLAN_DEFS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlan.id === plan.id}
                onSelect={() => setSelectedPlan(plan)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.ctaArea}>
          <Pressable style={styles.ctaBtn} onPress={handleSubscribe}>
            <Text style={styles.ctaBtnText}>{ctaText}</Text>
          </Pressable>
          <Text style={styles.ctaDisclaimer}>
            Cancel anytime. No hidden fees. Your progress is always saved.
          </Text>
          <Text style={styles.ctaLegal}>
            Payment will be charged to your App Store/Google Play account.
          </Text>
        </Animated.View>

        {/* Dismiss */}
        <Pressable style={styles.dismissBtn} onPress={onClose}>
          <Text style={styles.dismissText}>Not now</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 24, paddingBottom: 40 },
  header: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  kovaArea: { alignItems: 'center', paddingVertical: 16 },

  // Features
  features: { gap: 14, marginBottom: 24 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: { fontSize: 24 },
  featureText: { flex: 1 },
  featureTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  featureDesc: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },

  // Plan cards
  plansRow: { gap: 10, paddingBottom: 4, paddingHorizontal: 2 },
  planCard: {
    width: 140,
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  planCardSelected: { borderColor: colors.growth, borderWidth: 2 },
  planBadge: {
    backgroundColor: colors.growth,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  planBadgeText: { color: colors.bgPrimary, fontSize: 10, fontWeight: '800' },
  planName: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  planPrice: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  planSubtext: { color: colors.textTertiary, fontSize: 10, textAlign: 'center' },
  planTrial: { color: colors.growth, fontSize: 11, fontWeight: '700', marginTop: 2 },

  // CTA
  ctaArea: { alignItems: 'center', gap: 8, marginTop: 24 },
  ctaBtn: {
    backgroundColor: colors.growth,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  ctaBtnText: { color: colors.bgPrimary, fontSize: 17, fontWeight: '800' },
  ctaDisclaimer: {
    color: colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  ctaLegal: {
    color: colors.textTertiary,
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.7,
  },

  // Dismiss
  dismissBtn: {
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 12,
  },
  dismissText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
