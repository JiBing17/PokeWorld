import axios, { isAxiosError } from 'axios';

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 400;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      const canRetry =
        attempt < maxRetries &&
        (isAxiosError(error)
          ? !error.response || isRetryableStatus(error.response.status)
          : true);

      if (!canRetry) {
        throw error;
      }

      const retryAfterHeader = isAxiosError(error)
        ? error.response?.headers?.['retry-after']
        : undefined;
      const retryAfterMs = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : baseDelayMs * 2 ** attempt;

      await wait(Number.isFinite(retryAfterMs) ? retryAfterMs : baseDelayMs);
      attempt += 1;
    }
  }
}

export function isRateLimitError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 429;
}

export function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Aborted', 'AbortError');
  }
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

export function isAbortError(error: unknown): boolean {
  return (
    axios.isCancel(error) ||
    (error instanceof Error && error.name === 'AbortError')
  );
}
