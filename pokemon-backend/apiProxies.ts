import axios from 'axios';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { CACHE_TTL, getCached } from './apiCache';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TCG_BASE = 'https://api.pokemontcg.io/v2';

const TMDB_PATH_PATTERN = /^\/(search\/movie|genre\/movie\/list|movie\/\d+(?:\/credits)?)$/;
const TCG_PATH_PATTERN = /^\/(cards|sets(?:\/[\w.-]+)?)$/;

export const apiProxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: 'Too many API requests. Please try again later.',
});

function stripClientSecrets(query: Request['query']): Record<string, unknown> {
  const params: Record<string, unknown> = { ...query };
  delete params.api_key;
  return params;
}

export async function proxyTmdb(req: Request, res: Response): Promise<void> {
  const tmdbPath = req.path;

  if (!TMDB_PATH_PATTERN.test(tmdbPath)) {
    res.status(403).json({ error: 'TMDB path not allowed.' });
    return;
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'TMDB is not configured on the server.' });
    return;
  }

  const cacheKey = `tmdb:${tmdbPath}:${JSON.stringify(req.query)}`;

  try {
    const data = await getCached(
      cacheKey,
      async () => {
        const response = await axios.get(`${TMDB_BASE}${tmdbPath}`, {
          params: {
            ...stripClientSecrets(req.query),
            api_key: apiKey,
          },
          headers: {
            Accept: 'application/json',
            'User-Agent': 'PokeWorld/1.0 (fan project; contact via site)',
          },
        });
        return response.data;
      },
      CACHE_TTL.MEDIUM,
    );

    res.set('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (error) {
    console.error('TMDB proxy error:', error);
    res.status(502).json({ error: 'Failed to fetch TMDB data.' });
  }
}

export async function proxyTcg(req: Request, res: Response): Promise<void> {
  const tcgPath = req.path;

  if (!TCG_PATH_PATTERN.test(tcgPath)) {
    res.status(403).json({ error: 'TCG path not allowed.' });
    return;
  }

  const apiKey = process.env.POKEMON_TCG_API_KEY;
  const cacheKey = `tcg:${tcgPath}:${JSON.stringify(req.query)}`;

  try {
    const data = await getCached(
      cacheKey,
      async () => {
        const response = await axios.get(`${TCG_BASE}${tcgPath}`, {
          params: stripClientSecrets(req.query),
          headers: {
            Accept: 'application/json',
            ...(apiKey ? { 'X-Api-Key': apiKey } : {}),
            'User-Agent': 'PokeWorld/1.0 (fan project; contact via site)',
          },
        });
        return response.data;
      },
      CACHE_TTL.MEDIUM,
    );

    res.set('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (error) {
    console.error('TCG proxy error:', error);
    res.status(502).json({ error: 'Failed to fetch TCG data.' });
  }
}
