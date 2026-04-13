import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import Kova from '../../components/kova/Kova';
import Button from '../../components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../../components/ui/FloatingParticles';

interface NameInputProps {
  onNext: (name: string) => void;
}

export default function NameInput({ onNext }: NameInputProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    onNext(trimmed);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View entering={FadeInDown.delay(100)} style={styles.kovaArea}>
        <Kova size={110} emotion="curious" showSpeechBubble={false} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300)} style={styles.content}>
        <Text style={styles.question}>What should I call you?</Text>
        <Text style={styles.sub}>Just your name. Nothing else. Promise.</Text>

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Your first name"
          placeholderTextColor={C.t3}
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          maxLength={30}
          accessibilityLabel="Enter your first name"
        />

        <Button
          label="That's me"
          onPress={handleSubmit}
          size="lg"
          disabled={name.trim().length === 0}
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
  input: {
    backgroundColor: 'rgba(19,24,41,0.85)',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 16,
    color: C.t1,
    fontFamily: fonts.heading,
    fontSize: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    textAlign: 'center',
  },
  btn: { width: '100%' },
});
