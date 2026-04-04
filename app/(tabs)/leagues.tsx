import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../src/constants/colors';
import { useProgressStore } from '../../src/stores/progressStore';
import Card from '../../src/components/ui/Card';

const LEAGUE_ORDER = ['Ember', 'Wave', 'Stone', 'Prism', 'Nova', 'Zenith'];
const LEAGUE_COLORS: Record<string, string> = {
  Ember: colors.ember,
  Wave: colors.wave,
  Stone: colors.stone,
  Prism: colors.prism,
  Nova: colors.nova,
  Zenith: colors.zenith,
};
const LEAGUE_ICONS: Record<string, string> = {
  Ember: '🔥', Wave: '🌊', Stone: '🪨', Prism: '💎', Nova: '⭐', Zenith: '👑',
};

// Simulated leaderboard
const MOCK_PLAYERS = [
  { name: 'You', xp: 0, isUser: true },
  { name: 'Alex', xp: 1240 },
  { name: 'Sam', xp: 980 },
  { name: 'Jordan', xp: 870 },
  { name: 'Riley', xp: 720 },
  { name: 'Morgan', xp: 640 },
  { name: 'Casey', xp: 500 },
  { name: 'Drew', xp: 420 },
];

export default function LeaguesScreen() {
  const { league, weeklyXP } = useProgressStore();
  const leagueColor = LEAGUE_COLORS[league] ?? colors.ember;
  const leagueIcon = LEAGUE_ICONS[league] ?? '🔥';

  const leaderboard = MOCK_PLAYERS.map(p => ({
    ...p,
    xp: p.isUser ? weeklyXP : p.xp,
  })).sort((a, b) => b.xp - a.xp);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* League header */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card elevated style={styles.leagueCard}>
            <View style={[styles.leagueBadge, { backgroundColor: `${leagueColor}15` }]}>
              <Text style={styles.leagueIcon}>{leagueIcon}</Text>
              <Text style={[styles.leagueName, { color: leagueColor }]}>{league} League</Text>
            </View>
            <Text style={styles.leagueDesc}>
              Top 10 players promote next Monday. Train to climb.
            </Text>
            <View style={styles.weeklyXPRow}>
              <Text style={styles.weeklyXPLabel}>This week</Text>
              <Text style={styles.weeklyXPValue}>{weeklyXP} XP</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>This Week's Bracket</Text>
        {leaderboard.map((player, i) => (
          <Animated.View entering={FadeInDown.delay(200 + i * 50).springify()} key={player.name}>
            <View style={[styles.playerRow, player.isUser && styles.playerRowUser]}>
              <LinearGradient
                colors={[colors.bgCardTop, colors.bgCard]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.rank, i < 3 && styles.rankTop]}>{i + 1}</Text>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, player.isUser && styles.playerNameUser]}>
                  {player.name} {player.isUser && '(you)'}
                </Text>
              </View>
              <Text style={styles.playerXP}>{player.xp} XP</Text>
              {i < 10 && <View style={styles.promoteBadge}><Text style={styles.promoteText}>↑</Text></View>}
              {i >= 25 && <View style={styles.demoteBadge}><Text style={styles.demoteText}>↓</Text></View>}
            </View>
          </Animated.View>
        ))}

        {/* League progression */}
        <Text style={styles.sectionTitle}>All Leagues</Text>
        <View style={styles.leagueProgression}>
          {LEAGUE_ORDER.map((lg) => (
            <View
              key={lg}
              style={[
                styles.leaguePip,
                { borderColor: `${LEAGUE_COLORS[lg]}30` },
                lg === league && styles.leaguePipActive,
                lg === league && { borderColor: LEAGUE_COLORS[lg], shadowColor: LEAGUE_COLORS[lg] },
              ]}
            >
              <Text style={styles.leaguePipIcon}>{LEAGUE_ICONS[lg]}</Text>
              <Text style={[styles.leaguePipName, { color: lg === league ? LEAGUE_COLORS[lg] : colors.textTertiary }]}>{lg}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 12 },

  leagueCard: { gap: 14 },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  leagueIcon: { fontSize: 20 },
  leagueName: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 16,
  },
  leagueDesc: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  weeklyXPRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyXPLabel: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 13,
  },
  weeklyXPValue: {
    fontFamily: 'Nunito_700Bold',
    color: colors.warm,
    fontSize: 18,
    letterSpacing: -0.3,
  },

  sectionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },

  playerRow: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  playerRowUser: {
    borderColor: colors.growth,
    borderWidth: 1,
  },
  rank: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textTertiary,
    fontSize: 16,
    minWidth: 24,
  },
  rankTop: { color: colors.streak },
  playerInfo: { flex: 1 },
  playerName: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textPrimary,
    fontSize: 15,
  },
  playerNameUser: {
    fontFamily: 'Nunito_700Bold',
    color: colors.growth,
  },
  playerXP: {
    fontFamily: 'Nunito_700Bold',
    color: colors.warm,
    fontSize: 14,
  },
  promoteBadge: {
    backgroundColor: colors.growthTint,
    borderRadius: 999,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoteText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.growth,
    fontSize: 12,
  },
  demoteBadge: {
    backgroundColor: colors.coralTint,
    borderRadius: 999,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoteText: {
    fontFamily: 'Nunito_700Bold',
    color: colors.coral,
    fontSize: 12,
  },

  leagueProgression: { flexDirection: 'row', gap: 6 },
  leaguePip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 0.5,
    backgroundColor: colors.bgCard,
  },
  leaguePipActive: {
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  leaguePipIcon: { fontSize: 18 },
  leaguePipName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 9,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
});
