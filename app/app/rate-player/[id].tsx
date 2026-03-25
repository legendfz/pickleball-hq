import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { theme } from '../lib/theme';
import { getPlayerAvatarUrl } from '../lib/avatars';
import { PlayerAvatar } from '../lib/player-avatar';

interface SocialTag {
  id: string;
  emoji: string;
  name: string;
  nameZh: string;
  category: string;
}

interface SocialTagsData {
  tags: SocialTag[];
}

const CATEGORY_ORDER = ['style', 'social', 'reliable', 'attitude'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  style: 'Style',
  social: 'Social',
  reliable: 'Reliability',
  attitude: 'Attitude',
};
const CATEGORY_COLORS: Record<string, string> = {
  style: theme.accent,
  social: '#a855f7',
  reliable: theme.gold,
  attitude: theme.linkBlue,
};

const MAX_SELECTIONS = 3;

export default function RatePlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: player } = useQuery({
    queryKey: ['player', id],
    queryFn: async () => {
      const res = await api.get(`/api/players/${id}`);
      return res.data;
    },
  });

  const { data: tagsData } = useQuery<SocialTagsData>({
    queryKey: ['social-tags-all'],
    queryFn: async () => {
      const res = await api.get('/api/players/social-tags/all');
      return res.data;
    },
  });

  const toggleTag = (tagId: string) => {
    if (submitted) return;
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else if (next.size < MAX_SELECTIONS) {
        next.add(tagId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedTags.size === 0) return;
    setSubmitting(true);
    try {
      await api.post(`/api/players/${id}/social-tags`, {
        tagIds: Array.from(selectedTags),
      });
      setSubmitted(true);
      Alert.alert('Thanks! 🏓', 'Your tags have been submitted.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit tags. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const tagsByCategory: Record<string, SocialTag[]> = {};
  if (tagsData?.tags) {
    for (const tag of tagsData.tags) {
      if (!tagsByCategory[tag.category]) tagsByCategory[tag.category] = [];
      tagsByCategory[tag.category].push(tag);
    }
  }

  const avatarUrl = player
    ? getPlayerAvatarUrl(player.name, player.photoUrl, 120)
    : null;

  return (
    <>
      <Stack.Screen options={{ title: 'Rate Player' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Player Header */}
        {player && (
          <View style={styles.playerHeader}>
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <PlayerAvatar name={player.name} size={80} />
              )}
            </View>
            <Text style={styles.playerName}>{player.name}</Text>
            {player.duprRating && (
              <Text style={styles.duprBadge}>DUPR {player.duprRating.toFixed(3)}</Text>
            )}
          </View>
        )}

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>How was this player?</Text>
          <Text style={styles.subtitle}>
            Select up to {MAX_SELECTIONS} tags ({selectedTags.size}/{MAX_SELECTIONS})
          </Text>
        </View>

        {/* Tags by Category */}
        {CATEGORY_ORDER.map((category) => {
          const tags = tagsByCategory[category];
          if (!tags || tags.length === 0) return null;
          const catColor = CATEGORY_COLORS[category] || theme.accent;
          return (
            <View key={category} style={styles.categorySection}>
              <Text style={[styles.categoryLabel, { color: catColor }]}>
                {CATEGORY_LABELS[category]}
              </Text>
              <View style={styles.tagsRow}>
                {tags.map((tag) => {
                  const isSelected = selectedTags.has(tag.id);
                  const isDisabled = !isSelected && selectedTags.size >= MAX_SELECTIONS;
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagPill,
                        isSelected && [styles.tagPillSelected, { borderColor: catColor, backgroundColor: catColor + '20' }],
                        isDisabled && styles.tagPillDisabled,
                      ]}
                      onPress={() => toggleTag(tag.id)}
                      activeOpacity={0.7}
                      disabled={submitted}
                    >
                      <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                      <View style={styles.tagTextWrap}>
                        <Text
                          style={[
                            styles.tagName,
                            isSelected && { color: catColor },
                            isDisabled && styles.tagNameDisabled,
                          ]}
                        >
                          {tag.nameZh}
                        </Text>
                        <Text
                          style={[
                            styles.tagNameEn,
                            isSelected && { color: catColor + 'aa' },
                            isDisabled && styles.tagNameDisabled,
                          ]}
                        >
                          {tag.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            selectedTags.size > 0 ? styles.submitBtnActive : styles.submitBtnInactive,
          ]}
          onPress={handleSubmit}
          disabled={selectedTags.size === 0 || submitting || submitted}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.submitText,
              selectedTags.size > 0 && styles.submitTextActive,
            ]}
          >
            {submitted
              ? '✓ Submitted!'
              : submitting
              ? 'Submitting...'
              : selectedTags.size > 0
              ? `Submit ${selectedTags.size} Tag${selectedTags.size > 1 ? 's' : ''}`
              : 'Select at least 1 tag'}
          </Text>
        </TouchableOpacity>

        {/* Skip */}
        {!submitted && (
          <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 60 },

  // Player Header
  playerHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: theme.card,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: theme.accent,
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  playerName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  duprBadge: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '600',
  },

  // Title
  titleSection: {
    paddingHorizontal: theme.spacing.padding,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },

  // Categories
  categorySection: {
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Tag Pills
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: theme.border,
    gap: 8,
  },
  tagPillSelected: {
    borderWidth: 2,
  },
  tagPillDisabled: {
    opacity: 0.35,
  },
  tagEmoji: {
    fontSize: 20,
  },
  tagTextWrap: {
    flexShrink: 1,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  tagNameEn: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 1,
  },
  tagNameDisabled: {
    color: theme.textTertiary,
  },

  // Submit
  submitBtn: {
    marginHorizontal: theme.spacing.padding,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnActive: {
    backgroundColor: theme.accent,
  },
  submitBtnInactive: {
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  submitTextActive: {
    color: theme.text,
  },

  // Skip
  skipBtn: {
    paddingHorizontal: theme.spacing.padding,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});
