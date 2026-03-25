import { Router, Request, Response } from 'express';
import paddlesData from '../data/paddles.json';
import brandsData from '../data/brands.json';
import playersData from '../data/players.json';

const router = Router();

// GET /api/paddles — all paddles list
router.get('/', (req: Request, res: Response) => {
  const { search, tag, brand, category } = req.query;
  let results = [...paddlesData];

  if (search) {
    const s = String(search).toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.brand.toLowerCase().includes(s) ||
      p.faceMaterial.toLowerCase().includes(s)
    );
  }
  if (tag) {
    results = results.filter(p => p.tags.includes(String(tag)));
  }
  if (brand) {
    results = results.filter(p => p.brand.toLowerCase() === String(brand).toLowerCase());
  }
  if (category) {
    results = results.filter(p => p.category === String(category));
  }

  res.json({
    count: results.length,
    paddles: results.map(p => ({
      ...p,
      proPlayerCount: p.proPlayers.length,
    })),
  });
});

// GET /api/paddles/match?dupr=X&style=Y — smart recommendation
router.get('/match', (req: Request, res: Response) => {
  const dupr = parseFloat(String(req.query.dupr || '3.5'));
  const style = String(req.query.style || 'balanced').toLowerCase();
  const budget = String(req.query.budget || 'any');

  let candidates = [...paddlesData];

  // Filter by budget
  if (budget === 'low') {
    candidates = candidates.filter(p => p.price < 100);
  } else if (budget === 'mid') {
    candidates = candidates.filter(p => p.price >= 100 && p.price <= 150);
  } else if (budget === 'high') {
    candidates = candidates.filter(p => p.price > 150);
  }

  // Score each paddle
  const scored = candidates.map(p => {
    let score = 0;

    // DUPR-based scoring
    if (dupr >= 4.5) {
      // Advanced: prefer premium, carbon, high rating
      if (p.category === 'premium') score += 30;
      if (p.faceMaterial.includes('Carbon')) score += 20;
      if (p.rating >= 4.5) score += 15;
    } else if (dupr >= 3.5) {
      // Intermediate: prefer mid-range, balanced
      if (p.category === 'mid-range' || p.category === 'premium') score += 20;
      if (p.rating >= 4.2) score += 15;
      if (p.tags.includes('balanced')) score += 10;
    } else {
      // Beginner: prefer budget/mid, beginner-friendly
      if (p.category === 'budget' || p.category === 'mid-range') score += 25;
      if (p.tags.includes('beginner') || p.tags.includes('beginner-friendly')) score += 20;
    }

    // Style-based scoring
    if (style === 'control') {
      if (p.tags.includes('control')) score += 25;
      if (p.thickness === '16mm') score += 10;
      if (p.tags.includes('spin')) score += 5;
    } else if (style === 'power') {
      if (p.tags.includes('power')) score += 25;
      if (p.thickness === '14mm' || p.thickness === '13mm') score += 10;
      if (p.tags.includes('carbon')) score += 5;
    } else {
      // balanced
      if (p.tags.includes('balanced')) score += 20;
      if (p.tags.includes('control') || p.tags.includes('power')) score += 10;
    }

    // Add a small randomness for variety
    score += Math.random() * 5;

    return { ...p, matchScore: Math.min(98, Math.round(score / 0.8)) };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  res.json(scored.slice(0, 5));
});

// GET /api/paddles/:id — paddle detail with pro players who use it
router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const paddle = paddlesData.find(p => p.id === id);
  if (!paddle) return res.status(404).json({ error: 'Paddle not found' });

  const usedByPlayers = playersData.filter(p => p.gear?.paddleId === id);
  const brand = brandsData.find(b => b.id === paddle.brandId);

  res.json({
    ...paddle,
    usedBy: usedByPlayers.map(p => ({
      id: p.id,
      name: p.name,
      country: p.country,
      ranking: p.ranking,
      photoUrl: p.photoUrl,
    })),
    brandInfo: brand || null,
  });
});

// GET /api/paddles/compare/:id1/:id2 — compare two paddles
router.get('/compare/:id1/:id2', (req: Request, res: Response) => {
  const id1 = parseInt(req.params.id1);
  const id2 = parseInt(req.params.id2);
  const p1 = paddlesData.find(p => p.id === id1);
  const p2 = paddlesData.find(p => p.id === id2);

  if (!p1 || !p2) return res.status(404).json({ error: 'One or both paddles not found' });

  const count1 = playersData.filter(p => p.gear?.paddleId === id1).length;
  const count2 = playersData.filter(p => p.gear?.paddleId === id2).length;

  const parseWeight = (w: string) => parseFloat(w.replace('oz', ''));
  const w1 = parseWeight(p1.weight);
  const w2 = parseWeight(p2.weight);
  const parseThickness = (t: string) => parseFloat(t.replace('mm', ''));
  const t1 = parseThickness(p1.thickness);
  const t2 = parseThickness(p2.thickness);

  res.json({
    paddle1: { ...p1, proPlayerCount: count1 },
    paddle2: { ...p2, proPlayerCount: count2 },
    comparison: {
      weight: { p1: w1, p2: w2, winner: w1 > w2 ? 'p1' : w2 > w1 ? 'p2' : 'tie' },
      thickness: { p1: t1, p2: t2, winner: t1 > t2 ? 'p1' : t2 > t1 ? 'p2' : 'tie' },
      price: { p1: p1.price, p2: p2.price, winner: p1.price < p2.price ? 'p1' : p2.price < p1.price ? 'p2' : 'tie' },
      rating: { p1: p1.rating, p2: p2.rating, winner: p1.rating > p2.rating ? 'p1' : p2.rating > p1.rating ? 'p2' : 'tie' },
      reviewCount: { p1: p1.reviewCount, p2: p2.reviewCount, winner: p1.reviewCount > p2.reviewCount ? 'p1' : 'p2' },
      proPlayerCount: { p1: count1, p2: count2, winner: count1 > count2 ? 'p1' : count2 > count1 ? 'p2' : 'tie' },
    },
  });
});

// GET /api/brands — all brands
router.get('/brands', (_req: Request, res: Response) => {
  res.json(brandsData);
});

export default router;
