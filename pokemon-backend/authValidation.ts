export function validateCredentials(username: unknown, password: unknown): string | null {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return 'Username and password are required.';
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
    return 'Username must be 3–30 characters.';
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(trimmedUsername)) {
    return 'Username may only contain letters, numbers, dots, underscores, and hyphens.';
  }

  if (password.length < 8 || password.length > 128) {
    return 'Password must be 8–128 characters.';
  }

  return null;
}

export function isValidContactEmail(email: string): boolean {
  return email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPokemonName(name: unknown): name is string {
  return (
    typeof name === 'string' &&
    name.length >= 1 &&
    name.length <= 50 &&
    /^[a-zA-Z0-9-]+$/.test(name)
  );
}
