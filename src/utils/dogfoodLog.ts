import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Dogfood logger for the Mind Drift 7-day retention test (2026-04-20 → 2026-04-27).
 * Persists each session as an entry in an append-only array under a single
 * AsyncStorage key. Logging failures are swallowed — this must never affect
 * gameplay. Call `dumpDogfoodLog()` from a dev console to read the full array.
 */

const KEY = 'neurra-dogfood-log';

export interface DogfoodSession {
  game: 'mind-drift';
  startedAt: string;         // ISO timestamp
  endedAt: string;           // ISO timestamp
  finished: boolean;         // true = completed all rounds; false = abandoned
  finalScore: number;
  roundsCompleted: number;   // rounds fully finished before exit
  totalRounds: number;       // rounds the session was targeting
  pathLength: number;        // path length per round (constant within a session)
}

export async function logDogfoodSession(entry: DogfoodSession): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr: DogfoodSession[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    await AsyncStorage.setItem(KEY, JSON.stringify(arr));
    if (__DEV__) console.log('[dogfood]', JSON.stringify(entry));
  } catch {
    // Silent — never affect gameplay.
  }
}

export async function dumpDogfoodLog(): Promise<DogfoodSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr: DogfoodSession[] = raw ? JSON.parse(raw) : [];
    if (__DEV__) console.log('[dogfood dump]', JSON.stringify(arr, null, 2));
    return arr;
  } catch {
    return [];
  }
}

export async function clearDogfoodLog(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Silent.
  }
}
