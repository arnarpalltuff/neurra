import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { C } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';

/**
 * Tab bar redesign.
 *
 * Principles:
 *  - Always show the label, not just when focused. Users need to know what
 *    each tab is before they tap it.
 *  - Each tab has its own accent color when active (not all green).
 *  - Inactive tabs are muted, not invisible.
 *  - Compact: emoji 20px, label 9px. Clean and tight.
 *  - Subtle glow on the active tab icon — not the dot (removed).
 */

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
  activeColor: string;
}

const TabIcon = React.memo(function TabIcon({ emoji, label, focused, activeColor }: TabIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, { damping: 14, stiffness: 180 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabItem, animStyle]}>
      <Text style={[styles.tabEmoji, focused && { textShadowColor: activeColor, textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } }]}>
        {emoji}
      </Text>
      <Text
        style={[
          styles.tabLabel,
          focused ? { color: activeColor, fontFamily: fonts.bodyBold } : undefined,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
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
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
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
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} activeColor={C.green} />,
          tabBarAccessibilityLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎮" label="Games" focused={focused} activeColor={C.blue} />,
          tabBarAccessibilityLabel: "Games",
        }}
      />
      <Tabs.Screen
        name="grove"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌿" label="Grove" focused={focused} activeColor={C.green} />,
          tabBarAccessibilityLabel: "Grove",
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💡" label="Insights" focused={focused} activeColor={C.amber} />,
          tabBarAccessibilityLabel: "Insights",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} activeColor={C.peach} />,
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
    borderTopColor: 'rgba(255,255,255,0.06)',
    height: Platform.OS === 'ios' ? 82 : 66,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,10,18,0.88)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 8,
    minWidth: 56,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
