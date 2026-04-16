import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import Kova from '../../components/kova/Kova';
import Button from '../../components/ui/Button';
import FloatingParticles from '../../components/ui/FloatingParticles';
import { selection } from '../../utils/haptics';

interface NameInputProps {
  onNext: (name: string) => void;
}

export default function NameInput({ onNext }: NameInputProps) {
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const hasTypedFirstRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  const kovaScale = useSharedValue(1);
  const borderWidth = useSharedValue(1);

  const handleChange = (next: string) => {
    setName(next);
    if (!hasTypedFirstRef.current && next.length > 0) {
      hasTypedFirstRef.current = true;
      selection();
      kovaScale.value = withSequence(
        withSpring(1.08, { damping: 10, stiffness: 240 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    }
  };

  useEffect(() => {
    borderWidth.value = withTiming(focused ? 1.6 : 1, { duration: 200 });
  }, [focused, borderWidth]);

  const kovaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: kovaScale.value }],
  }));
  const inputStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
  }));

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    onNext(trimmed);
  };

  const trimmedLength = name.trim().length;
  const inputBorderColor = focused ? `${C.green}88` : 'rgba(255,255,255,0.1)';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={[C.bg1, '#0A0E1A', C.bg1]} style={StyleSheet.absoluteFillObject} />
      {/* Warm peach radial accent behind Kova — this screen should feel intimate. */}
      <View style={styles.warmGlow} />
      <FloatingParticles count={4} color="rgba(224,155,107,0.18)" />

      <Animated.View entering={FadeInDown.delay(100)} style={[styles.kovaArea, kovaStyle]}>
        <Kova size={110} emotion="curious" showSpeechBubble={false} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300)} style={styles.content}>
        <Text style={styles.question}>What should I call you?</Text>
        <Text style={styles.sub}>Just your name. Nothing else. Promise.</Text>

        <Animated.View style={[styles.inputWrap, { borderColor: inputBorderColor }, inputStyle]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Your first name"
            placeholderTextColor={C.t3}
            value={name}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            maxLength={30}
            accessibilityLabel="Enter your first name"
          />
        </Animated.View>

        <Button
          label="That's me"
          onPress={handleSubmit}
          size="lg"
          disabled={trimmedLength === 0}
          style={styles.btn}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg1,
    padding: 28,
    justifyContent: 'center',
    gap: 36,
  },
  warmGlow: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: `${C.peach}18`,
    shadowColor: C.peach,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 50,
    elevation: 6,
  },
  kovaArea: {
    alignItems: 'center',
  },
  content: {
    gap: 16,
  },
  question: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: fonts.kova,
    color: C.t3,
    fontSize: 18,
    textAlign: 'center',
  },
  inputWrap: {
    borderRadius: 999,
    backgroundColor: 'rgba(19,24,41,0.85)',
  },
  input: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    color: C.t1,
    fontFamily: fonts.heading,
    fontSize: 20,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
