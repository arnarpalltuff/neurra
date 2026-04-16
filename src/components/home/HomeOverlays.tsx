import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions } from 'react-native';
import CelebrationOverlay, { CelebrationKind } from '../ui/CelebrationOverlay';
import StreakBreakOverlay from '../ui/StreakBreakOverlay';
import Celebration from '../ui/Celebration';
import KovaEvolutionAnimation from '../kova/KovaEvolutionAnimation';
import PaywallFull from '../paywall/PaywallFull';
import { useProgressStore } from '../../stores/progressStore';
import { useKovaStore } from '../../stores/kovaStore';
import { useGameUnlockStore, daysSinceJoin } from '../../stores/gameUnlockStore';
import { useStreakUrgency } from '../../hooks/useStreakUrgency';
import { gameConfigs } from '../../constants/gameConfigs';
import { unlocksOnDay } from '../../constants/gameUnlockSchedule';

const { width } = Dimensions.get('window');

interface HomeOverlaysProps {
  /** Bump this value to fire a hearts particle burst (Kova tap etc). */
  heartsTrigger: number;
  /** Controlled visibility of the full paywall. */
  showPaywall: boolean;
  onClosePaywall: () => void;
}

/**
 * All top-of-app overlays and their triggering effects:
 *   - Level-up + game-unlock celebration queue
 *   - Streak-break overlay
 *   - Kova evolution / de-evolution transitions
 *   - Streak-freeze apology alert
 *   - Hearts particle burst
 *   - Full paywall modal
 * Owns the celebration queue state so the composer doesn't have to.
 */
export default React.memo(function HomeOverlays({
  heartsTrigger,
  showPaywall,
  onClosePaywall,
}: HomeOverlaysProps) {
  const level = useProgressStore(s => s.level);
  const longestStreak = useProgressStore(s => s.longestStreak);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const xp = useProgressStore(s => s.xp);
  const pendingFreezeMsg = useProgressStore(s => s.pendingStreakFreezeMessage);
  const clearPendingFreezeMsg = useProgressStore(s => s.clearPendingStreakFreezeMessage);

  const kovaStage = useKovaStore(s => s.currentStage);
  const pendingEvolution = useKovaStore(s => s.pendingEvolution);
  const pendingDeEvolution = useKovaStore(s => s.pendingDeEvolution);
  const clearPendingEvolution = useKovaStore(s => s.clearPendingEvolution);

  const unlockRefresh = useGameUnlockStore(s => s.refresh);
  const markUnlockCelebrated = useGameUnlockStore(s => s.markCelebrated);
  const celebratedDays = useGameUnlockStore(s => s.celebratedDays);

  const { streakBroken, brokenStreakValue, dismissStreakBreak } = useStreakUrgency();

  const [celebration, setCelebration] = useState<{ kind: CelebrationKind; value: string | number } | null>(null);

  // Level-up celebration when level advances.
  const prevLevelRef = useRef(level);
  useEffect(() => {
    if (prevLevelRef.current < level) setCelebration({ kind: 'levelUp', value: level });
    prevLevelRef.current = level;
  }, [level]);

  // Game-unlock celebration on first mount of a new unlock day.
  useEffect(() => {
    unlockRefresh();
    const day = daysSinceJoin();
    const todaysUnlocks = unlocksOnDay(day);
    if (todaysUnlocks.length === 0 || celebratedDays.includes(day)) return;
    const cfg = gameConfigs[todaysUnlocks[0]];
    if (!cfg) return;
    const label = todaysUnlocks.length > 1
      ? `${cfg.name} +${todaysUnlocks.length - 1} more`
      : cfg.name;
    const t = setTimeout(() => {
      setCelebration(prev => prev ?? { kind: 'gameUnlock', value: label });
      markUnlockCelebrated(day);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Streak-freeze apology alert.
  useEffect(() => {
    if (pendingFreezeMsg) {
      Alert.alert('Kova', pendingFreezeMsg, [
        { text: 'Thanks, Kova', onPress: () => clearPendingFreezeMsg() },
      ]);
    }
  }, [pendingFreezeMsg, clearPendingFreezeMsg]);

  return (
    <>
      {celebration && (
        <CelebrationOverlay
          kind={celebration.kind}
          value={celebration.value}
          visible
          onDismiss={() => setCelebration(null)}
        />
      )}
      <StreakBreakOverlay
        visible={streakBroken}
        brokenStreak={brokenStreakValue}
        longestStreak={longestStreak}
        totalSessions={totalSessions}
        xp={xp}
        onStartNewStreak={dismissStreakBreak}
      />
      <Celebration type="particles_hearts" trigger={heartsTrigger} origin={{ x: width / 2, y: 220 }} />
      <PaywallFull visible={showPaywall} onClose={onClosePaywall} />
      {pendingEvolution != null && (
        <KovaEvolutionAnimation
          fromStage={kovaStage - 1}
          toStage={pendingEvolution}
          isDeEvolution={false}
          onComplete={clearPendingEvolution}
        />
      )}
      {pendingDeEvolution != null && (
        <KovaEvolutionAnimation
          fromStage={kovaStage + 1}
          toStage={pendingDeEvolution}
          isDeEvolution
          onComplete={clearPendingEvolution}
        />
      )}
    </>
  );
});
