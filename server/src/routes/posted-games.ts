import { Router, Request, Response } from 'express';
import postedGamesData from '../data/posted-games.json';

const router = Router();

interface JoinedPlayer {
  id: number;
  name: string;
  dupr: number;
}

interface PostedGame {
  id: number;
  hostId: number;
  hostName: string;
  hostDupr: number;
  courtId: number;
  courtName: string;
  datetime: string;
  format: 'singles' | 'doubles' | 'mixed';
  needed: number;
  joined: JoinedPlayer[];
  duprRange: [number, number];
  notes: string;
  status: 'open' | 'full' | 'cancelled';
  city: string;
}

let games: PostedGame[] = [...(postedGamesData as PostedGame[])];

// GET /api/posted-games — all posted games, sorted by datetime
router.get('/', (_req: Request, res: Response) => {
  const sorted = [...games].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
  res.json({ data: sorted, total: sorted.length });
});

// GET /api/posted-games/city/:city — filter by city
router.get('/city/:city', (req: Request, res: Response) => {
  const city = decodeURIComponent(req.params.city).toLowerCase();
  const filtered = games
    .filter((g) => g.city.toLowerCase() === city)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  res.json({ data: filtered, total: filtered.length });
});

// POST /api/posted-games/:id/join — join a game
router.post('/:id/join', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const game = games.find((g) => g.id === id);

  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  if (game.status !== 'open') {
    res.status(400).json({ error: 'Game is not open for joining' });
    return;
  }

  const { playerId, playerName, playerDupr } = req.body;

  if (!playerId || !playerName) {
    res.status(400).json({ error: 'playerId and playerName are required' });
    return;
  }

  // Check if already joined
  if (game.joined.some((p) => p.id === playerId)) {
    res.status(400).json({ error: 'Already joined this game' });
    return;
  }

  // Check if host
  if (game.hostId === playerId) {
    res.status(400).json({ error: 'You are the host of this game' });
    return;
  }

  // Check DUPR range
  const dupr = playerDupr || 0;
  if (dupr < game.duprRange[0] || dupr > game.duprRange[1]) {
    res.status(400).json({
      error: `Your DUPR (${dupr}) is outside the range ${game.duprRange[0]}-${game.duprRange[1]}`,
    });
    return;
  }

  // Add player
  game.joined.push({ id: playerId, name: playerName, dupr });

  // Check if full
  if (game.joined.length >= game.needed) {
    game.status = 'full';
  }

  res.json({ data: game });
});

export default router;
