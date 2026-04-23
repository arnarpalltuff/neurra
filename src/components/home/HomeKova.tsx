import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Kova from '../kova/Kova';
import KovaParticles from '../kova/KovaParticles';
import KovaSpeechBubble from '../kova/KovaSpeechBubble';
import { useKovaStore, stageConfigFor } from '../../stores/kovaStore';
import { useProgressStore } from '../../stores/progressStore';
import { stageFromXP } from '../kova/KovaStates';
import { useKovaContext } from '../../hooks/useKovaContext';
import { generateKovaMessage } from '../../services/kovaAI';
import { getTimeOfDay } from '../../utils/timeUtils';
import { getGreeting } from '../../constants/kovaDialogue';
import { useStaggeredEntrance } from '../../hooks/useStaggeredEntrance';

interface HomeKovaProps {
  index: number;
  /** Raised when user taps Kova — parent may use for hearts burst etc. */
  onTap?: () => void;
  /** Whether the day's session is already done (drives Kova emotion). */
  sessionDone: boolean;
  /** Whether the streak is at risk (drives Kova emotion). */
  isUrgent: boolean;
  /** Coach-briefing greeting override — falls back to local greeting. */
  coachGreeting?: string;
}

export default React.memo(function HomeKova({
  index,
  onTap,
  sessionDone,
  isUrgent,
  coachGreeting,
}: HomeKovaProps) {
  const stageNum = useKovaStore(s => s.currentStage);
  const kovaEmotion = useKovaStore(s => s.currentEmotion);
  const kovaStageConfig = stageConfigFor(stageNum);
  const xp = useProgressStore(s => s.xp);
  const streak = useProgressStore(s => s.streak);
  const totalSessions = useProgressStore(s => s.totalSessions);
  const stage = stageFromXP(xp);

  const kovaContext = useKovaContext();
  const [kovaDialogue, setKovaDialogue] = useState<string | null>(null);
  const [kovaInsight, setKovaInsight] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);

  const fallbackGreeting = getGreeting({ streak, totalSessions });
  const forcedGreeting = coachGreeting ?? fallbackGreeting;

  useEffect(() => {
    let mounted = true;
    if (kovaContext.totalSessions >= 3) {
      generateKovaMessage('insight', kovaContext).then(msg => {
        if (mounted) setKovaInsight(msg);
      });
    }
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = useCallback(() => {
    onTap?.();
    // Tap cycle: if we have an insight and it hasn't been shown, show it;
    // otherwise fall through to fresh idle_tap chatter.
    if (kovaInsight && kovaDialogue !== kovaInsight) {
      setKovaDialogue(kovaInsight);
      setShowBubble(true);
      return;
    }
    generateKovaMessage('idle_tap', kovaContext).then(msg => {
      setKovaDialogue(msg);
      setShowBubble(true);
    });
  }, [kovaInsight, kovaDialogue, kovaContext, onTap]);

  const entranceStyle = useStaggeredEntrance(index);
  const emotion = sessionDone ? 'happy' : isUrgent ? 'worried' : streak === 0 ? 'curious' : 'idle';
  const timeOfDay = getTimeOfDay();

  return (
    <Animated.View style={[styles.zone, entranceStyle]}>
      <View style={styles.glow} pointerEvents="none">
        <LinearGradient
          colors={[`${kovaStageConfig.primaryColor}15`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>
      <KovaParticles
        emotion={kovaEmotion}
        primaryColor={kovaStageConfig.primaryColor}
        size={160}
        glowIntensity={kovaStageConfig.glowIntensity}
      />
      <KovaSpeechBubble
        text={kovaDialogue ?? ''}
        primaryColor={kovaStageConfig.primaryColor}
        visible={showBubble}
        onDismiss={() => setShowBubble(false)}
      />
      <Kova
        stage={stage}
        emotion={emotion}
        size={160 * kovaStageConfig.size}
        onTap={handleTap}
        dialogueContext={
          timeOfDay === 'morning' ? 'tapMorning'
            : timeOfDay === 'lateNight' ? 'tapLateNight'
            : 'tap'
        }
        forceDialogue={forcedGreeting}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  zone: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 220,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
});
