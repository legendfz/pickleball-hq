import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { theme } from '../lib/theme';
import { useLanguage } from '../lib/i18n';
import {
  getCurrentLevel,
  getNextLevel,
  getXPProgress,
  getEarnedBadges,
  LEVELS,
  type StreakBadge,
} from '../lib/gamification';
import ShareButton from '../components/ShareButton';
import { generateStreakShareText, generateDuprShareText, SHARE_XP_REWARD } from '../lib/share';

// ─── Mock Data ──────────────────────────────────────────────
const MOCK_USER = {
  name: 'Boss',
  dupr: 3.8,
  previousDupr: 3.6,
  matches: 47,
  wins: 31,
  streakDays: 7,
  totalXP: 245,
  sharesThisMonth: 5,
};

// ─── Components ─────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────

export default function ProfileScreen() {
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState(true);

  const currentLevel = getCurrentLevel(MOCK_USER.totalXP);
  const nextLevel = getNextLevel(currentLevel);
  const xpProgress = getXPProgress(MOCK_USER.totalXP);
  const earnedBadges = getEarnedBadges(MOCK_USER.streakDays);
  const xpToNext = nextLevel ? nextLevel.xpNeeded - MOCK_USER.totalXP : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Avatar & Name ── */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🏓</Text>
        </View>
        <Text style={styles.name}>{MOCK_USER.name}</Text>
        <View style={styles.duprWrap}>
          <Text style={styles.duprLabel}>DUPR</Text>
          <Text style={styles.duprValue}>{MOCK_USER.dupr}</Text>
        </View>
      </View>

      {/* ── Level & XP ── */}
      <View style={styles.card}>
        <View style={styles.levelHeader}>
          <View>
            <Text style={styles.levelBadge}>
              LVL {currentLevel.level}
            </Text>
            <Text style={[styles.levelName, { color: currentLevel.color }]}>
              {currentLevel.name}
            </Text>
          </View>
          <Text style={styles.xpTotal}>{MOCK_USER.totalXP} XP</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${xpProgress * 100}%`,
                backgroundColor: currentLevel.color,
              },
            ]}
          />
        </View>

        {nextLevel && (
          <Text style={styles.xpToNext}>
            {xpToNext} XP to {nextLevel.name} (LVL {nextLevel.level})
          </Text>
        )}
        {!nextLevel && (
          <Text style={styles.xpToNext}>🎉 Max level reached!</Text>
        )}
      </View>

      {/* ── Streak ── */}
      <View style={styles.card}>
        <View style={styles.streakRow}>
          <Text style={styles.streakEmoji}>
            {MOCK_USER.streakDays >= 7 ? '🔥' : '🌱'}
          </Text>
          <View>
            <Text style={styles.streakCount}>{MOCK_USER.streakDays} days</Text>
            <Text style={styles.streakLabel}>Playing streak</Text>
          </View>
        </View>
        {MOCK_USER.streakDays >= 7 && (
          <View style={styles.streakBonus}>
            <Text style={styles.streakBonusText}>+50 XP streak bonus earned!</Text>
          </View>
        )}
        <View style={styles.shareRow}>
          <ShareButton
            shareText={generateStreakShareText({ streakDays: MOCK_USER.streakDays })}
            label="Share Streak"
            icon="🔥"
          />
          <ShareButton
            shareText={generateDuprShareText({ currentDupr: MOCK_USER.dupr, previousDupr: MOCK_USER.previousDupr })}
            label="Share DUPR"
            icon="⚡"
          />
        </View>
      </View>

      {/* ── Badges ── */}
      {earnedBadges.length > 0 && (
        <View style={styles.card}>
          <SectionTitle>🏅 Badges</SectionTitle>
          <View style={styles.badgeGrid}>
            {earnedBadges.map((badge: StreakBadge) => (
              <View key={badge.days} style={styles.badgeItem}>
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDays}>{badge.days} days</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Stats ── */}
      <View style={styles.card}>
        <SectionTitle>{t('stats')}</SectionTitle>
        <StatRow label={t('matches')} value={String(MOCK_USER.matches)} />
        <StatRow label={t('wins')} value={String(MOCK_USER.wins)} />
        <StatRow
          label={t('winRate')}
          value={`${Math.round((MOCK_USER.wins / MOCK_USER.matches) * 100)}%`}
        />
        <StatRow label="Shares this month" value={`📤 ${MOCK_USER.sharesThisMonth}`} />
        <StatRow label="Share XP earned" value={`+${MOCK_USER.sharesThisMonth * SHARE_XP_REWARD} XP`} />
      </View>

      {/* ── Settings ── */}
      <View style={styles.card}>
        <SectionTitle>{t('settings')}</SectionTitle>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('notifications')}</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('language')}</Text>
          <View style={styles.langToggle}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                language === 'en' && styles.langBtnActive,
              ]}
              onPress={() => setLanguage('en')}
            >
              <Text
                style={[
                  styles.langBtnText,
                  language === 'en' && styles.langBtnTextActive,
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.langBtn,
                language === 'zh' && styles.langBtnActive,
              ]}
              onPress={() => setLanguage('zh')}
            >
              <Text
                style={[
                  styles.langBtnText,
                  language === 'zh' && styles.langBtnTextActive,
                ]}
              >
                中文
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Level Progression Info ── */}
      <View style={styles.card}>
        <SectionTitle>📊 Level Progression</SectionTitle>
        {LEVELS.map((level) => (
          <View key={level.level} style={styles.levelRow}>
            <View
              style={[
                styles.levelDot,
                {
                  backgroundColor:
                    MOCK_USER.totalXP >= level.xpNeeded
                      ? level.color
                      : theme.border,
                },
              ]}
            />
            <Text
              style={[
                styles.levelRowName,
                {
                  color:
                    MOCK_USER.totalXP >= level.xpNeeded
                      ? level.color
                      : theme.textSecondary,
                  fontWeight:
                    level.level === currentLevel.level ? '700' : '400',
                },
              ]}
            >
              LVL {level.level} — {level.name}
            </Text>
            <Text style={styles.levelRowXP}>{level.xpNeeded} XP</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    paddingTop: 56,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.accent,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  name: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  duprWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: 'rgba(8, 145, 178, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  duprLabel: {
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
  },
  duprValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.accent,
  },

  // Level Card
  card: {
    backgroundColor: theme.card,
    marginHorizontal: theme.spacing.padding,
    marginBottom: theme.spacing.cardGap,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  levelBadge: {
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    color: theme.textSecondary,
    letterSpacing: 1,
  },
  levelName: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  xpTotal: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpToNext: {
    fontSize: 12,
    color: theme.textSecondary,
  },

  // Streak
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  streakEmoji: {
    fontSize: 40,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  streakLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  streakBonus: {
    marginTop: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  streakBonusText: {
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
    color: theme.gold,
  },

  // Share row
  shareRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },

  // Badges
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    backgroundColor: theme.cardAlt,
    borderRadius: 12,
    padding: 12,
    minWidth: 90,
    borderWidth: 1,
    borderColor: theme.border,
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
    textAlign: 'center',
  },
  badgeDays: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Stats
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  statLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  settingLabel: {
    fontSize: 14,
    color: theme.text,
  },
  langToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.cardAlt,
  },
  langBtnActive: {
    backgroundColor: theme.accent,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
  },
  langBtnTextActive: {
    color: '#fff',
  },

  // Level progression
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelRowName: {
    flex: 1,
    fontSize: 13,
  },
  levelRowXP: {
    fontSize: 12,
    color: theme.textTertiary,
  },
});
