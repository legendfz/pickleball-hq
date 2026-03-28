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
import api from '../lib/api';
import { theme } from '../lib/theme';
import { SkeletonList } from '../lib/skeleton';

interface ActiveGame {
  id: number;
  hostName: string;
  courtName: string;
  courtId: number;
  city: string;
  datetime: string;
  format: string;
  needed: number;
  joined: Array<{ id: number; name: string; dupr: number }>;
  minutesAway: number;
  urgency: string;
  status: string;
}

interface ActiveCourt {
  courtId: number;
  name: string;
  activeNow: number;
  predictedCrowd: string;
}

interface LookingPlayer {
  id: number;
  name: string;
  city: string;
  court: string;
  dupr: number;
  lookingFor: string;
}

interface PlayNowData {
  activeGames: ActiveGame[];
  activeCourts: ActiveCourt[];
  lookingForPartners: LookingPlayer[];
  totalActive: number;
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function PlayNowScreen() {
  const router = useRouter();
  const [joining, setJoining] = useState<number | null>(null);

  // Mock user DUPR (in production, from user profile)
  const USER_DUPR = 4.0;

  const { data, isLoading, refetch } = useQuery<{ data: PlayNowData }>({
    queryKey: ['play-now', USER_DUPR],
    queryFn: async () => {
      const res = await api.get(`/api/posted-games/play-now?dupr=${USER_DUPR}`);
      return res.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const playNow = data?.data;
  const activeGames = playNow?.activeGames ?? [];
  const activeCourts = playNow?.activeCourts ?? [];
  const lookingForPartners = playNow?.lookingForPartners ?? [];

  const handleJoinGame = async (game: ActiveGame) => {
    setJoining(game.id);
    try {
      await api.post(`/api/posted-games/${game.id}/join`, {
        playerId: 999,
        playerName: 'You',
        playerDupr: 4.0,
      });
      Alert.alert('Joined! 🏓', `You've joined the game at ${game.courtName}`);
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to join');
    } finally {
      setJoining(null);
    }
  };

  const handleJoinWaitlist = (player: LookingPlayer) => {
    Alert.alert('Message Sent! 📨', `We'll let ${player.name} know you're interested in playing.`);
  };

  const urgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'now': return { text: 'NOW', color: '#ef4444', icon: '🔴' };
      case 'soon': return { text: 'SOON', color: '#f59e0b', icon: '🟡' };
      default: return { text: 'TODAY', color: theme.accent, icon: '🔵' };
    }
  };

  const crowdInfo = (crowd: string) => {
    if (crowd === 'busy') return { text: 'Busy', color: '#ef4444' };
    if (crowd === 'moderate') return { text: 'Moderate', color: '#f59e0b' };
    return { text: 'Quiet', color: '#22c55e' };
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Play Now' }} />
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>⚡</Text>
          <Text style={styles.headerTitle}>Play Now</Text>
          <Text style={styles.headerSub}>
            {playNow ? `${playNow.totalActive} people active right now` : 'Loading...'}
          </Text>
        </View>

        {isLoading ? (
          <SkeletonList count={4} cardHeight={100} />
        ) : (
          <>
            {/* Active Games Section */}
            {activeGames.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 Games Starting Soon</Text>
                {activeGames.map((game) => {
                  const spotsLeft = game.needed - game.joined.length;
                  const isFull = spotsLeft <= 0;
                  const urg = urgencyLabel(game.urgency);
                  return (
                    <View key={game.id} style={styles.gameCard}>
                      <View style={styles.gameCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.gameCardCourt} numberOfLines={1}>{game.courtName}</Text>
                          <Text style={styles.gameCardMeta}>
                            {game.city} • {game.format === 'doubles' ? '👥' : '👤'} {game.format}
                          </Text>
                        </View>
                        <View style={[styles.urgencyPill, { backgroundColor: urg.color + '20' }]}>
                          <Text style={[styles.urgencyText, { color: urg.color }]}>{urg.text}</Text>
                        </View>
                      </View>
                      <View style={styles.gameCardInfo}>
                        <Text style={styles.gameCardHost}>
                          {game.hostName} needs <Text style={{ color: theme.accent, fontWeight: '700' }}>{spotsLeft} more</Text>
                        </Text>
                        <Text style={styles.gameCardTime}>
                          {game.minutesAway <= 0 ? '🟢 Happening now!' : `⏰ In ${game.minutesAway} min`}
                        </Text>
                      </View>
                      {!isFull && (
                        <TouchableOpacity
                          style={[styles.joinBtn, joining === game.id && styles.joinBtnDisabled]}
                          onPress={() => handleJoinGame(game)}
                          disabled={joining === game.id}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.joinBtnText}>
                            {joining === game.id ? 'Joining...' : '🏓 Join Now'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {isFull && (
                        <View style={styles.fullBadge}>
                          <Text style={styles.fullBadgeText}>✅ Game is full</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Active Courts Section */}
            {activeCourts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔥 Courts Active Now</Text>
                {activeCourts.map((court) => {
                  const crowd = crowdInfo(court.predictedCrowd);
                  return (
                    <TouchableOpacity
                      key={court.courtId}
                      style={styles.courtCard}
                      onPress={() => router.push(`/court/${court.courtId}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.courtCardLeft}>
                        <Text style={styles.courtActiveCount}>{court.activeNow}</Text>
                        <Text style={styles.courtActiveLabel}>playing</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.courtCardName} numberOfLines={1}>{court.name}</Text>
                        <View style={[styles.crowdPill, { backgroundColor: crowd.color + '20', alignSelf: 'flex-start' }]}>
                          <Text style={[styles.crowdText, { color: crowd.color }]}>{crowd.text}</Text>
                        </View>
                      </View>
                      <Text style={styles.courtArrow}>→</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Looking for Partners */}
            {lookingForPartners.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👋 Looking for Partners</Text>
                {lookingForPartners.map((player) => (
                  <View key={player.id} style={styles.playerCard}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>{getInitials(player.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerCardName}>{player.name}</Text>
                      <Text style={styles.playerCardMeta}>
                        DUPR {player.dupr.toFixed(1)} • {player.lookingFor}
                      </Text>
                      <Text style={styles.playerCardLocation}>
                        📍 {player.court}, {player.city}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.messageBtn}
                      onPress={() => handleJoinWaitlist(player)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.messageBtnText}>👋</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Empty state */}
            {activeGames.length === 0 && activeCourts.length === 0 && lookingForPartners.length === 0 && (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🏓</Text>
                <Text style={styles.emptyTitle}>No activity right now</Text>
                <Text style={styles.emptySub}>Check back during peak hours (weekday evenings, weekend mornings)</Text>
                <TouchableOpacity
                  style={styles.postBtn}
                  onPress={() => router.push('/post-game')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.postBtnText}>➕ Post a Game Instead</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 60, paddingTop: 8 },

  // Header
  header: {
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerEmoji: { fontSize: 36, marginBottom: 6 },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.text,
  },
  headerSub: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Game cards
  gameCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: theme.spacing.padding,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gameCardCourt: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  gameCardMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  urgencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gameCardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameCardHost: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  gameCardTime: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  joinBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinBtnDisabled: {
    opacity: 0.6,
  },
  joinBtnText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  fullBadge: {
    backgroundColor: '#22c55e' + '20',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  fullBadgeText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },

  // Court cards
  courtCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: theme.spacing.padding,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  courtCardLeft: {
    alignItems: 'center',
    minWidth: 44,
  },
  courtActiveCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22c55e',
  },
  courtActiveLabel: {
    fontSize: 10,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  courtCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  crowdPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  crowdText: {
    fontSize: 11,
    fontWeight: '600',
  },
  courtArrow: {
    fontSize: 18,
    color: theme.textSecondary,
  },

  // Player cards
  playerCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: theme.spacing.padding,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accent + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.accent,
  },
  playerCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  playerCardMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  playerCardLocation: {
    fontSize: 11,
    color: theme.textTertiary,
    marginTop: 2,
  },
  messageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtnText: {
    fontSize: 22,
  },

  // Empty state
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: theme.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  postBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  postBtnText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
