import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { theme } from '../../lib/theme';
import { SkeletonBlock } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';

interface Review {
  id: number;
  user: string;
  rating: number;
  text: string;
  date: string;
}

interface CourtEvent {
  id: number;
  name: string;
  date: string;
  time: string;
  level: string;
}

interface CourtDetail {
  id: number;
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  type: string;
  courts: number;
  rating: number;
  free: boolean;
  openHours: string;
  address: string;
  reviews: Review[];
  events: CourtEvent[];
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push('★');
    else if (i === full && half) stars.push('★');
    else stars.push('☆');
  }
  return <Text style={{ color: theme.gold, fontSize: size }}>{stars.join('')}</Text>;
}

export default function CourtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: court, isLoading, error } = useQuery<CourtDetail>({
    queryKey: ['court', id],
    queryFn: async () => {
      const res = await api.get(`/api/courts/${id}`);
      return res.data;
    },
  });

  const openDirections = () => {
    if (!court) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${court.lat},${court.lng}`;
    Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ padding: 16, gap: 16 }}>
          <SkeletonBlock width={300} height={30} borderRadius={8} />
          <SkeletonBlock width={200} height={20} borderRadius={8} />
          <SkeletonBlock width={350} height={150} borderRadius={10} />
        </View>
      </View>
    );
  }

  if (error || !court) {
    return (
      <View style={styles.container}>
        <EmptyState message="Court not found" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: court.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.typeIcon}>{court.type === 'indoor' ? '🏠' : '☀️'}</Text>
            <Text style={styles.courtName}>{court.name}</Text>
          </View>
          <Text style={styles.address}>{court.address}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{court.courts}</Text>
              <Text style={styles.statLabel}>Courts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <StarRating rating={court.rating} size={14} />
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, court.free ? { color: '#22c55e' } : { color: theme.gold }]}>
                {court.free ? 'FREE' : 'PAID'}
              </Text>
              <Text style={styles.statLabel}>Access</Text>
            </View>
          </View>
        </View>

        {/* 🔥 Live Activity */}
        <View style={[styles.card, styles.heatCard]}>
          <Text style={styles.cardTitle}>🔥 Live Activity</Text>
          <View style={styles.heatRow}>
            <Text style={styles.heatCount}>
              {(court as any).activeNow || 0}
            </Text>
            <Text style={styles.heatLabel}>people playing now</Text>
          </View>
          <View style={styles.heatMeta}>
            {(() => {
              const crowd = (court as any).predictedCrowd || 'moderate';
              const crowdColor = crowd === 'busy' ? '#ef4444' : crowd === 'moderate' ? '#f59e0b' : '#22c55e';
              return (
                <View style={[styles.crowdPill, { backgroundColor: crowdColor + '20' }]}>
                  <Text style={[styles.crowdText, { color: crowdColor }]}>
                    {crowd === 'busy' ? '🔴 Busy' : crowd === 'moderate' ? '🟡 Moderate' : '🟢 Quiet'}
                  </Text>
                </View>
              );
            })()}
            {(court as any).upcomingGames > 0 && (
              <Text style={styles.upcomingText}>
                {`📅 ${(court as any).upcomingGames} upcoming game${(court as any).upcomingGames > 1 ? 's' : ''}`}
              </Text>
            )}
          </View>
          {/* Check-ins */}
          {(court as any).checkIns && (court as any).checkIns.length > 0 && (
            <View style={styles.checkInList}>
              <Text style={styles.checkInTitle}>Checked in:</Text>
              {(court as any).checkIns.slice(0, 6).map((ci: any, idx: number) => (
                <View key={idx} style={styles.checkInRow}>
                  <View style={styles.checkInAvatar}>
                    <Text style={styles.checkInAvatarText}>{ci.name.split(' ').map((n: string) => n[0]).join('')}</Text>
                  </View>
                  <Text style={styles.checkInName}>{ci.name}</Text>
                  <Text style={styles.checkInTime}>{ci.time}</Text>
                </View>
              ))}
            </View>
          )}
          {/* Peak hours prediction */}
          <View style={styles.predictionRow}>
            <Text style={styles.predictionText}>
              📊 Usually busiest: Weekend mornings & weekday evenings
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <View style={[styles.typeBadge, court.type === 'indoor' ? styles.indoorBadge : styles.outdoorBadge]}>
              <Text style={styles.typeBadgeText}>
                {court.type === 'indoor' ? '🏠 Indoor' : '☀️ Outdoor'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hours</Text>
            <Text style={styles.infoValue}>{court.openHours}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City</Text>
            <Text style={styles.infoValue}>{court.city}, {court.state}</Text>
          </View>
        </View>

        {/* Get Directions */}
        <TouchableOpacity style={styles.directionsBtn} onPress={openDirections} activeOpacity={0.7}>
          <Text style={styles.directionsBtnText}>📍 Get Directions</Text>
        </TouchableOpacity>

        {/* Upcoming Events */}
        {court.events && court.events.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upcoming Events</Text>
            {court.events.map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <View style={styles.eventDate}>
                  <Text style={styles.eventDateText}>{event.date.slice(5)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventMeta}>{event.time} • {event.level}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Reviews */}
        {court.reviews && court.reviews.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reviews</Text>
            {court.reviews.map((review) => (
              <View key={review.id} style={styles.reviewRow}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>{review.user}</Text>
                  <StarRating rating={review.rating} size={12} />
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 40 },

  header: {
    backgroundColor: theme.card,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  typeIcon: { fontSize: 24 },
  courtName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
  },
  address: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.border,
  },

  card: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 16,
    margin: 16,
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: theme.text, fontWeight: '500' },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  indoorBadge: { backgroundColor: 'rgba(139, 92, 246, 0.2)' },
  outdoorBadge: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },

  directionsBtn: {
    backgroundColor: theme.accent,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  directionsBtnText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    gap: 12,
  },
  eventDate: {
    backgroundColor: theme.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 55,
    alignItems: 'center',
  },
  eventDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.accent,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  eventMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },

  reviewRow: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  reviewText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  reviewDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },

  // 🔥 Live Activity
  heatCard: {
    borderWidth: 1,
    borderColor: '#22c55e' + '30',
  },
  heatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  heatCount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#22c55e',
  },
  heatLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  heatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  crowdPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  crowdText: {
    fontSize: 12,
    fontWeight: '600',
  },
  upcomingText: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: '500',
  },
  checkInList: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: theme.border,
  },
  checkInTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  checkInAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.accent + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.accent,
  },
  checkInName: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '500',
    flex: 1,
  },
  checkInTime: {
    fontSize: 11,
    color: theme.textTertiary,
  },
  predictionRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: theme.border,
  },
  predictionText: {
    fontSize: 12,
    color: theme.textTertiary,
    lineHeight: 18,
  },
});
