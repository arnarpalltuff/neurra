import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, FadeIn, FadeOut, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../constants/colors';
import { wordWeaveParams, updateDifficulty, getDifficulty } from '../../../utils/difficultyEngine';

const { width } = Dimensions.get('window');

// Common English words (simplified dictionary for demo)
const VALID_WORDS = new Set([
  'cat', 'dog', 'sun', 'moon', 'star', 'tree', 'bird', 'fish', 'rain', 'fire',
  'wind', 'rock', 'lake', 'hill', 'road', 'song', 'note', 'bell', 'rose', 'leaf',
  'seed', 'root', 'stem', 'vine', 'fern', 'moss', 'dew', 'mist', 'fog', 'glow',
  'beam', 'wave', 'tide', 'reef', 'sand', 'dust', 'snow', 'ice', 'frost', 'dawn',
  'dusk', 'noon', 'time', 'hour', 'day', 'week', 'year', 'age', 'era', 'past',
  'mind', 'soul', 'life', 'love', 'hope', 'fear', 'joy', 'pain', 'calm', 'wild',
  'fast', 'slow', 'tall', 'small', 'dark', 'bright', 'soft', 'hard', 'warm', 'cool',
  'open', 'free', 'true', 'real', 'deep', 'high', 'long', 'wide', 'thin', 'thick',
  'art', 'map', 'key', 'door', 'path', 'way', 'goal', 'plan', 'idea', 'word',
  'tale', 'myth', 'hero', 'sage', 'dream', 'wish', 'gift', 'fate', 'luck', 'risk',
  'stir', 'rise', 'fall', 'flow', 'grow', 'glow', 'spin', 'turn', 'move', 'stay',
  'find', 'seek', 'know', 'feel', 'hear', 'see', 'hold', 'keep', 'give', 'take',
  'land', 'sea', 'sky', 'earth', 'world', 'town', 'city', 'home', 'room', 'wall',
  'light', 'night', 'sound', 'voice', 'heart', 'spirit', 'stone', 'forest', 'river', 'ocean',
  'solar', 'lunar', 'storm', 'bloom', 'crane', 'flame', 'grace', 'blaze', 'shine', 'shade',
  'grain', 'plain', 'trail', 'brave', 'noble', 'proud', 'swift', 'quiet', 'gentle', 'fierce',
]);

const LETTER_POOL = 'ABCDEFGHIJKLMNOPRSTW';

function generateLetters(count: number): string[] {
  const vowels = 'AEIOU';
  const consonants = 'BCDFGHLMNPRST';
  const letters: string[] = [];
  // Ensure enough vowels for word formation
  const vowelCount = Math.max(3, Math.floor(count * 0.35));
  for (let i = 0; i < vowelCount; i++) {
    letters.push(vowels[Math.floor(Math.random() * vowels.length)]);
  }
  for (let i = vowelCount; i < count; i++) {
    letters.push(consonants[Math.floor(Math.random() * consonants.length)]);
  }
  return letters.sort(() => Math.random() - 0.5);
}

interface LetterItem {
  id: string;
  char: string;
  isBonus: boolean;
  angle: number;
}

interface WordWeaveProps {
  onComplete: (score: number, accuracy: number) => void;
  initialLevel?: number;
  isOnboarding?: boolean;
}

export default function WordWeave({ onComplete, initialLevel = 1, isOnboarding = false }: WordWeaveProps) {
  const diff = getDifficulty('word-weave', 0);
  const params = wordWeaveParams(Math.max(initialLevel, diff.level));

  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [currentWord, setCurrentWord] = useState<string[]>([]);
  const [currentWordIds, setCurrentWordIds] = useState<string[]>([]);
  const [submittedWords, setSubmittedWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(isOnboarding ? 45 : params.timeLimit);
  const [lastWord, setLastWord] = useState<{ word: string; valid: boolean; points: number } | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);
  const wordCountRef = useRef(0);
  const submittedRef = useRef<Set<string>>(new Set());

  const wordBarScale = useSharedValue(1);

  // Initialize letters
  useEffect(() => {
    const chars = generateLetters(params.letterCount);
    const angleStep = 360 / chars.length;
    const items: LetterItem[] = chars.map((char, i) => ({
      id: `${char}-${i}-${Date.now()}`,
      char,
      isBonus: params.hasBonusLetters && Math.random() < 0.15,
      angle: angleStep * i,
    }));
    setLetters(items);
  }, []);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          const accuracy = wordCountRef.current > 0 ? Math.min(1, wordCountRef.current / 8) : 0.5;
          onComplete(scoreRef.current, accuracy);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const tapLetter = useCallback((item: LetterItem) => {
    if (currentWordIds.includes(item.id)) return;
    Haptics.selectionAsync();
    setCurrentWord((w) => [...w, item.char]);
    setCurrentWordIds((ids) => [...ids, item.id]);
  }, [currentWordIds]);

  const submitWord = useCallback(() => {
    const word = currentWord.join('').toLowerCase();
    if (word.length < 3) {
      setCurrentWord([]);
      setCurrentWordIds([]);
      return;
    }

    const isValid = VALID_WORDS.has(word);
    const isDuplicate = submittedRef.current.has(word);

    if (isValid && !isDuplicate) {
      submittedRef.current.add(word);
      const bonus = currentWordIds.some((id) => letters.find((l) => l.id === id)?.isBonus);
      let pts = wordPoints(word.length);
      if (bonus) pts *= 2;
      scoreRef.current += pts;
      wordCountRef.current += 1;
      setScore(s => s + pts);
      setWordCount(c => c + 1);
      setSubmittedWords(prev => [...prev, word]);
      setLastWord({ word, valid: true, points: pts });
      updateDifficulty('word-weave', true);
      wordBarScale.value = withSequence(withSpring(1.08, { damping: 4 }), withSpring(1, { damping: 8 }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setLastWord({ word, valid: false, points: 0 });
      updateDifficulty('word-weave', false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setCurrentWord([]);
    setCurrentWordIds([]);
    setTimeout(() => setLastWord(null), 1200);
  }, [currentWord, currentWordIds, letters]);

  const clearWord = useCallback(() => {
    setCurrentWord([]);
    setCurrentWordIds([]);
  }, []);

  const wordBarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: wordBarScale.value }],
  }));

  const timeProgress = timeLeft / params.timeLimit;
  const isUrgent = timeLeft <= 10;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordCountText}>{wordCount} words</Text>
        <Text style={[styles.timerText, isUrgent && styles.timerUrgent]}>{timeLeft}s</Text>
        <Text style={styles.scoreText}>{score}</Text>
      </View>

      {/* Timer bar */}
      <View style={styles.timerBar}>
        <Animated.View style={[styles.timerFill, { width: `${timeProgress * 100}%`, backgroundColor: isUrgent ? colors.coral : colors.growth }]} />
      </View>

      {/* Word bar */}
      <Animated.View style={[styles.wordBar, wordBarStyle]}>
        {currentWord.length === 0 ? (
          <Text style={styles.wordBarPlaceholder}>Tap letters to form a word</Text>
        ) : (
          <Text style={styles.wordBarText}>{currentWord.join('')}</Text>
        )}
      </Animated.View>

      {/* Feedback */}
      {lastWord && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.feedbackContainer}>
          <Text style={[styles.feedbackText, lastWord.valid ? styles.feedbackValid : styles.feedbackInvalid]}>
            {lastWord.valid ? `+${lastWord.points} — ${lastWord.word.toUpperCase()}` : `"${lastWord.word}" — not a word`}
          </Text>
        </Animated.View>
      )}

      {/* Letter orbit */}
      <View style={styles.orbitContainer}>
        <View style={styles.orbit}>
          {letters.map((item) => {
            const isSelected = currentWordIds.includes(item.id);
            const rad = (item.angle * Math.PI) / 180;
            const r = 110;
            const x = r * Math.cos(rad);
            const y = r * Math.sin(rad);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.letterBtn,
                  isSelected && styles.letterSelected,
                  item.isBonus && styles.letterBonus,
                  { transform: [{ translateX: x }, { translateY: y }] },
                ]}
                onPress={() => tapLetter(item)}
                disabled={isSelected}
                accessibilityLabel={`Letter ${item.char}`}
              >
                <Text style={[styles.letterText, isSelected && styles.letterTextSelected]}>
                  {item.char}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearBtn} onPress={clearWord} accessibilityLabel="Clear word">
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, currentWord.length < 3 && styles.submitDisabled]}
          onPress={submitWord}
          disabled={currentWord.length < 3}
          accessibilityLabel="Submit word"
        >
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Recent words */}
      <View style={styles.recentWords}>
        {submittedWords.slice(-5).map((w, i) => (
          <Text key={`${w}-${i}`} style={styles.recentWord}>{w}</Text>
        ))}
      </View>
    </View>
  );
}

function wordPoints(len: number): number {
  if (len <= 3) return 50;
  if (len === 4) return 120;
  if (len === 5) return 250;
  if (len === 6) return 500;
  return 1000;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordCountText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  timerText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  timerUrgent: {
    color: colors.coral,
  },
  scoreText: {
    color: colors.warm,
    fontSize: 18,
    fontWeight: '800',
  },
  timerBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.bgTertiary,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  timerFill: {
    height: '100%',
    borderRadius: 2,
  },
  wordBar: {
    width: '100%',
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 8,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  wordBarPlaceholder: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  wordBarText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 3,
  },
  feedbackContainer: {
    height: 24,
    justifyContent: 'center',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackValid: {
    color: colors.growth,
  },
  feedbackInvalid: {
    color: colors.coral,
  },
  orbitContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbit: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  letterBtn: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  letterSelected: {
    backgroundColor: colors.growthDim,
    borderColor: colors.growth,
    opacity: 0.4,
  },
  letterBonus: {
    borderColor: colors.streak,
    backgroundColor: colors.streakDim,
  },
  letterText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  letterTextSelected: {
    color: colors.growth,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  clearBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: colors.growth,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
  recentWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    justifyContent: 'center',
  },
  recentWord: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
