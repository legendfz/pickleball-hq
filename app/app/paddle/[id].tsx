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
import api from '../lib/api';
import { PlayerAvatar } from '../lib/player-avatar';
import { SkeletonBlock } from '../lib/skeleton';
import { EmptyState } from '../lib/empty-state';
import { theme } from '../lib/theme';
import ShareButton from '../components/ShareButton';
import { generatePaddleShareText } from '../lib/share';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PaddleDetail {
  id: number;
  name: string;
  brand: string;
  brandId: number;
  weight: string;
  faceMaterial: string;
  coreMaterial: string;
  thickness: string;
  gripSize: string;
  length: string;
  width: string;
  price: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  buyUrl: string;
  releasedYear: number;
  category: string;
  bestFor: string;
  usedBy: { id: number; name: string; country: string; ranking: number; photoUrl: string | null }[];
  brandInfo: { id: number; name: string; website: string } | null;
}

const SPEC_ROWS: { key: string; label: string; icon: string }[] = [
  { key: 'weight', label: 'Weight', icon: '⚖️' },
  { key: 'faceMaterial', label: 'Face Material', icon: '🔲' },
  { key: 'coreMaterial', label: 'Core Material', icon: '🧱' },
  { key: 'thickness', label: 'Thickness', icon: '📏' },
  { key: 'gripSize', label: 'Grip Size', icon: '🤲' },
  { key: 'length', label: 'Length', icon: '📐' },
  { key: 'width', label: 'Width', icon: '↔️' },
];

export default function PaddleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: paddle, isLoading } = useQuery<PaddleDetail>({
    queryKey: ['paddle', id],
    queryFn: async () => {
      const res = await api.get(`/api/paddles/${id}`);
      return res.data;
    },
  });

  const { data: allPaddles } = useQuery<{ paddles: { id: number; name: string; brand: string }[] }>({
    queryKey: ['paddles'],
    queryFn: async () => {
      const res = await api.get('/api/paddles');
      return res.data;
    },
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#22c55e';
    if (rating >= 4.0) return theme.accent;
    if (rating >= 3.5) return '#eab308';
    return '#888';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={200} borderRadius={10} />
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={150} borderRadius={10} />
        </View>
      </View>
    );
  }

  if (!paddle) {
    return (
      <View style={styles.center}>
        <EmptyState message="Paddle not found" />
      </View>
    );
  }

  const comparablePaddles = (allPaddles?.paddles || []).filter((p) => p.id !== paddle.id).slice(0, 6);

  return (
    <>
      <Stack.Screen options={{ title: paddle.name, headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>{paddle.brand}</Text>
          <Text style={styles.paddleName}>{paddle.name}</Text>

          {/* Rating */}
          <View style={styles.ratingBig}>
            <Text style={[styles.ratingNumBig, { color: getRatingColor(paddle.rating) }]}>
              ★ {paddle.rating}
            </Text>
            <Text style={styles.ratingLabel}>{paddle.reviewCount} reviews</Text>
          </View>

          {/* Price + Buy */}
          <View style={styles.priceRow}>
            <Text style={styles.priceBig}>${paddle.price}</Text>
            <TouchableOpacity
              style={styles.buyBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(paddle.buyUrl)}
            >
              <Text style={styles.buyBtnText}>🛒 Buy Now</Text>
            </TouchableOpacity>
          </View>

          {/* Best For */}
          <View style={styles.bestFor}>
            <Text style={styles.bestForLabel}>Best For</Text>
            <Text style={styles.bestForText}>{paddle.bestFor}</Text>
          </View>

          {/* Tags */}
          <View style={styles.tagRow}>
            {paddle.tags.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Share */}
          <View style={styles.shareRow}>
            <ShareButton
              shareText={generatePaddleShareText({ paddleName: paddle.name, brand: paddle.brand })}
              label="Share Paddle"
              icon="🏓"
            />
          </View>
        </View>

        {/* Specs Table */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Specifications</Text>
          {SPEC_ROWS.map((row) => {
            const value = (paddle as any)[row.key] as string;
            if (!value) return null;
            return (
              <View key={row.key} style={styles.specRow}>
                <View style={styles.specLabel}>
                  <Text style={styles.specIcon}>{row.icon}</Text>
                  <Text style={styles.specLabelText}>{row.label}</Text>
                </View>
                <Text style={styles.specValue}>{value}</Text>
              </View>
            );
          })}
          <View style={styles.specRow}>
            <View style={styles.specLabel}>
              <Text style={styles.specIcon}>📅</Text>
              <Text style={styles.specLabelText}>Released</Text>
            </View>
            <Text style={styles.specValue}>{paddle.releasedYear}</Text>
          </View>
        </View>

        {/* Used By */}
        {paddle.usedBy.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Used by {paddle.usedBy.length} Pro Players</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {paddle.usedBy.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerChip}
                  onPress={() => router.push(`/player/${player.id}`)}
                  activeOpacity={0.7}
                >
                  <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size={48} />
                  <Text style={styles.playerChipName} numberOfLines={1}>{player.name.split(' ').pop()}</Text>
                  <Text style={styles.playerChipRank}>#{player.ranking}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Compare */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Compare With</Text>
          <View style={styles.compareGrid}>
            {comparablePaddles.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.compareBtn}
                onPress={() => router.push(`/paddle/compare/${paddle.id}-${p.id}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.compareBtnName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.compareBtnBrand}>{p.brand}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Brand */}
        {paddle.brandInfo && (
          <TouchableOpacity
            style={styles.brandCard}
            onPress={() => router.push(`/brand/${encodeURIComponent(paddle.brand)}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.brandCardLabel}>Brand</Text>
            <Text style={styles.brandCardName}>{paddle.brandInfo.name}</Text>
            <Text style={styles.brandCardLink}>View all paddles →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 40 },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: theme.card,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  brandName: {
    fontSize: 13,
    color: theme.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  paddleName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  ratingBig: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  ratingNumBig: {
    fontSize: 28,
    fontWeight: '700',
  },
  ratingLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  priceBig: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text,
  },
  buyBtn: {
    backgroundColor: theme.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  bestFor: {
    backgroundColor: theme.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  bestForLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bestForText: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: theme.accent + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: '500',
  },

  // Share
  shareRow: {
    marginTop: 14,
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

  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  specLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specIcon: {
    fontSize: 16,
  },
  specLabelText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },

  playerChip: {
    alignItems: 'center',
    width: 72,
  },
  playerChipName: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.text,
    marginTop: 6,
  },
  playerChipRank: {
    fontSize: 11,
    color: theme.textSecondary,
  },

  compareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compareBtn: {
    backgroundColor: theme.bg,
    borderRadius: 10,
    padding: 10,
    width: (SCREEN_WIDTH - 72) / 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  compareBtnName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  compareBtnBrand: {
    fontSize: 11,
    color: theme.textSecondary,
  },

  brandCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: theme.border,
  },
  brandCardLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandCardName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginTop: 4,
  },
  brandCardLink: {
    fontSize: 13,
    color: theme.accent,
    fontWeight: '500',
    marginTop: 4,
  },
});
