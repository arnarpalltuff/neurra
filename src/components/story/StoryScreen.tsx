import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  FadeIn, FadeOut, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tapHeavy } from '../../utils/haptics';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { MOOD_GRADIENTS, type StoryMood } from '../../constants/story';
import Kova from '../kova/Kova';
import { stageFromXP } from '../kova/KovaStates';
import { useProgressStore } from '../../stores/progressStore';
import PressableScale from '../ui/PressableScale';

const { width } = Dimensions.get('window');

interface StoryScreenProps {
  text: string;
  mood: StoryMood;
  duration: number;
  unlock?: {
    type: string;
    id: string;
    name: string;
  };
  onContinue: () => void;
}

function TypewriterText({ text, speed = 35 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');

    const interval = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <Text style={styles.storyText}>{displayed}</Text>
  );
}

export default function StoryScreen({
  text,
  mood,
  duration,
  unlock,
  onContinue,
}: StoryScreenProps) {
  const [showContinue, setShowContinue] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const xp = useProgressStore(s => s.xp);
  const stage = stageFromXP(xp);

  const continueOpacity = useSharedValue(0);
  const unlockScale = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContinue(true);
      continueOpacity.value = withTiming(1, { duration: 500 });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    if (unlock) {
      const timer = setTimeout(() => {
        setShowUnlock(true);
        unlockScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) });
        tapHeavy();
      }, Math.min(duration, text.length * 35 + 500));
      return () => clearTimeout(timer);
    }
  }, [unlock]);

  const continueStyle = useAnimatedStyle(() => ({
    opacity: continueOpacity.value,
  }));

  const unlockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: unlockScale.value }],
    opacity: unlockScale.value,
  }));

  const kovaEmotion = mood === 'triumphant' ? 'celebrating' :
    mood === 'tense' ? 'worried' :
    mood === 'dark' ? 'curious' :
    mood === 'peaceful' ? 'zen' : 'happy';

  const gradientColors = MOOD_GRADIENTS[mood];

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

      {/* Kova */}
      <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.kovaArea}>
        <Kova
          stage={stage}
          emotion={kovaEmotion}
          size={120}
          showSpeechBubble={false}
        />
      </Animated.View>

      {/* Story text */}
      <Animated.View entering={FadeIn.delay(600).duration(400)} style={styles.textArea}>
        <TypewriterText text={text} speed={35} />
      </Animated.View>

      {/* Unlock badge */}
      {showUnlock && unlock && (
        <Animated.View style={[styles.unlockBadge, unlockStyle]}>
          <Text style={styles.unlockEmoji}>
            {unlock.type === 'beacon' ? '🔥' : unlock.type === 'companion' ? '🌟' : '✨'}
          </Text>
          <Text style={styles.unlockText}>{unlock.name} unlocked</Text>
        </Animated.View>
      )}

      {/* Continue button */}
      {showContinue && (
        <Animated.View style={[styles.continueArea, continueStyle]}>
          <PressableScale style={styles.continueBtn} onPress={onContinue}>
            <Text style={styles.continueBtnText}>Continue</Text>
          </PressableScale>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  kovaArea: {
    marginBottom: 32,
  },
  textArea: {
    maxWidth: width * 0.85,
    alignItems: 'center',
  },
  storyText: {
    fontFamily: fonts.kova,
    fontSize: 20,
    color: C.t1,
    textAlign: 'center',
    lineHeight: 30,
  },
  unlockBadge: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(110,207,154,0.12)',
    borderWidth: 1,
    borderColor: C.green,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  unlockEmoji: {
    fontSize: 18,
  },
  unlockText: {
    fontFamily: fonts.bodySemi,
    color: C.green,
    fontSize: 13,
  },
  continueArea: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
  continueBtn: {
    borderWidth: 1,
    borderColor: C.green,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  continueBtnText: {
    fontFamily: fonts.bodySemi,
    color: C.green,
    fontSize: 15,
  },
});
