import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { theme } from '../../lib/theme';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';

interface Court {
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
  distance?: number;
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push('★');
    } else if (i === full && half) {
      stars.push('★');
    } else {
      stars.push('☆');
    }
  }
  return (
    <Text style={{ color: theme.gold, fontSize: size }}>
      {stars.join('')} <Text style={{ color: theme.textSecondary, fontSize: size - 2 }}>{rating.toFixed(1)}</Text>
    </Text>
  );
}

export default function CourtsScreen() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery<{ data: Court[] }>({
    queryKey: ['courts', search],
    queryFn: async () => {
      const params = search.trim() ? `?city=${encodeURIComponent(search.trim())}` : '';
      const res = await api.get(`/api/courts${params}`);
      return res.data;
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const courts = data?.data ?? [];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: 50 }}>
          <SkeletonList count={8} cardHeight={80} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: 50 }}>
          <EmptyState message="Failed to load courts" subtitle={(error as Error).message} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Court Finder</Text>
      <Text style={styles.pageSubtitle}>Find pickleball courts near you</Text>

      <View style={styles.searchWrap}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by city..."
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.resultCount}>{courts.length} courts found</Text>

      <FlatList
        data={courts}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.courtCard}
            onPress={() => router.push(`/court/${item.id}`)}
            activeOpacity={theme.activeOpacity}
          >
            <View style={styles.courtHeader}>
              <View style={styles.courtNameRow}>
                <Text style={styles.typeIcon}>{item.type === 'indoor' ? '🏠' : '☀️'}</Text>
                <Text style={styles.courtName} numberOfLines={1}>{item.name}</Text>
              </View>
              <View style={[styles.typeBadge, item.type === 'indoor' ? styles.indoorBadge : styles.outdoorBadge]}>
                <Text style={styles.typeBadgeText}>{item.type}</Text>
              </View>
            </View>

            <View style={styles.courtInfo}>
              <Text style={styles.courtMeta}>📍 {item.city}, {item.state}</Text>
              <Text style={styles.courtMeta}>🎾 {item.courts} courts</Text>
            </View>

            <View style={styles.courtFooter}>
              <StarRating rating={item.rating} />
              <View style={styles.footerRight}>
                {item.free ? (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                ) : (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>PAID</Text>
                  </View>
                )}
                <Text style={styles.hours}>{item.openHours}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: 50,
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
    marginBottom: 12,
  },
  searchWrap: {
    marginHorizontal: theme.spacing.padding,
    marginBottom: 12,
    backgroundColor: theme.card,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: theme.fontSize.body,
    color: theme.text,
  },
  clearBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: theme.textSecondary,
    fontSize: 18,
  },
  resultCount: {
    fontSize: 12,
    color: theme.textSecondary,
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: theme.spacing.padding,
    paddingBottom: 30,
  },
  courtCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courtNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  typeIcon: {
    fontSize: 16,
  },
  courtName: {
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indoorBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  outdoorBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  courtInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  courtMeta: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  courtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: '#22c55e',
  },
  paidBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: theme.gold,
  },
  hours: {
    fontSize: 11,
    color: theme.textSecondary,
  },
});
