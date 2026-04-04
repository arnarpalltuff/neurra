import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { C } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';
import { glow } from '../../src/utils/glow';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

const TabIcon = React.memo(function TabIcon({ emoji, label, focused }: TabIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 12, stiffness: 200 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabItem, animStyle]}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
      {focused && <Text style={styles.tabLabelActive}>{label}</Text>}
      {focused && <View style={styles.glowDot} />}
    </Animated.View>
  );
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={styles.tabBarBg} />
            </BlurView>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.tabBarBg]} />
          ),
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌱" label="Home" focused={focused} />,
          tabBarAccessibilityLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎮" label="Games" focused={focused} />,
          tabBarAccessibilityLabel: "Games",
        }}
      />
      <Tabs.Screen
        name="grove"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌿" label="Grove" focused={focused} />,
          tabBarAccessibilityLabel: "Grove",
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" label="Leagues" focused={focused} />,
          tabBarAccessibilityLabel: "Leagues",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
          tabBarAccessibilityLabel: "Profile",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg3,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 8,
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.35,
  },
  tabEmojiFocused: {
    opacity: 1,
  },
  tabLabelActive: {
    fontFamily: fonts.bodySemi,
    color: C.green,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  glowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.green,
    marginTop: 2,
    ...glow(C.green, 8, 0.8),
  },
});
