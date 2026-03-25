import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { theme } from '../lib/theme';
import { shareToSocial, SHARE_XP_REWARD } from '../lib/share';

interface ShareButtonProps {
  /** Pre-generated share text */
  shareText: string;
  /** Label shown on the pill button */
  label: string;
  /** Icon shown on the pill button */
  icon?: string;
  /** Callback after successful share (for XP, stats, etc.) */
  onShared?: () => void;
}

export default function ShareButton({ shareText, label, icon = '📤', onShared }: ShareButtonProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editableText, setEditableText] = useState(shareText);

  const handleOpenPreview = () => {
    setEditableText(shareText);
    setPreviewVisible(true);
  };

  const handleShare = async () => {
    setPreviewVisible(false);
    const result = await shareToSocial(editableText);
    if (result === 'shared') {
      onShared?.();
      Alert.alert(
        'Shared! 🎉',
        `+${SHARE_XP_REWARD} XP earned for sharing!`,
        [{ text: 'Nice!' }]
      );
    }
  };

  return (
    <>
      {/* Share Pill Button */}
      <TouchableOpacity style={styles.pill} onPress={handleOpenPreview} activeOpacity={0.7}>
        <Text style={styles.pillIcon}>{icon}</Text>
        <Text style={styles.pillText}>{label}</Text>
      </TouchableOpacity>

      {/* Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setPreviewVisible(false)}
        >
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>📤 Share to Social Media</Text>
            <Text style={styles.modalSubtitle}>
              Preview & edit your post before sharing (+{SHARE_XP_REWARD} XP)
            </Text>

            <TextInput
              style={styles.textInput}
              value={editableText}
              onChangeText={setEditableText}
              multiline
              textAlignVertical="top"
              maxLength={2200}
            />

            <Text style={styles.charCount}>
              {editableText.length}/2200
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPreviewVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Text style={styles.shareBtnText}>📤 Share Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Pill button
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.accent + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.accent + '40',
  },
  pillIcon: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.accent,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: theme.bg,
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: theme.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.border,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 11,
    color: theme.textTertiary,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: theme.bg,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
