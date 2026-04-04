import { useState, useEffect, useRef } from 'react';
import { useProgressStore } from '../stores/progressStore';

/**
 * Calculates streak urgency dim factor based on time of day.
 *
 * If the user hasn't played today and has a streak > 0:
 * - Before 6 PM: full brightness (1.0)
 * - 6 PM - 10 PM: gradual dim from 1.0 → 0.5
 * - 10 PM - 11 PM: dim from 0.5 → 0.25
 * - 11 PM - midnight: dim from 0.25 → 0.1 (nearly out)
 *
 * If session is done today or streak is 0: always 1.0.
 *
 * Also detects streak breaks (streak was > 0, now reset to 0 or 1
 * because the user missed a day).
 */
export function useStreakUrgency() {
  const streak = useProgressStore(s => s.streak);
  const isSessionDoneToday = useProgressStore(s => s.isSessionDoneToday);
  const lastSessionDate = useProgressStore(s => s.lastSessionDate);

  const [urgencyDim, setUrgencyDim] = useState(1);
  const [streakBroken, setStreakBroken] = useState(false);
  const [brokenStreakValue, setBrokenStreakValue] = useState(0);
  const prevStreakRef = useRef(streak);
  const sessionDone = isSessionDoneToday();

  // Detect streak breaks
  useEffect(() => {
    const prev = prevStreakRef.current;
    // Streak broke: was >1, now reset to 0 or 1 (and today's session is the reset)
    if (prev > 1 && streak <= 1 && !sessionDone) {
      setBrokenStreakValue(prev);
      setStreakBroken(true);
    }
    prevStreakRef.current = streak;
  }, [streak, sessionDone]);

  // Calculate urgency dim factor every minute
  useEffect(() => {
    if (sessionDone || streak === 0) {
      setUrgencyDim(1);
      return;
    }

    const calcDim = () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;

      if (hour < 18) {
        setUrgencyDim(1); // Full brightness before 6 PM
      } else if (hour < 22) {
        // 6 PM to 10 PM: dim from 1.0 → 0.5
        const progress = (hour - 18) / 4;
        setUrgencyDim(1 - progress * 0.5);
      } else if (hour < 23) {
        // 10 PM to 11 PM: dim from 0.5 → 0.25
        const progress = (hour - 22);
        setUrgencyDim(0.5 - progress * 0.25);
      } else {
        // 11 PM to midnight: dim from 0.25 → 0.1
        const progress = (hour - 23);
        setUrgencyDim(0.25 - progress * 0.15);
      }
    };

    calcDim();
    const interval = setInterval(calcDim, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [sessionDone, streak]);

  const dismissStreakBreak = () => {
    setStreakBroken(false);
  };

  return {
    urgencyDim,
    isUrgent: urgencyDim < 0.8 && !sessionDone && streak > 0,
    streakBroken,
    brokenStreakValue,
    dismissStreakBreak,
  };
}
