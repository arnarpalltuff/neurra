import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { fonts } from '../../constants/typography';
import { C } from '../../constants/colors';
import { useTypewriter } from '../../hooks/useTypewriter';

interface KovaSpeechBubbleProps {
  text: string;
  primaryColor: string;
  visible: boolean;
  onDismiss?: () => void;
  duration?: number; // auto-dismiss after this many ms (default 4000)
}

/**
 * Kova's speech bubble with typewriter text reveal.
 * Text appears character by character (40ms per char).
 * Auto-dismisses after 4 seconds.
 */
export default function KovaSpeechBubble({
  text, primaryColor, visible, onDismiss, duration = 4000,
}: KovaSpeechBubbleProps) {
  const displayedText = useTypewriter(visible && text ? text : '', { charMs: 40 });
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible || !text) return;
    dismissRef.current = setTimeout(() => {
      onDismiss?.();
    }, duration);
    return () => {
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, [text, visible, duration, onDismiss]);

  if (!visible || !text) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={[styles.bubble, { borderColor: `${primaryColor}30` }]}
    >
      <Text style={styles.text}>{displayedText}</Text>
      <View style={[styles.tail, { borderTopColor: 'rgba(10,14,26,0.88)' }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: '100%',
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(10,14,26,0.88)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 260,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontFamily: fonts.kova,
    fontSize: 16,
    color: C.t1,
    lineHeight: 22,
    textAlign: 'center',
  },
  tail: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
