import { useEffect, useRef, useState } from 'react';

interface TypewriterOptions {
  /** Milliseconds before the first character appears. */
  startDelayMs?: number;
  /** Milliseconds between characters. */
  charMs?: number;
  /** Fires once per revealed character with the current char count. */
  onTick?: (charCount: number) => void;
}

/**
 * Character-by-character reveal of `text`. Resets whenever `text` changes.
 * Timers are tracked in a single ref so unmount (or text change) is always
 * a clean teardown — no stashed handles, no leaked intervals.
 */
export function useTypewriter(text: string, options: TypewriterOptions = {}): string {
  const { startDelayMs = 0, charMs = 40, onTick } = options;
  const [displayed, setDisplayed] = useState('');
  // Ref keeps the latest onTick without retriggering the effect.
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    setDisplayed('');
    let startTimer: ReturnType<typeof setTimeout> | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    startTimer = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        tickRef.current?.(i);
        if (i >= text.length && interval) {
          clearInterval(interval);
          interval = null;
        }
      }, charMs);
    }, startDelayMs);

    return () => {
      if (startTimer) clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, [text, startDelayMs, charMs]);

  return displayed;
}
