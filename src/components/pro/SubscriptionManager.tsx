import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Linking,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { success as hapticSuccess, warning as hapticWarning } from '../../utils/haptics';
import { colors } from '../../constants/colors';
import { useProStore, PLAN_DEFS } from '../../stores/proStore';

type CancelStep = 'info' | 'survey' | 'done';

const CANCEL_REASONS = [
  'Too expensive',
  'Not using it enough',
  'Not seeing results',
  'Switching to another app',
  'Other',
];

const KEEP_ITEMS = [
  'Kova (same stage)',
  'Your grove & decorations',
  'All progress, streaks & history',
  '1 daily session',
];

const LOSE_ITEMS = [
  'Unlimited sessions',
  'Ad-free experience',
  'Brain map history',
  'Pro-exclusive cosmetics (unequipped but kept)',
  'Monthly bonus coins',
];

interface SubscriptionManagerProps {
  onClose: () => void;
  onGoToPro: () => void;
}

export default function SubscriptionManager({ onClose, onGoToPro }: SubscriptionManagerProps) {
  const isPro = useProStore(s => s.isPro);
  const plan = useProStore(s => s.plan);
  const expirationDate = useProStore(s => s.expirationDate);
  const trialActive = useProStore(s => s.trialActive);
  const trialEndDate = useProStore(s => s.trialEndDate);
  const isFoundingMember = useProStore(s => s.isFoundingMember);
  const familyRole = useProStore(s => s.familyRole);
  const cancelSubscription = useProStore(s => s.cancelSubscription);
  const restorePurchase = useProStore(s => s.restorePurchase);

  const [cancelling, setCancelling] = useState(false);
  const [cancelStep, setCancelStep] = useState<CancelStep>('info');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const planDef = plan ? PLAN_DEFS.find((p) => p.plan === plan) : null;
  const planLabel = planDef?.name ?? 'Free';

  const handleManageSubscription = () => {
    // Deep link to platform subscription management
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  };

  const handleRestore = () => {
    // In production, this calls RevenueCat.restorePurchases()
    hapticSuccess();
  };

  const handleStartCancel = () => {
    setCancelling(true);
    setCancelStep('info');
  };

  const handleConfirmCancel = () => {
    cancelSubscription();
    setCancelStep('done');
    hapticWarning();
  };

  if (cancelling) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          {cancelStep === 'info' && (
            <Animated.View entering={FadeIn}>
              <Text style={styles.cancelTitle}>We're sorry to see you go.</Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What you'll keep</Text>
                <View style={styles.keepList}>
                  {KEEP_ITEMS.map((item) => (
                    <View key={item} style={styles.keepItem}>
                      <Text style={styles.keepCheck}>✓</Text>
                      <Text style={styles.keepText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What you'll lose</Text>
                <View style={styles.loseList}>
                  {LOSE_ITEMS.map((item) => (
                    <View key={item} style={styles.loseItem}>
                      <Text style={styles.loseX}>✕</Text>
                      <Text style={styles.loseText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.cancelButtons}>
                <Pressable style={styles.keepProBtn} onPress={() => setCancelling(false)}>
                  <Text style={styles.keepProText}>Keep Pro</Text>
                </Pressable>
                <Pressable style={styles.continueBtn} onPress={() => setCancelStep('survey')}>
                  <Text style={styles.continueText}>Continue cancelling</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {cancelStep === 'survey' && (
            <Animated.View entering={FadeIn}>
              <Text style={styles.cancelTitle}>Quick question — why are you leaving?</Text>
              <Text style={styles.optionalText}>Optional</Text>

              <View style={styles.reasonList}>
                {CANCEL_REASONS.map((reason) => (
                  <Pressable
                    key={reason}
                    style={[styles.reasonItem, selectedReason === reason && styles.reasonSelected]}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>
                      {reason}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable style={styles.submitCancelBtn} onPress={handleConfirmCancel}>
                <Text style={styles.submitCancelText}>Submit and cancel</Text>
              </Pressable>
            </Animated.View>
          )}

          {cancelStep === 'done' && (
            <Animated.View entering={FadeIn} style={styles.doneArea}>
              <Text style={styles.doneTitle}>Your Pro subscription has been cancelled.</Text>
              <Text style={styles.doneBody}>
                {expirationDate
                  ? `You'll have Pro access until ${expirationDate}. `
                  : ''}
                You can re-subscribe anytime. Kova will miss the extra sparkle, but they're not going anywhere.
              </Text>
              <Pressable style={styles.gotItBtn} onPress={onClose}>
                <Text style={styles.gotItText}>Got it</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Subscription</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Status card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current plan</Text>
            <View style={styles.statusValueRow}>
              <Text style={styles.statusValue}>{isPro ? `Pro ${planLabel}` : 'Free'}</Text>
              {isFoundingMember && <Text style={styles.founderBadge}>Founding Member</Text>}
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={styles.statusValue}>
              {trialActive ? 'Trialing' : isPro ? 'Active' : 'Free'}
            </Text>
          </View>
          {expirationDate && plan !== 'lifetime' && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Next billing</Text>
              <Text style={styles.statusValue}>{expirationDate}</Text>
            </View>
          )}
          {plan === 'lifetime' && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Duration</Text>
              <Text style={styles.statusValue}>Forever</Text>
            </View>
          )}
          {familyRole && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Family role</Text>
              <Text style={styles.statusValue}>{familyRole === 'owner' ? 'Owner' : 'Member'}</Text>
            </View>
          )}
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.actions}>
          {isPro ? (
            <>
              {plan !== 'lifetime' && (
                <Pressable style={styles.actionBtn} onPress={handleManageSubscription}>
                  <Text style={styles.actionText}>Manage subscription</Text>
                  <Text style={styles.actionArrow}>→</Text>
                </Pressable>
              )}
              {plan !== 'lifetime' && (
                <Pressable style={styles.actionBtnDanger} onPress={handleStartCancel}>
                  <Text style={styles.actionTextDanger}>Cancel Pro</Text>
                </Pressable>
              )}
            </>
          ) : (
            <Pressable style={styles.goProBtn} onPress={onGoToPro}>
              <Text style={styles.goProText}>Go Pro</Text>
            </Pressable>
          )}
          <Pressable style={styles.actionBtn} onPress={handleRestore}>
            <Text style={styles.actionText}>Restore purchases</Text>
            <Text style={styles.actionArrow}>→</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 20, gap: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: { color: colors.sky, fontSize: 16, fontWeight: '600' },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },

  // Status card
  statusCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: { color: colors.textTertiary, fontSize: 13, fontWeight: '600' },
  statusValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  founderBadge: {
    backgroundColor: colors.warm + '33',
    color: colors.warm,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },

  // Actions
  actions: { gap: 10 },
  actionBtn: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  actionArrow: { color: colors.textTertiary, fontSize: 16 },
  actionBtnDanger: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF444444',
  },
  actionTextDanger: { color: '#FF4444', fontSize: 15, fontWeight: '600' },
  goProBtn: {
    backgroundColor: colors.growth,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  goProText: { color: colors.bgPrimary, fontSize: 16, fontWeight: '800' },

  // Cancel flow
  cancelTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  section: { marginBottom: 20 },
  sectionTitle: { color: colors.textSecondary, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  keepList: { gap: 8 },
  keepItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keepCheck: { color: colors.growth, fontSize: 14, fontWeight: '800' },
  keepText: { color: colors.textPrimary, fontSize: 14 },
  loseList: { gap: 8 },
  loseItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loseX: { color: '#FF4444', fontSize: 14, fontWeight: '800' },
  loseText: { color: colors.textSecondary, fontSize: 14 },
  cancelButtons: { gap: 12, marginTop: 20 },
  keepProBtn: {
    backgroundColor: colors.growth,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  keepProText: { color: colors.bgPrimary, fontSize: 16, fontWeight: '800' },
  continueBtn: {
    backgroundColor: colors.bgTertiary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },

  // Survey
  optionalText: { color: colors.textTertiary, fontSize: 13, marginBottom: 16 },
  reasonList: { gap: 8, marginBottom: 20 },
  reasonItem: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonSelected: { borderColor: colors.growth },
  reasonText: { color: colors.textSecondary, fontSize: 14 },
  reasonTextSelected: { color: colors.textPrimary, fontWeight: '600' },
  submitCancelBtn: {
    backgroundColor: '#FF4444',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitCancelText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Done
  doneArea: { alignItems: 'center', paddingTop: 40, gap: 16 },
  doneTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  doneBody: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  gotItBtn: {
    backgroundColor: colors.bgSecondary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    marginTop: 12,
  },
  gotItText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
});
