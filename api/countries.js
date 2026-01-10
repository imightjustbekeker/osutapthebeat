import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const countries = await kv.smembers('countries_list');
    const results = await Promise.all(countries.map(async (name) => {
      const stats = await kv.get(`country:${name}`);
      const playerCount = await kv.scard(`country_players:${name}`);
      
      return {
        country: name,
        totalPoints: stats.cumulativePoints,
        avgAccuracy: parseFloat((stats.cumulativeAccuracy / playerCount).toFixed(2)),
        playerCount
      };
    }));

    // Sort descending by totalPoints
    results.sort((a, b) => b.totalPoints - a.totalPoints);

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
