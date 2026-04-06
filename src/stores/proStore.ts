import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useShallow } from 'zustand/react/shallow';
import { todayStr } from '../utils/timeUtils';
import type { CustomerInfo } from 'react-native-purchases';
import { isProFromCustomerInfo, getProDetails } from '../utils/purchaseSdk';

// ── Types ──────────────────────────────────────────────

export type ProPlan = 'monthly' | 'yearly' | 'family' | 'lifetime';
export type FamilyRole = 'owner' | 'member';

export interface ProStatus {
  isPro: boolean;
  plan: ProPlan | null;
  expirationDate: string | null; // ISO date, null for lifetime
  trialActive: boolean;
  trialEndDate: string | null;
  familyRole: FamilyRole | null;
  isFoundingMember: boolean;
}

// ── Plan Definitions ───────────────────────────────────

export interface PlanDef {
  id: string;
  plan: ProPlan;
  name: string;
  price: string;
  priceSubtext: string;
  badge?: string;
  trialDays: number;
}

export const PLAN_DEFS: PlanDef[] = [
  {
    id: 'neurra_pro_monthly',
    plan: 'monthly',
    name: 'Monthly',
    price: '$7.99/mo',
    priceSubtext: '',
    trialDays: 0,
  },
  {
    id: 'neurra_pro_yearly',
    plan: 'yearly',
    name: 'Yearly',
    price: '$49.99/yr',
    priceSubtext: '$4.17/month · Save 48%',
    badge: 'Best Value',
    trialDays: 7,
  },
  {
    id: 'neurra_pro_family',
    plan: 'family',
    name: 'Family',
    price: '$79.99/yr',
    priceSubtext: 'Up to 5 members · $1.33/mo each',
    trialDays: 7,
  },
  {
    id: 'neurra_pro_lifetime',
    plan: 'lifetime',
    name: 'Lifetime',
    price: '$149.99',
    priceSubtext: 'Pay once, yours forever',
    trialDays: 0,
  },
];

// ── Pro Feature List ───────────────────────────────────

export const PRO_FEATURES = [
  { icon: '♾️', title: 'Unlimited sessions', description: 'Train as many times as you want each day' },
  { icon: '🚫', title: 'Zero ads', description: 'No banners, no interruptions, ever' },
  { icon: '📊', title: 'Brain map history', description: 'See your progress over weeks, months, and years' },
  { icon: '👗', title: 'Exclusive Kova styles', description: 'Crystal Armor, Aurora Cloak, and more' },
  { icon: '🌿', title: 'Grove themes & decorations', description: 'Aurora Borealis, Bioluminescent Deep, and Pro items' },
  { icon: '🪙', title: '500 bonus coins/month', description: 'Monthly coin drop on your renewal day' },
] as const;

// ── Paywall Display Rules ──────────────────────────────

interface PaywallState {
  lastFullPaywallDate: string | null;
  nudgeCountToday: number;
  nudgeDate: string | null;
  lastWeeklyReportPaywallDate: string | null;
}

// ── Store ──────────────────────────────────────────────

interface ProStoreState extends ProStatus {
  // Paywall tracking
  paywall: PaywallState;

  // Founding member
  foundingMemberCount: number; // simulated local count

  // Purchase flow
  purchaseLoading: boolean;
  purchaseError: string | null;
  /** Dev-only: treat user as Pro for gated features (Phase R) */
  debugSimulatePro: boolean;
  setDebugSimulatePro: (v: boolean) => void;

  // Actions
  subscribe: (plan: ProPlan) => void;
  syncFromRevenueCat: (info: CustomerInfo) => void;
  cancelSubscription: () => void;
  restorePurchase: (plan: ProPlan, expDate: string | null) => void;
  setFoundingMember: () => void;
  setPurchaseLoading: (v: boolean) => void;
  setPurchaseError: (v: string | null) => void;
  grantMonthlyCoins: () => boolean; // returns true if coins should be granted
  lastMonthlyCoinDate: string | null;

  // Paywall tracking
  canShowFullPaywall: (totalSessions: number) => boolean;
  recordFullPaywall: () => void;
  canShowNudge: (totalSessions: number) => boolean;
  recordNudge: () => void;
  canShowWeeklyPaywall: () => boolean;
  recordWeeklyPaywall: () => void;
}

export const useProStore = create<ProStoreState>()(
  persist(
    (set, get) => ({
      isPro: false,
      plan: null,
      expirationDate: null,
      trialActive: false,
      trialEndDate: null,
      familyRole: null,
      isFoundingMember: false,
      foundingMemberCount: 0,
      lastMonthlyCoinDate: null,
      purchaseLoading: false,
      purchaseError: null,
      debugSimulatePro: false,

      setDebugSimulatePro: (debugSimulatePro) => set({ debugSimulatePro }),

      paywall: {
        lastFullPaywallDate: null,
        nudgeCountToday: 0,
        nudgeDate: null,
        lastWeeklyReportPaywallDate: null,
      },

      subscribe: (plan) => {
        const now = new Date();
        let expDate: string | null = null;

        if (plan === 'monthly') {
          const exp = new Date(now);
          exp.setMonth(exp.getMonth() + 1);
          expDate = exp.toISOString().split('T')[0];
        } else if (plan === 'yearly' || plan === 'family') {
          const exp = new Date(now);
          exp.setFullYear(exp.getFullYear() + 1);
          expDate = exp.toISOString().split('T')[0];
        }
        // lifetime: expDate stays null

        set({
          isPro: true,
          plan,
          expirationDate: expDate,
          trialActive: false,
          trialEndDate: null,
          familyRole: plan === 'family' ? 'owner' : null,
        });
      },

      syncFromRevenueCat: (info: CustomerInfo) => {
        const isPro = isProFromCustomerInfo(info);
        const details = getProDetails(info);

        if (!isPro || !details) {
          set({ isPro: false, plan: null, expirationDate: null, trialActive: false, trialEndDate: null });
          return;
        }

        // Map RevenueCat product identifier back to our plan type
        const productId = details.productIdentifier;
        let plan: ProPlan = 'monthly';
        if (productId.includes('yearly')) plan = 'yearly';
        else if (productId.includes('family')) plan = 'family';
        else if (productId.includes('lifetime')) plan = 'lifetime';

        set({
          isPro: true,
          plan,
          expirationDate: details.expirationDate ?? null,
          trialActive: false,
          trialEndDate: null,
        });
      },

      setPurchaseLoading: (purchaseLoading) => set({ purchaseLoading }),
      setPurchaseError: (purchaseError) => set({ purchaseError }),

      cancelSubscription: () =>
        set({
          // Keep isPro until expiration — caller checks expirationDate
          // For simplicity, immediately revert (real app would keep until billing end)
          isPro: false,
          plan: null,
          trialActive: false,
          trialEndDate: null,
          familyRole: null,
        }),

      restorePurchase: (plan, expDate) =>
        set({
          isPro: true,
          plan,
          expirationDate: expDate,
          trialActive: false,
          trialEndDate: null,
        }),

      setFoundingMember: () =>
        set({ isFoundingMember: true }),

      grantMonthlyCoins: () => {
        const s = get();
        if (!s.isPro && !s.debugSimulatePro) return false;
        if (s.plan === 'lifetime' || s.plan === 'monthly' || s.plan === 'yearly' || s.plan === 'family') {
          const today = todayStr();
          if (s.lastMonthlyCoinDate === today) return false;
          // Check if at least 28 days since last grant
          if (s.lastMonthlyCoinDate) {
            const last = new Date(s.lastMonthlyCoinDate);
            const diff = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
            if (diff < 28) return false;
          }
          set({ lastMonthlyCoinDate: today });
          return true; // caller awards 500 coins
        }
        return false;
      },

      // Paywall display rules
      canShowFullPaywall: (totalSessions) => {
        const s = get();
        if (s.isPro || s.debugSimulatePro) return false;
        if (totalSessions < 7) return false; // Never before Day 7 (approx)
        const today = todayStr();
        if (s.paywall.lastFullPaywallDate) {
          const last = new Date(s.paywall.lastFullPaywallDate);
          const diff = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
          if (diff < 7) return false; // Max once per week
        }
        return true;
      },

      recordFullPaywall: () =>
        set((s) => ({
          paywall: { ...s.paywall, lastFullPaywallDate: todayStr() },
        })),

      canShowNudge: (totalSessions) => {
        const s = get();
        if (s.isPro || s.debugSimulatePro) return false;
        if (totalSessions < 7) return false;
        const today = todayStr();
        const pw = s.paywall;
        if (pw.nudgeDate !== today) {
          return true; // New day, reset count
        }
        return pw.nudgeCountToday < 2; // Max 2 per day
      },

      recordNudge: () =>
        set((s) => {
          const today = todayStr();
          const isNewDay = s.paywall.nudgeDate !== today;
          return {
            paywall: {
              ...s.paywall,
              nudgeDate: today,
              nudgeCountToday: isNewDay ? 1 : s.paywall.nudgeCountToday + 1,
            },
          };
        }),

      canShowWeeklyPaywall: () => {
        const s = get();
        if (s.isPro || s.debugSimulatePro) return false;
        const today = todayStr();
        if (s.paywall.lastWeeklyReportPaywallDate === today) return false;
        return true;
      },

      recordWeeklyPaywall: () =>
        set((s) => ({
          paywall: { ...s.paywall, lastWeeklyReportPaywallDate: todayStr() },
        })),
    }),
    {
      name: 'neurra-pro',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// ── Convenience Hook ───────────────────────────────────

export function useProStatus(): ProStatus {
  return useProStore(useShallow((s) => ({
    isPro: s.isPro || s.debugSimulatePro,
    plan: s.plan,
    expirationDate: s.expirationDate,
    trialActive: s.trialActive,
    trialEndDate: s.trialEndDate,
    familyRole: s.familyRole,
    isFoundingMember: s.isFoundingMember,
  })));
}
