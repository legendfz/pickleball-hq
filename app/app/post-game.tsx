import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter, Stack } from 'expo-router';
import api from '../lib/api';
import { theme } from '../lib/theme';

interface Court {
  id: number;
  name: string;
  city: string;
  type: string;
}

type Format = 'singles' | 'doubles' | 'mixed';

const formats: { key: Format; label: string; icon: string }[] = [
  { key: 'singles', label: 'Singles', icon: '👤' },
  { key: 'doubles', label: 'Doubles', icon: '👥' },
  { key: 'mixed', label: 'Mixed', icon: '👫' },
];

export default function PostGameScreen() {
  const router = useRouter();
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [showCourtPicker, setShowCourtPicker] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [format, setFormat] = useState<Format>('doubles');
  const [needed, setNeeded] = useState(2);
  const [duprMin, setDuprMin] = useState(3.0);
  const [duprMax, setDuprMax] = useState(5.0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: courtsData } = useQuery<{ data: Court[] }>({
    queryKey: ['courts-all'],
    queryFn: async () => {
      const res = await api.get('/api/courts');
      return res.data;
    },
  });

  const courts = courtsData?.data ?? [];
  const selectedCourtObj = courts.find((c) => c.id === selectedCourt);

  const adjustDupr = (field: 'min' | 'max', delta: number) => {
    if (field === 'min') {
      setDuprMin((prev) => Math.min(duprMax - 0.1, Math.max(2.0, Math.round((prev + delta) * 10) / 10)));
    } else {
      setDuprMax((prev) => Math.min(8.0, Math.max(duprMin + 0.1, Math.round((prev + delta) * 10) / 10)));
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourt) {
      Alert.alert('Missing Field', 'Please select a court');
      return;
    }
    if (!date || !time) {
      Alert.alert('Missing Field', 'Please enter date and time');
      return;
    }

    setSubmitting(true);
    try {
      // In a real app, this would POST to the server
      // For now just show success and go back
      Alert.alert('Game Posted! 🏓', 'Your game has been posted. Players can now join!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to post game. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Post a Game' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Post a Game</Text>
        <Text style={styles.pageSubtitle}>Create a game and invite players to join</Text>

        {/* Court Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Court</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowCourtPicker(!showCourtPicker)}
            activeOpacity={0.7}
          >
            <Text style={selectedCourtObj ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
              {selectedCourtObj ? selectedCourtObj.name : 'Select a court...'}
            </Text>
            <Text style={styles.pickerArrow}>{showCourtPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showCourtPicker && (
            <View style={styles.courtList}>
              {courts.map((court) => (
                <TouchableOpacity
                  key={court.id}
                  style={[styles.courtItem, selectedCourt === court.id && styles.courtItemSelected]}
                  onPress={() => {
                    setSelectedCourt(court.id);
                    setShowCourtPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.courtItemText, selectedCourt === court.id && styles.courtItemTextSelected]}>
                    {court.name}
                  </Text>
                  <Text style={styles.courtItemMeta}>
                    {court.city} • {court.type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2026-03-30"
            placeholderTextColor={theme.textTertiary}
            keyboardType="default"
          />
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="18:00"
            placeholderTextColor={theme.textTertiary}
            keyboardType="default"
          />
        </View>

        {/* Format */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Format</Text>
          <View style={styles.formatRow}>
            {formats.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.formatBtn, format === f.key && styles.formatBtnActive]}
                onPress={() => setFormat(f.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.formatIcon}>{f.icon}</Text>
                <Text style={[styles.formatText, format === f.key && styles.formatTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Players Needed */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Players Needed</Text>
          <View style={styles.neededRow}>
            {[1, 2, 3].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.neededBtn, needed === n && styles.neededBtnActive]}
                onPress={() => setNeeded(n)}
                activeOpacity={0.7}
              >
                <Text style={[styles.neededText, needed === n && styles.neededTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* DUPR Range */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DUPR Range</Text>
          <View style={styles.duprRow}>
            <View style={styles.duprField}>
              <Text style={styles.duprFieldLabel}>Min</Text>
              <View style={styles.duprControls}>
                <TouchableOpacity style={styles.duprBtn} onPress={() => adjustDupr('min', -0.1)}>
                  <Text style={styles.duprBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.duprValue}>{duprMin.toFixed(1)}</Text>
                <TouchableOpacity style={styles.duprBtn} onPress={() => adjustDupr('min', 0.1)}>
                  <Text style={styles.duprBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.duprDash}>—</Text>
            <View style={styles.duprField}>
              <Text style={styles.duprFieldLabel}>Max</Text>
              <View style={styles.duprControls}>
                <TouchableOpacity style={styles.duprBtn} onPress={() => adjustDupr('max', -0.1)}>
                  <Text style={styles.duprBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.duprValue}>{duprMax.toFixed(1)}</Text>
                <TouchableOpacity style={styles.duprBtn} onPress={() => adjustDupr('max', 0.1)}>
                  <Text style={styles.duprBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Bring own balls, parking info..."
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'Posting...' : '🏓 Post Game'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    paddingBottom: 60,
    paddingTop: 8,
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
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Court picker
  pickerBtn: {
    backgroundColor: theme.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  pickerTextSelected: {
    fontSize: 15,
    color: theme.text,
  },
  pickerTextPlaceholder: {
    fontSize: 15,
    color: theme.textTertiary,
  },
  pickerArrow: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  courtList: {
    backgroundColor: theme.card,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: theme.border,
    maxHeight: 240,
  },
  courtItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  courtItemSelected: {
    backgroundColor: theme.accent + '20',
  },
  courtItemText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  courtItemTextSelected: {
    color: theme.accent,
    fontWeight: '600',
  },
  courtItemMeta: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // Format
  formatRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatBtn: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  formatBtnActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
  },
  formatIcon: { fontSize: 20 },
  formatText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  formatTextActive: {
    color: theme.accent,
    fontWeight: '600',
  },

  // Needed
  neededRow: {
    flexDirection: 'row',
    gap: 10,
  },
  neededBtn: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  neededBtnActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
  },
  neededText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  neededTextActive: {
    color: theme.accent,
  },

  // DUPR
  duprRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  duprField: {
    alignItems: 'center',
    flex: 1,
  },
  duprFieldLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 6,
  },
  duprControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  duprBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  duprBtnText: {
    fontSize: 18,
    color: theme.text,
    fontWeight: '300',
  },
  duprValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.accent,
    minWidth: 40,
    textAlign: 'center',
  },
  duprDash: {
    fontSize: 20,
    color: theme.textSecondary,
    marginBottom: 20,
  },

  // Submit
  submitBtn: {
    backgroundColor: theme.accent,
    marginHorizontal: theme.spacing.padding,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '700',
  },
});
