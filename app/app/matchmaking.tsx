import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter, Stack } from 'expo-router';
import api from '../../lib/api';
import { theme } from '../../lib/theme';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';

interface MatchPlayer {
  id: number;
  name: string;
  city: string;
  lat: number;
  lng: number;
  dupr: number;
  type: 'player' | 'partner';
  preferredPlay: string;
  availability: string;
  level: string;
  distance: number;
  duprDiff: number;
  matchScore: number;
  isPerfect: boolean;
}

type MatchType = 'all' | 'player' | 'partner';

export default function MatchmakingScreen() {
  const router = useRouter();
  const [dupr, setDupr] = useState(4.0);
  const [matchType, setMatchType] = useState<MatchType>('all');
  const [hasSearched, setHasSearched] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery<{ data: MatchPlayer[] }>({
    queryKey: ['matchmaking', dupr, matchType],
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: '33.6846',
        lng: '-117.8265',
        dupr: dupr.toString(),
        type: matchType,
      });
      const res = await api.get(`/api/matchmaking/nearby?${params}`);
      return res.data;
    },
    enabled: hasSearched,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const players = data?.data ?? [];

  const duprLevels = [
    { min: 2.0, max: 3.0, label: 'Beginner', color: '#888' },
    { min: 3.0, max: 4.0, label: 'Intermediate', color: theme.blue },
    { min: 4.0, max: 5.0, label: 'Advanced', color: '#22c55e' },
    { min: 5.0, max: 6.0, label: 'Expert', color: theme.gold },
    { min: 6.0, max: 7.0, label: 'Pro', color: theme.accent },
    { min: 7.0, max: 8.0, label: 'Elite', color: '#a855f7' },
  ];

  const currentLevel = duprLevels.find((l) => dupr >= l.min && dupr < l.max) || duprLevels[0];

  const handleSearch = () => {
    setHasSearched(true);
    refetch();
  };

  const adjustDupr = (delta: number) => {
    setDupr((prev) => Math.min(8.0, Math.max(2.0, Math.round((prev + delta) * 10) / 10)));
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Find Game' }} />
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Find Game</Text>
        <Text style={styles.pageSubtitle}>Set your DUPR rating to find players at your level</Text>

        {/* DUPR Slider */}
        <View style={styles.duprSection}>
          <Text style={styles.duprLabel}>Your DUPR Rating</Text>
          <View style={styles.duprRow}>
            <TouchableOpacity style={styles.duprBtn} onPress={() => adjustDupr(-0.1)}>
              <Text style={styles.duprBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.duprDisplay}>
              <Text style={[styles.duprNumber, { color: currentLevel.color }]}>{dupr.toFixed(1)}</Text>
              <Text style={[styles.duprLevel, { color: currentLevel.color }]}>{currentLevel.label}</Text>
            </View>
            <TouchableOpacity style={styles.duprBtn} onPress={() => adjustDupr(0.1)}>
              <Text style={styles.duprBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {/* Quick select chips */}
          <View style={styles.duprChips}>
            {duprLevels.map((level) => (
              <TouchableOpacity
                key={level.label}
                style={[
                  styles.duprChip,
                  dupr >= level.min && dupr < level.max && { borderColor: level.color, backgroundColor: level.color + '20' },
                ]}
                onPress={() => setDupr((level.min + level.max) / 2)}
              >
                <Text style={[
                  styles.duprChipText,
                  dupr >= level.min && dupr < level.max && { color: level.color },
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Match Type */}
        <View style={styles.typeSection}>
          <Text style={styles.sectionTitle}>Looking For</Text>
          <View style={styles.typeRow}>
            {([
              { key: 'all' as MatchType, label: 'All Players', icon: '🏓' },
              { key: 'player' as MatchType, label: 'Opponent', icon: '⚔️' },
              { key: 'partner' as MatchType, label: 'Partner', icon: '🤝' },
            ]).map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeBtn, matchType === t.key && styles.typeBtnActive]}
                onPress={() => setMatchType(t.key)}
              >
                <Text style={styles.typeIcon}>{t.icon}</Text>
                <Text style={[styles.typeText, matchType === t.key && styles.typeTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>🔍 Search Players</Text>
        </TouchableOpacity>

        {/* Results */}
        {isFetching && !hasSearched ? null : isLoading ? (
          <SkeletonList count={5} cardHeight={80} />
        ) : !hasSearched ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🏓</Text>
            <Text style={styles.emptyText}>Set your rating and search to find players near you</Text>
          </View>
        ) : players.length === 0 ? (
          <EmptyState
            message="No players found"
            subtitle="Try adjusting your DUPR range or search type"
          />
        ) : (
          <FlatList
            data={players}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.accent}
                colors={[theme.accent]}
              />
            }
            renderItem={({ item }) => {
              const level = duprLevels.find((l) => item.dupr >= l.min && item.dupr < l.max) || duprLevels[0];
              const matchStars = Math.round(item.matchScore);
              const starsText = '⭐'.repeat(Math.min(matchStars, 10));
              return (
                <View style={[styles.playerCard, item.isPerfect && styles.playerCardPerfect]}>
                  {item.isPerfect && (
                    <View style={styles.perfectBadge}>
                      <Text style={styles.perfectBadgeText}>⭐ Perfect Match</Text>
                    </View>
                  )}
                  <View style={styles.playerHeader}>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{item.name}</Text>
                      <Text style={styles.playerMeta}>📍 {item.city} • {item.distance} mi away</Text>
                    </View>
                    <View style={styles.duprBadge}>
                      <Text style={[styles.duprBadgeText, { color: level.color }]}>{item.dupr.toFixed(1)}</Text>
                    </View>
                  </View>

                  {/* Match Score */}
                  <View style={styles.matchScoreRow}>
                    <Text style={styles.matchScoreLabel}>Match Score</Text>
                    <Text style={styles.matchScoreStars}>{starsText}</Text>
                    <Text style={styles.matchScoreNum}>{item.matchScore.toFixed(1)}/10</Text>
                  </View>

                  <View style={styles.playerTags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {item.type === 'player' ? '⚔️ Opponent' : '🤝 Partner'}
                      </Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {item.preferredPlay === 'doubles' ? '👥 Doubles' : '👤 Singles'}
                      </Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>📅 {item.availability}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      item.type === 'partner' ? styles.partnerBtn : styles.challengeBtn,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnText}>
                      {item.type === 'partner' ? '🤝 Partner Up' : '⚔️ Challenge'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  pageTitle: {
    fontSize: theme.fontSize.pageTitle,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    paddingHorizontal: theme.spacing.padding,
    paddingTop: 12,
  },
  pageSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 16,
  },

  // DUPR Section
  duprSection: {
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 16,
  },
  duprLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  duprRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  duprBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  duprBtnText: {
    fontSize: 24,
    color: theme.text,
    fontWeight: '300',
  },
  duprDisplay: {
    alignItems: 'center',
  },
  duprNumber: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  duprLevel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  duprChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    justifyContent: 'center',
  },
  duprChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  duprChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.textSecondary,
  },

  // Type Section
  typeSection: {
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  typeBtnActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
  },
  typeIcon: { fontSize: 20 },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  typeTextActive: {
    color: theme.accent,
    fontWeight: '600',
  },

  // Search Button
  searchBtn: {
    backgroundColor: theme.accent,
    marginHorizontal: theme.spacing.padding,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBtnText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Player List
  list: {
    paddingHorizontal: theme.spacing.padding,
    paddingBottom: 40,
  },
  playerCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
  },
  playerCardPerfect: {
    borderWidth: 1.5,
    borderColor: theme.gold + '80',
  },
  perfectBadge: {
    backgroundColor: theme.gold + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  perfectBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.gold,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerInfo: { flex: 1 },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  playerMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  duprBadge: {
    backgroundColor: theme.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  duprBadgeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  playerTags: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: theme.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: theme.textSecondary,
  },

  // Match Score
  matchScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  matchScoreLabel: {
    fontSize: 11,
    color: theme.textTertiary,
    fontWeight: '500',
  },
  matchScoreStars: {
    fontSize: 11,
  },
  matchScoreNum: {
    fontSize: 11,
    color: theme.accent,
    fontWeight: '700',
  },
  actionBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  challengeBtn: {
    backgroundColor: 'rgba(229, 57, 53, 0.15)',
  },
  partnerBtn: {
    backgroundColor: 'rgba(8, 145, 178, 0.15)',
  },
  actionBtnText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
