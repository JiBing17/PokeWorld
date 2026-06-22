import type { NextFunction, Request, Response } from 'express';

const TOKEN_HEADER = 'x-pokeworld-token';

export function requireApiToken(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.POKEWORLD_API_TOKEN;

  if (!expected) {
    res.status(503).json({ error: 'API token is not configured on the server.' });
    return;
  }

  const provided = req.header(TOKEN_HEADER);

  if (!provided || provided !== expected) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  next();
}
