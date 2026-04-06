import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { tapLight } from '../../utils/haptics';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { glow } from '../../utils/glow';
import { shuffle } from '../../utils/arrayUtils';
import PressableScale from '../ui/PressableScale';
import type { Challenge, GroceryChallenge, PhoneNumberChallenge, DirectionsChallenge } from '../../constants/challenges';

interface ChallengeGameProps {
  challenge: Challenge;
  onComplete: (score: number, total: number) => void;
}

export default function ChallengeGame({ challenge, onComplete }: ChallengeGameProps) {
  switch (challenge.subtype) {
    case 'grocery_list':
      return <GroceryListGame challenge={challenge as GroceryChallenge} onComplete={onComplete} />;
    case 'phone_number':
      return <PhoneNumberGame challenge={challenge as PhoneNumberChallenge} onComplete={onComplete} />;
    case 'directions':
      return <DirectionsGame challenge={challenge as DirectionsChallenge} onComplete={onComplete} />;
    default:
      return null;
  }
}

// ── Grocery List ────────────────────────────────────

function GroceryListGame({ challenge, onComplete }: { challenge: GroceryChallenge; onComplete: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [selected, setSelected] = useState<string[]>([]);
  const [scrambled] = useState(() => {
    // Add some decoy items
    const decoys = ['Yogurt', 'Cheese', 'Lettuce', 'Cereal', 'Apples', 'Juice', 'Flour', 'Sugar']
      .filter(d => !challenge.items.includes(d));
    const pool = [...challenge.items, ...decoys.slice(0, Math.min(4, decoys.length))];
    return shuffle(pool);
  });

  useEffect(() => {
    if (phase === 'memorize') {
      const timer = setTimeout(() => setPhase('recall'), challenge.displayDuration);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const toggleItem = useCallback((item: string) => {
    setSelected(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
    tapLight();
  }, []);

  const handleSubmit = useCallback(() => {
    const correct = selected.filter(s => challenge.items.includes(s)).length;
    const wrong = selected.filter(s => !challenge.items.includes(s)).length;
    const score = Math.max(0, correct - wrong);
    onComplete(score, challenge.items.length);
  }, [selected, challenge.items, onComplete]);

  if (phase === 'memorize') {
    return (
      <View style={styles.container}>
        <Text style={styles.phase}>Memorize these items</Text>
        <Animated.View entering={FadeIn.duration(500)} style={styles.itemsGrid}>
          {challenge.items.map((item, i) => (
            <Animated.View key={item} entering={FadeInDown.delay(i * 80).duration(300)} style={styles.memItem}>
              <Text style={styles.memItemText}>{item}</Text>
            </Animated.View>
          ))}
        </Animated.View>
        <Text style={styles.timer}>{Math.round(challenge.displayDuration / 1000)}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.phase}>Which items were on the list?</Text>
      <View style={styles.itemsGrid}>
        {scrambled.map((item) => {
          const isSelected = selected.includes(item);
          return (
            <PressableScale
              key={item}
              style={[styles.recallItem, isSelected && styles.recallItemSelected]}
              onPress={() => toggleItem(item)}
            >
              <Text style={[styles.recallItemText, isSelected && styles.recallItemTextSelected]}>
                {item}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      <PressableScale style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Done</Text>
      </PressableScale>
    </View>
  );
}

// ── Phone Number ────────────────────────────────────

function PhoneNumberGame({ challenge, onComplete }: { challenge: PhoneNumberChallenge; onComplete: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [input, setInput] = useState('');

  useEffect(() => {
    if (phase === 'memorize') {
      const timer = setTimeout(() => setPhase('recall'), challenge.displayDuration);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleDigit = useCallback((d: string) => {
    if (input.length < challenge.number.length) {
      setInput(prev => prev + d);
      tapLight();
    }
  }, [input, challenge.number.length]);

  const handleDelete = useCallback(() => {
    setInput(prev => prev.slice(0, -1));
  }, []);

  const handleSubmit = useCallback(() => {
    let correct = 0;
    for (let i = 0; i < challenge.number.length; i++) {
      if (input[i] === challenge.number[i]) correct++;
    }
    onComplete(correct, challenge.number.length);
  }, [input, challenge.number, onComplete]);

  if (phase === 'memorize') {
    return (
      <View style={styles.container}>
        <Text style={styles.phase}>Memorize this number</Text>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={styles.bigNumber}>{challenge.number}</Text>
        </Animated.View>
        <Text style={styles.timer}>{Math.round(challenge.displayDuration / 1000)}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.phase}>Enter the number</Text>
      <Text style={styles.inputDisplay}>
        {input || '\u00A0'}
        <Text style={styles.cursor}>|</Text>
      </Text>

      {/* Numpad */}
      <View style={styles.numpad}>
        {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(key => (
          <PressableScale
            key={key}
            style={[styles.numKey, key === '✓' && styles.numKeySubmit]}
            onPress={() => {
              if (key === '⌫') handleDelete();
              else if (key === '✓') handleSubmit();
              else handleDigit(key);
            }}
          >
            <Text style={[styles.numKeyText, key === '✓' && styles.numKeyTextSubmit]}>{key}</Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

// ── Directions ──────────────────────────────────────

function DirectionsGame({ challenge, onComplete }: { challenge: DirectionsChallenge; onComplete: (s: number, t: number) => void }) {
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [userOrder, setUserOrder] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>([]);

  useEffect(() => {
    if (phase === 'memorize') {
      const timer = setTimeout(() => {
        setPhase('recall');
        setRemaining(shuffle([...challenge.steps]));
      }, challenge.displayDuration);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleSelect = useCallback((step: string) => {
    setUserOrder(prev => [...prev, step]);
    setRemaining(prev => prev.filter(s => s !== step));
    tapLight();
  }, []);

  const handleUndo = useCallback(() => {
    if (userOrder.length === 0) return;
    const last = userOrder[userOrder.length - 1];
    setUserOrder(prev => prev.slice(0, -1));
    setRemaining(prev => [...prev, last]);
  }, [userOrder]);

  const handleSubmit = useCallback(() => {
    let correct = 0;
    for (let i = 0; i < challenge.steps.length; i++) {
      if (userOrder[i] === challenge.steps[i]) correct++;
    }
    onComplete(correct, challenge.steps.length);
  }, [userOrder, challenge.steps, onComplete]);

  if (phase === 'memorize') {
    return (
      <View style={styles.container}>
        <Text style={styles.phase}>Memorize these directions</Text>
        <View style={styles.directionsList}>
          {challenge.steps.map((step, i) => (
            <Animated.View key={step} entering={FadeInDown.delay(i * 150).duration(300)} style={styles.dirStep}>
              <Text style={styles.dirStepNum}>{i + 1}.</Text>
              <Text style={styles.dirStepText}>{step}</Text>
            </Animated.View>
          ))}
        </View>
        <Text style={styles.timer}>{Math.round(challenge.displayDuration / 1000)}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.phase}>Put them in order</Text>

      {/* User's current order */}
      <View style={styles.orderArea}>
        {userOrder.map((step, i) => (
          <View key={`placed-${i}`} style={styles.placedStep}>
            <Text style={styles.placedNum}>{i + 1}.</Text>
            <Text style={styles.placedText}>{step}</Text>
          </View>
        ))}
        {userOrder.length < challenge.steps.length && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Tap next step...</Text>
          </View>
        )}
      </View>

      {/* Remaining options */}
      <View style={styles.optionsArea}>
        {remaining.map((step) => (
          <PressableScale key={step} style={styles.optionBtn} onPress={() => handleSelect(step)}>
            <Text style={styles.optionText}>{step}</Text>
          </PressableScale>
        ))}
      </View>

      <View style={styles.actionRow}>
        {userOrder.length > 0 && (
          <PressableScale style={styles.undoBtn} onPress={handleUndo}>
            <Text style={styles.undoBtnText}>Undo</Text>
          </PressableScale>
        )}
        {remaining.length === 0 && (
          <PressableScale style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Done</Text>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: C.bg2,
    gap: 20,
  },
  phase: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 20,
    textAlign: 'center',
  },
  timer: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 13,
    marginTop: 8,
  },

  // Grocery
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    maxWidth: 320,
  },
  memItem: {
    backgroundColor: C.bg3,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  memItemText: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 15,
  },
  recallItem: {
    backgroundColor: C.bg3,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  recallItemSelected: {
    backgroundColor: 'rgba(110,207,154,0.12)',
    borderColor: C.green,
  },
  recallItemText: {
    fontFamily: fonts.bodySemi,
    color: C.t2,
    fontSize: 15,
  },
  recallItemTextSelected: {
    color: C.green,
  },

  // Phone number
  bigNumber: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 40,
    letterSpacing: 4,
    textAlign: 'center',
  },
  inputDisplay: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 32,
    letterSpacing: 3,
    minHeight: 44,
    textAlign: 'center',
  },
  cursor: {
    color: C.green,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    maxWidth: 260,
    marginTop: 16,
  },
  numKey: {
    width: 72,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: C.border,
  },
  numKeySubmit: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  numKeyText: {
    fontFamily: fonts.bodyBold,
    color: C.t1,
    fontSize: 20,
  },
  numKeyTextSubmit: {
    color: C.bg1,
  },

  // Directions
  directionsList: {
    gap: 10,
    maxWidth: 300,
  },
  dirStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.bg3,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dirStepNum: {
    fontFamily: fonts.bodyBold,
    color: C.amber,
    fontSize: 16,
  },
  dirStepText: {
    fontFamily: fonts.body,
    color: C.t1,
    fontSize: 15,
    flex: 1,
  },
  orderArea: {
    width: '100%',
    gap: 6,
    minHeight: 100,
  },
  placedStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(110,207,154,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: C.green,
  },
  placedNum: {
    fontFamily: fonts.bodyBold,
    color: C.green,
    fontSize: 14,
  },
  placedText: {
    fontFamily: fonts.body,
    color: C.t1,
    fontSize: 14,
  },
  placeholder: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    paddingVertical: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 13,
  },
  optionsArea: {
    gap: 8,
    width: '100%',
  },
  optionBtn: {
    backgroundColor: C.bg3,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  optionText: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 14,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  undoBtn: {
    borderWidth: 1,
    borderColor: C.t3,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  undoBtnText: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 14,
  },

  // Shared
  submitBtn: {
    backgroundColor: C.green,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 8,
    ...glow(C.green),
  },
  submitText: {
    fontFamily: fonts.bodyBold,
    color: C.bg1,
    fontSize: 16,
  },
});
