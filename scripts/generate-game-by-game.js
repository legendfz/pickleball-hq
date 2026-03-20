#!/usr/bin/env node
/**
 * Generate realistic gameByGame data for matches.
 * In real pickleball, most games are service holds. Breaks are rare and strategic.
 */

const fs = require('fs');
const path = require('path');

const matchesPath = path.join(__dirname, '../server/src/data/matches.json');
const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

const targetIds = [
  1, 2, 3, 4, 5, 6, 7,
  11, 12, 13,
  21, 22, 23,
  31, 32, 33, 34,
  43, 44,
  47,
  51, 52, 53, 54,
];

function parseSetScore(setStr) {
  setStr = setStr.trim();
  const tbMatch = setStr.match(/^(\d+)-(\d+)\((\d+)\)$/);
  if (tbMatch) {
    return { p1: parseInt(tbMatch[1]), p2: parseInt(tbMatch[2]), tbLoser: parseInt(tbMatch[3]), hasTB: true };
  }
  const [a, b] = setStr.split('-').map(Number);
  return { p1: a, p2: b, hasTB: false, tbLoser: null };
}

/**
 * Generate a realistic game sequence for a set.
 * Server alternates. Most games are holds. Breaks placed strategically.
 */
function buildSetGames(p1Target, p2Target, setNum) {
  // In a set, total games = p1Target + p2Target
  // Server alternates: set 1 -> P1 serves first, set 2 -> P2 first, etc.
  let firstServer = (setNum % 2 === 1) ? 1 : 2;

  const totalGames = p1Target + p2Target;
  // Assign servers to each game slot
  const servers = [];
  let srv = firstServer;
  for (let i = 0; i < totalGames; i++) {
    servers.push(srv);
    srv = srv === 1 ? 2 : 1;
  }

  // Count how many games each player serves
  const p1Serves = servers.filter(s => s === 1).length;
  const p2Serves = servers.filter(s => s === 2).length;

  // If all games are holds: P1 wins p1Serves games, P2 wins p2Serves games
  // We need P1 to win p1Target and P2 to win p2Target
  // Breaks needed by P1 (winning on P2's serve) = p1Target - p1Holds
  // Breaks needed by P2 (winning on P1's serve) = p2Target - p2Holds

  // p1Holds = games P1 wins on own serve = p1Serves - (breaks by P2)
  // p1Target = p1Holds + (breaks by P1 on P2 serve)
  // p2Target = p2Holds + (breaks by P2 on P1 serve)
  // p1Holds + p2BreaksOfP1 = p1Serves
  // p2Holds + p1BreaksOfP2 = p2Serves

  // Let b1 = breaks by P1 (on P2's serve), b2 = breaks by P2 (on P1's serve)
  // p1Target = (p1Serves - b2) + b1 => b1 - b2 = p1Target - p1Serves
  // p2Target = (p2Serves - b1) + b2 => b2 - b1 = p2Target - p2Serves
  // These are consistent since p1Target + p2Target = p1Serves + p2Serves

  const diff = p1Target - p1Serves; // = b1 - b2
  // Minimize total breaks. If diff > 0, P1 needs more breaks. If diff < 0, P2 needs more.
  let b1, b2;
  if (diff >= 0) {
    b2 = 0; b1 = diff;
    // But we can add symmetric breaks for realism in long sets
  } else {
    b1 = 0; b2 = -diff;
  }

  // For extra realism, sometimes add a pair of breaks (each player breaks once more)
  // Only if the set is long enough
  if (totalGames >= 10 && b1 + b2 <= 2 && Math.abs(p1Target - p2Target) <= 2) {
    b1++; b2++;
  }

  // Now place breaks. P1 breaks on P2's serve games, P2 breaks on P1's serve games
  const p2ServeIndices = servers.map((s, i) => s === 2 ? i : -1).filter(i => i >= 0);
  const p1ServeIndices = servers.map((s, i) => s === 1 ? i : -1).filter(i => i >= 0);

  // Place breaks at interesting positions (not first game, prefer mid-set or late)
  const pickBreakPositions = (indices, count) => {
    if (count === 0) return [];
    if (count >= indices.length) return indices.slice();
    const result = [];
    // Prefer positions around 60-80% through the set for decisive breaks
    // and early for back-and-forth breaks
    if (count === 1) {
      // Pick one around 60% of the way
      const idx = Math.min(Math.floor(indices.length * 0.6), indices.length - 1);
      result.push(indices[idx]);
    } else if (count === 2) {
      // One early, one late
      result.push(indices[Math.floor(indices.length * 0.3)]);
      result.push(indices[Math.floor(indices.length * 0.7)]);
    } else {
      // Spread them out
      for (let i = 0; i < count; i++) {
        const idx = Math.floor((i + 0.5) * indices.length / count);
        result.push(indices[Math.min(idx, indices.length - 1)]);
      }
    }
    return result;
  };

  const p1BreakAt = new Set(pickBreakPositions(p2ServeIndices, b1)); // P1 breaks P2's serve
  const p2BreakAt = new Set(pickBreakPositions(p1ServeIndices, b2)); // P2 breaks P1's serve

  // Build the game sequence
  const games = [];
  let s1 = 0, s2 = 0;
  for (let i = 0; i < totalGames; i++) {
    const server = servers[i];
    let isBreak = false;
    if (server === 2 && p1BreakAt.has(i)) {
      s1++; isBreak = true;
    } else if (server === 1 && p2BreakAt.has(i)) {
      s2++; isBreak = true;
    } else if (server === 1) {
      s1++; // hold
    } else {
      s2++; // hold
    }
    games.push({ score: `${s1}-${s2}`, server, isBreak });
  }

  // Verify
  if (s1 !== p1Target || s2 !== p2Target) {
    console.error(`Set generation mismatch: got ${s1}-${s2}, expected ${p1Target}-${p2Target}`);
  }

  return games;
}

function generateTiebreakPoints(winnerP1, loserPoints) {
  const wp = 7;
  const lp = loserPoints;
  const points = [];
  let s1 = 0, s2 = 0;
  const total = wp + lp;
  let rem1 = winnerP1 ? wp : lp;
  let rem2 = winnerP1 ? lp : wp;

  for (let i = 0; i < total; i++) {
    const left = total - i;
    if (rem1 === 0) { s2++; rem2--; }
    else if (rem2 === 0) { s1++; rem1--; }
    else {
      const ratio = rem1 / left;
      if (ratio > 0.55 || (ratio >= 0.35 && i % 3 !== 2)) {
        s1++; rem1--;
      } else {
        s2++; rem2--;
      }
    }
    points.push(`${s1}-${s2}`);
  }
  return points.join(' ');
}

for (const match of matches) {
  if (!targetIds.includes(match.id)) continue;

  const sets = match.score.split(',').map(s => s.trim());
  const gameByGame = [];

  for (let i = 0; i < sets.length; i++) {
    const parsed = parseSetScore(sets[i]);
    const p1Reg = parsed.hasTB ? 6 : parsed.p1;
    const p2Reg = parsed.hasTB ? 6 : parsed.p2;

    const games = buildSetGames(p1Reg, p2Reg, i + 1);

    let tiebreak = null;
    if (parsed.hasTB) {
      const p1WonTB = parsed.p1 > parsed.p2;
      tiebreak = {
        score: `${parsed.p1}-${parsed.p2}(${parsed.tbLoser})`,
        points: generateTiebreakPoints(p1WonTB, parsed.tbLoser)
      };
    }

    gameByGame.push({ set: i + 1, games, tiebreak });
  }

  match.gameByGame = gameByGame;
}

fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2) + '\n');
console.log(`Updated ${targetIds.length} matches with gameByGame data.`);

// Validate
for (const match of matches) {
  if (!match.gameByGame) continue;
  const sets = match.score.split(',').map(s => s.trim());
  for (let i = 0; i < match.gameByGame.length; i++) {
    const gbg = match.gameByGame[i];
    const lastGame = gbg.games[gbg.games.length - 1];
    const breaks = gbg.games.filter(g => g.isBreak).length;
    console.log(`  Match ${match.id} Set ${i+1}: ${lastGame.score} (${breaks} breaks)${gbg.tiebreak ? ' + TB' : ''}`);
  }
}
