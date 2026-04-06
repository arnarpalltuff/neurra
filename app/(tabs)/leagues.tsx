import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C } from '../../src/constants/colors';
import { fonts } from '../../src/constants/typography';
import { useProgressStore } from '../../src/stores/progressStore';

const LEAGUE_ORDER = ['Ember', 'Wave', 'Stone', 'Prism', 'Nova', 'Zenith'];
const LEAGUE_COLORS: Record<string, string> = {
  Ember: C.coral,
  Wave: C.blue,
  Stone: C.t3,
  Prism: C.purple,
  Nova: C.amber,
  Zenith: C.green,
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
  const league = useProgressStore(s => s.league);
  const weeklyXP = useProgressStore(s => s.weeklyXP);
  const leagueColor = LEAGUE_COLORS[league] ?? C.coral;
  const leagueIcon = LEAGUE_ICONS[league] ?? '🔥';

  const leaderboard = MOCK_PLAYERS.map(p => ({
    ...p,
    xp: p.isUser ? weeklyXP : p.xp,
  })).sort((a, b) => b.xp - a.xp);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* League header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.leagueCard}>
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
          </View>
        </Animated.View>

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>THIS WEEK'S BRACKET</Text>
        {leaderboard.map((player, i) => (
          <Animated.View entering={FadeInDown.delay(200 + i * 50).duration(400)} key={player.name}>
            <View style={[styles.playerRow, player.isUser && styles.playerRowUser]}>
              <Text style={[styles.rank, i < 3 && styles.rankTop]}>{i + 1}</Text>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, player.isUser && styles.playerNameUser]}>
                  {player.name} {player.isUser && '(you)'}
                </Text>
              </View>
              <Text style={styles.playerXP}>{player.xp} XP</Text>
              {i < 10 && <View style={styles.promoteBadge}><Text style={styles.promoteText}>↑</Text></View>}
            </View>
          </Animated.View>
        ))}

        {/* League progression */}
        <Text style={styles.sectionTitle}>ALL LEAGUES</Text>
        <View style={styles.leagueProgression}>
          {LEAGUE_ORDER.map((lg) => {
            const color = LEAGUE_COLORS[lg];
            const isCurrent = lg === league;
            return (
              <View
                key={lg}
                style={[
                  styles.leaguePip,
                  { borderColor: `${color}30` },
                  isCurrent && styles.leaguePipActive,
                  isCurrent && { borderColor: color, shadowColor: color },
                ]}
              >
                <Text style={styles.leaguePipIcon}>{LEAGUE_ICONS[lg]}</Text>
                <Text style={[styles.leaguePipName, { color: isCurrent ? color : C.t3 }]}>{lg}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg2 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 12 },

  leagueCard: {
    backgroundColor: C.bg3,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 0.5,
    borderColor: C.border,
  },
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
    fontFamily: fonts.heading,
    fontSize: 16,
  },
  leagueDesc: {
    fontFamily: fonts.body,
    color: C.t2,
    fontSize: 13,
    lineHeight: 20,
  },
  weeklyXPRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyXPLabel: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 13,
  },
  weeklyXPValue: {
    fontFamily: fonts.bodyBold,
    color: C.peach,
    fontSize: 18,
    letterSpacing: -0.3,
  },

  sectionTitle: {
    fontFamily: fonts.bodySemi,
    color: C.t3,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 4,
  },

  playerRow: {
    borderRadius: 16,
    backgroundColor: C.bg3,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  playerRowUser: {
    borderColor: C.green,
    borderWidth: 1,
  },
  rank: {
    fontFamily: fonts.bodyBold,
    color: C.t3,
    fontSize: 16,
    minWidth: 24,
  },
  rankTop: { color: C.amber },
  playerInfo: { flex: 1 },
  playerName: {
    fontFamily: fonts.bodySemi,
    color: C.t1,
    fontSize: 15,
  },
  playerNameUser: {
    fontFamily: fonts.bodyBold,
    color: C.green,
  },
  playerXP: {
    fontFamily: fonts.bodyBold,
    color: C.peach,
    fontSize: 14,
  },
  promoteBadge: {
    backgroundColor: C.greenTint,
    borderRadius: 999,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoteText: {
    fontFamily: fonts.bodyBold,
    color: C.green,
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
    backgroundColor: C.bg3,
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
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
