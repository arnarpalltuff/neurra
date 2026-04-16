import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { useDailyChallengeStore } from '../../stores/dailyChallengeStore';
import { useKovaStore } from '../../stores/kovaStore';
import DailyChallengeCard from './DailyChallengeCard';
import ExpirationTimer from './ExpirationTimer';
import RealLifeSlotCard from './RealLifeSlotCard';

interface DailyChallengeListProps {
  onPlayChallenge: (challengeId: string, gameType: string) => void;
}

/**
 * Container for the 3 daily challenge cards + expiration timer.
 * Automatically refreshes challenges on mount if needed.
 */
export default function DailyChallengeList({ onPlayChallenge }: DailyChallengeListProps) {
  const challenges = useDailyChallengeStore(s => s.challenges);
  const bonusChallenges = useDailyChallengeStore(s => s.bonusChallenges);
  const refreshIfNeeded = useDailyChallengeStore(s => s.refreshIfNeeded);
  const kovaStage = useKovaStore(s => s.currentStage);

  // Refresh on mount
  useEffect(() => {
    refreshIfNeeded(kovaStage);
  }, [kovaStage]);

  const availableCount = challenges.filter(c => c.status === 'available').length;
  const completedCount = challenges.filter(c => c.status === 'completed').length;
  const allDone = completedCount === challenges.length && challenges.length > 0;

  const handlePlay = (challengeId: string) => {
    const challenge = [...challenges, ...bonusChallenges].find(c => c.id === challengeId);
    if (challenge) {
      onPlayChallenge(challengeId, challenge.gameType);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Daily Challenges</Text>
          <Text style={styles.subtitle}>
            {allDone
              ? 'All done for today! 🎉'
              : `${availableCount} of ${challenges.length} remaining`}
          </Text>
        </View>
        <ExpirationTimer />
      </View>

      {/* Challenge cards */}
      <View style={styles.cards}>
        {challenges.map((challenge, i) => (
          <DailyChallengeCard
            key={challenge.id}
            challenge={challenge}
            index={i}
            onPlay={handlePlay}
          />
        ))}

        {/* Bonus challenges */}
        {bonusChallenges.filter(c => c.status === 'available').map((challenge, i) => (
          <DailyChallengeCard
            key={challenge.id}
            challenge={challenge}
            index={challenges.length + i}
            isBonus
            onPlay={handlePlay}
          />
        ))}

        {/* Real-life slot — one rotating real-world challenge per day. */}
        <RealLifeSlotCard index={challenges.length + bonusChallenges.length} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { gap: 2 },
  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: C.t1,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: C.t3,
  },
  cards: {
    gap: 10,
  },
});
