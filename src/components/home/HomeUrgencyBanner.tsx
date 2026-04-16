import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { accentGlow } from '../../constants/design';
import { useStaggeredEntrance } from '../../hooks/useStaggeredEntrance';

interface HomeUrgencyBannerProps {
  index: number;
}

export default React.memo(function HomeUrgencyBanner({ index }: HomeUrgencyBannerProps) {
  const style = useStaggeredEntrance(index);
  return (
    <Animated.View style={[styles.banner, accentGlow(C.amber, 14, 0.22), style]}>
      <Text style={styles.text}>
        Your streak's running low. A quick session keeps the flame alive.
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(240,181,66,0.1)',
    borderWidth: 1,
    borderColor: `${C.amber}44`,
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: C.amber,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
