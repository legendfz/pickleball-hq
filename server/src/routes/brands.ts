import { Router, Request, Response } from 'express';
import brandsData from '../data/brands.json';
import paddlesData from '../data/paddles.json';
import playersData from '../data/players.json';

const router = Router();

// GET /api/brands — all brands
router.get('/', (_req: Request, res: Response) => {
  const brands = brandsData.map(b => {
    const brandPaddles = paddlesData.filter(p => p.brandId === b.id);
    const brandPlayers = playersData.filter(p => p.gear?.brandId === b.id);
    return {
      ...b,
      paddleCount: brandPaddles.length,
      proPlayerCount: brandPlayers.length,
    };
  });
  // Sort by pro player count descending
  brands.sort((a, b) => b.proPlayerCount - a.proPlayerCount);
  res.json(brands);
});

// GET /api/brands/:id — brand detail with paddles and players
router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const brand = brandsData.find(b => b.id === id);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });

  const brandPaddles = paddlesData.filter(p => p.brandId === id);
  const brandPlayers = playersData.filter(p => p.gear?.brandId === id);

  res.json({
    ...brand,
    paddles: brandPaddles,
    players: brandPlayers.map(p => ({
      id: p.id,
      name: p.name,
      country: p.country,
      ranking: p.ranking,
      photoUrl: p.photoUrl,
      paddle: p.gear?.paddle,
    })),
    paddleCount: brandPaddles.length,
    proPlayerCount: brandPlayers.length,
  });
});

export default router;
