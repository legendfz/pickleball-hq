import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { useLanguage } from '../../lib/i18n';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { theme } from '../../lib/theme';
import type { Player } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

type TabKey = 'paddles' | 'players';

interface Paddle {
  id: number;
  name: string;
  brand: string;
  price: number;
  rating: number;
  faceMaterial: string;
  thickness: string;
  weight: string;
  category: string;
}

export default function BrandDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const brandName = decodeURIComponent(name || '');
  const router = useRouter();
  const { getPlayerName } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('paddles');

  const { data, isLoading } = useQuery<{ data: Player[] }>({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/api/players');
      return res.data;
    },
  });

  const { data: paddlesData } = useQuery<{ paddles: Paddle[] }>({
    queryKey: ['paddles'],
    queryFn: async () => {
      const res = await api.get('/api/paddles');
      return res.data;
    },
  });

  const players = data?.data ?? (Array.isArray(data) ? data : []);

  // Filter players that use this brand
  const brandPlayers = useMemo(() => {
    return players.filter((p) => {
      const eq = (p as any).equipment;
      const gear = (p as any).gear;
      if (gear?.brand === brandName) return true;
      if (!eq) return false;
      const check = (items: any[]) => items?.some((i: any) => i.brand === brandName || i === brandName);
      if (check(eq.apparel || [])) return true;
      if (check(eq.shoes || [])) return true;
      if (eq.racket?.brand === brandName) return true;
      if (eq.watch === brandName) return true;
      if (eq.otherSponsors?.includes(brandName)) return true;
      return false;
    });
  }, [players, brandName]);

  // Filter paddles for this brand
  const brandPaddles = useMemo(() => {
    return (paddlesData?.paddles || []).filter(
      (p) => p.brand.toLowerCase() === brandName.toLowerCase()
    );
  }, [paddlesData, brandName]);

  // Stats
  const totalPlayers = brandPlayers.length;
  const totalPaddles = brandPaddles.length;
  const avgRanking = totalPlayers > 0
    ? Math.round(brandPlayers.reduce((sum, p) => sum + p.ranking, 0) / totalPlayers)
    : 0;
  const totalTitles = brandPlayers.reduce((sum, p) => sum + (p.titles || 0), 0);
  const totalGrandSlams = brandPlayers.reduce((sum, p) => sum + (p.grandSlams || 0), 0);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: brandName }} />
        <SkeletonList count={5} cardHeight={52} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: brandName }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>{brandName.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.brandTitle}>{brandName}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalPaddles}</Text>
            <Text style={styles.statLabel}>Paddles</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalPlayers}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>#{avgRanking || '--'}</Text>
            <Text style={styles.statLabel}>Avg Rank</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: theme.gold }]}>{totalGrandSlams}</Text>
            <Text style={styles.statLabel}>Slams</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'paddles' && styles.tabActive]}
            onPress={() => setActiveTab('paddles')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'paddles' && styles.tabTextActive]}>
              Paddles ({totalPaddles})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'players' && styles.tabActive]}
            onPress={() => setActiveTab('players')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'players' && styles.tabTextActive]}>
              Players ({totalPlayers})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Paddle List */}
        {activeTab === 'paddles' && (
          <>
            {brandPaddles.length === 0 ? (
              <EmptyState message="No paddles found for this brand" />
            ) : (
              brandPaddles.map((paddle) => (
                <TouchableOpacity
                  key={paddle.id}
                  style={styles.paddleRow}
                  onPress={() => router.push(`/paddle/${paddle.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paddleInfo}>
                    <Text style={styles.paddleName}>{paddle.name}</Text>
                    <Text style={styles.paddleMeta}>
                      {paddle.weight} · {paddle.faceMaterial} · {paddle.thickness}
                    </Text>
                  </View>
                  <View style={styles.paddleRight}>
                    <Text style={styles.paddleRating}>★ {paddle.rating}</Text>
                    <Text style={styles.paddlePrice}>${paddle.price}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* Player List */}
        {activeTab === 'players' && (
          <>
            {brandPlayers.length === 0 ? (
              <EmptyState message="No players found for this brand" />
            ) : (
              brandPlayers.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerRow}
                  onPress={() => router.push(`/player/${player.id}`)}
                  activeOpacity={0.7}
                >
                  <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size={40} />
                  <View style={styles.nameWrap}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.playerName}>{getPlayerName(player)}</Text>
                      <Flag country={player.country} countryFlag={player.countryFlag} size={14} />
                    </View>
                    <Text style={styles.playerRank}>#{player.ranking}</Text>
                  </View>
                  <View style={styles.titlesWrap}>
                    <Text style={styles.titlesNum}>{player.titles}</Text>
                    <Text style={styles.titlesLabel}>titles</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 40 },

  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },

  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  statLabel: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.card,
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  nameWrap: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
  },
  playerRank: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  titlesWrap: {
    alignItems: 'center',
  },
  titlesNum: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  titlesLabel: {
    fontSize: 10,
    color: theme.textSecondary,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: theme.card,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  tabTextActive: {
    color: theme.accent,
    fontWeight: '600',
  },

  // Paddle rows
  paddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.card,
  },
  paddleInfo: {
    flex: 1,
    marginRight: 12,
  },
  paddleName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
  },
  paddleMeta: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  paddleRight: {
    alignItems: 'flex-end',
  },
  paddleRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
    marginBottom: 2,
  },
  paddlePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
});
