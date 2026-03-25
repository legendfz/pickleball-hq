import React, { useState, useMemo } from 'react';
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
import ShareButton from '../components/ShareButton';
import { generateMatchShareText } from '../lib/share';

interface Court {
  id: number;
  name: string;
  city: string;
  type: string;
  rating: number;
  activeNow?: number;
  predictedCrowd?: string;
  distance?: number;
}

type Format = 'singles' | 'doubles' | 'mixed';

// Mock user profile
const USER_DUPR = 4.0;
const USER_CITY = 'Irvine';
const RECENT_COURT_IDS = [1, 6, 26]; // courts user has visited before

const QUICK_TIME_OPTIONS = [
  { key: 'in1h', label: 'In 1 hour', icon: '⚡', getDatetime: () => { const d = new Date(); d.setHours(d.getHours() + 1); return d.toISOString(); } },
  { key: 'evening', label: 'Today evening', icon: '🌅', getDatetime: () => { const d = new Date(); d.setHours(18, 0, 0, 0); return d.toISOString(); } },
  { key: 'tomorrow', label: 'Tomorrow morning', icon: '☀️', getDatetime: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString(); } },
  { key: 'custom', label: 'Pick date/time', icon: '📅', getDatetime: () => '' },
];

export default function PostGameScreen() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Court selection
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);

  // Step 2: Time selection
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  // Advanced (hidden defaults)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [format, setFormat] = useState<Format>('doubles');
  const [needed, setNeeded] = useState(2);
  const [duprMin, setDuprMin] = useState(USER_DUPR - 0.5);
  const [duprMax, setDuprMax] = useState(USER_DUPR + 0.5);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gamePosted, setGamePosted] = useState(false);

  const { data: courtsData } = useQuery<{ data: Court[] }>({
    queryKey: ['courts-all'],
    queryFn: async () => {
      const res = await api.get('/api/courts');
      return res.data;
    },
  });

  const courts = courtsData?.data ?? [];

  // Recommended courts: recently visited first, then nearby in Irvine
  const recommendedCourts = useMemo(() => {
    const recent = courts.filter((c) => RECENT_COURT_IDS.includes(c.id));
    const nearby = courts
      .filter((c) => c.city === USER_CITY && !RECENT_COURT_IDS.includes(c.id))
      .slice(0, 4);
    return [...recent, ...nearby];
  }, [courts]);

  const selectedCourtObj = courts.find((c) => c.id === selectedCourt);

  const adjustDupr = (field: 'min' | 'max', delta: number) => {
    if (field === 'min') {
      setDuprMin((prev) => Math.min(duprMax - 0.1, Math.max(2.0, Math.round((prev + delta) * 10) / 10)));
    } else {
      setDuprMax((prev) => Math.min(8.0, Math.max(duprMin + 0.1, Math.round((prev + delta) * 10) / 10)));
    }
  };

  const handleSubmit = async () => {
    let datetime = '';
    if (selectedTime === 'custom') {
      if (!customDate || !customTime) {
        Alert.alert('Missing', 'Please pick a date and time');
        return;
      }
      datetime = `${customDate}T${customTime}:00`;
    } else if (selectedTime) {
      const opt = QUICK_TIME_OPTIONS.find((o) => o.key === selectedTime);
      if (opt) datetime = opt.getDatetime();
    }

    if (!datetime) {
      Alert.alert('Missing', 'Please select a time');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/posted-games', {
        courtId: selectedCourtObj?.id,
        courtName: selectedCourtObj?.name,
        city: selectedCourtObj?.city,
        datetime,
        format,
        needed,
        duprRange: [duprMin, duprMax],
        notes,
        hostId: 999,
        hostName: 'You',
        hostDupr: USER_DUPR,
      });
      setGamePosted(true);
      Alert.alert('Game Posted! 🏓', 'Your game is live. Players can now join!', [
        { text: 'OK' },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to post game. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const crowdLabel = (crowd?: string) => {
    if (crowd === 'busy') return { text: 'Busy', color: '#ef4444' };
    if (crowd === 'moderate') return { text: 'Moderate', color: '#f59e0b' };
    return { text: 'Quiet', color: '#22c55e' };
  };

  const formats: { key: Format; label: string; icon: string }[] = [
    { key: 'singles', label: 'Singles', icon: '👤' },
    { key: 'doubles', label: 'Doubles', icon: '👥' },
    { key: 'mixed', label: 'Mixed', icon: '👫' },
  ];

  // ---- STEP 1: Pick a Court ----
  if (step === 1) {
    return (
      <>
        <Stack.Screen options={{ title: 'Post a Game' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepNum}>1</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.stepDot}><Text style={[styles.stepNum, styles.stepNumInactive]}>2</Text></View>
          </View>
          <Text style={styles.stepLabel}>Step 1 of 2 — Pick a Court</Text>

          {/* Recommended Courts */}
          <Text style={styles.sectionTitle}>⭐ Recommended for You</Text>
          <View style={styles.courtList}>
            {recommendedCourts.map((court) => {
              const isRecent = RECENT_COURT_IDS.includes(court.id);
              const crowd = crowdLabel(court.predictedCrowd);
              return (
                <TouchableOpacity
                  key={court.id}
                  style={[styles.courtCard, selectedCourt === court.id && styles.courtCardSelected]}
                  onPress={() => setSelectedCourt(court.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.courtCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.courtCardName, selectedCourt === court.id && styles.courtCardNameSelected]} numberOfLines={1}>
                          {court.name}
                        </Text>
                        {isRecent && <Text style={styles.recentBadge}>Recent</Text>}
                      </View>
                      <Text style={styles.courtCardMeta}>{court.city} • {court.type === 'indoor' ? '🏠' : '☀️'} {court.type}</Text>
                    </View>
                    <View style={[styles.crowdPill, { backgroundColor: crowd.color + '20' }]}>
                      <Text style={[styles.crowdText, { color: crowd.color }]}>{crowd.text}</Text>
                    </View>
                  </View>
                  {(court.activeNow || 0) > 0 && (
                    <Text style={styles.activeText}>🟢 {court.activeNow} playing now</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* All Courts */}
          <Text style={styles.sectionTitle}>All Courts</Text>
          <View style={styles.courtList}>
            {courts.filter((c) => !recommendedCourts.find((r) => r.id === c.id)).slice(0, 10).map((court) => (
              <TouchableOpacity
                key={court.id}
                style={[styles.courtCard, selectedCourt === court.id && styles.courtCardSelected]}
                onPress={() => setSelectedCourt(court.id)}
                activeOpacity={0.7}
              >
                <View style={styles.courtCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courtCardName, selectedCourt === court.id && styles.courtCardNameSelected]} numberOfLines={1}>
                      {court.name}
                    </Text>
                    <Text style={styles.courtCardMeta}>{court.city} • {court.type}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>⭐ {court.rating}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={[styles.nextBtn, !selectedCourt && styles.nextBtnDisabled]}
            onPress={() => selectedCourt && setStep(2)}
            disabled={!selectedCourt}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>Next: Pick a Time →</Text>
          </TouchableOpacity>
        </ScrollView>
      </>
    );
  }

  // ---- STEP 2: Pick a Time ----
  return (
    <>
      <Stack.Screen options={{ title: 'Post a Game' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotDone]}><Text style={styles.stepNum}>✓</Text></View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepNum}>2</Text></View>
        </View>
        <Text style={styles.stepLabel}>Step 2 of 2 — Pick a Time</Text>

        {/* Selected Court Summary */}
        <View style={styles.selectedCourtSummary}>
          <Text style={styles.summaryLabel}>📍 Court</Text>
          <Text style={styles.summaryValue}>{selectedCourtObj?.name}</Text>
        </View>

        {/* Quick Time Options */}
        <Text style={styles.sectionTitle}>🕐 When?</Text>
        <View style={styles.timeGrid}>
          {QUICK_TIME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.timeBtn, selectedTime === opt.key && styles.timeBtnActive]}
              onPress={() => setSelectedTime(opt.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.timeIcon}>{opt.icon}</Text>
              <Text style={[styles.timeLabel, selectedTime === opt.key && styles.timeLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Date/Time Inputs */}
        {selectedTime === 'custom' && (
          <View style={styles.customTimeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={customDate}
                onChangeText={setCustomDate}
                placeholder="2026-03-30"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={customTime}
                onChangeText={setCustomTime}
                placeholder="18:00"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
          </View>
        )}

        {/* Defaults Summary */}
        <View style={styles.defaultsCard}>
          <Text style={styles.defaultsTitle}>Your defaults</Text>
          <Text style={styles.defaultsText}>👥 Doubles • Need 2 players • DUPR {duprMin.toFixed(1)}–{duprMax.toFixed(1)}</Text>
        </View>

        {/* Advanced Options */}
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
          activeOpacity={0.7}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedPanel}>
            {/* Format */}
            <Text style={styles.advLabel}>Format</Text>
            <View style={styles.formatRow}>
              {formats.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.formatBtn, format === f.key && styles.formatBtnActive]}
                  onPress={() => setFormat(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.formatIcon}>{f.icon}</Text>
                  <Text style={[styles.formatText, format === f.key && styles.formatTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Players Needed */}
            <Text style={styles.advLabel}>Players Needed</Text>
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

            {/* DUPR Range */}
            <Text style={styles.advLabel}>DUPR Range</Text>
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

            {/* Notes */}
            <Text style={styles.advLabel}>Notes (optional)</Text>
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
        )}

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

        {/* Share after posting */}
        {gamePosted && (
          <View style={styles.shareSection}>
            <Text style={styles.shareTitle}>📣 Tell your friends!</Text>
            <Text style={styles.shareSubtitle}>Share that you're looking for players</Text>
            <ShareButton
              shareText={generateMatchShareText({
                courtName: selectedCourtObj?.name || 'a court',
                score: 'Looking for players!',
                format,
                dupr: USER_DUPR,
              })}
              label="Share Game"
              icon="📤"
            />
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Back */}
        {!gamePosted && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← Change Court</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 60, paddingTop: 8 },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 4,
    gap: 0,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  stepDotDone: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  stepNumInactive: {
    color: theme.textSecondary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.border,
    marginHorizontal: 8,
  },
  stepLineDone: {
    backgroundColor: '#22c55e',
  },
  stepLabel: {
    textAlign: 'center',
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 20,
  },

  // Sections
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 10,
    marginTop: 8,
  },

  // Court cards
  courtList: {
    paddingHorizontal: theme.spacing.padding,
    gap: 8,
    marginBottom: 16,
  },
  courtCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  courtCardSelected: {
    borderColor: theme.accent,
    backgroundColor: theme.accent + '10',
  },
  courtCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  courtCardNameSelected: {
    color: theme.accent,
  },
  courtCardMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  recentBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.accent,
    backgroundColor: theme.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  crowdPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  crowdText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeText: {
    fontSize: 11,
    color: '#22c55e',
    marginTop: 6,
    fontWeight: '500',
  },
  ratingBadge: {
    backgroundColor: theme.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    color: theme.gold,
    fontWeight: '600',
  },

  // Next button
  nextBtn: {
    backgroundColor: theme.accent,
    marginHorizontal: theme.spacing.padding,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
  },

  // Selected court summary
  selectedCourtSummary: {
    backgroundColor: theme.card,
    marginHorizontal: theme.spacing.padding,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
    flex: 1,
  },

  // Time options
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.padding,
    gap: 10,
    marginBottom: 16,
  },
  timeBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  timeBtnActive: {
    borderColor: theme.accent,
    backgroundColor: theme.accent + '10',
  },
  timeIcon: { fontSize: 24 },
  timeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  timeLabelActive: {
    color: theme.accent,
  },

  // Custom time
  customTimeRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.padding,
    gap: 10,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 4,
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

  // Defaults summary
  defaultsCard: {
    backgroundColor: theme.card,
    marginHorizontal: theme.spacing.padding,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  defaultsTitle: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  defaultsText: {
    fontSize: 13,
    color: theme.textMuted,
  },

  // Advanced toggle
  advancedToggle: {
    paddingHorizontal: theme.spacing.padding,
    paddingVertical: 10,
  },
  advancedToggleText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },

  // Advanced panel
  advancedPanel: {
    paddingHorizontal: theme.spacing.padding,
    gap: 8,
    marginBottom: 16,
  },
  advLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Format
  formatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formatBtn: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  formatBtnActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
  },
  formatIcon: { fontSize: 18 },
  formatText: {
    fontSize: 11,
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
    gap: 8,
  },
  neededBtn: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  neededBtnActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
  },
  neededText: {
    fontSize: 16,
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
    marginBottom: 4,
  },
  duprControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  duprBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  duprBtnText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '300',
  },
  duprValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.accent,
    minWidth: 36,
    textAlign: 'center',
  },
  duprDash: {
    fontSize: 18,
    color: theme.textSecondary,
    marginBottom: 16,
  },

  // Notes
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
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

  // Back
  backBtn: {
    paddingHorizontal: theme.spacing.padding,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backBtnText: {
    fontSize: 13,
    color: theme.textSecondary,
  },

  // Share section (after posting)
  shareSection: {
    backgroundColor: theme.card,
    marginHorizontal: theme.spacing.padding,
    borderRadius: 14,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.accent + '30',
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  shareSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  doneBtn: {
    backgroundColor: theme.bg,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textSecondary,
  },
});
