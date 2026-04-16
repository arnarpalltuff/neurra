import { useMemo } from 'react';
import { useProgressStore } from '../../stores/progressStore';
import { useBrainHistoryStore } from '../../stores/brainHistoryStore';
import { classifyBrainWeather } from '../../utils/brainWeather';
import { todayStr } from '../../utils/timeUtils';

/**
 * Home-level brain-weather classification. Reads the same four stores the
 * composer used to inline, kept colocated so the composer stays thin.
 */
export function useHomeWeather() {
  const streak = useProgressStore(s => s.streak);
  const lastSessionDate = useProgressStore(s => s.lastSessionDate);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const brainScores = useProgressStore(s => s.brainScores);
  const isSessionDoneToday = useProgressStore(s => s.isSessionDoneToday);
  const getSnapshotFromDaysAgo = useBrainHistoryStore(s => s.getSnapshotFromDaysAgo);
  const sessionDone = isSessionDoneToday();

  return useMemo(() => {
    const weekAgo = getSnapshotFromDaysAgo(7);
    const gap = lastSessionDate
      ? Math.round(
          (new Date(`${todayStr()}T12:00:00`).getTime() -
            new Date(`${lastSessionDate}T12:00:00`).getTime()) / 86400000,
        )
      : Infinity;
    const returningToday = sessionDone && gap === 0 && streak === 1 && totalSessions > 1;
    return classifyBrainWeather({
      current: brainScores, weekAgo, streak, lastSessionDate, returningToday,
    });
  }, [brainScores, getSnapshotFromDaysAgo, lastSessionDate, streak, sessionDone, totalSessions]);
}
