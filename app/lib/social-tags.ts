import api from './api';

export interface EnrichedSocialTag {
  tagId: string;
  count: number;
  name: string;
  nameZh: string;
  emoji: string;
  category: string;
}

export interface PlayerSocialTags {
  playerId: number;
  playerName: string;
  tags: EnrichedSocialTag[];
  total: number;
}

export async function getPlayerSocialTags(playerId: number): Promise<PlayerSocialTags> {
  const res = await api.get(`/api/players/${playerId}/social-tags`);
  return res.data;
}

/**
 * Returns a compact string for matchmaking cards: "🧹×15 😊×12 ⏰×10"
 */
export function formatSocialTagsCompact(tags: EnrichedSocialTag[], max: number = 3): string {
  return tags
    .slice(0, max)
    .map((t) => `${t.emoji}×${t.count}`)
    .join(' ');
}
