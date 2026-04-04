import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { tapLight } from '../../utils/haptics';
import { playTap } from '../../utils/sound';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GradientButton({
  label,
  onPress,
  size = 'lg',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.base, styles[`size_${size}`], disabled && styles.disabled, animStyle, style]}
      onPress={onPress}
      onPressIn={() => {
        tapLight();
        playTap();
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 8, stiffness: 200 });
      }}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={['#5BBF8E', colors.growth, '#5BBF8E'] as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {loading ? (
        <ActivityIndicator color={colors.textInverse} />
      ) : (
        <Text style={[styles.text, styles[`textSize_${size}`], textStyle]}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.growth,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  disabled: {
    opacity: 0.45,
  },
  size_md: { paddingHorizontal: 28, paddingVertical: 14, minHeight: 48 },
  size_lg: { paddingHorizontal: 36, paddingVertical: 18, minHeight: 56 },
  text: { fontFamily: 'Nunito_700Bold', letterSpacing: 0.5, color: colors.textInverse },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 17 },
});
