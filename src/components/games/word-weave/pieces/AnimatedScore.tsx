import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Animated score — rolls from previous value to new value
// ─────────────────────────────────────────────────────────────
export function AnimatedScore({ value, style }: { value: number; style: StyleProp<TextStyle> }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current;
    const target = value;
    if (start === target) return;
    const startTime = Date.now();
    const duration = 500;
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(start + (target - start) * eased);
      setDisplay(current);
      if (t >= 1) {
        clearInterval(id);
        prev.current = target;
      }
    }, 24);
    return () => clearInterval(id);
  }, [value]);
  return <Text style={style}>{display}</Text>;
}
