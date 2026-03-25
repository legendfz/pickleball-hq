/**
 * Gamification System for PickleballHQ
 * Inspired by Duolingo's engagement patterns
 */

// ─── Streak Badges ─────────────────────────────────────────

export interface StreakBadge {
  days: number;
  name: string;
  emoji: string;
}

export const STREAK_BADGES: StreakBadge[] = [
  { days: 3, name: 'Getting Started', emoji: '🌱' },
  { days: 7, name: 'On Fire', emoji: '🔥' },
  { days: 14, name: 'Dedicated', emoji: '💪' },
  { days: 30, name: 'Machine', emoji: '⚡' },
  { days: 60, name: 'Unstoppable', emoji: '🏆' },
  { days: 100, name: 'Legend', emoji: '👑' },
];

// ─── Level System ──────────────────────────────────────────

export interface Level {
  level: number;
  name: string;
  xpNeeded: number;
  color: string;
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Rookie', xpNeeded: 0, color: '#888' },
  { level: 2, name: 'Player', xpNeeded: 100, color: '#00d4aa' },
  { level: 3, name: 'Competitor', xpNeeded: 300, color: '#0066ff' },
  { level: 4, name: 'Champion', xpNeeded: 800, color: '#ffd32a' },
  { level: 5, name: 'Elite', xpNeeded: 1500, color: '#6c5ce7' },
  { level: 6, name: 'Legend', xpNeeded: 3000, color: '#ff4757' },
];

// ─── XP Rules ──────────────────────────────────────────────

export const XP_RULES = {
  PLAY_MATCH: 20,
  WIN_MATCH: 10,
  STREAK_7_DAYS: 50,
  NEW_COURT: 10,
  ACCEPT_CHALLENGE: 5,
  POST_GAME: 5,
};

// ─── Helper Functions ──────────────────────────────────────

export function getCurrentLevel(totalXP: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXP >= level.xpNeeded) {
      current = level;
    }
  }
  return current;
}

export function getNextLevel(currentLevel: Level): Level | null {
  const idx = LEVELS.findIndex((l) => l.level === currentLevel.level);
  if (idx < LEVELS.length - 1) return LEVELS[idx + 1];
  return null;
}

export function getXPProgress(currentXP: number): number {
  const current = getCurrentLevel(currentXP);
  const next = getNextLevel(current);
  if (!next) return 1;
  const xpInLevel = currentXP - current.xpNeeded;
  const xpForNext = next.xpNeeded - current.xpNeeded;
  return Math.min(1, xpInLevel / xpForNext);
}

export function getEarnedBadges(streakDays: number): StreakBadge[] {
  return STREAK_BADGES.filter((badge) => streakDays >= badge.days);
}

export function getStreakEmoji(streakDays: number): string {
  if (streakDays <= 0) return '';
  const earned = getEarnedBadges(streakDays);
  return earned.length > 0 ? earned[earned.length - 1].emoji : '🔥';
}
