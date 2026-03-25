import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { SkeletonBlock } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { theme } from '../../lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ComparisonData {
  paddle1: any;
  paddle2: any;
  comparison: {
    weight: { p1: number; p2: number; winner: string };
    thickness: { p1: number; p2: number; winner: string };
    price: { p1: number; p2: number; winner: string };
    rating: { p1: number; p2: number; winner: string };
    reviewCount: { p1: number; p2: number; winner: string };
    proPlayerCount: { p1: number; p2: number; winner: string };
  };
}

const SPEC_ROWS = [
  { key: 'weight', label: 'Weight', icon: '⚖️', format: (v: string) => v },
  { key: 'faceMaterial', label: 'Face', icon: '🔲', format: (v: string) => v },
  { key: 'coreMaterial', label: 'Core', icon: '🧱', format: (v: string) => v },
  { key: 'thickness', label: 'Thickness', icon: '📏', format: (v: string) => v },
  { key: 'gripSize', label: 'Grip', icon: '🤲', format: (v: string) => v },
  { key: 'length', label: 'Length', icon: '📐', format: (v: string) => v },
  { key: 'width', label: 'Width', icon: '↔️', format: (v: string) => v },
  { key: 'releasedYear', label: 'Released', icon: '📅', format: (v: string) => String(v) },
];

export default function PaddleCompareScreen() {
  const { id1, id2 } = useLocalSearchParams<{ id1: string; id2: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery<ComparisonData>({
    queryKey: ['paddle-compare', id1, id2],
    queryFn: async () => {
      const res = await api.get(`/api/paddles/compare/${id1}/${id2}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Comparing...' }} />
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={120} borderRadius={10} />
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={300} borderRadius={10} />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <EmptyState message="Could not load comparison" />
      </View>
    );
  }

  const { paddle1: p1, paddle2: p2, comparison: comp } = data;

  const getColor = (winner: string, side: 'p1' | 'p2') => {
    if (winner === side) return '#22c55e';
    if (winner === 'tie') return theme.textSecondary;
    return theme.text;
  };

  const getBadge = (winner: string, side: 'p1' | 'p2') => {
    if (winner === side) return '✓';
    if (winner === 'tie') return '=';
    return '';
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Compare Paddles', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Paddle Headers */}
        <View style={styles.headers}>
          <TouchableOpacity
            style={styles.paddleHeader}
            onPress={() => router.push(`/paddle/${p1.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBrand}>{p1.brand}</Text>
            <Text style={styles.headerName}>{p1.name}</Text>
            <Text style={styles.headerPrice}>${p1.price}</Text>
            <View style={[styles.buyBtn, { backgroundColor: theme.accent }]}>
              <TouchableOpacity onPress={() => Linking.openURL(p1.buyUrl)}>
                <Text style={styles.buyBtnText}>Buy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <View style={styles.vs}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <TouchableOpacity
            style={styles.paddleHeader}
            onPress={() => router.push(`/paddle/${p2.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBrand}>{p2.brand}</Text>
            <Text style={styles.headerName}>{p2.name}</Text>
            <Text style={styles.headerPrice}>${p2.price}</Text>
            <View style={[styles.buyBtn, { backgroundColor: theme.accent }]}>
              <TouchableOpacity onPress={() => Linking.openURL(p2.buyUrl)}>
                <Text style={styles.buyBtnText}>Buy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>At a Glance</Text>

          {/* Rating */}
          <View style={styles.comparisonRow}>
            <Text style={[styles.compValue, { color: getColor(comp.rating.winner, 'p1') }]}>
              ★ {p1.rating} {getBadge(comp.rating.winner, 'p1')}
            </Text>
            <Text style={styles.compLabel}>Rating</Text>
            <Text style={[styles.compValue, { color: getColor(comp.rating.winner, 'p2') }]}>
              {getBadge(comp.rating.winner, 'p2')} ★ {p2.rating}
            </Text>
          </View>

          {/* Price */}
          <View style={styles.comparisonRow}>
            <Text style={[styles.compValue, { color: getColor(comp.price.winner, 'p1') }]}>
              ${p1.price} {getBadge(comp.price.winner, 'p1')}
            </Text>
            <Text style={styles.compLabel}>Price</Text>
            <Text style={[styles.compValue, { color: getColor(comp.price.winner, 'p2') }]}>
              {getBadge(comp.price.winner, 'p2')} ${p2.price}
            </Text>
          </View>

          {/* Weight */}
          <View style={styles.comparisonRow}>
            <Text style={[styles.compValue, { color: getColor(comp.weight.winner, 'p1') }]}>
              {p1.weight} {getBadge(comp.weight.winner, 'p1')}
            </Text>
            <Text style={styles.compLabel}>Weight</Text>
            <Text style={[styles.compValue, { color: getColor(comp.weight.winner, 'p2') }]}>
              {getBadge(comp.weight.winner, 'p2')} {p2.weight}
            </Text>
          </View>

          {/* Thickness */}
          <View style={styles.comparisonRow}>
            <Text style={[styles.compValue, { color: getColor(comp.thickness.winner, 'p1') }]}>
              {p1.thickness} {getBadge(comp.thickness.winner, 'p1')}
            </Text>
            <Text style={styles.compLabel}>Thickness</Text>
            <Text style={[styles.compValue, { color: getColor(comp.thickness.winner, 'p2') }]}>
              {getBadge(comp.thickness.winner, 'p2')} {p2.thickness}
            </Text>
          </View>

          {/* Pro Players */}
          <View style={styles.comparisonRow}>
            <Text style={[styles.compValue, { color: getColor(comp.proPlayerCount.winner, 'p1') }]}>
              👤 {comp.proPlayerCount.p1} {getBadge(comp.proPlayerCount.winner, 'p1')}
            </Text>
            <Text style={styles.compLabel}>Pros</Text>
            <Text style={[styles.compValue, { color: getColor(comp.proPlayerCount.winner, 'p2') }]}>
              {getBadge(comp.proPlayerCount.winner, 'p2')} 👤 {comp.proPlayerCount.p2}
            </Text>
          </View>

          {/* Reviews */}
          <View style={styles.comparisonRow}>
            <Text style={[styles.compValue, { color: getColor(comp.reviewCount.winner, 'p1') }]}>
              {p1.reviewCount} {getBadge(comp.reviewCount.winner, 'p1')}
            </Text>
            <Text style={styles.compLabel}>Reviews</Text>
            <Text style={[styles.compValue, { color: getColor(comp.reviewCount.winner, 'p2') }]}>
              {getBadge(comp.reviewCount.winner, 'p2')} {p2.reviewCount}
            </Text>
          </View>
        </View>

        {/* Specs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Specifications</Text>
          {SPEC_ROWS.map((row) => {
            const v1 = (p1 as any)[row.key];
            const v2 = (p2 as any)[row.key];
            return (
              <View key={row.key} style={styles.specRow}>
                <Text style={styles.specIcon}>{row.icon}</Text>
                <Text style={styles.specValue}>{row.format(v1)}</Text>
                <Text style={styles.specLabel}>{row.label}</Text>
                <Text style={styles.specValue}>{row.format(v2)}</Text>
              </View>
            );
          })}
        </View>

        {/* Tags */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tags</Text>
          <View style={styles.tagCompareRow}>
            <View style={styles.tagCol}>
              {p1.tags.map((t: string) => (
                <View key={t} style={[styles.tagPill, p2.tags?.includes(t) && styles.tagPillShared]}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
            <View style={styles.tagCol}>
              {p2.tags.map((t: string) => (
                <View key={t} style={[styles.tagPill, p1.tags?.includes(t) && styles.tagPillShared]}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 40 },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },

  headers: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  paddleHeader: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  headerBrand: {
    fontSize: 11,
    color: theme.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  headerPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  buyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  vs: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.accent,
  },

  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 14,
  },

  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  compValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  compLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    width: 70,
  },

  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  specIcon: {
    fontSize: 16,
    width: 28,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
  },
  specLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    width: 70,
    textAlign: 'center',
  },

  tagCompareRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tagCol: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: theme.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tagPillShared: {
    borderColor: theme.accent,
    backgroundColor: theme.accent + '15',
  },
  tagText: {
    fontSize: 11,
    color: theme.textSecondary,
  },
});
