import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { closeDatabase } from '../db';

export const TEST_API_TOKEN = 'test-api-token';
export const TEST_JWT_SECRET = 'test-jwt-secret-min-32-characters-long';

let mongod: MongoMemoryServer | undefined;
let app: Express | undefined;

export async function getTestApp(): Promise<Express> {
  if (app) {
    return app;
  }

  process.env.NODE_ENV = 'test';
  process.env.POKEWORLD_API_TOKEN = TEST_API_TOKEN;
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.GEMINI_API_KEY = '';

  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const { app: expressApp } = await import('../server');
  app = expressApp;
  return app;
}

export async function teardownTestApp(): Promise<void> {
  await closeDatabase();
  if (mongod) {
    await mongod.stop();
    mongod = undefined;
  }
  app = undefined;
}

export function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'X-PokeWorld-Token': TEST_API_TOKEN,
    ...extra,
  };
}

export function authHeaders(token: string): Record<string, string> {
  return apiHeaders({
    Authorization: `Bearer ${token}`,
  });
}
