import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { gameConfigs, GameId, BrainArea } from '../constants/gameConfigs';

const SECONDARY_AREAS: Partial<Record<GameId, BrainArea>> = {
  'pulse': 'speed',
  'word-weave': 'memory',
  'chain-reaction': 'focus',
  'mind-drift': 'flexibility',
  'face-place': 'focus',
  'mirrors': 'speed',
  'zen-flow': 'flexibility',
};

export function getAreasForGame(gameId: GameId | string): BrainArea[] {
  const cfg = gameConfigs[gameId as GameId];
  if (!cfg) return ['memory'];
  const primary = cfg.brainArea;
  const secondary = SECONDARY_AREAS[gameId as GameId];
  return secondary ? [primary, secondary] : [primary];
}

export function useNeuralMap(gameId: GameId | string) {
  const activeAreas = useMemo(() => getAreasForGame(gameId), [gameId]);
  const [pulseArea, setPulseArea] = useState<BrainArea | null>(null);
  const [intensity, setIntensity] = useState(0.3);
  const comboRef = useRef(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, []);

  const onCorrectAnswer = useCallback(() => {
    comboRef.current += 1;
    setIntensity(Math.min(1.0, 0.3 + comboRef.current * 0.07));

    setPulseArea(activeAreas[0]);
    schedule(() => setPulseArea(null), 500);

    if (comboRef.current >= 5 && activeAreas.length > 1) {
      schedule(() => {
        setPulseArea(activeAreas[1]);
        schedule(() => setPulseArea(null), 400);
      }, 200);
    }
  }, [activeAreas, schedule]);

  const onWrongAnswer = useCallback(() => {
    comboRef.current = Math.max(0, comboRef.current - 2);
    setIntensity(0.1);
    schedule(() => {
      setIntensity(Math.max(0.2, 0.3 + comboRef.current * 0.07));
    }, 300);
  }, [schedule]);

  const reset = useCallback(() => {
    comboRef.current = 0;
    setIntensity(0.3);
    setPulseArea(null);
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);

  return { activeAreas, pulseArea, intensity, onCorrectAnswer, onWrongAnswer, reset };
}
