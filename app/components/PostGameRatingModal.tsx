import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../lib/theme';
import { generateMatchShareText, shareToSocial } from '../lib/share';

interface PostGameRatingModalProps {
  visible: boolean;
  onClose: () => void;
  opponentName: string;
  opponentId?: number;
  courtName: string;
  score: string;
  format: 'singles' | 'doubles' | 'mixed';
}

const PRESET_TAGS = [
  { emoji: '💪', label: 'Great player' },
  { emoji: '🤝', label: 'Fair play' },
  { emoji: '🔥', label: 'Intense match' },
  { emoji: '😊', label: 'Fun to play with' },
  { emoji: '⚡', label: 'Fast hands' },
  { emoji: '🎯', label: 'Precise shots' },
];

export default function PostGameRatingModal({
  visible,
  onClose,
  opponentName,
  opponentId,
  courtName,
  score,
  format,
}: PostGameRatingModalProps) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (index: number) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else if (next.size < 3) {
        next.add(index);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // Simulate API call
    setTimeout(() => {
      onClose();
      // Auto-navigate to share
      const shareText = generateMatchShareText({
        courtName,
        score,
        format,
      });
      shareToSocial(shareText);
    }, 300);
  };

  const handleSkip = () => {
    onClose();
  };

  const handleRateFull = () => {
    onClose();
    if (opponentId) {
      router.push(`/rate-player/${opponentId}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Great game!</Text>
          <Text style={styles.subtitle}>Rate your opponent: {opponentName}</Text>

          {/* Quick Tags */}
          <View style={styles.tagsGrid}>
            {PRESET_TAGS.map((tag, index) => {
              const isSelected = selectedTags.has(index);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                  onPress={() => toggleTag(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                  <Text style={[styles.tagLabel, isSelected && styles.tagLabelSelected]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={[styles.submitBtn, selectedTags.size === 0 && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={selectedTags.size === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {submitted ? '✓ Rated!' : `Rate & Share (+10 XP)`}
            </Text>
          </TouchableOpacity>

          {opponentId && (
            <TouchableOpacity style={styles.fullRateBtn} onPress={handleRateFull} activeOpacity={0.7}>
              <Text style={styles.fullRateBtnText}>Rate with more tags →</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: theme.border,
    gap: 6,
  },
  tagPillSelected: {
    borderColor: theme.accent,
    backgroundColor: theme.accent + '15',
  },
  tagEmoji: {
    fontSize: 16,
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  tagLabelSelected: {
    color: theme.accent,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  fullRateBtn: {
    paddingVertical: 8,
  },
  fullRateBtnText: {
    fontSize: 13,
    color: theme.accent,
    fontWeight: '500',
  },
  skipBtn: {
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
});
