import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { SkeletonBlock, SkeletonList } from '../lib/skeleton';
import { EmptyState } from '../lib/empty-state';
import { theme } from '../lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Paddle {
  id: number;
  name: string;
  brand: string;
  brandId: number;
  weight: string;
  faceMaterial: string;
  coreMaterial: string;
  thickness: string;
  price: number;
  rating: number;
  reviewCount: number;
  proPlayers: number[];
  tags: string[];
  category: string;
  bestFor: string;
  proPlayerCount?: number;
}

const FILTERS = ['All', 'Carbon', 'Graphite', 'Beginner', 'Advanced', 'Budget', 'Premium'] as const;
type FilterKey = typeof FILTERS[number];

export default function PaddlesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');

  const { data, isLoading } = useQuery<{ count: number; paddles: Paddle[] }>({
    queryKey: ['paddles'],
    queryFn: async () => {
      const res = await api.get('/api/paddles');
      return res.data;
    },
  });

  const filtered = useMemo(() => {
    if (!data?.paddles) return [];
    let result = data.paddles;

    // Search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.brand.toLowerCase().includes(s) ||
          p.faceMaterial.toLowerCase().includes(s)
      );
    }

    // Filter
    if (activeFilter !== 'All') {
      const f = activeFilter.toLowerCase();
      result = result.filter((p) => {
        if (f === 'carbon') return p.faceMaterial.toLowerCase().includes('carbon');
        if (f === 'graphite') return p.faceMaterial.toLowerCase().includes('graphite');
        if (f === 'beginner') return p.tags.includes('beginner') || p.tags.includes('beginner-friendly');
        if (f === 'advanced') return p.tags.includes('advanced');
        if (f === 'budget') return p.category === 'budget';
        if (f === 'premium') return p.category === 'premium';
        return true;
      });
    }

    return result;
  }, [data, search, activeFilter]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#22c55e';
    if (rating >= 4.0) return theme.accent;
    if (rating >= 3.5) return '#eab308';
    return '#888';
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'premium': return { label: 'PREMIUM', color: '#a855f7' };
      case 'mid-range': return { label: 'MID', color: theme.blue };
      case 'budget': return { label: 'VALUE', color: '#22c55e' };
      default: return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Paddle Database', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏓 Paddle Database</Text>
          <Text style={styles.headerSub}>{data?.count || 0} paddles from top brands</Text>
          <TouchableOpacity
            style={styles.findBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/paddle/find')}
          >
            <Text style={styles.findBtnText}>🎯 Find Your Perfect Paddle</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search paddles, brands, materials..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <Text style={styles.resultCount}>{filtered.length} paddles</Text>

        {isLoading ? (
          <SkeletonList count={5} cardHeight={100} />
        ) : filtered.length === 0 ? (
          <EmptyState message="No paddles match your search" />
        ) : (
          filtered.map((paddle) => {
            const badge = getCategoryBadge(paddle.category);
            return (
              <TouchableOpacity
                key={paddle.id}
                style={styles.paddleCard}
                onPress={() => router.push(`/paddle/${paddle.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.paddleCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.paddleName}>{paddle.name}</Text>
                      {badge && (
                        <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
                          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.paddleBrand}>{paddle.brand}</Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>${paddle.price}</Text>
                  </View>
                </View>

                <View style={styles.paddleMeta}>
                  <View style={styles.ratingRow}>
                    <Text style={[styles.ratingNum, { color: getRatingColor(paddle.rating) }]}>
                      ★ {paddle.rating}
                    </Text>
                    <Text style={styles.reviewCount}>({paddle.reviewCount})</Text>
                  </View>

                  <View style={styles.specsRow}>
                    <Text style={styles.spec}>{paddle.weight}</Text>
                    <Text style={styles.specDot}>·</Text>
                    <Text style={styles.spec}>{paddle.faceMaterial}</Text>
                    <Text style={styles.specDot}>·</Text>
                    <Text style={styles.spec}>{paddle.thickness}</Text>
                  </View>

                  <View style={styles.proRow}>
                    <Text style={styles.proCount}>
                      👤 {paddle.proPlayerCount ?? paddle.proPlayers.length} pro players
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
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
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 14,
  },
  findBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  findBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: theme.text,
    fontSize: 14,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: theme.textSecondary,
    fontSize: 16,
  },

  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterPillActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  filterPillTextActive: {
    color: '#fff',
  },

  resultCount: {
    fontSize: 12,
    color: theme.textSecondary,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  paddleCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  paddleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  paddleName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    flexShrink: 1,
  },
  paddleBrand: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceTag: {
    backgroundColor: theme.accent + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.accent,
  },
  paddleMeta: {
    gap: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNum: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spec: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  specDot: {
    color: '#555',
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proCount: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: '500',
  },
});
