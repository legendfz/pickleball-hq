import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { getStreakEmoji } from '../../lib/gamification';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 110;
const TAB_BAR_HEIGHT = 85;
const CARD_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - TAB_BAR_HEIGHT;

// ─── Mock User ─────────────────────────────────────────────
const MOCK_USER = {
  streakDays: 7,
};

// ─── Court Data ────────────────────────────────────────────
const COURT_INFO: Record<number, { icon: string; rating: number; playing: number; weeklyVisits: number; mostActive: string }> = {
  1:  { icon: '🏠', rating: 4.3, playing: 4, weeklyVisits: 127, mostActive: 'Saturday 8-10 AM' },
  2:  { icon: '☀️', rating: 4.1, playing: 2, weeklyVisits: 89, mostActive: 'Sunday 9-11 AM' },
  4:  { icon: '🏊', rating: 4.4, playing: 3, weeklyVisits: 156, mostActive: 'Saturday 9-11 AM' },
  6:  { icon: '🌳', rating: 4.2, playing: 5, weeklyVisits: 134, mostActive: 'Sunday 8-10 AM' },
  8:  { icon: '🔥', rating: 4.6, playing: 8, weeklyVisits: 210, mostActive: 'Friday 6-8 PM' },
  9:  { icon: '🏖️', rating: 4.0, playing: 3, weeklyVisits: 95, mostActive: 'Saturday 3-5 PM' },
  11: { icon: '🏔️', rating: 4.5, playing: 6, weeklyVisits: 178, mostActive: 'Saturday 8-10 AM' },
  12: { icon: '🎯', rating: 4.3, playing: 7, weeklyVisits: 195, mostActive: 'Wednesday 6-8 PM' },
  15: { icon: '🌊', rating: 4.7, playing: 4, weeklyVisits: 142, mostActive: 'Sunday 10-12 PM' },
  26: { icon: '🏅', rating: 4.4, playing: 6, weeklyVisits: 168, mostActive: 'Wednesday 6-8 PM' },
  28: { icon: '🎯', rating: 4.2, playing: 5, weeklyVisits: 145, mostActive: 'Saturday 10-12 PM' },
};

// ─── Posted Games with urgency ────────────────────────────

interface RawGame {
  id: number;
  hostId: number;
  hostName: string;
  hostDupr: number;
  courtId: number;
  courtName: string;
  datetime: string;
  format: string;
  needed: number;
  joined: Array<{ id: number; name: string; dupr: number }>;
  duprRange: [number, number];
  notes: string;
  status: string;
  city: string;
  isRecurring: boolean;
  recurrence?: string;
  regulars?: Array<{ id: number; name: string; dupr: number }>;
  openSpots?: number;
  urgency?: 'low' | 'medium' | 'high';
}

const POSTED_GAMES: RawGame[] = [
  { id: 1, hostId: 500, hostName: 'Mike Chen', hostDupr: 3.8, courtId: 1, courtName: 'Pickleball Station', datetime: '2026-03-25T18:00:00', format: 'doubles', needed: 2, joined: [{ id: 501, name: 'Lisa Wang', dupr: 4.0 }], duprRange: [3.5, 4.5], notes: 'Bring own balls', status: 'open', city: 'Irvine', isRecurring: false, urgency: 'high' },
  { id: 2, hostId: 502, hostName: 'David Rodriguez', hostDupr: 3.5, courtId: 2, courtName: 'Rancho San Joaquin', datetime: '2026-03-25T09:00:00', format: 'singles', needed: 1, joined: [], duprRange: [3.0, 4.0], notes: 'Looking for a fun singles match', status: 'open', city: 'Irvine', isRecurring: false, urgency: 'high' },
  { id: 3, hostId: 503, hostName: 'Amy Wang', hostDupr: 4.5, courtId: 4, courtName: 'Lakeshore Athletic Club', datetime: '2026-03-26T10:00:00', format: 'doubles', needed: 3, joined: [{ id: 509, name: 'Emily Clark', dupr: 4.7 }, { id: 512, name: 'Tom Harris', dupr: 4.3 }], duprRange: [4.0, 5.0], notes: 'Indoor courts, 1 more for doubles', status: 'open', city: 'Irvine', isRecurring: false, urgency: 'high' },
  { id: 4, hostId: 504, hostName: 'Chris Thompson', hostDupr: 3.2, courtId: 9, courtName: 'Newport Beach PB Courts', datetime: '2026-03-26T16:00:00', format: 'doubles', needed: 2, joined: [{ id: 510, name: 'Kevin Nguyen', dupr: 3.6 }], duprRange: [2.5, 4.0], notes: 'Casual game, all levels welcome', status: 'open', city: 'Newport Beach', isRecurring: false, urgency: 'high' },
  { id: 5, hostId: 505, hostName: 'Nicole Kim', hostDupr: 4.0, courtId: 8, courtName: 'Costa Mesa Pickleball', datetime: '2026-03-27T19:00:00', format: 'mixed', needed: 2, joined: [{ id: 506, name: 'Ryan Patel', dupr: 3.9 }], duprRange: [3.5, 4.5], notes: 'Mixed doubles, need 1 more pair', status: 'open', city: 'Costa Mesa', isRecurring: false, urgency: 'high' },
  { id: 6, hostId: 507, hostName: 'Sarah Mitchell', hostDupr: 4.3, courtId: 11, courtName: 'Laguna Niguel Regional Park', datetime: '2026-03-28T08:00:00', format: 'doubles', needed: 1, joined: [], duprRange: [4.0, 5.0], notes: 'Morning doubles, early bird!', status: 'open', city: 'Laguna Niguel', isRecurring: false, urgency: 'high' },
  { id: 7, hostId: 511, hostName: 'Megan Davis', hostDupr: 4.1, courtId: 15, courtName: 'Santa Monica Pickleball Club', datetime: '2026-03-28T14:00:00', format: 'singles', needed: 1, joined: [], duprRange: [3.5, 4.5], notes: 'Singles match by the beach', status: 'open', city: 'Santa Monica', isRecurring: false, urgency: 'high' },
  { id: 8, hostId: 513, hostName: 'Amanda Garcia', hostDupr: 4.4, courtId: 12, courtName: 'Anaheim Pickleball Center', datetime: '2026-03-29T11:00:00', format: 'doubles', needed: 3, joined: [{ id: 515, name: 'Rachel Adams', dupr: 4.6 }, { id: 520, name: 'Jake Wilson', dupr: 4.2 }], duprRange: [4.0, 5.0], notes: 'Competitive doubles, reserve courts booked', status: 'open', city: 'Anaheim', isRecurring: false, urgency: 'high' },
  { id: 9, hostId: 514, hostName: 'Brandon Scott', hostDupr: 3.7, courtId: 6, courtName: 'Glen IR Pickleball Complex', datetime: '2026-03-29T17:00:00', format: 'doubles', needed: 2, joined: [{ id: 518, name: 'Jason Brown', dupr: 3.8 }, { id: 516, name: 'Daniel Kim', dupr: 3.3 }], duprRange: [3.0, 4.0], notes: 'After-work doubles, drinks after!', status: 'full', city: 'Irvine', isRecurring: false, urgency: 'low' },
  { id: 10, hostId: 517, hostName: 'Lauren Taylor', hostDupr: 4.0, courtId: 28, courtName: 'Long Beach Pickleball Hub', datetime: '2026-03-30T10:00:00', format: 'mixed', needed: 1, joined: [], duprRange: [3.5, 4.5], notes: 'Mixed doubles partner needed', status: 'open', city: 'Long Beach', isRecurring: false, urgency: 'high' },
  { id: 11, isRecurring: true, recurrence: 'Every Sat 9:00-11:00 AM', courtId: 1, courtName: 'Pickleball Station', city: 'Irvine', hostId: 500, hostName: 'Mike Chen', hostDupr: 3.8, format: 'doubles', datetime: '2026-03-29T09:00:00', needed: 4, duprRange: [3.5, 4.5], notes: 'Our regular Saturday morning crew', status: 'full', regulars: [{ id: 500, name: 'Mike C.', dupr: 3.8 }, { id: 501, name: 'Lisa W.', dupr: 4.0 }, { id: 506, name: 'Ryan P.', dupr: 3.9 }, { id: 514, name: 'Brandon S.', dupr: 3.7 }], openSpots: 0, joined: [], urgency: 'low' },
  { id: 12, isRecurring: true, recurrence: 'Every Sun 8:00-10:00 AM', courtId: 6, courtName: 'Glen IR Pickleball Complex', city: 'Irvine', hostId: 503, hostName: 'Amy Wang', hostDupr: 4.5, format: 'doubles', datetime: '2026-03-30T08:00:00', needed: 4, duprRange: [4.0, 5.0], notes: 'Advanced doubles group', status: 'open', regulars: [{ id: 503, name: 'Amy W.', dupr: 4.5 }, { id: 509, name: 'Emily C.', dupr: 4.7 }, { id: 507, name: 'Sarah M.', dupr: 4.3 }], openSpots: 1, joined: [], urgency: 'high' },
  { id: 13, isRecurring: true, recurrence: 'Every Wed 6:00-8:00 PM', courtId: 26, courtName: 'Irvine Great Park Courts', city: 'Irvine', hostId: 518, hostName: 'Jason Brown', hostDupr: 3.8, format: 'doubles', datetime: '2026-03-25T18:00:00', needed: 4, duprRange: [3.0, 4.5], notes: 'Mid-week doubles, casual vibe', status: 'open', regulars: [{ id: 518, name: 'Jason B.', dupr: 3.8 }, { id: 519, name: 'Stephanie N.', dupr: 4.2 }, { id: 505, name: 'Nicole K.', dupr: 4.0 }], openSpots: 1, joined: [], urgency: 'high' },
];

interface CardData {
  id: string;
  type: 'game' | 'court';
  courtName: string;
  courtId: number;
  icon: string;
  playing: number;
  rating: number;
  weeklyVisits: number;
  mostActive: string;
  // Game-specific
  hostName?: string;
  time?: string;
  format?: string;
  duprMin?: number;
  duprMax?: number;
  joined?: Array<{ name: string; dupr: number }>;
  needed?: number;
  isRecurring?: boolean;
  recurrence?: string;
  notes?: string;
  // Urgency
  urgency?: 'low' | 'medium' | 'high';
  spotsLeft?: number;
}

function buildCards(): CardData[] {
  const cards: CardData[] = [];

  for (const game of POSTED_GAMES) {
    const court = COURT_INFO[game.courtId] || { icon: '🏓', rating: 4.0, playing: 2, weeklyVisits: 50, mostActive: 'Weekends' };
    const dt = new Date(game.datetime);
    const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const joinedPlayers = game.joined || [];
    const regulars = game.regulars || [];
    const spotsLeft = game.isRecurring ? (game.openSpots ?? 0) : game.needed - game.joined.length;

    cards.push({
      id: game.isRecurring ? `recurring-${game.id}` : `game-${game.id}`,
      type: 'game',
      courtName: game.courtName,
      courtId: game.courtId,
      icon: court.icon,
      playing: court.playing,
      rating: court.rating,
      weeklyVisits: court.weeklyVisits,
      mostActive: court.mostActive,
      hostName: game.hostName,
      time: game.isRecurring ? game.recurrence : timeStr,
      format: game.format,
      duprMin: game.duprRange[0],
      duprMax: game.duprRange[1],
      joined: game.isRecurring ? regulars : joinedPlayers,
      needed: game.isRecurring ? game.openSpots : game.needed,
      isRecurring: game.isRecurring,
      recurrence: game.recurrence,
      notes: game.notes,
      urgency: game.urgency as CardData['urgency'],
      spotsLeft,
    });
  }

  return cards;
}

const ALL_CARDS = buildCards();

// Count high-urgency games for Play Now badge
const HIGH_URGENCY_COUNT = ALL_CARDS.filter((c) => c.urgency === 'high' && (c.spotsLeft ?? 0) > 0).length;

// ─── Components ────────────────────────────────────────────

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

function PlayerAvatars({ players, needed }: { players: Array<{ name: string; dupr: number }>; needed: number }) {
  const total = players.length + (needed || 0);
  const items = [];
  for (let i = 0; i < total; i++) {
    if (i < players.length) {
      const initials = players[i].name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      items.push(
        <View key={i} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      );
    } else {
      items.push(
        <View key={i} style={styles.avatarEmpty}>
          <Text style={styles.avatarEmptyText}>?</Text>
        </View>
      );
    }
  }
  return <View style={styles.avatarRow}>{items}</View>;
}

function JoinedAnimation({ visible, type }: { visible: boolean; type: 'join' | 'skip' }) {
  if (!visible) return null;
  return (
    <View style={[styles.overlay, type === 'skip' && styles.overlaySkip]}>
      <Text style={styles.overlayEmoji}>{type === 'join' ? '✅' : '👋'}</Text>
      <Text style={styles.overlayText}>
        {type === 'join' ? 'Joined!' : 'Skipped'}
      </Text>
    </View>
  );
}

// ─── Card Component ────────────────────────────────────────

function GameCard({
  card,
  onJoin,
  onSkip,
}: {
  card: CardData;
  onJoin: () => void;
  onSkip: () => void;
}) {
  const slideX = useRef(new Animated.Value(0)).current;
  const [overlay, setOverlay] = useState<{ visible: boolean; type: 'join' | 'skip' }>({ visible: false, type: 'join' });

  const handleJoin = () => {
    Animated.timing(slideX, {
      toValue: SCREEN_WIDTH,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setOverlay({ visible: true, type: 'join' });
      setTimeout(() => onJoin(), 400);
    });
  };

  const handleSkip = () => {
    Animated.timing(slideX, {
      toValue: -SCREEN_WIDTH,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setOverlay({ visible: true, type: 'skip' });
      setTimeout(() => onSkip(), 400);
    });
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ translateX: slideX }] }]}>
      <View style={styles.cardInner}>
        {/* Court Header */}
        <View style={styles.courtSection}>
          <Text style={styles.courtIcon}>{card.icon}</Text>
          <View style={styles.courtInfo}>
            <Text style={styles.courtName} numberOfLines={1}>{card.courtName}</Text>
            <View style={styles.courtMetaRow}>
              <Text style={styles.playingNow}>{card.playing} playing now</Text>
              <Text style={styles.dot}>·</Text>
              <StarRating rating={card.rating} />
            </View>
          </View>
        </View>

        {/* Game Info */}
        <View style={[
          styles.gameSection,
          card.urgency === 'high' && styles.gameSectionUrgentHigh,
          card.urgency === 'medium' && styles.gameSectionUrgentMedium,
        ]}>
          <View style={styles.gameRow}>
            <Text style={styles.hostName}>@ {card.hostName}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.gameTime}>{card.time}</Text>
          </View>
          <View style={styles.gameRow}>
            <Text style={styles.formatBadge}>
              {card.format === 'doubles' ? '🏓 Doubles' : card.format === 'singles' ? '🎯 Singles' : '🤝 Mixed'}
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.duprRange}>DUPR {card.duprMin}–{card.duprMax}</Text>
          </View>
          {card.isRecurring && (
            <View style={styles.recurringBadge}>
              <Text style={styles.recurringText}>🔄 {card.recurrence}</Text>
            </View>
          )}
          {/* Urgency indicator */}
          {card.urgency === 'high' && (card.spotsLeft ?? 0) > 0 && (
            <View style={styles.urgencyHighBadge}>
              <Text style={styles.urgencyHighText}>🔥 {card.spotsLeft} spot{card.spotsLeft !== 1 ? 's' : ''} left!</Text>
            </View>
          )}
          {card.urgency === 'medium' && (card.spotsLeft ?? 0) > 0 && (
            <View style={styles.urgencyMediumBadge}>
              <Text style={styles.urgencyMediumText}>{card.spotsLeft} spots left</Text>
            </View>
          )}
        </View>

        {/* Player Avatars */}
        <View style={styles.playersSection}>
          <PlayerAvatars
            players={card.joined || []}
            needed={card.needed || 0}
          />
          <Text style={[
            styles.spotsText,
            card.urgency === 'high' && { color: '#ef4444', fontWeight: '700' as const },
          ]}>
            {card.needed && card.needed > 0
              ? (card.urgency === 'high' ? `🔥 Only ${card.needed} spot${card.needed > 1 ? 's' : ''} left — join now!` : `${card.needed} spot${card.needed > 1 ? 's' : ''} open`)
              : 'Full — waitlist available'}
          </Text>
        </View>

        {/* Notes */}
        {card.notes ? (
          <Text style={styles.notesText}>💬 {card.notes}</Text>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipBtnText}>Skip →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={handleJoin}
            activeOpacity={0.8}
          >
            <Text style={styles.joinBtnText}>🏓 Join</Text>
          </TouchableOpacity>
        </View>

        {/* Social Proof */}
        <View style={styles.socialProof}>
          <Text style={styles.socialProofText}>🔥 {card.weeklyVisits} visits this week</Text>
          <Text style={styles.socialProofSub}>Most active: {card.mostActive}</Text>
        </View>

        {/* Scroll Hint */}
        <Text style={styles.scrollHint}>▲ Swipe up to continue</Text>
      </View>

      <JoinedAnimation visible={overlay.visible} type={overlay.type} />
    </Animated.View>
  );
}

// ─── Empty State ───────────────────────────────────────────

function EmptyCard() {
  const router = useRouter();
  return (
    <View style={[styles.card, styles.emptyCard]}>
      <Text style={styles.emptyEmoji}>🎉</Text>
      <Text style={styles.emptyTitle}>That's all for now!</Text>
      <Text style={styles.emptySub}>No more games nearby — yet.</Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => router.push('/post-game')}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyBtnText}>📝 Post a Game</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────

export default function PlayScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>(ALL_CARDS);

  const handleJoin = useCallback((cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  }, []);

  const handleSkip = useCallback((cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  }, []);

  const renderItem = useCallback(({ item }: { item: CardData }) => (
    <GameCard
      card={item}
      onJoin={() => handleJoin(item.id)}
      onSkip={() => handleSkip(item.id)}
    />
  ), [handleJoin, handleSkip]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Play</Text>
        </View>
        <View style={styles.headerRight}>
          {HIGH_URGENCY_COUNT > 0 && (
            <TouchableOpacity
              style={styles.urgencyBadge}
              onPress={() => router.push('/posted-games')}
              activeOpacity={0.8}
            >
              <Text style={styles.urgencyBadgeText}>🔴 {HIGH_URGENCY_COUNT}</Text>
            </TouchableOpacity>
          )}
          {MOCK_USER.streakDays > 0 && (
            <TouchableOpacity
              style={styles.streakBadge}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.streakEmoji}>{getStreakEmoji(MOCK_USER.streakDays)}</Text>
              <Text style={styles.streakCount}>{MOCK_USER.streakDays}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => router.push('/matchmaking')}
            activeOpacity={0.7}
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Feed */}
      <FlatList
        data={cards}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={CARD_HEIGHT}
        decelerationRate="fast"
        ListEmptyComponent={<EmptyCard />}
        bounces={false}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },

  // Header
  header: {
    height: HEADER_HEIGHT,
    paddingTop: 52,
    paddingHorizontal: theme.spacing.padding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.bg,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    // Gradient-like: use accent + gold combo
    color: theme.accent,
    textShadowColor: theme.gold + '60',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  urgencyBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ef4444',
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.gold,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 18,
  },

  // Card
  card: {
    height: CARD_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: theme.bg,
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 20,
  },

  // Court Section
  courtSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  courtIcon: {
    fontSize: 48,
  },
  courtInfo: {
    flex: 1,
  },
  courtName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 6,
  },
  courtMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playingNow: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '600',
  },
  dot: {
    fontSize: 14,
    color: theme.textTertiary,
  },
  stars: {
    fontSize: 14,
    color: theme.gold,
    letterSpacing: 1,
  },

  // Game Section
  gameSection: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  gameSectionUrgentHigh: {
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gameSectionUrgentMedium: {
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  urgencyHighBadge: {
    backgroundColor: '#ef4444' + '20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  urgencyHighText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ef4444',
  },
  urgencyMediumBadge: {
    backgroundColor: '#f59e0b' + '20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  urgencyMediumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  gameTime: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  formatBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  duprRange: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.accent,
  },
  recurringBadge: {
    backgroundColor: theme.accent + '15',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  recurringText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.accent,
  },

  // Players
  playersSection: {
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.accent,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  avatarEmpty: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed' as any,
  },
  avatarEmptyText: {
    fontSize: 16,
    color: theme.textTertiary,
    fontWeight: '600',
  },
  spotsText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
  },

  // Notes
  notesText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  skipBtn: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  skipBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  joinBtn: {
    flex: 1.2,
    backgroundColor: theme.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  joinBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Social Proof
  socialProof: {
    alignItems: 'center',
    gap: 2,
  },
  socialProofText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.gold,
  },
  socialProofSub: {
    fontSize: 11,
    color: theme.textTertiary,
  },

  // Scroll Hint
  scrollHint: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 4,
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 145, 178, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 0,
  },
  overlaySkip: {
    backgroundColor: 'rgba(107, 114, 128, 0.85)',
  },
  overlayEmoji: {
    fontSize: 64,
  },
  overlayText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
  },
  emptySub: {
    fontSize: 15,
    color: theme.textSecondary,
  },
  emptyBtn: {
    backgroundColor: theme.accent,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
});
