import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';

// ─── Mock User ──────────────────────────────────────────────
const MOCK_USER = {
  name: 'Boss',
  avatar: '🏓',
  duprRating: 4.253,
  gamesPlayed: 47,
  wins: 31,
};

const MOCK_GAME_HISTORY = [
  { id: 1, court: 'Pickleball Station Irvine', date: 'Mar 24', time: '6PM', result: 'Won 11-7, 11-9', type: 'Doubles' },
  { id: 2, court: 'Irvine Park', date: 'Mar 23', time: '9AM', result: 'Lost 9-11, 11-8, 7-11', type: 'Singles' },
  { id: 3, court: 'Heritage Park', date: 'Mar 22', time: '7PM', result: 'Won 11-5, 11-8', type: 'Doubles' },
  { id: 4, court: 'Pickleball Station Irvine', date: 'Mar 21', time: '5PM', result: 'Won 11-9, 8-11, 11-6', type: 'Doubles' },
  { id: 5, court: 'Irvine Park', date: 'Mar 20', time: '10AM', result: 'Won 11-4, 11-3', type: 'Singles' },
];

// ─── Screen ─────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);

  const winRate = Math.round((MOCK_USER.wins / MOCK_USER.gamesPlayed) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Avatar & Name ── */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{MOCK_USER.avatar}</Text>
        </View>
        <Text style={styles.userName}>{MOCK_USER.name}</Text>
      </View>

      {/* ── DUPR Rating ── */}
      <View style={styles.duprCard}>
        <Text style={styles.duprLabel}>DUPR RATING</Text>
        <Text style={styles.duprValue}>{MOCK_USER.duprRating.toFixed(3)}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{MOCK_USER.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{MOCK_USER.wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
        </View>
      </View>

      {/* ── Recent Games ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RECENT GAMES</Text>
        {MOCK_GAME_HISTORY.map((game) => (
          <View key={game.id} style={styles.gameCard}>
            <View style={styles.gameTop}>
              <Text style={styles.gameCourt} numberOfLines={1}>{game.court}</Text>
              <Text style={styles.gameDate}>{game.date} · {game.time}</Text>
            </View>
            <View style={styles.gameBottom}>
              <Text style={[
                styles.gameResult,
                game.result.startsWith('Won') ? styles.resultWon : styles.resultLost,
              ]}>
                {game.result}
              </Text>
              <View style={styles.gameTypeBadge}>
                <Text style={styles.gameTypeText}>{game.type}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* ── Settings ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SETTINGS</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <Text style={styles.settingIcon}>👤</Text>
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.settingRow}>
            <Text style={styles.settingIcon}>🌙</Text>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#555', true: theme.accent }}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <Text style={styles.settingIcon}>📍</Text>
            <Text style={styles.settingLabel}>My Location</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <Text style={styles.settingIcon}>❓</Text>
            <Text style={styles.settingLabel}>Help & Support</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.version}>PickleballHQ v1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    paddingTop: 56,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.accent,
  },
  avatarText: {
    fontSize: 36,
  },
  userName: {
    fontSize: 24,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },

  // DUPR Card
  duprCard: {
    backgroundColor: theme.card,
    marginHorizontal: theme.spacing.padding,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.accent + '30',
  },
  duprLabel: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  duprValue: {
    fontSize: 40,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -1,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    width: '100%',
    justifyContent: 'center',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.border,
    alignSelf: 'stretch',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: theme.spacing.padding,
    paddingBottom: 12,
  },

  // Game Card
  gameCard: {
    backgroundColor: theme.card,
    marginHorizontal: theme.spacing.padding,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
  },
  gameTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gameCourt: {
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
    flex: 1,
    marginRight: 8,
  },
  gameDate: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  gameBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameResult: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
  },
  resultWon: {
    color: '#22c55e',
  },
  resultLost: {
    color: theme.red,
  },
  gameTypeBadge: {
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gameTypeText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
    color: theme.accent,
  },

  // Settings
  settingsGroup: {
    backgroundColor: theme.card,
    marginHorizontal: theme.spacing.padding,
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    gap: 12,
  },
  settingIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
  },
  settingArrow: {
    fontSize: 16,
    color: theme.textSecondary,
  },

  // Version
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 8,
  },
});
