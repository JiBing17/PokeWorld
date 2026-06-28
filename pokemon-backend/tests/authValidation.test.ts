import { describe, expect, it } from 'vitest';
import {
  isValidContactEmail,
  isValidPokemonName,
  validateCredentials,
} from '../authValidation';

describe('validateCredentials', () => {
  it('rejects a username that is too short', () => {
    expect(validateCredentials('ab', 'password123')).toBe('Username must be 3–30 characters.');
  });

  it('rejects a password that is too short', () => {
    expect(validateCredentials('ash', 'short')).toBe('Password must be 8–128 characters.');
  });

  it('accepts valid username and password', () => {
    expect(validateCredentials('ash', 'password123')).toBeNull();
  });
});

describe('isValidPokemonName', () => {
  it('accepts a normal pokemon name', () => {
    expect(isValidPokemonName('pikachu')).toBe(true);
  });

  it('rejects names with spaces or special characters', () => {
    expect(isValidPokemonName('mr. mime')).toBe(false);
  });
});

describe('isValidContactEmail', () => {
  it('accepts a basic email address', () => {
    expect(isValidContactEmail('ash@example.com')).toBe(true);
  });

  it('rejects an invalid email address', () => {
    expect(isValidContactEmail('not-an-email')).toBe(false);
  });
});
