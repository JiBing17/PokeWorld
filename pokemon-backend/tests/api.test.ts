import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import {
  apiHeaders,
  authHeaders,
  getTestApp,
  teardownTestApp,
} from './helpers';

describe('API', () => {
  let app: Express;

  beforeAll(async () => {
    app = await getTestApp();
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('API token (requireApiToken)', () => {
    it('rejects requests without the API token', async () => {
      const res = await request(app).get('/api/pokemon?limit=1');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized.');
    });

    it('rejects requests with the wrong API token', async () => {
      const res = await request(app)
        .get('/api/pokemon?limit=1')
        .set('X-PokeWorld-Token', 'wrong-token');

      expect(res.status).toBe(401);
    });
  });

  describe('User register and login', () => {
    const username = `testuser_${Date.now()}`;
    const password = 'password123';

    it('rejects registration when fields are missing', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set(apiHeaders())
        .send({ username: 'ab' });

      expect(res.status).toBe(400);
    });

    it('registers a new user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set(apiHeaders())
        .send({ username, password });

      expect(res.status).toBe(201);
      expect(res.text).toBe('User created');
    });

    it('rejects duplicate registration', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set(apiHeaders())
        .send({ username, password });

      expect(res.status).toBe(409);
      expect(res.text).toBe('User already exists');
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .set(apiHeaders())
        .send({ username, password });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.username).toBe(username);
    });

    it('rejects login with wrong password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .set(apiHeaders())
        .send({ username, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.text).toBe('Invalid username or password');
    });
  });

  describe('Favorites (database)', () => {
    const username = `favuser_${Date.now()}`;
    const password = 'password123';
    let jwtToken = '';

    beforeAll(async () => {
      await request(app)
        .post('/api/users/register')
        .set(apiHeaders())
        .send({ username, password });

      const login = await request(app)
        .post('/api/users/login')
        .set(apiHeaders())
        .send({ username, password });

      jwtToken = login.body.token;
    });

    it('rejects favorites requests without a login token', async () => {
      const res = await request(app).get('/api/users/favorites').set(apiHeaders());

      expect(res.status).toBe(401);
      expect(res.text).toBe('No token provided');
    });

    it('returns an empty favorites list for a new user', async () => {
      const res = await request(app)
        .get('/api/users/favorites')
        .set(authHeaders(jwtToken));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('adds a pokemon to favorites and reads it back', async () => {
      const add = await request(app)
        .post('/api/users/favorites')
        .set(authHeaders(jwtToken))
        .send({ pokemonName: 'pikachu' });

      expect(add.status).toBe(200);
      expect(add.text).toBe('Favorite added');

      const list = await request(app)
        .get('/api/users/favorites')
        .set(authHeaders(jwtToken));

      expect(list.status).toBe(200);
      expect(list.body).toContain('pikachu');
    });

    it('removes a pokemon from favorites', async () => {
      const remove = await request(app)
        .delete('/api/users/favorites/pikachu')
        .set(authHeaders(jwtToken));

      expect(remove.status).toBe(200);
      expect(remove.text).toBe('Favorite removed');

      const list = await request(app)
        .get('/api/users/favorites')
        .set(authHeaders(jwtToken));

      expect(list.body).not.toContain('pikachu');
    });
  });

  describe('Pokemon endpoints', () => {
    it('rejects an invalid pokemon name', async () => {
      const res = await request(app)
        .get('/api/pokemon/not%20valid!')
        .set(apiHeaders());

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid Pokémon name.');
    });

    it('rejects an empty batch request', async () => {
      const res = await request(app)
        .post('/api/pokemon/batch')
        .set(apiHeaders())
        .send({ names: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('A non-empty names array is required.');
    });

    it('returns pokemon types from the batch endpoint', async () => {
      const res = await request(app)
        .post('/api/pokemon/batch')
        .set(apiHeaders())
        .send({ names: ['pikachu'] });

      expect(res.status).toBe(200);
      expect(res.body[0].name).toBe('pikachu');
      expect(res.body[0].types.length).toBeGreaterThan(0);
    });
  });
});
