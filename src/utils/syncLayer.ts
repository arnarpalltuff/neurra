import { useAuthStore, SyncAction } from '../stores/authStore';

/**
 * Sync layer abstraction for offline-first data sync.
 *
 * In production, this connects to Firebase Firestore or Supabase.
 * All operations work offline and queue for sync on reconnect.
 *
 * Strategy:
 * - After each session: sync to server
 * - On app open: pull latest from server
 * - Conflict resolution: last write wins (server timestamp)
 * - Offline: everything works locally, syncs on reconnect
 */

/** What gets synced to the server */
export interface SyncPayload {
  userId: string;
  progress: {
    xp: number;
    level: number;
    streak: number;
    longestStreak: number;
    totalSessions: number;
    brainScores: Record<string, number>;
    coins: number;
    league: string;
  };
  grove: {
    activeTheme: string;
    unlockedThemes: string[];
    placedDecorations: unknown[];
    ownedDecorations: string[];
    zoneGrowths: unknown;
    unlockedVisitors: string[];
  };
  cosmetics: {
    ownedOutfits: string[];
    ownedAccessories: string[];
    equippedOutfit: string | null;
    equippedAccessory: string | null;
  };
  settings: Record<string, unknown>;
  subscription: {
    isPro: boolean;
    plan: string | null;
    expirationDate: string | null;
  };
  timestamp: number;
}

/** Queue an action for sync when online */
export function queueSync(type: string, payload: Record<string, unknown>): void {
  const { addToSyncQueue, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) return;
  addToSyncQueue({ type, payload });
}

/** Attempt to sync all queued actions */
export async function flushSyncQueue(): Promise<{ synced: number; failed: number }> {
  const { syncQueue, clearSyncQueue, isAuthenticated, recordSync } = useAuthStore.getState();

  if (!isAuthenticated || syncQueue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  // In production: batch upload syncQueue to server
  // For each action in queue:
  //   POST /api/sync { action }
  //   On success: remove from queue
  //   On failure: keep in queue for retry
  //
  // For now, simulate success:
  const count = syncQueue.length;
  clearSyncQueue();
  recordSync();

  return { synced: count, failed: 0 };
}

/** Pull latest data from server (on app open) */
export async function pullFromServer(): Promise<boolean> {
  const { isAuthenticated, user } = useAuthStore.getState();
  if (!isAuthenticated || !user) return false;

  // In production:
  //   GET /api/user/{userId}/state
  //   Compare server timestamp with local
  //   If server is newer: merge into local stores
  //   If local is newer: push local to server
  //
  // For now, no-op:
  return true;
}

/** Full sync: push local changes, then pull server state */
export async function fullSync(): Promise<void> {
  await flushSyncQueue();
  await pullFromServer();
}

/** Sync after session completion */
export function syncAfterSession(): void {
  // Fire-and-forget sync
  flushSyncQueue().catch(() => {
    // Silently fail — will retry next time
  });
}
