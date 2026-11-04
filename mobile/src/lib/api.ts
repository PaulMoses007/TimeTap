import { router } from 'expo-router';

import { API_BASE_URL } from './config';
import { deleteToken, getToken } from './storage';

// Render's free tier can take about a minute to wake up
const TIMEOUT_MS = 70000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function errorText(data: any, fallback: string): string {
  if (typeof data?.detail === 'string') return data.detail;

  // FastAPI validation errors: [{ loc, msg }, ...]
  if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
    return String(data.detail[0].msg).replace(/^Value error, /, '');
  }

  return fallback;
}

/**
 * Authenticated JSON request to the TimeTap backend.
 * - Only a 401 (expired/invalid session) logs the user out.
 *   A 403 is a normal "not allowed" answer and is shown as an error.
 * - Gives a friendly message when the server is waking up or offline.
 */
export async function apiRequest<T = any>(
  path: string,
  options: { method?: string; body?: object } = {},
): Promise<T> {
  const token = await getToken();

  if (!token) {
    router.replace('/login');
    throw new ApiError('Please log in again.', 401);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';

    throw new ApiError(
      aborted
        ? 'The server is taking too long to respond. It may be waking up - please try again in a moment.'
        : 'Cannot reach the server. Check your internet connection and try again.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(
      `Unexpected server response (HTTP ${response.status}). The server may be starting up - please try again.`,
      response.status,
    );
  }

  if (response.status === 401) {
    await deleteToken();
    router.replace('/login');

    throw new ApiError('Your session expired. Please log in again.', 401);
  }

  if (!response.ok) {
    throw new ApiError(
      errorText(data, `Request failed (HTTP ${response.status}).`),
      response.status,
    );
  }

  return data as T;
}
