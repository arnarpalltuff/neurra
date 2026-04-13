import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import Kova from '../../components/kova/Kova';
import Button from '../../components/ui/Button';
import { requestNotificationSetup, scheduleDefaultReminder } from '../../utils/notificationSchedule';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingParticles from '../../components/ui/FloatingParticles';

interface Props {
  onDone: (enabled: boolean) => void;
}

export default function NotificationAsk({ onDone }: Props) {
  const handleSure = async () => {
    const ok = await requestNotificationSetup();
    if (ok) await scheduleDefaultReminder();
    onDone(ok);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg1, '#0A0E1A', C.bg1]} style={StyleSheet.absoluteFillObject} />
      <FloatingParticles count={6} color="rgba(110,207,154,0.12)" />
      <Animated.View entering={FadeInDown.delay(80)} style={styles.kova}>
        <Kova size={100} emotion="happy" showSpeechBubble={false} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200)} style={styles.content}>
        <Text style={styles.title}>Can Kova remind you once a day?</Text>
        <Text style={styles.sub}>Short nudge — you can change this anytime in Settings.</Text>
        <Button label="Sure" onPress={handleSure} size="lg" style={styles.btn} />
        <Button label="Maybe later" onPress={() => onDone(false)} variant="ghost" size="md" style={styles.btn2} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: C.bg1 },
  kova: { alignItems: 'center', marginBottom: 16 },
  content: { gap: 12 },
  title: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 32,
  },
  sub: {
    fontFamily: fonts.body,
    color: C.t3,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  btn: { width: '100%', marginTop: 8 },
  btn2: { width: '100%' },
});
