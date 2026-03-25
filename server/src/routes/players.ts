import { Router, Request, Response } from 'express';
import { mockPlayers, mockMatches, mockTournaments } from '../mock-data';
import socialTagsData from '../data/social-tags.json';

const router = Router();

// Surface classification helper
function getSurface(tournamentId: number): string {
  const t = mockTournaments.find((t) => t.id === tournamentId);
  if (!t) return 'Unknown';
  const s = t.surface.toLowerCase();
  if (s.includes('clay')) return 'Clay';
  if (s.includes('grass')) return 'Grass';
  if (s.includes('hard')) return 'Hard';
  return t.surface;
}

// GET /api/players — Player list with search and ranking sort
router.get('/', (req: Request, res: Response) => {
  let players = [...mockPlayers];

  // Filter by tour (ATP/WTA/ALL)
  const tour = (req.query.tour as string || '').toUpperCase();
  if (tour === 'ATP' || tour === 'WTA') {
    players = players.filter((p) => (p as any).tour === tour);
  }

  // Search by name or country
  const search = req.query.search as string | undefined;
  if (search) {
    const q = search.toLowerCase();
    players = players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q)
    );
  }

  // Sort by ranking (default), or by name
  const sortBy = req.query.sort as string | undefined;
  if (sortBy === 'name') {
    players.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    players.sort((a, b) => a.ranking - b.ranking);
  }

  // Pagination
  const limit = parseInt(String(req.query.limit)) || 200;
  const offset = parseInt(String(req.query.offset)) || 0;
  const total = players.length;
  players = players.slice(offset, offset + limit);

  res.json({
    data: players,
    total,
    limit,
    offset,
  });
});

// GET /api/players/:id — Player detail with recent matches
router.get('/:id', (req: Request, res: Response) => {
  const player = mockPlayers.find((p) => p.id === parseInt(String(req.params.id)));
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  // Get recent matches for this player
  const playerMatches = mockMatches
    .filter((m) => m.player1Id === player.id || m.player2Id === player.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .map((m) => {
      const player1 = mockPlayers.find((p) => p.id === m.player1Id)!;
      const player2 = mockPlayers.find((p) => p.id === m.player2Id)!;
      const winner = mockPlayers.find((p) => p.id === m.winnerId)!;
      const tournament = mockTournaments.find((t) => t.id === m.tournamentId)!;
      return { ...m, player1, player2, winner, tournament };
    });

  // Calculate stats
  const allPlayerMatches = mockMatches.filter(
    (m) => m.player1Id === player.id || m.player2Id === player.id
  );
  const wins = allPlayerMatches.filter((m) => m.winnerId === player.id).length;
  const losses = allPlayerMatches.length - wins;

  // Win/loss by surface
  const surfaceStats: Record<string, { wins: number; losses: number }> = {};
  allPlayerMatches.forEach((m) => {
    const surface = getSurface(m.tournamentId);
    if (!surfaceStats[surface]) surfaceStats[surface] = { wins: 0, losses: 0 };
    if (m.winnerId === player.id) {
      surfaceStats[surface].wins++;
    } else {
      surfaceStats[surface].losses++;
    }
  });

  const winLossBySurface = Object.entries(surfaceStats).map(([surface, stats]) => ({
    surface,
    wins: stats.wins,
    losses: stats.losses,
  }));

  // Season win/loss (2024 matches)
  const seasonMatches = allPlayerMatches.filter((m) => m.date.startsWith('2024'));
  const seasonWins = seasonMatches.filter((m) => m.winnerId === player.id).length;
  const seasonLosses = seasonMatches.length - seasonWins;

  res.json({
    ...player,
    recentMatches: playerMatches,
    stats: {
      winLoss: `${wins}-${losses}`,
      titlesThisYear: player.titles,
      bestResult: player.grandSlams > 0 ? `${player.grandSlams} Grand Slam titles` : `Career high #${player.careerHigh}`,
      seasonWinLoss: `${seasonWins}-${seasonLosses}`,
      winLossBySurface,
    },
    // Pass through extended fields
    rankingHistory: (player as any).rankingHistory || [],
    record: (player as any).record || null,
    birthplace: (player as any).birthplace || null,
    coach: (player as any).coach || null,
    recentForm: (player as any).recentForm || null,
  });
});

// GET /api/players/:id/dupr — DUPR rating details
router.get('/:id/dupr', (req: Request, res: Response) => {
  const player = mockPlayers.find((p) => p.id === parseInt(String(req.params.id)));
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  const duprRating = (player as any).duprRating || 4.0;
  const duprDoubles = (player as any).duprDoubles || duprRating;

  // Calculate rank among all players
  const allDups = mockPlayers
    .map((p) => ({ id: p.id, dupr: (p as any).duprRating || 4.0 }))
    .sort((a, b) => b.dupr - a.dupr);
  const rank = allDups.findIndex((p) => p.id === player.id) + 1;

  // Generate 12-month mock DUPR history
  const history: { month: string; rating: number }[] = [];
  let currentRating = duprRating;
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    // Gradually trend toward current rating
    const trend = ((12 - i) / 12);
    const noise = (Math.random() - 0.5) * 0.15;
    const rating = Math.round((duprRating - 0.3 * (1 - trend) + noise) * 1000) / 1000;
    history.push({ month, rating: Math.min(8.0, Math.max(2.0, rating)) });
  }
  // Ensure last entry matches current
  history[history.length - 1].rating = duprRating;

  res.json({
    playerId: player.id,
    playerName: player.name,
    duprRating,
    duprDoubles,
    rank,
    totalPlayers: mockPlayers.length,
    history,
    lastUpdated: new Date().toISOString(),
  });
});

// GET /api/players/social-tags — All available social tags
router.get('/social-tags/all', (_req: Request, res: Response) => {
  res.json(socialTagsData);
});

// GET /api/players/:id/social-tags — Player's social tags
router.get('/:id/social-tags', (req: Request, res: Response) => {
  const player = mockPlayers.find((p) => p.id === parseInt(String(req.params.id)));
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  const rawTags = (player as any).socialTags || [];
  // Enrich with tag metadata
  const enriched = rawTags
    .filter((st: any) => st.count >= 3)
    .map((st: any) => {
      const meta = socialTagsData.tags.find((t) => t.id === st.tagId);
      return {
        ...st,
        name: meta?.name || st.tagId,
        nameZh: meta?.nameZh || '',
        emoji: meta?.emoji || '🏷️',
        category: meta?.category || 'style',
      };
    })
    .sort((a: any, b: any) => b.count - a.count);

  res.json({
    playerId: player.id,
    playerName: player.name,
    tags: enriched,
    total: enriched.length,
  });
});

// POST /api/players/:id/social-tags — Submit tags (mock, no auth)
router.post('/:id/social-tags', (req: Request, res: Response) => {
  const player = mockPlayers.find((p) => p.id === parseInt(String(req.params.id)));
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  const { tagIds } = req.body;
  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    res.status(400).json({ error: 'tagIds must be a non-empty array' });
    return;
  }
  if (tagIds.length > 3) {
    res.status(400).json({ error: 'Maximum 3 tags per submission' });
    return;
  }

  // Validate tag IDs
  const validIds = new Set(socialTagsData.tags.map((t) => t.id));
  const invalid = tagIds.filter((id: string) => !validIds.has(id));
  if (invalid.length > 0) {
    res.status(400).json({ error: `Invalid tag IDs: ${invalid.join(', ')}` });
    return;
  }

  // Mock: increment counts on the player object
  if (!(player as any).socialTags) {
    (player as any).socialTags = [];
  }

  for (const tagId of tagIds) {
    const existing = (player as any).socialTags.find((st: any) => st.tagId === tagId);
    if (existing) {
      existing.count++;
    } else {
      (player as any).socialTags.push({ tagId, count: 1 });
    }
  }

  // Return updated tags
  const rawTags = (player as any).socialTags;
  const enriched = rawTags
    .filter((st: any) => st.count >= 3)
    .map((st: any) => {
      const meta = socialTagsData.tags.find((t) => t.id === st.tagId);
      return {
        ...st,
        name: meta?.name || st.tagId,
        nameZh: meta?.nameZh || '',
        emoji: meta?.emoji || '🏷️',
        category: meta?.category || 'style',
      };
    })
    .sort((a: any, b: any) => b.count - a.count);

  res.json({
    success: true,
    playerId: player.id,
    tags: enriched,
  });
});

export default router;
