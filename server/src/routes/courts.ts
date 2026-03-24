import { Router, Request, Response } from 'express';
import courtsData from '../data/courts.json';

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
}

const courts: Court[] = courtsData as Court[];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
  res.json({ data: results, total: results.length });
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

  res.json({ data: results, total: results.length });
});

// GET /api/courts/:id — court detail
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

  res.json({ ...court, reviews, events });
});

export default router;
