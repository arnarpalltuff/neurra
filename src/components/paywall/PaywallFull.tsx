import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, ScrollView,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import Kova from '../kova/Kova';
import PlanCard from './PlanCard';
import Button from '../ui/Button';
import {
  useProStore,
  PLAN_DEFS,
  PRO_FEATURES,
  type ProPlan,
  type PlanDef,
} from '../../stores/proStore';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '../../utils/purchaseSdk';
import type { PurchasesPackage } from 'react-native-purchases';

interface PaywallFullProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaywallFull({ visible, onClose }: PaywallFullProps) {
  const [selectedPlan, setSelectedPlan] = useState<ProPlan>('yearly');
  const syncFromRevenueCat = useProStore(s => s.syncFromRevenueCat);
  const purchaseLoading = useProStore(s => s.purchaseLoading);
  const setPurchaseLoading = useProStore(s => s.setPurchaseLoading);
  const setPurchaseError = useProStore(s => s.setPurchaseError);

  // Map RevenueCat packages to our plan definitions
  const [packages, setPackages] = useState<Map<ProPlan, PurchasesPackage>>(new Map());

  useEffect(() => {
    if (!visible) return;
    getOfferings().then((offering) => {
      if (!offering) return;
      const map = new Map<ProPlan, PurchasesPackage>();
      for (const pkg of offering.packages) {
        const id = pkg.product.identifier;
        if (id.includes('monthly')) map.set('monthly', pkg);
        else if (id.includes('yearly')) map.set('yearly', pkg);
        else if (id.includes('family')) map.set('family', pkg);
        else if (id.includes('lifetime')) map.set('lifetime', pkg);
      }
      setPackages(map);
    });
  }, [visible]);

  const handlePurchase = useCallback(async () => {
    const pkg = packages.get(selectedPlan);
    if (!pkg) {
      // Fallback: if RevenueCat not configured yet, just set local state
      useProStore.getState().subscribe(selectedPlan);
      onClose();
      return;
    }

    setPurchaseLoading(true);
    setPurchaseError(null);

    try {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        syncFromRevenueCat(customerInfo);
        onClose();
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Purchase failed. Please try again.';
      setPurchaseError(msg);
      Alert.alert('Purchase Error', msg);
    } finally {
      setPurchaseLoading(false);
    }
  }, [selectedPlan, packages, syncFromRevenueCat, onClose, setPurchaseLoading, setPurchaseError]);

  const handleRestore = useCallback(async () => {
    setPurchaseLoading(true);
    try {
      const info = await restorePurchases();
      syncFromRevenueCat(info);
      const isPro = useProStore.getState().isPro;
      if (isPro) {
        Alert.alert('Restored', 'Your Pro subscription has been restored.');
        onClose();
      } else {
        Alert.alert('No Subscription Found', 'We could not find an active subscription for this account.');
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message ?? 'Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  }, [syncFromRevenueCat, onClose, setPurchaseLoading]);

  const selectedDef = PLAN_DEFS.find(p => p.plan === selectedPlan);
  const ctaLabel = selectedDef?.trialDays
    ? `Start ${selectedDef.trialDays}-Day Free Trial`
    : 'Subscribe';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Close button */}
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>X</Text>
          </Pressable>

          {/* Hero */}
          <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.hero}>
            <Kova stage={5} emotion="excited" size={100} showSpeechBubble={false} />
            <Text style={styles.heroTitle}>Unlock Neurra Pro</Text>
            <Text style={styles.heroSubtitle}>
              Train without limits. Zero ads. Full brain insights.
            </Text>
          </Animated.View>

          {/* Features */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.features}>
            {PRO_FEATURES.map((feat, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{feat.icon}</Text>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>{feat.title}</Text>
                  <Text style={styles.featureDesc}>{feat.description}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Plan selector */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.plans}>
            {PLAN_DEFS.map((plan) => (
              <PlanCard
                key={plan.plan}
                plan={plan}
                selected={selectedPlan === plan.plan}
                onSelect={() => setSelectedPlan(plan.plan)}
              />
            ))}
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.ctaArea}>
            {purchaseLoading ? (
              <ActivityIndicator size="large" color={C.green} />
            ) : (
              <Button label={ctaLabel} onPress={handlePurchase} size="lg" style={styles.ctaBtn} />
            )}

            <Pressable onPress={handleRestore}>
              <Text style={styles.restoreText}>Already subscribed? Restore</Text>
            </Pressable>
          </Animated.View>

          {/* Legal */}
          <Text style={styles.legal}>
            Subscription auto-renews unless cancelled at least 24 hours before the end of the current period.
            By subscribing, you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL('https://neurra.app/terms')}>
              Terms
            </Text>
            {' '}and{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL('https://neurra.app/privacy')}>
              Privacy Policy
            </Text>.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg1,
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
    gap: 24,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bg4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: fonts.bodyBold,
    color: C.t3,
    fontSize: 14,
  },

  // Hero
  hero: {
    alignItems: 'center',
    gap: 10,
  },
  heroTitle: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 28,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Features
  features: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 20,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  featureInfo: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 15,
  },
  featureDesc: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 13,
    lineHeight: 19,
  },

  // Plans
  plans: {
    gap: 12,
  },

  // CTA
  ctaArea: {
    alignItems: 'center',
    gap: 14,
  },
  ctaBtn: {
    width: '100%',
  },
  restoreText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
  },

  // Legal
  legal: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
  legalLink: {
    color: C.blue,
    textDecorationLine: 'underline',
  },
});
