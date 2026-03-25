import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter, Stack } from 'expo-router';
import api from '../../lib/api';
import { theme } from '../../lib/theme';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';

interface JoinedPlayer {
  id: number;
  name: string;
  dupr: number;
}

interface PostedGame {
  id: number;
  hostId: number;
  hostName: string;
  hostDupr: number;
  courtId: number;
  courtName: string;
  datetime: string;
  format: 'singles' | 'doubles' | 'mixed';
  needed: number;
  joined: JoinedPlayer[];
  duprRange: [number, number];
  notes: string;
  status: 'open' | 'full' | 'cancelled' | 'needs_players' | 'expired';
  city: string;
  isRecurring?: boolean;
  recurrence?: string;
  regulars?: Array<{ id: number; name: string; dupr: number }>;
  openSpots?: number;
  waitlist?: Array<{ id: number; name: string; dupr: number }>;
  urgency?: 'low' | 'medium' | 'high';
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDateTime(dt: string): { date: string; time: string; relative: string } {
  const d = new Date(dt);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let relative = '';
  if (diffDays === 0) relative = 'Today';
  else if (diffDays === 1) relative = 'Tomorrow';
  else if (diffDays < 7) relative = days[d.getDay()];
  else relative = `${months[d.getMonth()]} ${d.getDate()}`;

  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, '0');

  return {
    date: `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`,
    time: `${h}:${m} ${ampm}`,
    relative,
  };
}

const formatIcons: Record<string, string> = {
  singles: '👤',
  doubles: '👥',
  mixed: '👫',
};

export default function PostedGamesScreen() {
  const router = useRouter();
  const [joining, setJoining] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery<{ data: PostedGame[] }>({
    queryKey: ['posted-games'],
    queryFn: async () => {
      const res = await api.get('/api/posted-games');
      return res.data;
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const games = data?.data ?? [];

  const handleJoin = async (game: PostedGame) => {
    setJoining(game.id);
    try {
      // Mock current user
      const currentPlayer = { id: 999, name: 'You', dupr: 4.0 };
      // For recurring games with no open spots, join waitlist
      const joinWaitlist = game.isRecurring && (game.openSpots ?? 0) <= 0;
      await api.post(`/api/posted-games/${game.id}/join`, {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        playerDupr: currentPlayer.dupr,
        joinWaitlist,
      });
      if (joinWaitlist) {
        Alert.alert('Added to Waitlist! 📋', `You'll be notified when a spot opens up at ${game.courtName}`);
      } else {
        Alert.alert('Joined! 🏓', `You've joined the game at ${game.courtName}`);
      }
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to join');
    } finally {
      setJoining(null);
    }
  };

  const renderGame = (game: PostedGame) => {
    const dt = formatDateTime(game.datetime);

    // Recurring game rendering
    if (game.isRecurring) {
      const regulars = game.regulars ?? [];
      const openSpots = game.openSpots ?? 0;
      const waitlist = game.waitlist ?? [];

      return (
        <View key={game.id} style={[styles.gameCard, styles.recurringCard]}>
          {/* Recurring Badge */}
          <View style={styles.recurringBadgeRow}>
            <View style={styles.recurringBadge}>
              <Text style={styles.recurringBadgeText}>⚡ Recurring</Text>
            </View>
            <Text style={styles.recurrenceText}>{game.recurrence}</Text>
          </View>

          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.courtInfo}>
              <Text style={styles.courtName} numberOfLines={1}>{game.courtName}</Text>
              <View style={styles.formatBadge}>
                <Text style={styles.formatBadgeText}>
                  {formatIcons[game.format]} {game.format.charAt(0).toUpperCase() + game.format.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.dateBox}>
              <Text style={styles.dateRelative}>{dt.relative}</Text>
              <Text style={styles.dateTime}>{dt.time}</Text>
            </View>
          </View>

          {/* Regulars */}
          <Text style={styles.regularsTitle}>Regular Crew ({regulars.length})</Text>
          <View style={styles.playersRow}>
            {regulars.map((player) => (
              <View key={player.id} style={styles.playerChip}>
                <View style={[styles.avatar, styles.avatarRegular]}>
                  <Text style={styles.avatarText}>{getInitials(player.name)}</Text>
                </View>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={styles.playerDupr}>{player.dupr.toFixed(1)}</Text>
              </View>
            ))}
            {openSpots > 0 && Array.from({ length: openSpots }).map((_, i) => (
              <View key={`open-${i}`} style={styles.playerChip}>
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <Text style={styles.avatarTextEmpty}>?</Text>
                </View>
                <Text style={styles.playerNameEmpty}>Open</Text>
              </View>
            ))}
          </View>

          {/* Open Spots / Waitlist */}
          {openSpots > 0 ? (
            <Text style={styles.openSpotsText}>
              🟢 <Text style={{ fontWeight: '700', color: theme.accent }}>{openSpots} spot{openSpots > 1 ? 's' : ''} open</Text>
            </Text>
          ) : (
            <Text style={styles.fullText}>✅ Roster full</Text>
          )}

          {/* Waitlist */}
          {waitlist.length > 0 && (
            <View style={styles.waitlistSection}>
              <Text style={styles.waitlistTitle}>Waitlist ({waitlist.length})</Text>
              <View style={styles.waitlistRow}>
                {waitlist.map((w) => (
                  <View key={w.id} style={styles.waitlistChip}>
                    <Text style={styles.waitlistName}>{w.name}</Text>
                    <Text style={styles.waitlistDupr}>{w.dupr.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* DUPR Range */}
          <View style={styles.duprRow}>
            <Text style={styles.duprLabel}>DUPR Range</Text>
            <View style={styles.duprRangePill}>
              <Text style={styles.duprRangeText}>
                {game.duprRange[0].toFixed(1)} — {game.duprRange[1].toFixed(1)}
              </Text>
            </View>
          </View>

          {game.notes ? (
            <Text style={styles.notesText}>💬 {game.notes}</Text>
          ) : null}

          {/* Join / Waitlist Button */}
          <TouchableOpacity
            style={[
              styles.joinBtn,
              openSpots <= 0 && styles.waitlistBtn,
              joining === game.id && styles.joinBtnDisabled,
            ]}
            onPress={() => handleJoin(game)}
            disabled={joining === game.id}
            activeOpacity={0.8}
          >
            <Text style={[styles.joinBtnText, openSpots <= 0 && styles.waitlistBtnText]}>
              {joining === game.id
                ? 'Joining...'
                : openSpots > 0
                  ? '🏓 Join Regular Session'
                  : '📋 Join Waitlist'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Regular (non-recurring) game rendering
    const spotsLeft = game.needed - game.joined.length;
    const isFull = game.status === 'full' || spotsLeft <= 0;

    // Compute urgency
    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (!isFull) {
      if (spotsLeft <= 1) urgency = 'high';
      else if (spotsLeft <= 2) urgency = 'medium';
    }

    const allPlayers = [
      { id: game.hostId, name: game.hostName, dupr: game.hostDupr, isHost: true },
      ...game.joined.map((p) => ({ ...p, isHost: false })),
    ];

    return (
      <View key={game.id} style={[
        styles.gameCard,
        urgency === 'high' && !isFull && styles.gameCardUrgentHigh,
        urgency === 'medium' && !isFull && styles.gameCardUrgentMedium,
        isFull && styles.gameCardFull,
      ]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.courtInfo}>
            <Text style={styles.courtName} numberOfLines={1}>{game.courtName}</Text>
            <View style={styles.formatBadge}>
              <Text style={styles.formatBadgeText}>
                {formatIcons[game.format]} {game.format.charAt(0).toUpperCase() + game.format.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateRelative}>{dt.relative}</Text>
            <Text style={styles.dateTime}>{dt.time}</Text>
          </View>
        </View>

        {/* Need text */}
        <Text style={styles.needText}>
          {isFull ? (
            <Text style={styles.fullText}>✅ Game is full!</Text>
          ) : urgency === 'high' ? (
            <Text style={{ color: '#ef4444', fontWeight: '700' as const }}>🔥 1 spot left!</Text>
          ) : urgency === 'medium' ? (
            <Text style={{ color: '#f59e0b', fontWeight: '600' as const }}>{spotsLeft} spots left</Text>
          ) : (
            <>
              <Text style={styles.hostName}>{game.hostName}</Text> needs{' '}
              <Text style={styles.spotsCount}>{spotsLeft} more</Text> player{spotsLeft > 1 ? 's' : ''}
            </>
          )}
        </Text>

        {/* Players */}
        <View style={styles.playersRow}>
          {allPlayers.map((player) => (
            <View key={player.id} style={styles.playerChip}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(player.name)}</Text>
              </View>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}{player.isHost ? ' ⭐' : ''}
              </Text>
              <Text style={styles.playerDupr}>{player.dupr.toFixed(1)}</Text>
            </View>
          ))}
          {/* Empty spots */}
          {Array.from({ length: Math.max(0, spotsLeft) }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.playerChip}>
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text style={styles.avatarTextEmpty}>?</Text>
              </View>
              <Text style={styles.playerNameEmpty}>Open</Text>
            </View>
          ))}
        </View>

        {/* DUPR Range */}
        <View style={styles.duprRow}>
          <Text style={styles.duprLabel}>DUPR Range</Text>
          <View style={styles.duprRangePill}>
            <Text style={styles.duprRangeText}>
              {game.duprRange[0].toFixed(1)} — {game.duprRange[1].toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {game.notes ? (
          <Text style={styles.notesText}>💬 {game.notes}</Text>
        ) : null}

        {/* Join Button */}
        {!isFull && (game.status === 'open' || game.status === 'needs_players') && (
          <TouchableOpacity
            style={[
              styles.joinBtn,
              urgency === 'high' && styles.joinBtnUrgent,
              joining === game.id && styles.joinBtnDisabled,
            ]}
            onPress={() => handleJoin(game)}
            disabled={joining === game.id}
            activeOpacity={0.8}
          >
            <Text style={[styles.joinBtnText, urgency === 'high' && { color: '#fff' }]}>
              {joining === game.id ? 'Joining...' : urgency === 'high' ? '🔥 Join Now!' : '🏓 Join Game'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Find Games' }} />
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
        <Text style={styles.pageTitle}>Find Games</Text>
        <Text style={styles.pageSubtitle}>Join open pickleball games near you</Text>

        {/* Post Game Button */}
        <TouchableOpacity
          style={styles.postGameBtn}
          onPress={() => router.push('/post-game')}
          activeOpacity={0.8}
        >
          <Text style={styles.postGameIcon}>➕</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.postGameTitle}>Post a Game</Text>
            <Text style={styles.postGameSubtitle}>Create your own game & invite players</Text>
          </View>
          <Text style={styles.postGameArrow}>→</Text>
        </TouchableOpacity>

        {/* City Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityPillsRow}
        >
          {['All', 'Irvine', 'Costa Mesa', 'Newport Beach', 'Laguna Niguel', 'Santa Monica', 'Anaheim', 'Long Beach'].map((city) => (
            <TouchableOpacity
              key={city}
              style={styles.cityPill}
              activeOpacity={0.7}
            >
              <Text style={styles.cityPillText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Games List */}
        {isLoading ? (
          <SkeletonList count={3} cardHeight={180} />
        ) : games.length === 0 ? (
          <EmptyState
            message="No games posted yet"
            subtitle="Be the first to post a game!"
          />
        ) : (
          <View style={styles.gamesList}>
            {games.map(renderGame)}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    paddingBottom: 60,
    paddingTop: 8,
  },
  pageTitle: {
    fontSize: theme.fontSize.pageTitle,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    paddingHorizontal: theme.spacing.padding,
  },
  pageSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 16,
  },

  // Post Game Button
  postGameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    marginHorizontal: theme.spacing.padding,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.accent + '40',
  },
  postGameIcon: {
    fontSize: 24,
  },
  postGameTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  postGameSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 1,
  },
  postGameArrow: {
    fontSize: 20,
    color: theme.accent,
    fontWeight: '300',
  },

  // City pills
  cityPillsRow: {
    paddingHorizontal: theme.spacing.padding,
    paddingBottom: 12,
    gap: 6,
    flexDirection: 'row',
  },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cityPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },

  // Games list
  gamesList: {
    paddingHorizontal: theme.spacing.padding,
    gap: 12,
  },

  // Game Card
  gameCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  gameCardUrgentHigh: {
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gameCardUrgentMedium: {
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  gameCardFull: {
    opacity: 0.7,
    borderColor: theme.textTertiary + '40',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  courtInfo: {
    flex: 1,
    marginRight: 12,
  },
  courtName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  formatBadge: {
    backgroundColor: theme.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  formatBadgeText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  dateBox: {
    alignItems: 'flex-end',
  },
  dateRelative: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.accent,
  },
  dateTime: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // Need text
  needText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  hostName: {
    fontWeight: '600',
    color: theme.text,
  },
  spotsCount: {
    fontWeight: '700',
    color: theme.accent,
  },
  fullText: {
    color: '#22c55e',
    fontWeight: '600',
  },

  // Players
  playersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  playerChip: {
    alignItems: 'center',
    gap: 4,
    minWidth: 56,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.accent + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmpty: {
    backgroundColor: theme.bg,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.accent,
  },
  avatarTextEmpty: {
    fontSize: 16,
    color: theme.textTertiary,
  },
  playerName: {
    fontSize: 11,
    color: theme.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  playerNameEmpty: {
    fontSize: 11,
    color: theme.textTertiary,
    fontStyle: 'italic',
  },
  playerDupr: {
    fontSize: 10,
    color: theme.accent,
    fontWeight: '600',
  },

  // DUPR Range
  duprRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  duprLabel: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  duprRangePill: {
    backgroundColor: theme.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  duprRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.accent,
  },

  // Notes
  notesText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },

  // Join Button
  joinBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  joinBtnDisabled: {
    opacity: 0.6,
  },
  joinBtnText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },

  // Recurring games
  recurringCard: {
    borderColor: theme.accent + '40',
    borderWidth: 1.5,
  },
  recurringBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  recurringBadge: {
    backgroundColor: theme.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recurringBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
  },
  recurrenceText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  regularsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avatarRegular: {
    borderWidth: 2,
    borderColor: '#22c55e' + '60',
  },
  openSpotsText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  waitlistSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: theme.border,
    marginBottom: 8,
  },
  waitlistTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textTertiary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  waitlistRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  waitlistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.bg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  waitlistName: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  waitlistDupr: {
    fontSize: 10,
    color: theme.textTertiary,
    fontWeight: '600',
  },
  waitlistBtn: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  waitlistBtnText: {
    color: theme.accent,
  },
});
