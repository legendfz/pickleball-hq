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
  isRecurring?: boolean;
  recurrence?: string;
  regulars?: Array<{ id: number; name: string; dupr: number }>;
  openSpots?: number;
  waitlist?: Array<{ id: number; name: string; dupr: number }>;
}

let games: PostedGame[] = [...(postedGamesData as PostedGame[])];

// GET /api/posted-games — all posted games, sorted by datetime
router.get('/', (_req: Request, res: Response) => {
  const sorted = [...games].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
  res.json({ data: sorted, total: sorted.length });
});

// GET /api/posted-games/play-now — active games happening soon
router.get('/play-now', (_req: Request, res: Response) => {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const soon = new Date(now);
  soon.setHours(soon.getHours() + 2);

  // Games happening today or within next 2 hours
  const active = games
    .filter((g) => {
      const dt = new Date(g.datetime);
      return dt >= now && dt <= endOfDay && g.status === 'open';
    })
    .map((g) => {
      const dt = new Date(g.datetime);
      const diffMin = Math.round((dt.getTime() - now.getTime()) / (1000 * 60));
      let urgency = 'later';
      if (diffMin <= 0) urgency = 'now';
      else if (diffMin <= 60) urgency = 'soon';
      else if (diffMin <= 180) urgency = 'this-afternoon';
      return { ...g, minutesAway: diffMin, urgency };
    })
    .sort((a, b) => a.minutesAway - b.minutesAway);

  // Courts with people active right now (from courts data, hardcoded for now)
  const activeCourts = [
    { courtId: 1, name: 'Pickleball Station', activeNow: 4, predictedCrowd: 'busy' },
    { courtId: 6, name: 'Glen IR Pickleball Complex', activeNow: 8, predictedCrowd: 'busy' },
    { courtId: 26, name: 'Irvine Great Park Courts', activeNow: 6, predictedCrowd: 'busy' },
    { courtId: 4, name: 'Lakeshore Athletic Club', activeNow: 6, predictedCrowd: 'busy' },
    { courtId: 8, name: 'Costa Mesa Pickleball', activeNow: 5, predictedCrowd: 'busy' },
    { courtId: 17, name: 'DTLA Pickleball', activeNow: 5, predictedCrowd: 'busy' },
    { courtId: 28, name: 'Long Beach Pickleball Hub', activeNow: 4, predictedCrowd: 'busy' },
  ].filter((c) => c.activeNow >= 2);

  // Players looking for partners right now
  const lookingForPartners = [
    { id: 501, name: 'Jessica Park', city: 'Irvine', court: 'Orange County PB Club', dupr: 4.2, lookingFor: 'doubles partner' },
    { id: 506, name: 'Ryan Patel', city: 'Irvine', court: 'Northwood Park', dupr: 3.9, lookingFor: 'opponent' },
    { id: 503, name: 'Amy Wang', city: 'Irvine', court: 'Lakeshore Athletic Club', dupr: 4.5, lookingFor: 'doubles partner' },
    { id: 519, name: 'Stephanie Nguyen', city: 'Aliso Viejo', court: 'Irvine Great Park', dupr: 4.2, lookingFor: 'mixed doubles partner' },
  ];

  res.json({
    data: {
      activeGames: active,
      activeCourts,
      lookingForPartners,
      totalActive: active.length + activeCourts.reduce((sum, c) => sum + c.activeNow, 0),
    },
  });
});

// GET /api/posted-games/city/:city — filter by city
router.get('/city/:city', (req: Request, res: Response) => {
  const city = decodeURIComponent(req.params.city).toLowerCase();
  const filtered = games
    .filter((g) => g.city.toLowerCase() === city)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  res.json({ data: filtered, total: filtered.length });
});

// POST /api/posted-games — create a new game
router.post('/', (req: Request, res: Response) => {
  const {
    courtId, courtName, city, datetime, format, needed, duprRange, notes,
    hostId, hostName, hostDupr, isRecurring, recurrence,
  } = req.body;

  if (!courtId || !courtName || !datetime) {
    res.status(400).json({ error: 'courtId, courtName, and datetime are required' });
    return;
  }

  const newGame: PostedGame = {
    id: Math.max(...games.map((g) => g.id)) + 1,
    hostId: hostId || 999,
    hostName: hostName || 'You',
    hostDupr: hostDupr || 4.0,
    courtId,
    courtName,
    city: city || 'Irvine',
    datetime,
    format: format || 'doubles',
    needed: needed || 2,
    joined: [],
    duprRange: duprRange || [3.5, 4.5],
    notes: notes || '',
    status: 'open',
    isRecurring: isRecurring || false,
    recurrence: recurrence || undefined,
  };

  games.push(newGame);
  res.status(201).json({ data: newGame });
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

  const { playerId, playerName, playerDupr, joinWaitlist } = req.body;

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

  // For recurring games, handle waitlist
  if (game.isRecurring && joinWaitlist) {
    if (!game.waitlist) game.waitlist = [];
    if (game.waitlist.some((w) => w.id === playerId)) {
      res.status(400).json({ error: 'Already on waitlist' });
      return;
    }
    game.waitlist.push({ id: playerId, name: playerName, dupr: playerDupr || 0 });
    res.json({ data: game, message: 'Added to waitlist' });
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
