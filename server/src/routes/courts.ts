import { Router, Request, Response } from 'express';
import courtsData from '../data/courts.json';
import postedGamesData from '../data/posted-games.json';

const router = Router();

interface Court {
  id: number;
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  type: string;
  courts: number;
  rating: number;
  free: boolean;
  openHours: string;
  address: string;
  activeNow?: number;
  predictedCrowd?: string;
  checkIns?: Array<{ name: string; time: string }>;
  upcomingGames?: number;
  mostActive?: string;
  weeklyVisitors?: number;
  popularTimes?: number[];
  photos?: Array<{ id: number; color: string; caption: string; author: string; time: string }>;
  topPlayers?: string[];
}

interface PostedGame {
  id: number;
  hostId: number;
  hostName: string;
  hostDupr: number;
  courtId: number;
  courtName: string;
  datetime: string;
  format: string;
  needed: number;
  joined: Array<{ id: number; name: string; dupr: number }>;
  duprRange: [number, number];
  notes: string;
  status: string;
  city: string;
  isRecurring?: boolean;
  recurrence?: string;
  regulars?: Array<{ id: number; name: string; dupr: number }>;
  openSpots?: number;
}

const courts: Court[] = courtsData as Court[];
const games: PostedGame[] = postedGamesData as PostedGame[];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(a));
  return R * c;
}

// Compute real-time status for a court based on posted games
function computeRealTimeStatus(court: Court) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Get today's games at this court
  const todayGames = games.filter((g) => {
    if (g.courtId !== court.id) return false;
    const dt = new Date(g.datetime);
    return dt >= todayStart && dt <= todayEnd && g.status !== 'expired' && g.status !== 'cancelled';
  });

  const scheduledToday = todayGames.length;
  const playersExpected = todayGames.reduce((sum, g) => {
    if (g.isRecurring) {
      return sum + (g.regulars?.length ?? 0) + (g.openSpots ?? 0);
    }
    return sum + g.needed;
  }, 0);

  // Find current game (closest to now, in progress or starting soon)
  let currentGroup: string | null = null;
  let nextGame: { time: string; host: string; spotsLeft: number } | null = null;

  const sortedGames = [...todayGames].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  for (const g of sortedGames) {
    const dt = new Date(g.datetime);
    const diffMin = (now.getTime() - dt.getTime()) / (1000 * 60);

    if (diffMin >= 0 && diffMin <= 120) {
      // Game is in progress (started within last 2 hours)
      currentGroup = `${g.hostName}'s group`;
    } else if (dt > now && !nextGame) {
      // Next upcoming game
      const spotsLeft = g.isRecurring
        ? (g.openSpots ?? 0)
        : g.needed - g.joined.length;
      const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      nextGame = {
        time: timeStr,
        host: g.hostName,
        spotsLeft,
      };
    }
  }

  // Data confidence
  let dataConfidence: 'high' | 'medium' | 'low';
  const hasCheckIns = court.checkIns && court.checkIns.length > 0;
  if (scheduledToday > 0 && hasCheckIns) {
    dataConfidence = 'high';
  } else if (scheduledToday > 0) {
    dataConfidence = 'medium';
  } else {
    dataConfidence = 'low';
  }

  return {
    scheduledToday,
    playersExpected,
    currentGroup,
    nextGame,
    peakHours: court.mostActive || 'Weekend mornings',
    dataConfidence,
    lastUpdated: now.toISOString(),
  };
}

// Enrich court list items with game info for highlights
function enrichCourtList(courtList: Court[]) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  return courtList.map((court) => {
    const todayGames = games.filter((g) => {
      if (g.courtId !== court.id) return false;
      const dt = new Date(g.datetime);
      return dt >= todayStart && dt <= todayEnd && g.status !== 'expired' && g.status !== 'cancelled';
    });

    const gamesToday = todayGames.length;
    const totalPlayersExpected = todayGames.reduce((sum, g) => {
      if (g.isRecurring) return sum + (g.regulars?.length ?? 0) + (g.openSpots ?? 0);
      return sum + g.needed;
    }, 0);

    // Find urgency games
    const urgencyGames = todayGames.filter((g) => {
      const spotsLeft = g.isRecurring ? (g.openSpots ?? 0) : g.needed - g.joined.length;
      return spotsLeft > 0 && spotsLeft <= 2;
    });

    // Data confidence
    const hasCheckIns = court.checkIns && court.checkIns.length > 0;
    let dataConfidence: 'high' | 'medium' | 'low';
    if (gamesToday > 0 && hasCheckIns) dataConfidence = 'high';
    else if (gamesToday > 0) dataConfidence = 'medium';
    else dataConfidence = 'low';

    return {
      ...court,
      realTimeStatus: {
        scheduledToday: gamesToday,
        playersExpected: totalPlayersExpected,
        dataConfidence,
        peakHours: court.mostActive || 'Weekend mornings',
        hasUrgencyGames: urgencyGames.length > 0,
        urgencySpotInfo: urgencyGames.length > 0
          ? (() => {
              const g = urgencyGames[0];
              const spotsLeft = g.isRecurring ? (g.openSpots ?? 0) : g.needed - g.joined.length;
              const timeStr = new Date(g.datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              return `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} available @ ${timeStr}`;
            })()
          : null,
      },
    };
  });
}

// GET /api/courts — search by city
router.get('/', (req: Request, res: Response) => {
  let results = [...courts];
  const city = (req.query.city as string || '').toLowerCase();
  const type = (req.query.type as string || '').toLowerCase();

  if (city) {
    results = results.filter((c) => c.city.toLowerCase().includes(city));
  }
  if (type) {
    results = results.filter((c) => c.type === type);
  }

  results.sort((a, b) => b.rating - a.rating);
  const enriched = enrichCourtList(results);
  res.json({ data: enriched, total: enriched.length });
});

// GET /api/courts/hot — courts ranked by activity
router.get('/hot', (_req: Request, res: Response) => {
  const hot = [...courts]
    .filter((c) => (c.activeNow || 0) > 0)
    .sort((a, b) => (b.activeNow || 0) - (a.activeNow || 0));
  const enriched = enrichCourtList(hot);
  res.json({ data: enriched, total: enriched.length });
});

// GET /api/courts/nearby — find nearby courts
router.get('/nearby', (req: Request, res: Response) => {
  const lat = parseFloat(String(req.query.lat || '0'));
  const lng = parseFloat(String(req.query.lng || '0'));
  const radius = parseFloat(String(req.query.radius || '25'));

  if (!lat || !lng) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  let results = courts.map((c) => ({
    ...c,
    distance: Math.round(haversineDistance(lat, lng, c.lat, c.lng) * 10) / 10,
  }));

  results = results.filter((c) => c.distance <= radius);
  results.sort((a, b) => a.distance - b.distance);

  const enriched = enrichCourtList(results);
  res.json({ data: enriched, total: enriched.length });
});

// GET /api/courts/:id — court detail with heat data
router.get('/:id', (req: Request, res: Response) => {
  const court = courts.find((c) => c.id === parseInt(String(req.params.id)));
  if (!court) {
    res.status(404).json({ error: 'Court not found' });
    return;
  }

  // Mock reviews
  const reviews = [
    { id: 1, user: 'Alex M.', rating: 5, text: 'Great courts, well maintained. Love playing here!', date: '2024-12-15' },
    { id: 2, user: 'Sarah K.', rating: 4, text: 'Good facilities, can get crowded on weekends.', date: '2024-12-10' },
    { id: 3, user: 'Mike R.', rating: 5, text: 'Best pickleball venue in the area!', date: '2024-11-28' },
    { id: 4, user: 'Lisa T.', rating: 3, text: 'Courts are fine but parking is limited.', date: '2024-11-20' },
  ];

  // Mock events at this court
  const events = [
    { id: 1, name: 'Weekly Open Play', date: '2025-01-04', time: '9:00 AM', level: 'All Levels' },
    { id: 2, name: '3.5+ Round Robin', date: '2025-01-05', time: '2:00 PM', level: '3.5+' },
    { id: 3, name: 'Beginner Clinic', date: '2025-01-06', time: '10:00 AM', level: '2.0-3.0' },
  ];

  // Heat prediction based on historical patterns
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  let predictedBusy = court.predictedCrowd || 'moderate';
  if (isWeekend && hour >= 8 && hour <= 12) predictedBusy = 'busy';
  else if (!isWeekend && hour >= 17 && hour <= 19) predictedBusy = 'busy';
  else if (hour < 7 || hour > 21) predictedBusy = 'quiet';

  // Compute real-time status
  const realTimeStatus = computeRealTimeStatus(court);

  res.json({
    ...court,
    reviews,
    events,
    predictedCrowd: predictedBusy,
    realTimeStatus,
  });
});

export default router;
