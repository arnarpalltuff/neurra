import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { useUserStore } from '../../stores/userStore';
import { useProgressStore } from '../../stores/progressStore';
import { getTimeOfDay } from '../../utils/timeUtils';
import { useStaggeredEntrance } from './homeStagger';

const GREETINGS: Record<string, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  lateNight: 'Still up?',
};

interface HomeGreetingProps {
  index: number;
  weatherIcon: string;
  weatherHeadline: string;
}

export default React.memo(function HomeGreeting({
  index,
  weatherIcon,
  weatherHeadline,
}: HomeGreetingProps) {
  const style = useStaggeredEntrance(index);
  const name = useUserStore(s => s.name);
  const streak = useProgressStore(s => s.streak);
  const timeOfDay = getTimeOfDay();

  return (
    <Animated.View style={[styles.row, style]}>
      <View style={styles.left}>
        <Text style={styles.sub}>{weatherIcon}  {GREETINGS[timeOfDay].toUpperCase()}</Text>
        <Text style={styles.name}>{name || 'friend'}</Text>
        <Text style={styles.weather}>{weatherHeadline}</Text>
      </View>
      {streak > 0 && (
        <View style={styles.streakCol}>
          <View style={styles.streakGlow} />
          <View style={styles.streakFlameRow}>
            <Text style={styles.flame}>🔥</Text>
            <Text style={styles.streakNumber}>{streak}</Text>
          </View>
          <Text style={styles.streakLabel}>DAY STREAK</Text>
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginTop: 48,
  },
  left: {
    flex: 1,
  },
  sub: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: C.t3,
    letterSpacing: 1.4,
  },
  name: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 34,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  weather: {
    fontFamily: fonts.kova,
    fontSize: 15,
    color: C.t2,
    marginTop: 4,
  },
  streakCol: {
    alignItems: 'center',
    marginTop: 8,
    position: 'relative',
  },
  streakGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -4,
    borderRadius: 16,
    backgroundColor: 'rgba(240,181,66,0.08)',
    shadowColor: C.amber,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  streakFlameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  flame: {
    fontSize: 18,
  },
  streakNumber: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: C.amber,
    letterSpacing: -0.4,
    textShadowColor: 'rgba(240,181,66,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  streakLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: C.t4,
    letterSpacing: 1.3,
    marginTop: 1,
  },
});
