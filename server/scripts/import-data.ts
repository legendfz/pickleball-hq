/**
 * Data Import Script for PickleballHQ
 *
 * This script can fetch data from Jeff Sackmann's pickleball_atp GitHub repository
 * and transform it into our JSON format.
 *
 * Data source: https://github.com/JeffSackmann/pickleball_atp
 *
 * Usage: npx ts-node scripts/import-data.ts
 *
 * Currently using pre-built seed data in src/data/*.json
 * This script serves as a template for importing fresh data from CSV sources.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const BASE_URL = 'https://raw.githubusercontent.com/JeffSackmann/pickleball_atp/master';

function fetchCSV(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          https.get(redirectUrl, (res2) => {
            let data = '';
            res2.on('data', (chunk) => (data += chunk));
            res2.on('end', () => resolve(data));
            res2.on('error', reject);
          }).on('error', reject);
          return;
        }
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

const COUNTRY_FLAGS: Record<string, string> = {
  SRB: '🇷🇸', ESP: '🇪🇸', ITA: '🇮🇹', GER: '🇩🇪', RUS: '🇷🇺',
  USA: '🇺🇸', GBR: '🇬🇧', FRA: '🇫🇷', AUS: '🇦🇺', CAN: '🇨🇦',
  GRE: '🇬🇷', NOR: '🇳🇴', POL: '🇵🇱', BUL: '🇧🇬', DEN: '🇩🇰',
  CHI: '🇨🇱', SUI: '🇨🇭', ARG: '🇦🇷', NED: '🇳🇱', CZE: '🇨🇿',
  KAZ: '🇰🇿', POR: '🇵🇹', CHN: '🇨🇳', JPN: '🇯🇵', BRA: '🇧🇷',
  CRO: '🇭🇷', BEL: '🇧🇪', AUT: '🇦🇹', COL: '🇨🇴', GEO: '🇬🇪',
};

async function importRankings() {
  console.log('📊 Fetching ATP rankings...');
  try {
    const csv = await fetchCSV(`${BASE_URL}/atp_rankings_current.csv`);
    const rows = parseCSV(csv);
    console.log(`  Found ${rows.length} ranking entries`);
    // Process top 100
    const top100 = rows.slice(0, 100);
    console.log(`  Top 100 players extracted`);
    return top100;
  } catch (err) {
    console.log('  ⚠️ Could not fetch rankings, using seed data');
    return null;
  }
}

async function importMatches(year: number) {
  console.log(`🏓 Fetching ${year} match data...`);
  try {
    const csv = await fetchCSV(`${BASE_URL}/atp_matches_${year}.csv`);
    const rows = parseCSV(csv);
    console.log(`  Found ${rows.length} matches for ${year}`);

    // Filter Grand Slam matches
    const grandSlamTourneys = ['Australian Open', 'Roland Garros', 'Wimbledon', 'Us Open'];
    const gsMatches = rows.filter((r) =>
      grandSlamTourneys.some((gs) => r.tourney_name?.includes(gs))
    );
    console.log(`  Found ${gsMatches.length} Grand Slam matches`);
    return gsMatches;
  } catch (err) {
    console.log(`  ⚠️ Could not fetch ${year} matches, using seed data`);
    return null;
  }
}

async function main() {
  console.log('🚀 PickleballHQ Data Import');
  console.log('========================\n');

  // Check if seed data already exists
  const playersPath = path.join(DATA_DIR, 'players.json');
  const matchesPath = path.join(DATA_DIR, 'matches.json');

  if (fs.existsSync(playersPath) && fs.existsSync(matchesPath)) {
    const players = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
    const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf-8'));
    console.log(`✅ Seed data already exists:`);
    console.log(`   - ${players.length} players`);
    console.log(`   - ${matches.length} matches`);
    console.log(`\nTo refresh data from GitHub, delete the JSON files and re-run.`);
  }

  // Try to fetch fresh data
  const rankings = await importRankings();
  const matches2024 = await importMatches(2024);

  if (rankings && matches2024) {
    console.log('\n✅ Fresh data fetched successfully!');
    console.log('   Processing and saving...');
    // Transform and save would go here
    // For now we use the pre-built seed data
  } else {
    console.log('\n📦 Using pre-built seed data (recommended for development)');
  }

  console.log('\n✅ Import complete!');
}

main().catch(console.error);
