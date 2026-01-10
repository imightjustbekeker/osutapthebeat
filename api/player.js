import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Player name required' });

  try {
    const data = await kv.get(`player:${name}`);
    if (!data) return res.status(404).json({ error: 'Player not found' });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
