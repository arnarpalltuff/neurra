import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withSequence, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { C } from '../../../../constants/colors';
import { styles } from '../styles';

export interface LetterItem {
  id: string;
  char: string;
  isBonus: boolean;
  angle: number;
}

// ─────────────────────────────────────────────────────────────
// Letter disc — glowing orb that flies in from center on start
// ─────────────────────────────────────────────────────────────
export function LetterDisc({
  item, selected, x, y, onPress, startDelay, isPlaying,
}: {
  item: LetterItem;
  selected: boolean;
  x: number;
  y: number;
  onPress: () => void;
  startDelay: number;
  isPlaying: boolean;
}) {
  const breath = useSharedValue(1);
  const press = useSharedValue(1);
  const glow = useSharedValue(item.isBonus ? 0.4 : 0);
  const entry = useSharedValue(0);

  const breathDur = useMemo(() => 2400 + Math.random() * 1400, []);
  const breathDelay = useMemo(() => Math.random() * 1200, []);

  useEffect(() => {
    // Entry animation: fly in from center with stagger
    entry.value = withDelay(
      startDelay,
      withSpring(1, { damping: 12, stiffness: 120, mass: 0.9 }),
    );
    // Breathing loop
    breath.value = withDelay(
      breathDelay + startDelay + 600,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: breathDur, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.96, { duration: breathDur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    if (item.isBonus) {
      glow.value = withDelay(
        startDelay + 400,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        ),
      );
    }
  }, []);

  const outerStyle = useAnimatedStyle(() => {
    const e = entry.value;
    return {
      transform: [
        { translateX: x * e },
        { translateY: y * e },
        { scale: breath.value * press.value * (selected ? 0.78 : 1) * (0.3 + 0.7 * e) },
      ],
      opacity: (selected ? 0.32 : 1) * e,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: item.isBonus ? 0.55 + glow.value * 0.35 : selected ? 0 : 0.55,
    transform: [{ scale: item.isBonus ? 1 + glow.value * 0.15 : 1 }],
  }));

  const handlePressIn = () => {
    if (!isPlaying) return;
    press.value = withSpring(0.88, { damping: 10, stiffness: 220 });
  };
  const handlePressOut = () => {
    press.value = withSpring(1, { damping: 8, stiffness: 200 });
  };

  const orbId = `orb-${item.id}`;
  const shineId = `shine-${item.id}`;
  const bonus = item.isBonus;

  return (
    <Animated.View style={[styles.discWrap, outerStyle]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.discHalo,
          {
            backgroundColor: bonus
              ? 'rgba(240,181,66,0.32)'
              : 'rgba(155,114,224,0.22)',
          },
          glowStyle,
        ]}
      />
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={selected || !isPlaying}
        accessibilityLabel={`Letter ${item.char}`}
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <View
          style={[
            styles.discInner,
            {
              borderColor: bonus
                ? 'rgba(255,220,120,0.8)'
                : 'rgba(200,180,255,0.35)',
              shadowColor: bonus ? C.amber : '#8E8CFF',
              shadowOpacity: bonus ? 0.8 : 0.5,
              shadowRadius: bonus ? 14 : 10,
            },
          ]}
        >
          <Svg width={54} height={54} style={StyleSheet.absoluteFillObject}>
            <Defs>
              <RadialGradient
                id={orbId}
                cx="32%"
                cy="26%"
                rx="78%"
                ry="78%"
                fx="32%"
                fy="26%"
              >
                {bonus
                  ? [
                      <Stop key="0" offset="0%" stopColor="#FFE8A8" stopOpacity="1" />,
                      <Stop key="1" offset="45%" stopColor="#D19B2A" stopOpacity="1" />,
                      <Stop key="2" offset="100%" stopColor="#3A2410" stopOpacity="1" />,
                    ]
                  : [
                      <Stop key="0" offset="0%" stopColor="#5A6AA0" stopOpacity="1" />,
                      <Stop key="1" offset="50%" stopColor="#1F2440" stopOpacity="1" />,
                      <Stop key="2" offset="100%" stopColor="#080A18" stopOpacity="1" />,
                    ]}
              </RadialGradient>
              <RadialGradient
                id={shineId}
                cx="30%"
                cy="22%"
                rx="45%"
                ry="45%"
                fx="30%"
                fy="22%"
              >
                <Stop
                  offset="0%"
                  stopColor="#FFFFFF"
                  stopOpacity={bonus ? '0.85' : '0.55'}
                />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={27} cy={27} r={25} fill={`url(#${orbId})`} />
            <Circle cx={27} cy={27} r={23} fill={`url(#${shineId})`} />
          </Svg>
          <Text
            style={[
              styles.discLetter,
              {
                color: bonus ? '#FFF4C8' : '#F2EDE4',
                textShadowColor: bonus
                  ? 'rgba(255,220,120,0.85)'
                  : 'rgba(200,190,255,0.55)',
                textShadowRadius: bonus ? 12 : 8,
              },
            ]}
          >
            {item.char}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
