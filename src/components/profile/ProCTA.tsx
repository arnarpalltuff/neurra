import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { space, radii, accentGlow } from '../../constants/design';
import { useProStore, PLAN_DEFS } from '../../stores/proStore';
import { tapMedium } from '../../utils/haptics';
import PressableScale from '../ui/PressableScale';

interface ProCTAProps {
  onOpenPaywall: () => void;
}

const PRO_BENEFITS = [
  { icon: 'infinite' as const, text: 'Unlimited sessions' },
  { icon: 'sparkles' as const, text: 'Advanced brain insights' },
  { icon: 'color-palette' as const, text: 'All grove themes & cosmetics' },
  { icon: 'heart' as const, text: '8 hearts per day' },
];

export default React.memo(function ProCTA({ onOpenPaywall }: ProCTAProps) {
  const isPro = useProStore(s => s.isPro || s.debugSimulatePro);
  const plan = useProStore(s => s.plan);
  const expirationDate = useProStore(s => s.expirationDate);
  const isFoundingMember = useProStore(s => s.isFoundingMember);

  const handlePress = () => {
    tapMedium();
    onOpenPaywall();
  };

  if (isPro) {
    const planLabel = plan
      ? PLAN_DEFS.find(p => p.plan === plan)?.name ?? plan
      : null;
    const expires = expirationDate
      ? new Date(expirationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;

    return (
      <Animated.View
        entering={FadeInDown.delay(700).duration(450).springify().damping(16)}
        style={styles.wrap}
      >
        <View style={[styles.proCard, accentGlow(C.amber, 16, 0.22)]}>
          <LinearGradient
            colors={[`${C.amber}14`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proGradient}
          />
          <View style={styles.proIcon}>
            <Ionicons name="sparkles" size={18} color={C.amber} />
          </View>
          <View style={styles.proText}>
            <Text style={styles.proLabel}>
              Neurra Pro{planLabel ? ` · ${planLabel}` : ''}
              {isFoundingMember && <Text style={{ color: C.amber }}>  · Founder</Text>}
            </Text>
            {expires && plan !== 'lifetime' && (
              <Text style={styles.proMeta}>Renews {expires}</Text>
            )}
            {plan === 'lifetime' && (
              <Text style={styles.proMeta}>Lifetime access — thank you.</Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(700).duration(450).springify().damping(16)}
      style={styles.wrap}
    >
      <PressableScale
        onPress={handlePress}
        style={[styles.ctaCard, accentGlow(C.amber, 20, 0.3)]}
      >
        <LinearGradient
          colors={[`${C.amber}1F`, `${C.peach}0F`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.ctaHeader}>
          <Ionicons name="sparkles" size={14} color={C.amber} />
          <Text style={styles.ctaEyebrow}>UNLOCK NEURRA PRO</Text>
        </View>

        <Text style={styles.ctaTitle}>Train smarter. Grow faster.</Text>

        <View style={styles.benefits}>
          {PRO_BENEFITS.map(b => (
            <View key={b.text} style={styles.benefitRow}>
              <Ionicons name={b.icon} size={12} color={C.amber} />
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.button, { backgroundColor: C.amber }]}>
          <Text style={styles.buttonText}>Go Pro</Text>
          <Ionicons name="arrow-forward" size={14} color="#0C1018" />
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(19,24,41,0.9)',
    borderWidth: 1,
    borderColor: `${C.amber}33`,
    overflow: 'hidden',
  },
  proGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  proIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${C.amber}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proText: {
    flex: 1,
  },
  proLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: C.t1,
    letterSpacing: 0.2,
  },
  proMeta: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: C.t3,
    marginTop: 2,
  },
  ctaCard: {
    borderRadius: radii.lg,
    backgroundColor: 'rgba(19,24,41,0.9)',
    borderWidth: 1,
    borderColor: `${C.amber}44`,
    padding: space.lg,
    overflow: 'hidden',
  },
  ctaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  ctaEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: C.amber,
    letterSpacing: 1.5,
  },
  ctaTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: C.t1,
    letterSpacing: -0.4,
    marginBottom: space.sm,
  },
  benefits: {
    gap: 6,
    marginBottom: space.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.t2,
    letterSpacing: 0.1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: radii.pill,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#0C1018',
    letterSpacing: 0.3,
  },
});
