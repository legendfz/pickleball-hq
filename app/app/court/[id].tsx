import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { theme } from '../../lib/theme';
import { SkeletonBlock } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import ShareButton from '../../components/ShareButton';
import { generateCourtShareText } from '../../lib/share';

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
  checkIns?: Array<{ name: string; time: string; avatar: string | null }>;
  weeklyVisitors?: number;
  popularTimes?: number[];
  photos?: Array<{ id: number; color: string; caption: string; author: string; time: string }>;
  mostActive?: string;
  topPlayers?: string[];
  realTimeStatus?: {
    scheduledToday: number;
    playersExpected: number;
    currentGroup: string | null;
    nextGame: { time: string; host: string; spotsLeft: number } | null;
    peakHours: string;
    dataConfidence: 'high' | 'medium' | 'low';
    lastUpdated: string;
  };
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

// ─── Enhanced Reviews Section ────────────────────────────────────────
const MOCK_REVIEWS: Review[] = [
  { id: 1, user: 'Mike C.', rating: 4, text: 'Great courts, well maintained. Gets crowded on weekends.', date: '2 days ago' },
  { id: 2, user: 'Sarah K.', rating: 5, text: 'Best courts in the area! Clean lines, good nets, and plenty of space.', date: '1 week ago' },
  { id: 3, user: 'Tom R.', rating: 4, text: 'Good surface, friendly community. Parking can be tricky on Saturday mornings.', date: '2 weeks ago' },
  { id: 4, user: 'Lisa W.', rating: 5, text: 'Love playing here! The lights at night are excellent for evening games.', date: '3 weeks ago' },
  { id: 5, user: 'David R.', rating: 3, text: 'Decent courts but they could use resurfacing. Water pools after rain.', date: '1 month ago' },
  { id: 6, user: 'Amy W.', rating: 5, text: 'Perfect for competitive play. Good mix of skill levels here.', date: '1 month ago' },
  { id: 7, user: 'Chris T.', rating: 4, text: 'Clean restrooms, water fountain works. Only issue is limited shade.', date: '1 month ago' },
  { id: 8, user: 'Nicole K.', rating: 4, text: 'Great community! Regular games happening, easy to find partners.', date: '2 months ago' },
];

function ReviewsSection({ initialReviews, courtName }: { initialReviews?: Review[]; courtName: string }) {
  const reviews = initialReviews && initialReviews.length > 0 ? initialReviews : MOCK_REVIEWS;
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  const allReviews = [...userReviews, ...reviews];
  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : '0.0';

  const handleSubmit = () => {
    if (newRating === 0 || !newText.trim()) return;
    const newReview: Review = {
      id: Date.now(),
      user: 'You',
      rating: newRating,
      text: newText.trim(),
      date: 'Just now',
    };
    setUserReviews([newReview, ...userReviews]);
    setShowWriteReview(false);
    setNewRating(0);
    setNewText('');
  };

  return (
    <View style={styles.card}>
      <View style={styles.reviewsHeader}>
        <View>
          <Text style={styles.cardTitle}>Reviews</Text>
          <Text style={styles.reviewsAvg}>
            {avgRating} ★ ({allReviews.length} reviews)
          </Text>
        </View>
      </View>

      {allReviews.map((review) => (
        <View key={review.id} style={styles.reviewRow}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewAvatar}>
              <Text style={styles.reviewAvatarText}>
                {review.user.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.reviewHeaderRow}>
                <Text style={styles.reviewUser}>{review.user}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <StarRating rating={review.rating} size={12} />
            </View>
          </View>
          <Text style={styles.reviewText}>{review.text}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.writeReviewBtn}
        onPress={() => setShowWriteReview(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.writeReviewBtnText}>✏️ Write Review</Text>
      </TouchableOpacity>

      {/* Write Review Modal */}
      <Modal visible={showWriteReview} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Review {courtName}</Text>

            <Text style={styles.modalLabel}>Rating</Text>
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setNewRating(star)} activeOpacity={0.7}>
                  <Text style={[styles.starPickerStar, star <= newRating && styles.starPickerActive]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Your Review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              placeholderTextColor={theme.textTertiary}
              multiline
              value={newText}
              onChangeText={setNewText}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowWriteReview(false); setNewRating(0); setNewText(''); }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, (newRating === 0 || !newText.trim()) && styles.modalSubmitDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.7}
                disabled={newRating === 0 || !newText.trim()}
              >
                <Text style={styles.modalSubmitBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
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
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${court.lat},${court.lng}`;
    const appleUrl = `https://maps.apple.com/?daddr=${court.lat},${court.lng}`;
    // Try Google Maps first, fall back to Apple Maps
    Linking.openURL(Platform.OS === 'ios' ? appleUrl : googleUrl).catch(() => {
      Linking.openURL(Platform.OS === 'ios' ? googleUrl : appleUrl);
    });
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
          <View style={styles.shareRow}>
            <ShareButton
              shareText={generateCourtShareText({ courtName: court.name, city: court.city })}
              label="Share Visit"
              icon="📍"
            />
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

        {/* ⚡ RIGHT NOW — Live Status */}
        {court.realTimeStatus && (
          <View style={[styles.card, styles.liveNowCard]}>
            <Text style={styles.cardTitle}>⚡ RIGHT NOW</Text>

            {/* Confidence chip */}
            {(() => {
              const conf = court.realTimeStatus!.dataConfidence;
              if (conf === 'high') {
                const checkInCount = (court as any).checkIns?.length || 0;
                return (
                  <View style={[styles.confidenceChip, { backgroundColor: '#22c55e' + '15' }]}>
                    <Text style={[styles.confidenceChipText, { color: '#22c55e' }]}>
                      ✅ Verified by {checkInCount} check-in{checkInCount !== 1 ? 's' : ''} today
                    </Text>
                  </View>
                );
              }
              if (conf === 'medium') {
                return (
                  <View style={[styles.confidenceChip, { backgroundColor: '#f59e0b' + '15' }]}>
                    <Text style={[styles.confidenceChipText, { color: '#f59e0b' }]}>
                      📋 Based on scheduled games
                    </Text>
                  </View>
                );
              }
              return (
                <View style={[styles.confidenceChip, { backgroundColor: theme.textTertiary + '15' }]}>
                  <Text style={[styles.confidenceChipText, { color: theme.textTertiary }]}>
                    📊 Based on historical data
                  </Text>
                </View>
              );
            })()}

            {/* Scheduled today summary */}
            <View style={styles.liveNowRow}>
              <Text style={styles.liveNowCount}>
                {court.realTimeStatus.dataConfidence === 'high' ? '🟢' : court.realTimeStatus.dataConfidence === 'medium' ? '🟡' : '⚪'}{' '}
                {court.realTimeStatus.scheduledToday} group{court.realTimeStatus.scheduledToday !== 1 ? 's' : ''} scheduled
              </Text>
            </View>

            {/* Current group */}
            {court.realTimeStatus.currentGroup && (
              <View style={styles.liveNowDetail}>
                <Text style={styles.liveNowLabel}>Current: {court.realTimeStatus.currentGroup}</Text>
                <Text style={styles.liveNowMeta}>In progress</Text>
              </View>
            )}

            {/* Next game */}
            {court.realTimeStatus.nextGame && (
              <View style={styles.liveNowDetail}>
                <Text style={styles.liveNowLabel}>
                  Next: {court.realTimeStatus.nextGame.host} @ {court.realTimeStatus.nextGame.time}
                </Text>
                <Text style={styles.liveNowMeta}>
                  Spots left: {court.realTimeStatus.nextGame.spotsLeft}
                </Text>
                {court.realTimeStatus.nextGame.spotsLeft > 0 && court.realTimeStatus.nextGame.spotsLeft <= 2 && (
                  <TouchableOpacity
                    style={styles.liveNowJoinBtn}
                    activeOpacity={0.8}
                    onPress={() => router.push('/posted-games')}
                  >
                    <Text style={styles.liveNowJoinBtnText}>Join</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Best time suggestion */}
            <View style={styles.bestTimeRow}>
              <Text style={styles.bestTimeLabel}>⏰ Best time: Now!</Text>
              <Text style={styles.bestTimeSub}>(less crowded than avg)</Text>
            </View>

            {/* Peak hours */}
            <View style={styles.peakHoursRow}>
              <Text style={styles.peakHoursTitle}>📊 Peak hours:</Text>
              <Text style={styles.peakHoursText}>{court.realTimeStatus.peakHours}</Text>
              {court.mostActive && court.mostActive !== court.realTimeStatus.peakHours && (
                <Text style={styles.peakHoursText}>
                  {court.mostActive.includes('Tue') ? 'Tuesday 5-7 PM' : ''}
                </Text>
              )}
            </View>
          </View>
        )}

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

        {/* Social Stats */}
        {(court.weeklyVisitors || court.mostActive || court.topPlayers) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Social Stats</Text>
            {court.weeklyVisitors && (
              <View style={styles.socialStatRow}>
                <Text style={styles.socialStatIcon}>👥</Text>
                <Text style={styles.socialStatText}>
                  <Text style={styles.socialStatHighlight}>{court.weeklyVisitors}</Text> visits this week
                </Text>
              </View>
            )}
            {court.mostActive && (
              <View style={styles.socialStatRow}>
                <Text style={styles.socialStatIcon}>⏰</Text>
                <Text style={styles.socialStatText}>
                  Most active: <Text style={styles.socialStatHighlight}>{court.mostActive}</Text>
                </Text>
              </View>
            )}
            {court.topPlayers && court.topPlayers.length > 0 && (
              <View style={styles.socialStatRow}>
                <Text style={styles.socialStatIcon}>⭐</Text>
                <Text style={styles.socialStatText}>
                  Top players: <Text style={styles.socialStatHighlight}>{court.topPlayers.join(', ')}</Text>
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Popular Times Chart */}
        {court.popularTimes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Popular Times</Text>
            <View style={styles.chartContainer}>
              {court.popularTimes.map((value, hour) => {
                const maxVal = Math.max(...court.popularTimes!);
                const height = maxVal > 0 ? (value / maxVal) * 60 : 0;
                const isNow = hour === new Date().getHours();
                return (
                  <View key={hour} style={styles.chartBarWrap}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: Math.max(height, 2),
                          backgroundColor: isNow ? theme.accent : theme.textTertiary + '60',
                        },
                      ]}
                    />
                    {hour % 4 === 0 && (
                      <Text style={styles.chartLabel}>
                        {hour === 0 ? '12a' : hour === 12 ? '12p' : hour > 12 ? `${hour - 12}p` : `${hour}a`}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
            <Text style={styles.chartHint}>Current hour highlighted</Text>
          </View>
        )}

        {/* Photos */}
        {court.photos && court.photos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📸 Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {court.photos.map((photo) => (
                <View key={photo.id} style={styles.photoItem}>
                  <View style={[styles.photoPlaceholder, { backgroundColor: photo.color }]}>
                    <Text style={styles.photoIcon}>🏓</Text>
                  </View>
                  <Text style={styles.photoCaption} numberOfLines={1}>{photo.caption}</Text>
                  <Text style={styles.photoMeta}>{photo.author} · {photo.time}</Text>
                </View>
              ))}
              {/* Add Photo Button */}
              <TouchableOpacity style={styles.addPhotoBtn} activeOpacity={0.7}>
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Reviews */}
        <ReviewsSection initialReviews={court.reviews} courtName={court.name} />
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

  // Share
  shareRow: {
    marginTop: 14,
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
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.accent,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
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
    paddingLeft: 46,
  },
  reviewDate: {
    fontSize: 11,
    color: '#666',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewsAvg: {
    fontSize: 13,
    color: theme.gold,
    fontWeight: '600',
  },
  writeReviewBtn: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: theme.accent + '15',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.accent + '30',
  },
  writeReviewBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  starPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  starPickerStar: {
    fontSize: 32,
    color: theme.border,
  },
  starPickerActive: {
    color: theme.gold,
  },
  reviewInput: {
    backgroundColor: theme.bg,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: theme.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.border,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.accent,
  },
  modalSubmitDisabled: {
    opacity: 0.4,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Social Stats
  socialStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  socialStatIcon: {
    fontSize: 18,
  },
  socialStatText: {
    fontSize: 13,
    color: theme.textSecondary,
    flex: 1,
  },
  socialStatHighlight: {
    color: theme.text,
    fontWeight: '600',
  },

  // Popular Times Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 80,
    marginBottom: 8,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '80%',
    borderRadius: 2,
    minHeight: 2,
  },
  chartLabel: {
    fontSize: 8,
    color: theme.textTertiary,
    marginTop: 4,
  },
  chartHint: {
    fontSize: 11,
    color: theme.textTertiary,
    textAlign: 'center',
  },

  // Photos
  photoScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  photoItem: {
    width: 140,
    marginRight: 12,
  },
  photoPlaceholder: {
    width: 140,
    height: 100,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 28,
    opacity: 0.7,
  },
  photoCaption: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.text,
    marginTop: 6,
  },
  photoMeta: {
    fontSize: 10,
    color: theme.textTertiary,
    marginTop: 2,
  },
  addPhotoBtn: {
    width: 140,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.accent + '40',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoIcon: {
    fontSize: 28,
    color: theme.accent,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.accent,
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

  // ⚡ Live Now Section
  liveNowCard: {
    borderWidth: 1,
    borderColor: theme.accent + '30',
  },
  confidenceChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  confidenceChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  liveNowRow: {
    marginBottom: 12,
  },
  liveNowCount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  liveNowDetail: {
    backgroundColor: theme.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 4,
  },
  liveNowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  liveNowMeta: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  liveNowJoinBtn: {
    backgroundColor: theme.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  liveNowJoinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  bestTimeRow: {
    backgroundColor: '#22c55e' + '10',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 2,
  },
  bestTimeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
  },
  bestTimeSub: {
    fontSize: 11,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  peakHoursRow: {
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: theme.border,
    gap: 4,
  },
  peakHoursTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  peakHoursText: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '500',
  },
});
