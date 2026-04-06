import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgressStore } from './progressStore';

export interface CoinTransaction {
  amount: number;
  reason: string;
  date: string;
}

interface CoinLedgerState {
  transactions: CoinTransaction[];
  earnCoins: (amount: number, reason: string) => void;
  spendCoins: (amount: number, reason: string) => boolean;
}

/**
 * Coin ledger (Phase O). Balance is stored in progressStore for legacy compatibility;
 * this store persists the transaction history and funnels earn/spend through progress.
 */
export const useCoinStore = create<CoinLedgerState>()(
  persist(
    (set) => ({
      transactions: [],

      earnCoins: (amount, reason) => {
        if (amount <= 0) return;
        useProgressStore.getState().addCoins(amount);
        set((s) => ({
          transactions: [
            ...s.transactions.slice(-199),
            { amount, reason, date: new Date().toISOString() },
          ],
        }));
      },

      spendCoins: (amount, reason) => {
        if (amount <= 0) return true;
        const ok = useProgressStore.getState().spendCoins(amount);
        if (!ok) return false;
        set((s) => ({
          transactions: [
            ...s.transactions.slice(-199),
            { amount: -amount, reason, date: new Date().toISOString() },
          ],
        }));
        return true;
      },
    }),
    {
      name: 'neurra-coin-ledger',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ transactions: s.transactions }),
    },
  ),
);
