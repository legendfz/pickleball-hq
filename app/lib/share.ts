import { Share } from 'react-native';

// ─── Share Text Generators ─────────────────────────────────

export interface MatchShareData {
  courtName: string;
  score: string;         // e.g. "Won 11-7, 11-9"
  format: 'singles' | 'doubles' | 'mixed';
  partners?: string[];   // e.g. ["Lisa W."]
  opponents?: string[];  // e.g. ["Mike C.", "Tom R."]
  dupr?: number;
}

export interface StreakShareData {
  streakDays: number;
}

export interface DuprShareData {
  currentDupr: number;
  previousDupr: number;
}

export interface CourtShareData {
  courtName: string;
  city: string;
}

export interface PaddleShareData {
  paddleName: string;
  brand: string;
}

// Generate share text for a completed match
export function generateMatchShareText(data: MatchShareData): string {
  const { courtName, score, format, partners, opponents, dupr } = data;

  let text = `🏓 Just played at ${courtName}!\n`;
  if (dupr) text += `DUPR ${dupr.toFixed(1)} · `;
  text += `${score}\n`;

  if (format !== 'singles') {
    const partnerStr = partners?.length ? `with ${partners.join(' & ')}` : '';
    const opponentStr = opponents?.length ? `vs ${opponents.join(' & ')}` : '';
    text += `${capitalize(format)} ${partnerStr} ${opponentStr}`.trim() + '\n';
  }

  text += `\n#PickleballHQ #Pickleball`;
  return text.trim();
}

// Generate share text for a streak achievement
export function generateStreakShareText(data: StreakShareData): string {
  return `🔥 ${data.streakDays} day streak! Can't stop playing!\n\n#PickleballHQ #Pickleball`;
}

// Generate share text for a DUPR level-up
export function generateDuprShareText(data: DuprShareData): string {
  return `⚡ Just hit DUPR ${data.currentDupr.toFixed(1)}!\nLevel up from ${data.previousDupr.toFixed(1)} → ${data.currentDupr.toFixed(1)}\n\n#PickleballHQ #Pickleball`;
}

// Generate share text for playing at a court
export function generateCourtShareText(data: CourtShareData): string {
  return `📍 Played at ${data.courtName}, ${data.city}!\n\n#PickleballHQ #Pickleball`;
}

// Generate share text for paddle usage
export function generatePaddleShareText(data: PaddleShareData): string {
  return `🏓 My paddle: ${data.brand} ${data.paddleName}\n\n#PickleballHQ #Pickleball`;
}

// ─── Share Action ──────────────────────────────────────────

export type ShareResult = 'shared' | 'dismissed' | 'error';

export async function shareToSocial(text: string): Promise<ShareResult> {
  try {
    const result = await Share.share({
      message: text,
    });

    if (result.action === Share.sharedAction) {
      return 'shared';
    }
    return 'dismissed';
  } catch {
    return 'error';
  }
}

// ─── XP Reward ─────────────────────────────────────────────

export const SHARE_XP_REWARD = 10;

export function getShareXPReward(): number {
  return SHARE_XP_REWARD;
}

// ─── Helpers ───────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
