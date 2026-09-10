import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // Get top 10 players from Redis Sorted Set because
    const topPlayersRaw = await kv.zrange('leaderboard_players', 0, 9, { rev: true, withScores: true });
    
    // Format: Redis returns [member, score, member, score] ( im planning to redo the entire two repos for this kms ) 
    const topPlayers = [];
    for (let i = 0; i < topPlayersRaw.length; i += 2) {
      topPlayers.push({ player: topPlayersRaw[i], points: topPlayersRaw[i+1] });
    }

    // Reuse logic for country totals
    const countryNames = await kv.smembers('countries_list');
    const topCountries = await Promise.all(countryNames.map(async (name) => {
      const stats = await kv.get(`country:${name}`);
      return { country: name, totalPoints: stats.cumulativePoints };
    }));

    topCountries.sort((a, b) => b.totalPoints - a.totalPoints);

    return res.status(200).json({
      topPlayers,
      topCountries: topCountries.slice(0, 10)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
