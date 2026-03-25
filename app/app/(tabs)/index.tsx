import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { getStreakEmoji } from '../../lib/gamification';

// ─── Mock Data ──────────────────────────────────────────────
const MOCK_USER = {
  streakDays: 7,
};

const MOCK_COURTS = [
  {
    id: 1,
    name: 'Pickleball Station Irvine',
    icon: '🏠',
    playing: 4,
    status: 'Busy' as const,
    rating: 4.3,
    courts: 8,
    weeklyVisitors: 127,
    mostActive: 'Saturday 8-10 AM',
  },
  {
    id: 2,
    name: 'Irvine Park',
    icon: '☀️',
    playing: 2,
    status: 'Open' as const,
    rating: 4.1,
    courts: 6,
    weeklyVisitors: 89,
    mostActive: 'Sunday 9-11 AM',
  },
  {
    id: 3,
    name: 'Heritage Park',
    icon: '🌳',
    playing: 6,
    status: 'Busy' as const,
    rating: 4.5,
    courts: 10,
    weeklyVisitors: 203,
    mostActive: 'Saturday 8-10 AM',
  },
];

const MOCK_GAMES = [
  {
    id: 1,
    poster: 'Mike',
    spotsNeeded: 2,
    court: 'Station',
    time: '6PM',
    duprMin: 3.5,
    duprMax: 4.5,
    joined: 2,
    total: 4,
  },
  {
    id: 2,
    poster: 'Sarah',
    spotsNeeded: 1,
    court: 'Irvine Park',
    time: '7:30PM',
    duprMin: 2.5,
    duprMax: 3.5,
    joined: 3,
    total: 4,
  },
  {
    id: 3,
    poster: 'James',
    spotsNeeded: 3,
    court: 'Heritage Park',
    time: '9AM',
    duprMin: 4.0,
    duprMax: 5.0,
    joined: 1,
    total: 4,
  },
];

// ─── Components ─────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push('★');
    else if (i === full && half) stars.push('★');
    else stars.push('☆');
  }
  return <Text style={styles.stars}>{stars.join('')}</Text>;
}

function PlayerSlots({ joined, total }: { joined: number; total: number }) {
  const slots = [];
  for (let i = 0; i < total; i++) {
    slots.push(
      <Text key={i} style={styles.slotEmoji}>
        {i < joined ? '👤' : '__'}
      </Text>
    );
  }
  return <View style={styles.slotsRow}>{slots}</View>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const d = new Date();
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

// ─── Main Screen ────────────────────────────────────────────

export default function PlayScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()}, Boss</Text>
            <Text style={styles.date}>{getFormattedDate()}</Text>
          </View>
          {MOCK_USER.streakDays > 0 && (
            <TouchableOpacity
              style={styles.streakBadge}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.streakBadgeEmoji}>
                {getStreakEmoji(MOCK_USER.streakDays)}
              </Text>
              <Text style={styles.streakBadgeText}>{MOCK_USER.streakDays}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Play Now CTA ── */}
      <TouchableOpacity
        style={styles.playNowBtn}
        onPress={() => router.push('/play-now')}
        activeOpacity={0.85}
      >
        <Text style={styles.playNowEmoji}>🏓</Text>
        <View style={styles.playNowTextWrap}>
          <Text style={styles.playNowTitle}>PLAY NOW</Text>
          <Text style={styles.playNowSub}>Find a game now</Text>
        </View>
      </TouchableOpacity>

      {/* ── Find a Game / Browse Games / Paddles ── */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/matchmaking')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>🔍</Text>
          <Text style={styles.quickActionLabel}>Find Opponents</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/posted-games')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionLabel}>Browse Games</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/paddles')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>🏓</Text>
          <Text style={styles.quickActionLabel}>Paddle Guide</Text>
        </TouchableOpacity>
      </View>

      {/* ── Find Your Paddle CTA ── */}
      <TouchableOpacity
        style={styles.paddleCta}
        onPress={() => router.push('/paddle/find')}
        activeOpacity={0.85}
      >
        <Text style={styles.paddleCtaEmoji}>🎯</Text>
        <View>
          <Text style={styles.paddleCtaTitle}>Find Your Perfect Paddle</Text>
          <Text style={styles.paddleCtaSub}>3 questions, personalized results</Text>
        </View>
      </TouchableOpacity>

      {/* ── Nearby Courts ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NEARBY COURTS</Text>
          <TouchableOpacity onPress={() => router.push('/courts')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {MOCK_COURTS.map((court) => (
          <TouchableOpacity
            key={court.id}
            style={styles.courtCard}
            onPress={() => router.push(`/court/${court.id}`)}
            activeOpacity={theme.activeOpacity}
          >
            <View style={styles.courtHeader}>
              <Text style={styles.courtIcon}>{court.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.courtName} numberOfLines={1}>{court.name}</Text>
                <View style={styles.courtMeta}>
                  <Text style={styles.courtPlaying}>{court.playing} playing</Text>
                  <Text style={styles.courtDot}>·</Text>
                  <Text style={[
                    styles.courtStatus,
                    court.status === 'Busy' ? styles.statusBusy : styles.statusOpen,
                  ]}>
                    {court.status}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.courtFooter}>
              <StarRating rating={court.rating} />
              <Text style={styles.courtVisitors}>{court.weeklyVisitors} visits this week</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Today's Games ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY'S GAMES</Text>
          <TouchableOpacity onPress={() => router.push('/posted-games')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {MOCK_GAMES.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.gameCard}
            activeOpacity={theme.activeOpacity}
          >
            <View style={styles.gameTop}>
              <Text style={styles.gamePoster}>{game.poster} needs {game.spotsNeeded}</Text>
              <View style={styles.duprBadge}>
                <Text style={styles.duprText}>DUPR {game.duprMin}-{game.duprMax}</Text>
              </View>
            </View>
            <Text style={styles.gameDetails}>@ {game.court} · {game.time}</Text>
            <PlayerSlots joined={game.joined} total={game.total} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Post a Game Button ── */}
      <TouchableOpacity
        style={styles.postGameBtn}
        onPress={() => router.push('/post-game')}
        activeOpacity={0.8}
      >
        <Text style={styles.postGameText}>📝 Post a Game</Text>
      </TouchableOpacity>

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

  // Header
  header: {
    paddingHorizontal: theme.spacing.padding,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  greeting: {
    fontSize: 26,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  date: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginTop: 4,
  },
  streakBadgeEmoji: {
    fontSize: 16,
  },
  streakBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.gold,
  },

  // Play Now CTA
  playNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accent,
    marginHorizontal: theme.spacing.padding,
    marginBottom: 12,
    borderRadius: 16,
    padding: 22,
    gap: 14,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  playNowEmoji: {
    fontSize: 36,
  },
  playNowTextWrap: {
    flex: 1,
  },
  playNowTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  playNowSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.padding,
    gap: 10,
    marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickActionIcon: {
    fontSize: 22,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
  },

  // Paddle CTA
  paddleCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: theme.spacing.padding,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.accent + '30',
  },
  paddleCtaEmoji: {
    fontSize: 28,
  },
  paddleCtaTitle: {
    fontSize: 15,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  paddleCtaSub: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.padding,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  seeAll: {
    fontSize: 13,
    color: theme.accent,
    fontWeight: theme.fontWeight.semibold,
  },

  // Court Card
  courtCard: {
    backgroundColor: theme.card,
    marginHorizontal: theme.spacing.padding,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
  },
  courtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  courtIcon: {
    fontSize: 28,
  },
  courtName: {
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
  },
  courtMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  courtPlaying: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  courtDot: {
    fontSize: 12,
    color: theme.textTertiary,
  },
  courtStatus: {
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
  },
  statusBusy: {
    color: theme.gold,
  },
  statusOpen: {
    color: '#22c55e',
  },
  courtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stars: {
    fontSize: 13,
    color: theme.gold,
  },
  courtVisitors: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: theme.fontWeight.semibold,
  },

  // Game Card
  gameCard: {
    backgroundColor: theme.card,
    marginHorizontal: theme.spacing.padding,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
  },
  gameTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gamePoster: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  duprBadge: {
    backgroundColor: 'rgba(8, 145, 178, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  duprText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
  },
  gameDetails: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  slotEmoji: {
    fontSize: 20,
  },

  // Post Game Button
  postGameBtn: {
    marginHorizontal: theme.spacing.padding,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.accent + '40',
    borderStyle: 'dashed' as any,
  },
  postGameText: {
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
  },
});
