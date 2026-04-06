import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../constants/colors';
import { selection } from '../../utils/haptics';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Card({ children, style, elevated = false, onPress }: CardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const inner = (
    <>
      <LinearGradient
        colors={[C.bg4, C.bg3]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        {children}
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.card, elevated && styles.elevated, style]}>
        {inner}
      </View>
    );
  }

  return (
    <AnimatedPressable
      style={[styles.card, elevated && styles.elevated, animStyle, style]}
      onPress={onPress}
      onPressIn={() => {
        selection();
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 8, stiffness: 200 });
      }}
    >
      {inner}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 4,
  },
  elevated: {
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 8,
  },
  content: {
    padding: 20,
  },
});
