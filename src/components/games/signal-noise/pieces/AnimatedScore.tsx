import React, { useState, useEffect, useRef } from 'react';
import { Text } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Animated score — odometer roll-up
// ─────────────────────────────────────────────────────────────
export function AnimatedScore({ value, style: s }: { value: number; style: any }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current;
    const target = value;
    if (start === target) return;
    const startTime = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startTime) / 500);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (t >= 1) { clearInterval(id); prev.current = target; }
    }, 24);
    return () => clearInterval(id);
  }, [value]);
  return <Text style={s}>{display}</Text>;
}
