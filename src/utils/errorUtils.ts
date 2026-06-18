import { isAxiosError } from 'axios';

export const getErrorMessage = (
  error: unknown,
  fallback = 'An unexpected error occurred'
): string => {
  if (isAxiosError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
