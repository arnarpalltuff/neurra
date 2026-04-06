import { useState, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { useProgressStore } from '../stores/progressStore';
import { useStoryStore } from '../stores/storyStore';
import { getDailyBriefing, summarizeSessions, type CoachBriefing } from '../services/brainCoach';

/**
 * Hook that returns the daily AI coaching briefing.
 *
 * - Calls the API once per day on mount
 * - Returns cached briefing on subsequent renders
 * - Falls back to static greetings if API unavailable or insufficient data
 */
export function useDailyBriefing() {
  const [briefing, setBriefing] = useState<CoachBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  const name = useUserStore(s => s.name) || 'friend';
  const streak = useProgressStore(s => s.streak);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const storyEnabled = useStoryStore(s => s.storyEnabled);
  const storyDay = useStoryStore(s => s.currentDay);

  useEffect(() => {
    let cancelled = false;

    async function fetchBriefing() {
      try {
        const sessions = useProgressStore.getState().sessions;
        const summaries = summarizeSessions(sessions);
        const result = await getDailyBriefing({
          name,
          streak,
          totalSessions,
          sessions: summaries,
          storyEnabled,
          storyDay,
          apiKey: undefined,
        });
        if (!cancelled) setBriefing(result);
      } catch {
        // Silently fail — static fallback is already in getDailyBriefing
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBriefing();
    return () => { cancelled = true; };
  }, [name, streak, totalSessions, storyEnabled, storyDay]);

  return { briefing, loading };
}
