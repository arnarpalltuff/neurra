import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { colors } from '../src/constants/colors';
import Kova from '../src/components/kova/Kova';

function Section({ icon, title, delay, children }: {
  icon: string; title: string; delay: number; children: React.ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={styles.bold}>{children}</Text>;
}

export default function ScienceScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>The Science</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.subtitle}>
          Honest answers about brain training — what works, what doesn't, and why we built Neurra the way we did.
        </Text>

        {/* Section 1 */}
        <Section icon="🧠" title="What we know" delay={100}>
          <Text style={styles.body}>
            Brain training games exercise specific cognitive skills. <Bold>Consistent practice improves performance on those skills.</Bold> This is well-established in cognitive science.
          </Text>
          <Text style={styles.body}>
            The landmark <Bold>ACTIVE Trial</Bold> — a 20-year study with over 2,800 participants — found that specific cognitive training had lasting benefits for daily task performance, even a decade after the initial training period.
          </Text>
          <Text style={styles.body}>
            Regular mental exercise is associated with cognitive health maintenance, much like physical exercise supports physical health. The evidence is strongest for <Bold>targeted, adaptive practice</Bold> that keeps you in your challenge zone.
          </Text>
        </Section>

        {/* Section 2 */}
        <Section icon="🚫" title="What we DON'T claim" delay={200}>
          <View style={styles.claimList}>
            {[
              'Neurra does NOT claim to increase IQ.',
              'Neurra does NOT claim to prevent or treat dementia, Alzheimer\'s, or any medical condition.',
              'Neurra does NOT claim game improvements automatically transfer to all real-world tasks.',
              'Neurra is NOT a medical device or treatment.',
            ].map((claim, i) => (
              <View key={i} style={styles.claimRow}>
                <Text style={styles.claimX}>✕</Text>
                <Text style={styles.claimText}>{claim}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Section 3 */}
        <Section icon="✅" title="What Neurra actually does" delay={300}>
          <View style={styles.doList}>
            {[
              'Builds a daily habit of mental exercise targeting memory, attention, speed, flexibility, and mindfulness.',
              'Uses adaptive difficulty to keep you in the optimal challenge zone — not too easy, not too hard.',
              'Provides real-world framing to help you notice improvements in daily life. These are approximations, not clinical measurements.',
              'The best thing Neurra does is get you to show up every day. Consistency matters more than any single session.',
            ].map((item, i) => (
              <View key={i} style={styles.doRow}>
                <Text style={styles.doCheck}>✓</Text>
                <Text style={styles.doText}>{item}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Section 4 */}
        <Section icon="💡" title="Why we're honest about this" delay={400}>
          <Text style={styles.body}>
            In 2016, Lumosity was fined <Bold>$50 million by the FTC</Bold> for claiming their games could reduce cognitive decline and improve performance in school and work — without adequate evidence to support those claims.
          </Text>
          <Text style={styles.bodyHighlight}>
            "We believe you deserve honesty. Brain training is valuable, but it's not magic."
          </Text>
          <Text style={styles.body}>
            The brain training industry has a history of overclaiming. We chose a different path: build something genuinely useful, be transparent about what it can and can't do, and let the experience speak for itself.
          </Text>
          <Text style={styles.bodySmall}>
            For further reading, we recommend the peer-reviewed meta-analyses on cognitive training, the ACTIVE Trial publication (Rebok et al., 2014), and resources from the National Institute on Aging.
          </Text>
        </Section>

        {/* Kova footer */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.kovaFooter}>
          <Kova stage={3} emotion="curious" size={80} showSpeechBubble={false} forceDialogue="Knowledge is brain training too." />
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backText: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.sky,
    fontSize: 15,
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    color: colors.textPrimary,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },

  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIcon: { fontSize: 22 },
  sectionTitle: {
    fontFamily: 'Quicksand_700Bold',
    color: colors.textPrimary,
    fontSize: 18,
  },

  body: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textPrimary,
  },
  bodyHighlight: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textPrimary,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 23,
    marginBottom: 12,
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: colors.growth,
  },
  bodySmall: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textTertiary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  claimList: { gap: 10 },
  claimRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  claimX: {
    fontFamily: 'Nunito_700Bold',
    color: colors.coral,
    fontSize: 14,
    marginTop: 2,
  },
  claimText: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },

  doList: { gap: 10 },
  doRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  doCheck: {
    fontFamily: 'Nunito_700Bold',
    color: colors.growth,
    fontSize: 14,
    marginTop: 2,
  },
  doText: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },

  kovaFooter: {
    alignItems: 'center',
    paddingTop: 16,
  },
});
