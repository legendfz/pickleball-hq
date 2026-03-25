import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { SkeletonBlock } from '../../../lib/skeleton';
import { theme } from '../../../lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Step = 'level' | 'style' | 'budget' | 'results';

const DUPR_LEVELS = [
  { label: 'Beginner', value: '2.5', desc: 'Just starting out', emoji: '🌱' },
  { label: 'Recreational', value: '3.0', desc: 'Playing for fun', emoji: '😊' },
  { label: 'Intermediate', value: '3.5', desc: 'Consistent rallies', emoji: '🎯' },
  { label: 'Advanced', value: '4.5', desc: 'Tournament level', emoji: '🏆' },
] as const;

const STYLES = [
  { label: 'Control', value: 'control', desc: 'Dinks, drops, precision', emoji: '🎯' },
  { label: 'Balanced', value: 'balanced', desc: 'Mix of offense & defense', emoji: '⚖️' },
  { label: 'Power', value: 'power', desc: 'Drives, smashes, speed', emoji: '💪' },
] as const;

const BUDGETS = [
  { label: '$50–100', value: 'low', desc: 'Great value picks', emoji: '💰' },
  { label: '$100–150', value: 'mid', desc: 'Performance balance', emoji: '💎' },
  { label: '$150+', value: 'high', desc: 'Premium & pro level', emoji: '👑' },
  { label: 'Any', value: 'any', desc: 'Show me everything', emoji: '🌟' },
] as const;

export default function FindPaddleScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('level');
  const [dupr, setDupr] = useState('3.5');
  const [style, setStyle] = useState('balanced');
  const [budget, setBudget] = useState('any');

  const { data: results, isLoading: resultsLoading, refetch } = useQuery<any[]>({
    queryKey: ['paddle-match', dupr, style, budget],
    queryFn: async () => {
      const res = await api.get(`/api/paddles/match?dupr=${dupr}&style=${style}&budget=${budget}`);
      return res.data;
    },
    enabled: step === 'results',
  });

  const handleFind = () => {
    setStep('results');
    refetch();
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return theme.accent;
    if (score >= 40) return '#eab308';
    return '#888';
  };

  const renderStep = () => {
    switch (step) {
      case 'level':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your level?</Text>
            <Text style={styles.stepSub}>Select your approximate DUPR rating</Text>
            <View style={styles.optionGrid}>
              {DUPR_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl.value}
                  style={[styles.optionCard, dupr === lvl.value && styles.optionCardActive]}
                  onPress={() => setDupr(lvl.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{lvl.emoji}</Text>
                  <Text style={[styles.optionLabel, dupr === lvl.value && styles.optionLabelActive]}>
                    {lvl.label}
                  </Text>
                  <Text style={styles.optionDesc}>{lvl.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => setStep('style')}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'style':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How do you like to play?</Text>
            <Text style={styles.stepSub}>Pick your preferred style</Text>
            <View style={styles.optionGrid}>
              {STYLES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.optionCardWide, style === s.value && styles.optionCardActive]}
                  onPress={() => setStyle(s.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{s.emoji}</Text>
                  <Text style={[styles.optionLabel, style === s.value && styles.optionLabelActive]}>
                    {s.label}
                  </Text>
                  <Text style={styles.optionDesc}>{s.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('level')}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('budget')} activeOpacity={0.8}>
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'budget':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your budget?</Text>
            <Text style={styles.stepSub}>We'll match you within range</Text>
            <View style={styles.optionGrid}>
              {BUDGETS.map((b) => (
                <TouchableOpacity
                  key={b.value}
                  style={[styles.optionCard, budget === b.value && styles.optionCardActive]}
                  onPress={() => setBudget(b.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{b.emoji}</Text>
                  <Text style={[styles.optionLabel, budget === b.value && styles.optionLabelActive]}>
                    {b.label}
                  </Text>
                  <Text style={styles.optionDesc}>{b.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('style')}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.findBtn} onPress={handleFind} activeOpacity={0.8}>
                <Text style={styles.findBtnText}>🎯 Find My Paddle</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'results':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.resultTitle}>Your Top Matches</Text>
            <Text style={styles.resultSub}>
              Based on {DUPR_LEVELS.find((l) => l.value === dupr)?.label} level · {style} style · {BUDGETS.find((b) => b.value === budget)?.label} budget
            </Text>

            {resultsLoading ? (
              <View style={{ gap: 12 }}>
                <SkeletonBlock width={SCREEN_WIDTH - 32} height={160} borderRadius={12} />
                <SkeletonBlock width={SCREEN_WIDTH - 32} height={160} borderRadius={12} />
                <SkeletonBlock width={SCREEN_WIDTH - 32} height={160} borderRadius={12} />
              </View>
            ) : (
              (results || []).map((paddle: any, idx: number) => (
                <TouchableOpacity
                  key={paddle.id}
                  style={styles.resultCard}
                  onPress={() => router.push(`/paddle/${paddle.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resultCardHeader}>
                    <View style={styles.matchBadge}>
                      <Text style={[styles.matchBadgeText, { color: getMatchColor(paddle.matchScore) }]}>
                        {paddle.matchScore}%
                      </Text>
                      <Text style={styles.matchBadgeLabel}>match</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.resultName}>{paddle.name}</Text>
                      <Text style={styles.resultBrand}>{paddle.brand}</Text>
                    </View>
                    <Text style={styles.resultPrice}>${paddle.price}</Text>
                  </View>

                  <View style={styles.resultMeta}>
                    <Text style={styles.resultSpec}>{paddle.weight}</Text>
                    <Text style={styles.resultDot}>·</Text>
                    <Text style={styles.resultSpec}>{paddle.faceMaterial}</Text>
                    <Text style={styles.resultDot}>·</Text>
                    <Text style={styles.resultSpec}>{paddle.thickness}</Text>
                  </View>

                  <View style={styles.resultRating}>
                    <Text style={styles.resultRatingText}>★ {paddle.rating}</Text>
                    <Text style={styles.resultReviewCount}>({paddle.reviewCount})</Text>
                  </View>

                  <Text style={styles.resultBestFor} numberOfLines={2}>
                    {paddle.bestFor}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={styles.restartBtn}
              onPress={() => { setStep('level'); }}
              activeOpacity={0.7}
            >
              <Text style={styles.restartBtnText}>↻ Start Over</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Find Your Paddle', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Progress */}
        {step !== 'results' && (
          <View style={styles.progressBar}>
            {['level', 'style', 'budget'].map((s, i) => {
              const steps: Step[] = ['level', 'style', 'budget'];
              const activeIdx = steps.indexOf(step);
              return (
                <View key={s} style={styles.progressStep}>
                  <View style={[styles.progressDot, i <= activeIdx && styles.progressDotActive]}>
                    <Text style={styles.progressNum}>{i + 1}</Text>
                  </View>
                  {i < 2 && <View style={[styles.progressLine, i < activeIdx && styles.progressLineActive]} />}
                </View>
              );
            })}
          </View>
        )}

        {renderStep()}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 40 },

  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 0,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  progressNum: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.border,
  },
  progressLineActive: {
    backgroundColor: theme.accent,
  },

  stepContent: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  stepSub: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    width: (SCREEN_WIDTH - 52) / 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
  },
  optionCardWide: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    width: SCREEN_WIDTH - 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
  },
  optionCardActive: {
    borderColor: theme.accent,
    backgroundColor: theme.accent + '10',
  },
  optionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  optionLabelActive: {
    color: theme.accent,
  },
  optionDesc: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  backBtn: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  findBtn: {
    flex: 2,
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  findBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  resultSub: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'capitalize',
  },

  resultCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchBadge: {
    backgroundColor: theme.accent + '15',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  matchBadgeText: {
    fontSize: 20,
    fontWeight: '800',
  },
  matchBadgeLabel: {
    fontSize: 10,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  resultBrand: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  resultPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  resultSpec: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  resultDot: {
    color: '#555',
  },
  resultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  resultRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
  },
  resultReviewCount: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  resultBestFor: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },

  restartBtn: {
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 8,
  },
  restartBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
});
