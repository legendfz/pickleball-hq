import { Router, Request, Response } from 'express';
import playersData from '../data/players.json';

const router = Router();

interface MatchPlayer {
  id: number;
  name: string;
  city: string;
  lat: number;
  lng: number;
  dupr: number;
  type: 'player' | 'partner';
  preferredPlay: string;
  availability: string;
  level: string;
}

// Mock matchmaking users (20 players in Irvine/LA area)
const matchPlayers: MatchPlayer[] = [
  { id: 500, name: 'Mike Chen', city: 'Irvine', lat: 33.6846, lng: -117.8265, dupr: 3.8, type: 'player', preferredPlay: 'doubles', availability: 'weekends', level: 'intermediate' },
  { id: 501, name: 'Jessica Park', city: 'Irvine', lat: 33.6931, lng: -117.7932, dupr: 4.2, type: 'partner', preferredPlay: 'doubles', availability: 'weekdays', level: 'intermediate' },
  { id: 502, name: 'David Rodriguez', city: 'Tustin', lat: 33.7325, lng: -117.8102, dupr: 3.5, type: 'player', preferredPlay: 'singles', availability: 'anytime', level: 'beginner' },
  { id: 503, name: 'Amy Wang', city: 'Irvine', lat: 33.6712, lng: -117.7789, dupr: 4.5, type: 'partner', preferredPlay: 'doubles', availability: 'weekends', level: 'advanced' },
  { id: 504, name: 'Chris Thompson', city: 'Newport Beach', lat: 33.6189, lng: -117.9281, dupr: 3.2, type: 'player', preferredPlay: 'doubles', availability: 'weekends', level: 'beginner' },
  { id: 505, name: 'Nicole Kim', city: 'Costa Mesa', lat: 33.6639, lng: -117.9134, dupr: 4.0, type: 'player', preferredPlay: 'singles', availability: 'weekdays', level: 'intermediate' },
  { id: 506, name: 'Ryan Patel', city: 'Irvine', lat: 33.7102, lng: -117.7745, dupr: 3.9, type: 'partner', preferredPlay: 'doubles', availability: 'anytime', level: 'intermediate' },
  { id: 507, name: 'Sarah Mitchell', city: 'Laguna Niguel', lat: 33.5241, lng: -117.7056, dupr: 4.3, type: 'player', preferredPlay: 'doubles', availability: 'weekends', level: 'advanced' },
  { id: 508, name: 'James Lee', city: 'Anaheim', lat: 33.8366, lng: -117.9143, dupr: 3.1, type: 'player', preferredPlay: 'singles', availability: 'weekdays', level: 'beginner' },
  { id: 509, name: 'Emily Clark', city: 'Huntington Beach', lat: 33.6595, lng: -117.9988, dupr: 4.7, type: 'partner', preferredPlay: 'doubles', availability: 'weekends', level: 'advanced' },
  { id: 510, name: 'Kevin Nguyen', city: 'Garden Grove', lat: 33.7739, lng: -117.9414, dupr: 3.6, type: 'player', preferredPlay: 'doubles', availability: 'anytime', level: 'intermediate' },
  { id: 511, name: 'Megan Davis', city: 'Santa Monica', lat: 34.0195, lng: -118.4912, dupr: 4.1, type: 'player', preferredPlay: 'singles', availability: 'weekends', level: 'intermediate' },
  { id: 512, name: 'Tom Wilson', city: 'Los Angeles', lat: 34.0407, lng: -118.2468, dupr: 3.4, type: 'player', preferredPlay: 'doubles', availability: 'weekdays', level: 'beginner' },
  { id: 513, name: 'Amanda Garcia', city: 'Pasadena', lat: 34.1478, lng: -118.1445, dupr: 4.4, type: 'partner', preferredPlay: 'doubles', availability: 'weekends', level: 'advanced' },
  { id: 514, name: 'Brandon Scott', city: 'Irvine', lat: 33.6856, lng: -117.8401, dupr: 3.7, type: 'player', preferredPlay: 'doubles', availability: 'weekdays', level: 'intermediate' },
  { id: 515, name: 'Rachel Adams', city: 'Mission Viejo', lat: 33.5965, lng: -117.6592, dupr: 4.6, type: 'partner', preferredPlay: 'singles', availability: 'anytime', level: 'advanced' },
  { id: 516, name: 'Daniel Kim', city: 'Fullerton', lat: 33.8703, lng: -117.9242, dupr: 3.3, type: 'player', preferredPlay: 'doubles', availability: 'weekends', level: 'beginner' },
  { id: 517, name: 'Lauren Taylor', city: 'Long Beach', lat: 33.7701, lng: -118.1937, dupr: 4.0, type: 'partner', preferredPlay: 'doubles', availability: 'weekdays', level: 'intermediate' },
  { id: 518, name: 'Jason Brown', city: 'Irvine', lat: 33.6705, lng: -117.7368, dupr: 3.8, type: 'player', preferredPlay: 'singles', availability: 'anytime', level: 'intermediate' },
  { id: 519, name: 'Stephanie Nguyen', city: 'Aliso Viejo', lat: 33.5675, lng: -117.7268, dupr: 4.2, type: 'partner', preferredPlay: 'doubles', availability: 'weekends', level: 'intermediate' },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/matchmaking/nearby — find nearby players with similar DUPR
router.get('/nearby', (req: Request, res: Response) => {
  const lat = parseFloat(String(req.query.lat || '33.6846'));
  const lng = parseFloat(String(req.query.lng || '-117.8265'));
  const dupr = parseFloat(String(req.query.dupr || '4.0'));
  const type = (req.query.type as string) || 'all';
  const radius = parseFloat(String(req.query.radius || '50'));

  let results = matchPlayers.map((p) => ({
    ...p,
    distance: Math.round(haversineDistance(lat, lng, p.lat, p.lng) * 10) / 10,
    duprDiff: Math.abs(p.dupr - dupr),
  }));

  // Filter by type
  if (type === 'player') {
    results = results.filter((p) => p.type === 'player');
  } else if (type === 'partner') {
    results = results.filter((p) => p.type === 'partner');
  }

  // Filter by radius
  results = results.filter((p) => p.distance <= radius);

  // Filter by DUPR range (within 1.0)
  results = results.filter((p) => p.duprDiff <= 1.5);

  // Sort by combined distance + DUPR difference score
  results.sort((a, b) => {
    const scoreA = a.distance * 0.3 + a.duprDiff * 10;
    const scoreB = b.distance * 0.3 + b.duprDiff * 10;
    return scoreA - scoreB;
  });

  res.json({ data: results, total: results.length });
});

export default router;
