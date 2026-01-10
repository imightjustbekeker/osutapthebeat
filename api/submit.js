import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { player, country, points, accuracy } = req.body;

  if (!player || !country || typeof points !== 'number' || typeof accuracy !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  try {
    const playerKey = `player:${player}`;
    const countryKey = `country:${country}`;

    // 1. Update Player Stats
    const playerData = (await kv.get(playerKey)) || { recentScores: [], country };
    
    // Add new score to the start and trim to last 10
    const newRecentScores = [{ points, accuracy }, ...playerData.recentScores].slice(0, 10);
    
    await kv.set(playerKey, {
      player,
      country,
      points, // Latest
      accuracy, // Latest
      recentScores: newRecentScores
    });

    // 2. Update Country Stats (Atomic increment)
    // If it's a first-time player for this country, we track it via a Set to get playerCount
    await kv.sadd('countries_list', country);
    await kv.sadd(`country_players:${country}`, player);
    
    const countryStats = (await kv.get(countryKey)) || { cumulativePoints: 0, cumulativeAccuracy: 0 };
    
    await kv.set(countryKey, {
      cumulativePoints: (countryStats.cumulativePoints || 0) + points,
      cumulativeAccuracy: (countryStats.cumulativeAccuracy || 0) + accuracy,
    });

    // 3. Update Global Leaderboard Index
    await kv.zadd('leaderboard_players', { score: points, member: player });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
